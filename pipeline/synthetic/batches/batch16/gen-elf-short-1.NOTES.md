# gen-elf-short-1 — "Open Joints" (ELF short_text_1q, TYPE-001)

Batch16 · ELF short unit 1 · `candidate_id: PLACEHOLDER` · 1 question · BrE

---

## 1. Topic and lane

**Cavity-wall drainage: why the unmortared vertical joints above a window head
run in the lull rather than during the storm.** Chosen from the lane brief's
candidate list (weep holes in brick cavity walls) after rejecting the other
three on graze or general-knowledge grounds:

- *tuning a bell by removing metal* — grazes the shipped family
  `klockgjutning-craft-reportage-long` (bell founding) on the do-not-graze list.
- *crack-arrest riveting in ship hulls* — the Liberty-ship brittle-fracture
  story is a famous explainer thesis; G-STEM kills general-knowledge items.
- *road camber and drainage* — adjacent to the shipped
  `road-marking-lifespan-science-journalism-short`.

**Graze check against the 100 excluded families.** Nothing on the list concerns
water movement through a wall. The two building-adjacent exclusions are
`self-healing-concrete-materials-science-detail` (autogenous crack healing in a
material) and `rounded-window-corners-as-manufacturing-tolerance` (stress
concentration and tooling); the excluded `welded-rail-ballast-resistance` short
is a thermal-force item. `vattentornsarkitektur` and `stenmurar-odlingslandskap`
are Swedish long units on architecture and landscape history. None shares this
unit's mechanism, its evidence, or its trap.

**Authentic-corpus topic screen** (`data/parsed/*.json`, 28 sittings, 4320
rows): `cavity`, `perpend`, `brickwork`, `damp-proof`, `stop end` and
`driving rain` return zero hits. `brick` returns twelve rows, of which the only
building one is `host-2013-verb1-ELF-031` "Quality Buildings" — four sentences
on the weathering of facade materials and protective coatings. That is the
nearest authentic neighbour and it is a different specific topic.

## 2. Physics first — the directionality check batch15 failed

Batch15's TYPE-001 short was refuted at V-FINAL because it had jointed track
*opening* a gap each summer when an expansion gap is widest in the cold. So the
mechanism here was verified against four independent industry sources **before
drafting** (all via the Exa web-search MCP; this session's WebSearch budget was
reported exhausted at 200/200 on the first attempt, so no WebSearch query was
run — see `originality_note`):

| claim in the passage | direction | source |
|---|---|---|
| the outer leaf is porous by design, not a seal | water goes **in** | BDA TIS-C6: "The outer leaf of masonry construction is not watertight" |
| water crosses it and runs down the cavity face | **down the back** of the outer leaf | MPA Mortar Data Sheet 12; Brickability *Resisting Rainwater Penetration* |
| a tray over the opening turns it back out through open perpends | **out** | Brickability; LABC *Installing site-formed cavity trays* |
| spacing "every half-metre or so" | inside the cited 450 mm maximum | Brickability ("intervals not greater than 450mm", "not less than two weepholes over each opening") |
| **while the wind is on the face the tray holds its water; it drains in the lull** | wind pressure pushes **in** at the weeps | BDA TIS-C6 exposure table: severe exposure = "Standing water in cavity tray (drains from weepholes when wind drops)"; Brickability: rain penetration "due to high winds blowing into cavity walls through weepholes and moving water up beyond the upstand of dpc trays" |
| a dammed tray, or a tray without stop ends, stops the discharge | both real failure modes | LABC ("keep cavity trays free of mortar droppings"); Brickability (stop ends "prevent … water … being thrown off its ends into the cavity") |

The item turns on the fifth row — the one line of real physics that a
domain-competent solver is unlikely to hold, which is what keeps the question
passage-dependent rather than general knowledge.

Two claims are the writer's observation rather than a sourced standard, and the
passage frames them that way: that not all the joints run and none for long,
and that a head giving nothing back an hour after the wind drops is worth
recording. Neither is asserted as a rule of the trade.

## 3. Trap architecture (q1, key **D**)

Stem: *"What is said about the open joints before the wind drops?"* — the
`what is said about X` form, 29 unique / 60 total occurrences in the 405
authentic ELF stems. Deliberately **not** "What are we told about…" (batch15's
short-1 stem), and **not** sentence-initial "According to the text, …", which
occurs 0 times sentence-initially in the authentic corpus (it appears 23 times,
always as a trailing or medial clause). "What happens…" scored 0/405 and was
discarded for that reason.

| opt | trap | build | how the passage defeats it |
|---|---|---|---|
| A | `quantifier_upgrade` + the intuitive picture of a drain | "Every joint … is running, which is exactly what those gaps are there for" — borrows the passage's own statement of purpose | "the tray holds what it has collected" (nothing is running yet) and "Not all of the joints run" (the absolute is refused even for the lull) |
| B | reversed / mis-sequenced mechanism | the brick still absorbing, the tray still dry — the lag most readers assume between rain and leak | the water "that gets past it" is already on the tray, which is why the tray *has collected* anything |
| C | half-right conjunction (strongest) | true first clause — nothing does come out — welded to a wrong cause and an unsupported "usually" | the stoppage is the wind's doing, not a defect; and "an open joint cannot say" which of the two faults a dry head means. C also moves the diagnosis to the wrong moment (the note is taken an hour *after* the wind drops) |
| **D** | **key**, `paraphrase_one_sentence` | recasts "While the wind is still on the wall it pushes in at those same joints, and the tray holds what it has collected" | — |

Longest shared token run between each option and the passage: A 3
("those gaps are", intentional surface match), B 2, C 2, **D 3** ("in at
those"). No option reproduces a passage clause; the key is a genuine recast.

## 4. Self-blind-solve (done cold, arguing for each distractor)

- **A** — *For:* the passage does say those gaps are the whole of the wall's
  drainage, so a working wall should be draining while it rains. *Against:* the
  passage puts the discharge in the lull explicitly and refuses "every" even
  there. **Not defensible.**
- **B** — *For:* the brick is described as wetting through, and a delay between
  soaking and leaking is the ordinary intuition. *Against:* "holds what it has
  collected" places the water on the tray during the blow. **Not defensible.**
- **C** — *For:* its first clause is exactly right, which is what makes it the
  dangerous option. *Against:* the causal half is contradicted twice — the wind
  is the stated reason, and the passage says a dry head does not identify its
  own fault. **Not defensible as a whole statement.**
- **D** — supported directly by the timing sentence and corroborated on both
  sides (water already on the tray; discharge deferred to the lull).

**Result: exactly one defensible answer.** No rewrite was needed on this axis.
Key letter **D** — the letter is varied away from batch15's shorts (B and C).

## 5. Hedge map (batch16 rule 10)

With a single question the "pick the qualified option" heuristic must not
select the key at all.

| opt | form | correct? |
|---|---|---|
| A | hard absolutiser ("Every") | ✗ |
| B | flat | ✗ |
| C | hedged ("usually") | ✗ |
| **D** | **flat, unhedged causal assertion** | ✓ |

Pick-the-hedged lands on C (wrong); strip-the-absolutes eliminates A and leaves
three (undecided). M-FORM is clear for the same reason — only one distractor
carries an absolutiser, so the key is not the sole measured option.

Length: A 16, B 15, C 15, D 16 under `mech.tokenize()`. The key is **tied** for
longest, never uniquely longest; ratio 1.07 against the 2.36 ELF cap.

## 6. Law 12 — divergence from the shipped moulds

Move sequence: *flat physical detail → what it is for → mechanism → the timing
twist → seven-word verdict sentence → limiting observation → a diagnostic rule
that ends in an ambiguity.*

Deliberately unlike the shipped ELF shorts:

- no received view being corrected (`elf-b10-003` "not, as the guidebooks like
  to say"; `elf-b8-004` "Ask a driver … the guess is usually years");
- no negation/misdirection opener (`elf-b11-003` "The hard part … is not the
  water"; `elf-b9-004` "A playground surface is not engineered to feel soft");
- no second-person opening scene (`elf-b12-003`);
- no named expert, no quotation, and **no log or tally of incidents** — the
  immediately preceding TYPE-001 short, `elf-b15-003`, is built on a 39-buckle
  log, and repeating that shape one batch later would be the clone;
- no aphoristic close and no "not A, but B" chiasmus: the piece stops on
  something the trade cannot determine from outside.

Nearest structural relative is `elf-b11-003` (a practitioner-bylined mechanism
piece with no named expert); it opens on a stated misdirection and closes on a
second, separate problem, where this one opens flat and closes on an
unresolvable one. M-ECHO passes against all 100 shipped units.

## 7. Names (law 16 / rule 4 / rule 8)

**One name in the whole unit** — the byline. No toponym, firm, institute,
standard or publication is invented, which is the cheapest way to cut law-16
exposure; the wall, the trade and the weather stay generic.

- **Rhoswen** — real Welsh given name; checked against the rule-8 list of 214
  used given names, **not present**. The only bearer any query surfaced was a
  Skate Canada figure skater with a different surname.
- **Pellowden** — no bearer of the string returned. Every hit was for the real
  Cornish surnames Pellow / Pellowe / Pellew. Kept as a coinage and **flagged
  for V-FINAL re-verification, not certified**.

Rejected during this pass, each on a live collision (full queries and hits in
`originality_note`): **Vardrell** (real composer's middle name; a real
Charleston creek), **Brindlow** (real rare UK surname — decisively, a bearer is
a project co-ordinator at a UK building-ventilation manufacturer: in-domain),
**Merrishaw** (a director of a UK electrical/mechanical contracting company,
plus a Birmingham road), **Vennaway** (a real Gower locality with a listed lime
kiln), **Drewsby** (how transcripts render the footballer Dewsbury-Hall;
Dewsbury is a real town), **Trennock** (a registered Australian company).

Not verified: no gazetteer, Companies House or electoral-roll database was
queried directly — only open web results, as listed.

## 8. Declared shortfalls

1. **Readability below the blueprint band.** fk_grade **8.7** against the
   blueprint's short_text band of 11.0–15.0 (FRE 67.8, polysyllabic 8.9%). The
   register is deliberately plain trade prose; three register edits lifted it
   from 7.5 to 8.7 without touching the mechanism. Context: no mechanical gate
   checks readability (GENERATION.md law 7), and the 27 shipped ELF shorts span
   7.0–16.2 — `elf-b15-004` shipped at **7.0** with zero gate flags in either
   round, `elf-b8-004` at 9.0, `elf-b11-003` at 9.5. Inside the shipped
   distribution, below the blueprint target; G-REGISTER should judge the voice.
2. **Phrase probing is partial.** Two distinctive strings were probed and both
   came back clean; four clauses revised for register *after* probing were
   never re-probed (named in `phrase_probe_note`). This is not the eight-phrase
   Tier-2 sweep in `elf/anti-plagiarism.md`.
3. **BrE evidence is thin by count.** Exactly one token in the student-facing
   text distinguishes BrE from AmE orthography — `half-metre`. The rest of the
   BrE signal is lexical (`south-westerly`, `window head`, `the trade`,
   `stop end`, `during the build`). Stated as a count rather than as a blanket
   "BrE held throughout", which batch15's short-2 was pulled up on.

## 9. Mechanical gates (final file, re-run after every edit)

`run_mech.py gen-elf-short-1.json --parsed-dir <main>/data/parsed
--p5-corpus-dir auto` (100 shipped units indexed):

```
M-SCHEMA pass · M-BANDS pass · M-PLAGIARISM pass
M-TELL pass · M-FORM pass · M-ECHO pass
```

Bands: passage 160 mech tokens (blueprint 105–160 ✓, bands.json 101–368 ✓);
1 paragraph; mean sentence 20.0 (12.0–47.2 ✓); sentence lengths
[18, 10, 18, 26, 23, 7, 10, 48], sd 12.4 (≥7 ✓); prompt 11 tokens (3–30 ✓);
options 15–16 tokens (0–31 ✓); option-length ratio 1.07 (cap 2.36 ✓).

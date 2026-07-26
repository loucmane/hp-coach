# gen-elf-long — authoring notes (Batch 11)

**Unit:** ELF `long_passage_5q`, 5 questions.
**Family tag:** `new-island-colonization-turnover-science-journalism-long`
**Title:** *The Arrival Lists*
**Topic:** submarine-volcanic islands from eruption to ecosystem — what a cumulative
species list does and does not record.

---

## 1. Genre and topic rationale

**Genre:** `science_journalism` (the ≈45% modal genre), **AmE** held throughout
(*colonized, armored, kilometers, meters, traveling, toward*-free prose; no BrE
lone-word intrusions). Arc: **phenomenon → evidence → complication → verdict**.

**Why this framing.** The assigned pool (submarine volcanoes building new
islands, eruption-to-ecosystem field science) has an obvious lazy shape — "life
returns to a sterile island, isn't nature wonderful" — which is a frictionless
parable and exactly what law 9 kills. So the piece is built around a *measurement*
argument instead: the number every new island is judged by is a **cumulative
arrival list**, which is a ratchet. It can only rise. It therefore cannot register
the turnover that is most of what the island's nineteen-year record actually
contains. That gives the passage a real thesis, a real antagonist (Ruhe, who says
the geology settles everything), and concrete residue that does not all point at
the answer.

**Law 1 check — no famous-thesis anchoring.** Every entity is invented: the
**Sarnhold Rise**, the islands **Kelvain**, **Odren**, **Vessa**, the ecologist
**Ilse Draeven**, the volcanologist **Petar Ruhe**, the byline **Nadia Berthold**.
The real-world analogue (a young volcanic island with a long survey series) is
recognizable as a *situation*, but no question can be answered from it: every key
rests on invented particulars — sixty-one plants against nineteen survivors, six
of seven islands, a two-hectare petrel colony on ninety hectares, four seasons at
Odren. A solver who knows real island biogeography still has to read.

**Law 6 — credited-excerpt frame.** Title in the `title` field only; byline
`— Nadia Berthold` on its own line at the end of the final paragraph; glossary at
the very tail, defining **only** two words that literally occur in the passage
(*tephra*, ¶1/¶4; *palagonite*, ¶4).

**Law 9 — no manufactured tidiness.** The piece concedes a great deal to the side
it disagrees with (Draeven grants Ruhe "the half of it she thinks is his"), it
carries digression that serves no question (the fine-seeded composites; the vents
still steaming; "Vessa is a depth sounding"), and it refuses to resolve — Draeven
"will not say what Kelvain will look like at fifty."

---

## 2. Planted trap architecture

The passage was written **with** the items, not before them. The hedges and scopes
the distractors operate on were planted deliberately:

| planted in passage | operated on by |
|---|---|
| "That sequence held on **six of the seven** islands" | q2 B (upgrade to all seven) |
| "the **bird-carried** species arrived **last** and slowest" | q2 B (order reversal) |
| "**median** stay for a **wind-arrived** plant … a little over three years" | q3 C (median→each, subset→all) |
| "it has **never once** been shorter than the year before" | q3 D (claims the count fell) |
| the Odren colony moving; plants "**thinned by half** within four seasons" | q4 A ("to die"), q4 D (nitrogen persists) |
| Ruhe's unqualified quote vs. Draeven's half-concession | q1 B, q5 A (attribution swap) |
| "an **uncemented** island never gets an ecology to lose" | q5 D (the key's concession clause) |

**Block budget** (per `families.md`): 2× TYPE-001, 1× TYPE-002, 1× TYPE-004 at an
**edge** position, 1× TYPE-005 at the other edge. Local items follow passage order
(¶2 → ¶3 → ¶4).

| q | family | position | anchor | key | trap set |
|---|---|---|---|---|---|
| 1 | ELF-TYPE-004 main idea | edge (1) | whole text | **C** | scope_error(distorted) / role_or_attribution_swap / outside_knowledge |
| 2 | ELF-TYPE-001 detail | 2 | ¶2 | **D** | over-hedged contradiction / quantifier_upgrade+reversal / wrong_location(time-shift) |
| 3 | ELF-TYPE-001 detail | 3 | ¶3 | **A** | outside_knowledge / quantifier_upgrade / surface_word_match |
| 4 | ELF-TYPE-002 inference | 4 | ¶4 join | **B** | too_literal(+2 flaws) / too_far / outside_knowledge(contradicted) |
| 5 | ELF-TYPE-005 stance | edge (5) | ¶4 + verdict | **D** | role_or_attribution_swap / polarity overshoot / direction reversal |

**Key spread:** C, D, A, B, D — no column, no positional tell.

### Law 10 — breaking the hedged-key correlation

The default failure mode is that the key is always the only measured option. Broken
deliberately here:

- **q3 is the inversion.** The key is the flat numeric claim ("Sixty-one … under a
  third"); the *cautious-sounding* option ("a little over three years") is **wrong**,
  because it launders a median for one arrival class into a term for every species.
- **q2** puts the over-hedged option (A, "too irregular … for any predicted sequence")
  on the wrong side as well.
- **q5 C** was written to be as measured in form as the key ("broadly", "a small
  qualification") so that reaching for the qualified option decides nothing.
- Across the unit only two of five keys are the more measured option, and on the two
  where the key is measured a distractor is measured too.

### Law 11 / distractor plausibility

No distractor is verbatim-true. Each carries an identifiable flaw a careful reader
can name — an inverted order (q2 B), a promoted median (q3 C), a generalized "will"
plus an overstated outcome (q4 A), a stance handed to the wrong speaker (q1 B, q5 A).
And none is absurd: q3 B (competitive displacement), q4 D (soil nitrogen persists
after its source leaves) and q1 D (dispersal routes are new) are all *plausible real
mechanisms* a passage-blind reader cannot wave away — they fail only against what
this text actually says.

### Law 3 — paraphrase, never copy

No option reproduces a passage sentence. The closest, q3 A, states the arithmetic
(19 of 61 is under a third) that the passage leaves the reader to do; q2 D recasts
"six of the seven" as "nearly every" and "sat close to what had been forecast" as
"close to those forecast".

### Stem law

Every stem names a setup without entailing an answer. q4's stem restates a fact the
passage already gives (the survivors are under the colony) so that the item asks for
the **join** with Odren rather than for either fact — it fixes the target without
indicating which implication is meant, and A/C/D are all answers to the question as
asked.

---

## 3. Self-blind-solve (skeptical, arguing *for* each non-key)

Solved from the passage alone, arguing each distractor as if defending it.

- **q1 → C, single.** A is the strongest rival: ¶4 really does put almost every
  survivor under the colony and says petrels make soil. It dies on "the one thing"
  (¶4 makes cementation a precondition) and on scope — the colony is the mechanism
  inside a piece framed, opened and closed on the ratchet (¶1, ¶3, ¶5). B is real
  passage content but is Ruhe's position, conceded only in half. D is never stated.
- **q2 → D, single.** A and B are directly contradicted by the same sentence; C is
  ¶3's finding relocated to ¶2 *and* overstated against the three-year median.
- **q3 → A, single.** D is contradicted by ¶1's "never once been shorter". C is
  false twice over (median, and wind-arrived only) and additionally false because
  nineteen species have *not* dropped out. B introduces competition, which the text
  never raises.
- **q4 → B, single.** A was the item's real risk — a literal reading of Odren. It was
  rewritten to carry two flaws ("will" generalizes one storm at one cape; "to die"
  overstates "thinned by half"), which makes it defeatable rather than merely
  redundant. D is contradicted by the measured outcome; C leaps into policy the text
  declines ("She will not say…", and her recommendation is about publication, not
  management).
- **q5 → D, single.** A is the signature swap; the quote is Ruhe's and is answered in
  the next sentence. B overshoots a text that grants Ruhe a real point in its own
  voice. C is the measured decoy but reverses the direction — the bare interior is
  the writer's *bound* on Ruhe, not a small caveat.

**Rewrites forced by this pass:** (i) q4's stem was re-cut from "What is implied by
what happened on Odren…" to name the Kelvain fact, because the original left a
category gap between an Odren stem and a Kelvain key that a blind grader could have
scored as a mismatch; (ii) q4 A gained its two flaws; (iii) q5's options were moved
from "He" to "The writer" — the byline is female and Draeven is female, so "She"
would have been genuinely ambiguous between writer and quotee in a stance item,
which is the one family where that ambiguity is fatal.

**Result: no two-way item remains.**

---

## 4. Band compliance (measured with `mech.py`)

`run_mech.py` — **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-PLAGIARISM pass** (zero findings on all five).

| stat | value | band |
|---|---|---|
| passage words | **794** | ELF long_passage 332–873 (blueprint 550–825) |
| sentences | 35 | — |
| mean sentence words | **22.69** | 14.9–35.4 (blueprint 16–30) |
| sentence-length sd | **15.49** | ≥ 7 |
| shortest / longest sentence | 4 / 65 | high variance by design; the 65 is the byline+glossary fold noted in law 6 |
| paragraphs | 5 + glossary block | long: 1–5 logical paragraphs |
| prompt words | 6 / 13 / 11 / 20 / 16 | 3–30 |
| option words | 16–21 | 0–31 |
| option length ratio | 1.17 / 1.19 / 1.05 / 1.24 / 1.11 | cap 2.36 |
| key is longest option | **never** (0 of 5) | M-TELL |
| key letters | C, D, A, B, D | spread |

Spelling variety: **AmE**, single, verified by read-through.

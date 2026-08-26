# gen-las-long — NOTES (batch16)

**Unit:** LÄS long, 4 questions. `family: tegelbrukshistoria-facktext-long`.
**Title:** Tegel från Sölvinge. **Byline:** Boel Rundhage, byggnadshistoriker.
**candidate_id:** `PLACEHOLDER` (orchestrator assigns).

---

## 1. Domain lane and graze check

Lane: Swedish craft/infrastructure history. Of the five candidates offered in
the brief I rejected four before drafting:

- **mejerihanteringens historia** — grazes `fabodbruk-agrarhistoria-popularvetenskap-long`
  (fäbod = the summer dairy) and sits next to `isupptagning-ishandel` /
  `cold-chain-logistics`. Dropped.
- **fyr- och lotsväsendet** — grazes `buoy-tending-mooring-scope-reportage-long`
  and `history-of-navigation-history-essay-long`. Dropped.
- **kanalbyggnadsepoken** — grazes `flottningshistoria-facktext-long` (inland
  waterway transport of goods) and touches `vertical-transport-history`. Dropped.
- **repslageri** — rope/cordage sits adjacent to the mooring-scope unit and to
  `submarine-cable-repair`. Dropped as the second-best option.

**Chosen: tegelbruk (brickworks).** No unit among the 100 shipped families
touches clay, brick, ceramics, kiln firing or the manufacture of masonry
units. Nearest neighbours and why they are not grazed:

| shipped family | why this unit is not a graze |
|---|---|
| klockgjutning-craft-reportage-long | metal casting in a one-shot mould; no clay, no continuous kiln, no fault taxonomy |
| garverihantverk-facktext-long | pits and liquors, organic material, no firing at all |
| vattentornsarkitektur-facktext-long | finished buildings and façade choices, not material production |
| stenmurar-odlingslandskap-popularvetenskap-long | gathered field stone, no manufacture |
| sea-salt-saltern-craft | evaporation pans, no chambered furnace |
| isupptagning-ishandel-facktext-long | harvest and storage of a natural product |

---

## 2. Genre and blueprint compliance

`sakprosa / facktext_larobok`, long band. Opening move: **definitional-material** —
the passage opens by reading an existing wall and states that a brickworks can
largely be read out of its bricks. Register: nominalisations (`Vintervittringen`,
`Vedåtgången`, `Sorteringen`, `Grävningen`), `-s`-passives (`brändes`, `bars`,
`leddes`, `gjordes`, `upptas`, `nämns`), one tense shift into the generic
present for the ring-kiln description.

Measured with `mech.py` (`gates/scripts`):

| stat | value | band |
|---|---|---|
| passage words | 949 | blueprint 750–1135, bands.json 215–1260 |
| sentences | 59 | blueprint ~35–66 |
| mean sentence words | 16.1 | blueprint 14–25, bands.json 8.2–30.9 |
| paragraphs | 11 | blueprint 4–17, bands.json 1–35 |
| sentence length min / max | 4 / 41 | deliberate variance: 23 sentences ≤12 words, 7 ≥25 |
| prompt words | 7–14 | 3–31 |
| option words | 3–12 | 0–23 |
| option length ratio (max) | 1.67 | ≤5.25 |

`run_mech.py` with `--p5-corpus-dir auto` (100 shipped units indexed) and the
authentic corpus at `data/parsed`: **M-SCHEMA pass, M-BANDS pass, M-TELL pass,
M-FORM pass, M-ECHO pass, M-PLAGIARISM pass.**

Glossary defines only words that occur in the passage (`råtegel`, `kollergång`,
`skift`). Byline last, glossary at the tail, both inside `passage`.

---

## 3. Architecture — law 12 (no clones)

Diffed against the shipped LÄS longs. `las-b12-001`, `las-b13-001`,
`las-b14-001` and `las-b14-003` share one mould: numeric-inventory lede →
mechanism → named researcher → named challenger → a "the material has more
holes" paragraph → a "much in the files does not belong here" residue
paragraph → present-day coda. `las-b15-001` broke half of it (institutional
case, single historian) but kept the ledger critique and the present-day trace
coda.

This unit departs on every axis:

- **No modern scholar and no challenger at all.** The only present-day voice is
  the byline. There is no duel and no researcher whose conclusion is
  problematised.
- **No ledger motif** (law 13 names it saturated). There are no account books,
  no entry dates, no probate inventory. The evidence is *material*: the bricks
  themselves, and two walls built 25 years apart.
- **Thesis shape: straight reconstruction with no contested question.** Not
  "the metric measures the wrong thing" (capped at ~1/batch and not used here),
  not conventional-view-confirmed, not a duel.
- **Residue is woven in**, not parked in a dedicated paragraph: the 1896 fire
  insurance (a hand pump, six barrows, a tiled stove in the office), the nine
  days the moulders stopped work in July 1893 with no recorded settlement, and
  the stamp that vanished in 1897 for reasons two 1918 recollections disagree
  about and neither can settle.
- **The close stays in the period** (1904) and ends on a contradiction between
  two walls rather than on a present-day trace. No aphoristic two-sentence
  coda, no "not A, but B" chiasmus.
- **Title** is flat and place-named (`Tegel från Sölvinge`) rather than the
  clause-shaped titles of the last four LÄS longs; rule 15 explicitly allows
  flat descriptive and place-name titles.

Phrase blocklist scanned: no hits, no close variants.

---

## 4. Planted targets and trap architecture

Passage and questions were designed together. Four hedged / directional /
scoped claims were planted, one per question.

**Q1 · `detalj_ospecificerad` · target: §6 (kalkspräckning).**
Planted claim is *directional in time*: the lime grain is burnt to quicklime in
the kiln but takes up moisture and blows a flake off the face **afterwards** —
"I ugnen hände detta sällan." Scoped to the lower pit's limestone gravel.
- **C (key)** paraphrases the mechanism.
- **B** `reversed_causality` on the time arrow: bursting relocated into the
  firing itself. The hardest distractor — it is what a reader expects of a kiln.
- **A** `scope_shift` + `surface_lexical_echo`: the frost of §2 promoted from
  a wanted pre-treatment of the raw clay to a defect in the finished brick.
- **D** `plausible_worldknowledge`, hedged: cooling too fast is a genuine brick
  fault, but the passage never mentions a cooling defect.

**Q2 · `enligt_texten_detalj` · target: §5 (position in the chamber). SHORT-BREATH.**
Stem 7 words; options 3–5 words (addendum rule 5).
- **B (key)** position relative to the fire channels decides colour and hardness.
- **D** `plausible_worldknowledge`: the two clay pits are described at length in
  §2 and a reader naturally assumes the raw material gives the colour. The
  passage closes this door on purpose: the clays were mixed on the beating
  table and after 1875 nothing was fired from one pit alone.
- **A** `surface_lexical_echo` on the lime; **C** `scope_shift` to drying time,
  which in the text governs delivery volume, not appearance.

**Q3 · `inference_slutsats` · targets: §7, three sentences.**
The key requires combining: (i) watering slakes the lime while the brick is
still on the works' yard, (ii) bricks that burst there go into the works' own
road fill, (iii) the 1890s complaints almost all concerned brick that burst
after being laid. Conclusion: part of the loss moved from the customer's wall
to the works.
- **D (key)**, scoped with "En del av".
- **C** `reversed_causality` on the direction of the loss (sold cheap to
  customers) — contradicted: the burst bricks went to road fill, never sold.
- **B** `overgeneralisation` (absolute "inga klagomål") — contradicted by the
  deep-sitting grain that could lie still until the wall had stood a winter.
- **A** `plausible_worldknowledge` (hardening, frost resistance) — never said.

*Double-key control:* I deliberately did **not** offer any option of the form
"watering reduced complaints / reduced the risk in the wall", because that
would also be defensible and would have made the item double-keyed. This is the
law 11 / law 4 failure mode that has held units in three earlier batches.

**Q4 · `detalj_ospecificerad` · target: §4 (ring-kiln heat economy).**
Directional and explicitly guarded: fuel per thousand fell about a third, and
"Elden brann inte hetare än förr."
- **A (key)** paraphrases the two heat recoveries (incoming air preheated by
  cooling bricks; flue gas drying the ware next in line).
- **B** `reversed_causality` against an explicit denial in the text.
- **C** `half_right_conjunction` with lexical echo: the pan mill really was
  installed in 1884, but for the lime, and nothing is said about density or
  firing time.
- **D** `overgeneralisation`, hedged: the flue gas did dry ware, but the drying
  sheds still cap the summer's deliveries.

Key spread: **C, B, D, A** — all four letters, no positional tell.

---

## 5. Hedge map (addendum rule 10)

| q | key | key hedged? | hedged distractor(s) | absolute distractor |
|---|---|---|---|---|
| 1 | C | **no** (flat assertion) | D "tycks ha kylts" → **wrong** | – |
| 2 | B | **no** (bare noun phrase) | none in the row | – |
| 3 | D | yes ("En del av") | – | B "inga klagomål" |
| 4 | A | **no** (flat assertion) | D "tycks ha blivit överflödiga" → **wrong** | – |

"Pick the most qualified-sounding option" selects the key in **1 of 4**
questions and leads to a wrong answer in **2 of 4**. Rule 10's requirement of at
least one question with a flat unhedged key beside a cautious-sounding wrong
distractor is met twice (Q1, Q4).

---

## 6. Self-blind-solve

Solved from the passage alone, arguing actively for every non-keyed option
before accepting a key.

- **Q1 = C.** B needs the bursting to happen in the kiln; "I ugnen hände detta
  sällan" closes it. A makes the frost damage a finished brick, but in the text
  the frost works on the raw clay before moulding. D is an unsupported cooling
  fault. One defensible answer.
- **Q2 = B.** D is the dangerous one and I pushed on it hardest: the two clays
  are described in detail, so if any brick could be traced to a pit the option
  would be alive. The mixing on the beating table plus the 1875 end of
  single-clay firing kills it. A ties lime to colour, which the text never does.
  C belongs to delivery volume. One defensible answer.
- **Q3 = D.** Checked explicitly for a second defensible option; the three
  distractors are either contradicted (C by the road fill, B by the
  deep-sitting grain) or wholly unsupported (A). One defensible answer.
- **Q4 = A.** B falls on "Elden brann inte hetare än förr", C on the pan mill's
  stated purpose, D on the drying sheds still governing the summer's output.
  One defensible answer.

No question is answerable without the passage: every key rests on invented
particulars (the mixing on the beating table, the ring kiln's two heat
recoveries, the watering and the road fill).

Cross-question check: Q1 and Q3 both concern the lime but at different targets
(mechanism/timing vs the consequence of watering); no option in either row
gives away the other. No option reproduces a passage sentence.

---

## 7. Names — law 16 (search log, not a certificate)

**Tool used, stated plainly:** `WebSearch` was **unavailable** — the session's
budget (200/200) was already exhausted at my first call, which returned the
budget message for both `"Sölvinge" ort Sverige` and `"Vrenmark" efternamn
Sverige`. All checks below were therefore run with **Exa web search** plus one
direct fetch of the Swedish Wikipedia search page, on **2026-08-26**. Every
query is re-runnable.

**Kept (3 proper nouns only):**

1. **Sölvinge** (village, parish, works, folkskola — one toponym reused for all
   four, to keep the number of checkable names down).
   - sv.wikipedia search: **no article**; the page offers "Skapa sidan
     'Sölvinge'". Returned titles: Carl-Henrik Sölvinger, Veckans brott,
     Ericsson Information Systems, Gotlands militärkommando, Styrkula.
   - Exa `"Sölvinge" svensk ort by socken`: no Swedish locality; hits were the
     Lithuanian company UAB Solvingė (Klaipėda) and unrelated Chinese exam
     pages.
   - **Not certified.** Small Swedish hamlet names are frequently absent from
     the open web. **Flagged for V-FINAL** to re-check against Lantmäteriet's
     ortnamnsregister, which I could not reach in this session.
2. **Evald Vrenmark** (tegelmästare 1879–1902).
   - Exa `"Vrenmark" efternamn person Sverige`: **no bearer of that exact
     spelling.** The engine fell back on the real but differently spelled
     Wrennmark (hitta.se: 7 bearers — Niklas Wrennmark, Göteborg; Lars
     Wrennmark / Wrennmark Utveckling AB, Enskededalen; Fanny Wrennmark,
     estate agent) and Wirenmark (Kerstin Margareta Wirenmark, Åtvidaberg).
     None is active in building history, brickmaking or craft history.
   - `"Evald Vrenmark"`: no hit.
3. **Boel Rundhage** (byline, byggnadshistoriker).
   - Exa `"Boel Rundhage" person`: **no hit on the full name**; results were
     Boel Rundqvist (silversmithing, Folkuniversitetet Lund), Bo Rundh
     (professor, Karlstad University), Bo Rundberg, Boo Rundqvist.
   - Exa `"Rundhage" efternamn person Sverige`: one bearer in hyphenated form,
     Ingrid Rundhage-Höjer (music teacher, Bergaskolan, Malmö), plus a German
     surname article (Welt) listing Rundhage among `-hage` farm names. No
     bearer in building history or craft.

**Rejected during search — not used:**

- **Evald Öhrnstedt** — a **real living person** in Götene: board member of
  Götene Elförening (their annual report) and a donkey breeder (haststam.se).
  An exact full-name collision; exactly the failure law 16 was written for.
- **Bringlöv** — several bearers, incl. the director Jana Bringlöv Ekspong.
- **Sandhamre** — Elisabeth Jansson Sandhamre, artist represented at
  Nationalmuseum; an adjacent cultural field.
- **Bjärnstedt** — several bearers (hitta.se, gravar.se).
- **Vresmark** — too close to the bank's own Vresfallets bruk / Elias Vretberg.

**Registry check (addendum rules 8–9):** the given names *Boel* and *Evald* do
not appear in the 214-name used list; no full-name pair from rule 9 occurs
here; the two given names are not repeated inside the unit. Genders are
independently drawn (modern author female, period craftsman male) and there is
no careful-woman/overconfident-man pairing, since there is no duel.

The purchasing town, the river and the lake are left unnamed on purpose.

---

## 8. Convention checks (addendum rules 1–7)

- No quotation marks anywhere in the passage; no straight quotes in the file.
- No em dash. 16 en dashes, all spaced; byline opens with " – ".
- Options: no semicolons, longest 12 words (≤21), key never the sole longest
  (Q1 all four are 11 words; Q2 3 vs 5; Q3 10 vs 12; Q4 10 vs 12).
- Short-breath question present (Q2).
- Keys spread C/B/D/A; no letter repeats.
- `generator_meta`: origin `batch16-generator`, model `claude-opus-5`, date
  `2026-08-26`; `candidate_id` left as the literal `PLACEHOLDER`.

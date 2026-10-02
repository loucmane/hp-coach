# gen-las-long — batch21 LÄS long (facktext) — generator notes

Unit file: `batches/batch21/gen-las-long.json`
`candidate_id`: `PLACEHOLDER` (orchestrator assigns).
`family`: `fabodbruk-mjolkhushallning-facktext-long`
Title: **Fäbodåret i Ryttmo** · byline **Dagrun Orrbrant** · glossary 2 entries.
Keys: **C, D, A, B**.

---

## 0. Disclosure up front — the family-exclusion conflict

The brief's 107-family exclusion list contains **`fabodbruk-agrarhistoria-popularvetenskap-long`**.
That family is `las-b6-001`, and `las-b6-001` is in **`RETIRED.json`** — retired 2026-07-30 as a
sentence-level clone of `las-b5-001`, excluded from the product-bank import, replacement already
assigned (`las-b14-001`). The lane brief for this slot nevertheless assigns **fäbodbruk**
explicitly and in detail.

I took the subject and built the unit to be disjoint from the retired one on every axis:

| axis | las-b6-001 (retired) | this unit |
|---|---|---|
| family string | `fabodbruk-agrarhistoria-popularvetenskap-long` | `fabodbruk-mjolkhushallning-facktext-long` |
| genre | populärvetenskap (a study reported) | facktext_larobok (a practice reconstructed) |
| subject inside the topic | which fäbodar were *restocked* in the 2000s and why | how the system worked and why it ended |
| frame | ethnologist + counter-scholar, objection/rebuttal | one scholar, no skeptic, he states his own weakness |
| moral paragraph | "neither glorify nor dismiss" | none |
| coda | aphoristic ("Att minnas … kostar föga") | a live scene with the animals |
| setting | Dalarna / Härjedalen / Jämtland named | no province named at all |
| names, toponyms, glossary | Halvardsson, Ohlander, Bäckström, Grönvallen; glossed fäbod/buföring/messmör | none shared; glosses vallkulla/kulning |

**Measured:** longest shared token n-gram with `las-b6-001` over title + passage + prompts +
options is **3** — the function-word run `som en gång` and the corpus rubrik-stem fragment
`sammanfattar bäst textens`; **zero at n ≥ 4**. M-ECHO passes against all 114 indexed units.

If the orchestrator judges the family exclusion binding regardless of the retirement, this unit
should be **regenerated on a different subject**, not repaired — the exclusion is topical, and no
edit inside a fäbod passage discharges it. Recorded in `generator_meta.family_exclusion_conflict_note`
so a gate sees it rather than rediscovering it.

---

## 1. Family, genre, and what the passage is

`macro_genre` sakprosa · `fine_genre` facktext_larobok · `size` long (4 questions).

Per-question families (corpus-matched: 3 detail + 1 higher-order):

| q | family | anchored in |
|---|---|---|
| 1 | `enligt_texten_detalj` | ¶2 — how the buföring date was fixed |
| 2 | `detalj_ospecificerad` | ¶5 — calls versus horn |
| 3 | `enligt_texten_detalj` | ¶3 — the terms of hire |
| 4 | `huvudbudskap_syfte` | whole text (¶1 + ¶4 + ¶6) |

**Thesis shape: mechanism-is-the-point, with the mechanism inverted at the end.** The whole
practice rested on distance being survivable *because the product kept*; it ended when a buyer who
wanted fresh milk every morning made distance set the price instead. That is not the
"metric-measures-the-wrong-thing" shape (capped at ~1 per batch), not a dispute, and not left
unresolved.

**Skeptic slot: none.** One named scholar, introduced by what he did, who states the weakness of
his own comparison himself. No counter-scholar, no objection-and-rebuttal, and — per the lane
constraint — **no discipline-titled expert** (`Agrarhistorikern X`): Brynolf Pilhammar is
introduced by the act of laying the creameries' collection rounds beside the summer farms'
locations.

---

## 2. Move sequence and coda versus the last three LÄS longs

| unit | opening move | evidence pattern | skeptic | coda |
|---|---|---|---|---|
| las-b18-001 (lime kilns) | 1874 handbook quotation | handbook + parish remains | — | remains in the ground |
| las-b19-001 (bloomery) | sensory scene, prospecting bar in the moss | experimental smelts | — | remains in the ground |
| las-b20-001 (water meadows) | calendar/procedure first, no researcher | survey record + measurements | two scholars, unresolved | the unresolved dispute |
| **this unit** | **a ratio of weights** — what came down weighed about a tenth of what the cows gave | **a working reconstruction**, then one route comparison with a self-stated confounder | **none** | **a live present-tense scene with the animals** |

**RULE 20(a) — the fire crafts and the reconstruction frame are gone.** `ugn` occurs zero times.
Boiling appears once, as one step among several in the dairy paragraph, and neither firewood nor a
hearth is ever a subject. None of the banned frame survives: no low stone furnace in a named
parish, no work rhythm set by frost and firewood, no researcher who inventoried the remains, no
experimental reconstruction, no reading of overgrown mounds, and no coda that dates the practice.

**The third-consecutive coda is broken.** The batch20 gate lesson named the shape that outlived
RULE 20(a): "the remains are in the ground, here is how to read them, here is why the count is
uncertain." This unit's abandonment evidence (Pilhammar's route comparison and its confounder)
sits in **¶7, mid-piece**, and the passage ends on the cattle walking the same path in June,
needing to be led the first year behind an old cow that remembers the way. Not an aphorism, not a
chiasmus, not a date, not an administrative fact, not a question — the new coda monoculture the
brief reports for batch20 (its own figure: 4 of 7 units closing on a flat administrative or
operational fact) is avoided too.

**Other batch20 lane lessons honoured:** setting is inland (no coast, no water at all beyond a
brook used for cooling); there is **no money-arithmetic argument** — the only sums are a wage line
and they are texture, not a computation; the title is flat, descriptive and place-named, and carries
no numeral — the brief records a fifth numeral-led Swedish title as a standing G-REGISTER minor,
and that is the brief's count, not one I recomputed.

**Phrase-level diff, not just move-level** (the batch20 lesson that law 12's structural diff
missed a phrase clone): longest shared token n-gram over title + passage + prompts + options is
**3** against each of `las-b18-001`, `las-b19-001`, `las-b20-001`, `las-b14-001`, the retired
`las-b6-001` and all six batch21 siblings — every hit a function-word run (`och den som`,
`till detta kom`, `sig inte heller`, `drygt två mil`) or the shared corpus stem fragment.
**Zero at n ≥ 4 against all eleven.** No signature string reused in a matching structural slot.

**Sibling sweep (RULE 8, the collision batch20 shipped) — run over ALL six sibling units, not
just the shipped bank.** Re-run after the last sibling landed, with
`gates/scripts/registry_extract.py batches/batch21` (7 units, 176 capitalised tokens, 18 adjacent
pairs). Sibling given names: Adrian, Elspeth, Irene, Ralph, Wendy, Yvonne, Odette, Oscar, Fredrika,
Gottfrid, Hilding, Lars, Lisen. Sibling surnames: Kitson, Kelsingham, Dunnicott, Jarrett, Bowles,
Hobbermarsh, Fenniscarth, Goddard, Sölvhamre, Runesson, Uddén, Timmerhed, Wibbelund, Ferningate.

No name is reused, and no name is a near-duplicate. Computed minima: **Brynolf 5** (Irene),
**Dagrun 4** (Adrian), **Blenda 3** (Wendy), **Pilhammar 6** (Sölvhamre), **Orrbrant 5** (Jarrett),
**Nyholm 6** (Bowles); toponyms against every sibling name **Ryttmo 5**, **Klintbodarna 7**,
**Glupbäcken 7**, **Trindbodarna 8**. Sibling families are all distinct and none grazes fäbodbruk
(village-hall jumble sale, fish passes, tape adhesive, a book-society ledger, a market-square
debate, a parlour essay).

---

## 3. Passage skeleton and planted targets

| ¶ | role | planted target |
|---|---|---|
| 1 | lede (result as a ratio) | the constraint: everything carried home had to be made to keep |
| 2 | background | *the buföring date was fixed at the byastämma, and the animals could not go up before leaf-out* → **q1** |
| 3 | method_or_case (the people) | *hired one summer at a time, wage settled in May, mostly in goods with a small cash sum in autumn* → **q3**; the account-book line is the RULE 17 ordinary figure |
| 4 | finding (the making) | products chosen by what would survive the journey; the drier-cheese-further-out gradient (residue, not a question target) |
| 5 | nuance (sound over distance) | *the calls varied with the caller; the horn signals were few, fixed and addressed to people, and carried further than any call* → **q2** |
| 6 | turn (the decline) | cheap grain + ley + fertiliser removed the original reason; the creamery then inverted what distance was worth |
| 7 | counterpoint (evidence + its limit) | Pilhammar's route comparison and the confounder he names himself; labour leaving |
| 8 | implication (what survives) | a few hundred still grazed; a vall closes in in twenty-odd years |
| 9 | close (scene) | the herd walks the path; one that has not must be led |

**Law 9 — no manufactured tidiness.** Deliberate friction that does not point at any answer: the
sources testify to the loneliness but not to unfreedom, and a girl who had run a vall well could
choose her farm the next year; the boundary between call and horn is explicitly *not* sharp;
Pilhammar's comparison "measures partly the same thing it is meant to explain"; and the survival
paragraph concedes that what is made now is not what was made.

---

## 4. Trap design per question

**q1 — `enligt_texten_detalj`, ¶2. Key C.**
- A `scope_shift` — the hay is why the animals moved *at all*, not what fixed the day.
- B `true_but_irrelevant` — the hiring genuinely did precede the buföring ("lönen gjordes upp i
  maj, innan buföringen"); sequence offered as cause.
- D `plausible_worldknowledge` — snowmelt and ice-out are the expected transhumance trigger and
  the strongest distractor in the unit; the text names only leaf-out.

**q2 — `detalj_ospecificerad`, ¶5. Key D.**
- A `reversed_causality` — the range comparison is one the text actually makes, and it runs the
  other way ("längre än något rop bar"). **This is the only inverted option in the unit**, and it
  is deliberately one a reader could believe without the passage: kulning really does carry, and
  the belief that it out-ranges a horn is the ordinary lay assumption. It is not a same-nouns
  mirror of the key — the key is about *variability versus fixed meaning*, A is about *range* —
  so it does not advertise the key by being the only broken option. (Batch20 lost q2 twice to a
  mirror that was incoherent alone; the fix that finally worked there was dropping the device. I
  kept a reversal only because it survives the "believable alone" test on its own terms.)
- B `half_right_conjunction` — the horn in fog is true; the calls in the morning is false.
- C `plausible_worldknowledge` — an invented transmission story the text never tells. (Reworded
  after review from `hornsignalerna av folket på grannfäboden` to `hornsignalerna på
  grannfäboden`: the gapped parallel had paired a place adverbial with an agent `av`-phrase, so
  the option said *taught by* while the rationale argued *learned in the wrong place*. The trap is
  unchanged; the mismatch is gone.)

**q3 — `enligt_texten_detalj`, ¶3. Key A.** The law-11 discipline is applied even though the stem
is not a `bäst`/`stämmer med texten` form: every distractor carries a locatable flaw and none is
verbatim-true. (The stem was moved off `Vilket påstående om X stämmer med texten?` because the
sibling `gen-las-debatt.json` uses that exact template in the same batch — a corpus-attested stem
is free to reuse across batches, but twice in one batch's LÄS lane is a house tic.)
- B `hedged_distractor` — the cautious, output-linked wage; the text binds the wage in May, before
  any yield is known.
- C `scope_shift` — takes the real autumn cash payment and makes it conditional on a sale that the
  text never mentions.
- D `plausible_worldknowledge` — the ordinary Swedish annual *tjänsteår*, which is what a
  historically literate solver expects; contradicted in terms by "lejdes för en sommar i taget".
  D exists specifically so that world knowledge does not isolate the key: both A and D are
  historically typical arrangements.

**q4 — `huvudbudskap_syfte`, whole text. Key B.**
- A `detail_as_main` — the labour paragraph promoted to the whole.
- C `scope_shift` — widened past the text to agriculture at large.
- D `detail_as_main` — the closing regrowth observation promoted to the theme.

---

## 5. The option-form test, written out per question

Method: passage covered, stem and four options only, ranked on wording alone. If any of the six
batch20 routes beats 1-in-4, rebuild. Two rebuilds happened on this test and are recorded below.

**q1** *Vad bestämde, enligt texten, tidpunkten för buföringen?*
1. *Absolutizer/hedge triage* — no option carries an absolutizer and no option is hedged. Nothing.
2. *Contradictory dyad* — four different variables: stored hay / hiring / a village decision plus
   leaf-out / snowmelt and ice-out. No pair sits on one variable.
3. *Mirrored twin* — none; no option is another with an arrow reversed.
4. *Main-idea scope triage* — n/a (not a main-idea item); all four are the same shape, a
   determinant.
5. *Stem announces the answer's shape* — "Vad bestämde … tidpunkten" is satisfied identically by
   all four; two options are two-part (C, D) and two single (A, B), so the two-part form is not a
   marker.
6. *Cross-question leak* — see §6.
   **Residual: world knowledge, and it runs in two directions.** A reader who knows Swedish
   village organisation leans C; a reader who knows Alpine/Nordic transhumance leans D. Honest
   estimate C ≈ 35 %, D ≈ 30 %, A ≈ 20 %, B ≈ 15 %.

**q2** *Vilken skillnad mellan ropen och hornsignalerna framgår av texten?*
1. No absolutizers; exactly one hedge ("i regel") and it is on **A, a distractor**.
2. Four variables: range / time of day / transmission / variability-versus-fixed-meaning. No dyad.
3. A is a reversal but not a mirror of the key (different variable) and is believable unread.
4. n/a.
5. The stem announces "a difference" and **all four options state a difference**, using both of
   the stem's nouns — the fix batch20's lesson 5 prescribes. All four are parallel two-part
   contrasts opening on "Ropen".
6. See §6.
   **Residual: domain knowledge about kulning.** Honest estimate D ≈ 40 %, A ≈ 25 %, B ≈ 20 %,
   C ≈ 15 %. **This is the unit's weakest question and the number is not rounded down.**

**q3** *Hur var fäbodfolkets lön ordnad, enligt texten?*
1. No absolutizers; one hedge ("varierade något") and it is on **B, a distractor**; the key is flat.
2. Four variables: when-agreed-plus-what-in / linked to output / conditional on a sale / contract
   length. **An earlier draft had A ("avtalades på våren") against a D that said "avtalades på
   hösten" — a clean contradictory dyad on the timing variable, 50 % for free. D was rebuilt onto
   contract length.**
3. No mirror.
4. n/a.
5. The stem predicates nothing; all four are statements about the wage.
6. See §6.
   **Residual:** world knowledge pulls at A and D simultaneously by design. Honest estimate
   A ≈ 32 %, D ≈ 25 %, B ≈ 22 %, C ≈ 21 %.

**q4** *Vilken rubrik sammanfattar bäst textens innehåll?*
1. No absolutizers, no hedges.
2. Four different content axes; no dyad.
3. No mirror.
4. **Main-idea scope triage explicitly defused.** All four are five-word "X och Y" noun phrases —
   identical shape, identical length (5/5/5/5, ratio 1.00). None is written as a summary tricolon.
   There is no too-narrow / too-broad / off-topic / summary ladder: A and D are both real strands
   of the text and only C is a scope error. **An earlier draft had C as "Jordbrukets omvandling
   under 1800-talets sista årtionden" — the only option without "och" and the only six-word one;
   rebuilt.**
5. The plain corpus rubrik stem announces nothing. (A content noun was added after review —
   all nine corpus instances of this stem carry one, none is bare.)
6. See §6.
   **Residual:** B is the only relational title, but A and D are the topically specific ones and a
   test-wise solver is as likely to reach for those. Honest estimate B ≈ 30 %, A ≈ 30 %, D ≈ 20 %,
   C ≈ 20 %.

**RULE 15 pair check — joint, not per-question.** The four questions rest on four disjoint factual
bases (a date, a pair of sound systems, a wage form, the whole-text thesis). No question
enumerates a hypothesis space that another then takes a stance over; nothing in q1–q3's option
sets names the distance-and-keeping relation q4's key asserts, and nothing in q4's set names a
date, a sound or a wage form. No one-way leak: no distractor concedes a fact another question
tests. **Joint stems-only floor with all four sheets read together and the passage covered:
about 1 in 3** — no better than the weakest single question.

---

## 6. RULE 11 — cross-question lexical and conceptual bridges

Computed mechanically over the final bytes: content lemmas (function words and ≤3-letter tokens
stripped) appearing in the option sets of two or more questions.

| lemma | where | verdict |
|---|---|---|
| `först` | q2 B, q3 C | function-grade; both distractors |
| `mycket` | q1 A, q3 B | function-grade quantifier; both distractors |
| `skogen` | q2 A, q4 A | the passage's unavoidable setting word; both distractors |
| `vallkullorna` | q1 B, q4 A | the passage's unavoidable term for the workers; both distractors |

**No key shares a content lemma with any other question's option set.** Every shared lemma sits in
a distractor in both places, so cross-sheet corroboration would mislead a solver rather than help
one.

Two earlier drafts were rebuilt on exactly this check:
- `byn` once stood in q1's **key** and in two other questions' distractors → q1's target was moved
  off the distance relation entirely (from "what governed how dry the cheeses were made" to "what
  fixed the buföring date"), which removed the lemma *and* the conceptual bridge below.
- `varorna` once stood in **both q3's and q4's keys** → q4's key was reworded from "Avståndet och
  varorna som måste hålla" to **"Avståndet och kravet på hållbarhet"**.
- Conceptual, not lexical: the first q1 keyed on *distance → keeping*, which is the same relation
  q4's key asserts — a one-way inference channel from q1 to q4. Moving q1 to the buföring date
  closed it.

---

## 7. RULE 12 and the stem ∩ key token check

Each stem read alone, asking what it gives away:

- **q1** gives away that the buföring had a date and something fixed it. Entails no option.
- **q2** gives away that the text draws a difference between the two sounds. All four options
  state a difference, so the entailment narrows nothing.
- **q3** names the subject (the wage) and asks how it was arranged, without predicating anything
  contested about it — the neutral referential form RULE 12 asks for.
- **q4** is the plain corpus rubrik stem.

**Stem ∩ key tokens** (batch20's key echoed the stem's modal `kan`; no stem here carries a modal).
Computed on the final bytes with `mech.py`'s tokenizer, not eyeballed — an earlier draft of this
table asserted a `gjordes` echo that belonged to a superseded q1 stem and was false of the shipped
one:

| q | shared with key | shared with distractors | verdict |
|---|---|---|---|
| 1 | **none** | `för` (function) in distractor B only | clean |
| 2 | `ropen`, `hornsignalerna` | the same two, in **all four** options by design | not a marker |
| 3 | **none** | `hur` (function) in distractor B only | clean |
| 4 | **none** | none | clean |

**No key shares a content token with its stem anywhere in the unit.**

---

## 8. Hedge balance (RULE 10 / RULE 13)

| q | key form | hedged option present? | who carries it |
|---|---|---|---|
| 1 | flat, specific, two-part | no | — |
| 2 | flat two-part claim | yes — "i regel" | **distractor A** |
| 3 | flat two-part claim | yes — "varierade något" | **distractor B** |
| 4 | flat noun phrase | no | — |

**The key is the hedged or qualified option in 0 of 4** (cap is 2 of 4). In the two questions where
a hedge exists at all it marks a wrong answer, so "pick the cautious one" scores zero. In q1 and q4
no option is hedged, so the heuristic returns nothing rather than being inverted into a new one.

**Absolutizers:** scanned mechanically over all sixteen options and all four prompts against the
full M-FORM family plus the brief's additions (`ingenting`, `ingenstans`, `uteslutande`): **zero
hits**. `helt` was removed from an early q3 D ("ett helt tjänsteår") for this reason. M-FORM passes.

---

## 9. Self-blind-solve and the double-key check

**Blind (passage covered):** the per-question estimates are in §5 — 35 / 40 / 32 / 30 %. Nothing
in the unit is answerable from form.

**Passage open, arguing for each non-keyed option in turn:**

- q1 A — the hay explains why the system existed; ¶2 never lets a hay stock fix a date.
- q1 B — "lönen gjordes upp i maj, innan buföringen" gives order, not cause; the sentence that
  gives the cause is the byastämma sentence.
- q1 D — snow and ice occur nowhere in the passage; the only natural sign named is the leaves.
- q2 A — refuted in terms: the horn signals were heard "längre än något rop bar".
- q2 B — the fog clause is true, the morning clause is false (the calls brought the animals home
  "om kvällen").
- q2 C — the text puts the learning up on the vall, on the animals' side.
- q3 B — the wage is fixed in May, before any yield is known.
- q3 C — no sale is mentioned anywhere and the goods go home to the farms.
- q3 D — "lejdes för en sommar i taget" is explicit.
- q4 A, D — single strands of the text; q4 C — wider than the text.

**No second defensible answer in any of the four.**

---

## 10. Measured statistics (RULE 19 — recomputed on the final bytes)

Computed with `mech.py`'s own `tokenize()` and `sentences()` on the file as shipped; nothing
carried forward from a draft.

| stat | value | band |
|---|---|---|
| passage words | **862** | 215–1260 (blueprint long target 750–1135; lane brief aim 750–850 — **12 words over the soft aim**, disclosed rather than shaved) |
| paragraphs | 10 (9 prose + glossary block) | 1–35 |
| sentences | 52 | — |
| mean sentence words | **16.58** | 8.2–30.9 |
| sentence words min / median / max | 3 / 17 / 38 | genuine variance, not uniform |
| title words | 3 | ≤12 |

| q | prompt w | option w | ratio | key | key w | key strictly longest |
|---|---|---|---|---|---|---|
| 1 | 7 | 8, 7, 8, 8 | 1.14 | C | 8 | no (three-way tie) |
| 2 | 9 | 10, 11, 9, 12 | 1.33 | D | 12 | **yes, by 1 word** |
| 3 | 7 | 9, 11, 8, 9 | 1.38 | A | 9 | no |
| 4 | 6 | 5, 5, 5, 5 | 1.00 | B | 5 | no (four-way equal) |

Prompt band 3–31 ✓, option band 0–23 ✓, `option_length_ratio_max` cap 5.25 ✓. Key strictly longest
in **1 of 4**. No option contains a semicolon; all options ≤ 12 words (rule 5 cap is 21).
**Short-breath question: q1** — 7-word stem, all four options ≤ 8 words.

**Typography — one system across both layers.** Student-facing: em dash U+2014 **0**, spaced en
dash U+2013 **8**, curly quotes **0**, U+2019 **0**, ASCII hyphen 2 (the Swedish decade forms
`1880- och 1890-talen` and `1800-talets`, not dashes). Rationales: em dash **0**, en dash **4**,
curly quotes **0**, U+2019 **0**, ASCII hyphen **0**. Written with `\uXXXX` escapes throughout.
The unit carries no quotation, so rule 2's `”…”` never arises.

**Rationale hygiene:** scanned for `KEY X:` openings, snake_case trap labels, rule references, gate
names and English lemmas inflected as Swedish — **zero hits**. Every rationale opens `Rätt svar X:`
and every rationale names things with the passage's own terms (`byastämman`, `buföringen`,
`räkenskapsboken`, `hornsignalerna`, `vallen`, `mansålder`).

**Mechanical gates, final bytes:** M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass ·
M-ECHO pass (114 shipped units indexed) · M-PLAGIARISM pass (against `data/parsed`, 174 authentic
LÄS passages). Schema validation against `candidate-item.schema.json` passes with a real
`candidate_id` substituted for the `PLACEHOLDER` sentinel.

---

## 11. Law 16 / RULE 14 search log

Full log, with counts and dates, is in `generator_meta.originality_note`. Summary:

**Positive control first, same endpoints, same session (2026-09-02), before any candidate probe:**
`"Flarken"` → sv.wikipedia CirrusSearch exact phrase **totalhits 56** (Flarken Luleå kommun,
Flarken Robertsfors kommun, Flarken, Flarken Ytterhogdals socken, Rutvik); Nominatim
`countrycodes=se` **10 results** (Luleå, Härjedalen, Boden, Kalix, Vindeln, Norsjö, Malå, Piteå,
Lycksele, Lidköping). **Control passes**, so the zeros below are informative. No English-language
leg was run and none is claimed — every name in this unit is Swedish. **No VOID legs**: every
probe listed returned a result (including the zeros), and no endpoint failed or was skipped.

**Kept names** — all 0/0 on both endpoints, all one-letter *and* diacritic variants enumerated by
hand and probed literally, all bank-screened at Levenshtein ≥ 3 over 2 668 capitalised tokens
(2 407 from every shipped and queued candidate's title + passage + prompts + options, 953 from the
brief's own lists):

| name | role | variants probed literally | nearest real neighbour (computed) |
|---|---|---|---|
| **Brynolf Pilhammar** | researcher; carries the finding *and* its stated weakness | Pålhammar, Pilhammer, Pihlhammar, Nilhammar — all 0/0 | Pilham 3, Stålhammar 3, Stenhammar 4 |
| **Dagrun Orrbrant** | byline | Orrbrandt, Örrbrant, Orrbrent, Orrbrand — all 0/0 | no bearer surfaced |
| **Blenda Nyholm** | RULE 17 ordinary figure | — (ordinary name, see RULE 21 below) | — |
| **Ryttmo** | village (+ *Ryttmo nedre gård*, *Ryttmo mejeriförening*) | Ryttmon, Rytmo, Ryttbo, Rättmo, Röttmo, Byttmo — all 0 places | Rytterne 4 |
| **Trindbodarna** | the fäbod | Trindboderna, Trindbodarne, Trinbodarna, Brindbodarna, Grindbodarna — all 0/0 | **3** (Sandbodarna) |
| **Klintbodarna** | the second fäbod | Klintboderna, Klintbodarne, Klinbodarna — all 0/0 | **4** (Sandbodarna, Ålabodarna) |
| **Glupbäcken** | the stream | Glopbäcken, Glumbäcken, Glubbäcken, Glupbacken, Glupbäck — all 0/0 | Snärjebäcken 6; shipped Skrömtbäcken 6, Vråbäcken 4 |

No name ends in `-vall`, `-by` or `-ius`; no `Mar-*` given name; **no coined place name ending in
`-vall`**, as the lane brief required.

**Rejected candidates — the probes that earned their keep:**

| candidate | why rejected |
|---|---|
| **Orrhage** | sv.wiki totalhits 2, first title **Lars Orrhage** — a real bearer with an article |
| **Nyskog** | Nominatim returned 3 real places; its d=1 neighbour **Nyskoga** is a real socken (sv.wiki 78) |
| **Pärnfors** | d=1 from **Pernfors**; `"Pernfors"` → sv.wiki 28, article *Mikael Pernfors*. Exactly the diacritic variant a fuzzy search hides |
| **Nordgärde** | d=1 from **Nordgärdet** (6 real places) and **Norrgärde** (10 real places) |
| **Nävlund** | d=1 from **Näslund** (sv.wiki 1 025) |
| **Orlund** | d=1 from the real **Örlund** (Daniel Örlund) |
| **Ruskbäcken** | Nominatim returned a real Ruskbäcken in Hagfors kommun |
| **Snärjbäcken** | d=1 from the real river **Snärjebäcken**, Kalmar län |
| **Persson** (ordinary surname) | bank screen d=1 from the shipped pair **Per Ersson** |
| **Bjärmo** | bank screen d=1 from the shipped surname **Bjärnmo** (las-b16-003) |
| **Blenda Nilsson** | sv.wiki 2 hits; snippets name her as wife of the opera singer Olof Lemon and mother of Benna Lemon-Brundin — a bearer with encyclopedia presence. RULE 21(a) fail |
| **Snarbodarna** | 0/0 on both endpoints with an empty d=1 neighbourhood, and replaced anyway: computed d=**2** from the verified-real **Storbodarna**/**Störbodarna**. At the RULE 16 bar rather than clear of it; **Trindbodarna** at 3 was available, so 3 was taken |
| Stavhed (2 from shipped Sarvhed), Palmsäter (2 from Vallsäter), Nällmark (2 from Vallmark), Nyberg (2 from Öberg) | at the bar rather than clear of it; dropped rather than argued for |

**RULE 21 — the ordinary figure and law 16.**
Ordinary figure: **Blenda Nyholm**, one line in a farm account book (summer 1897: six kronor, a
pair of shoes, three alnar of vadmal).
- **(a) No notable bearer** — sv.wikipedia exact phrase `"Blenda Nyholm"` → **totalhits 0** in the
  control-passing session; exact-quoted web search returned no bearer of the pair (only unrelated
  Blendas: Blenda Ljungberg, Blenda Nkímyá, the Småland legend). The earlier candidate *Blenda
  Nilsson* was dropped on this leg.
- **(b) No bearer in the unit's own domain** — domain named as Swedish summer-farming, agrarian
  history and dairy history; the query was run explicitly (`"Blenda Nyholm"` + fäbod / fäbodbruk /
  agrarhistoria / mejeri) and returned only general fäbod sources, no bearer.
- **(c) No quoted words, no attributed act** — she is named once, in the account book, and says
  nothing; she is the source of no claim. **The two claim-bearing voices are the coinages:**
  Brynolf Pilhammar carries the comparison and its self-stated confounder, Dagrun Orrbrant carries
  the text. The riskier roles went to the coined names, not to the ordinary one.
- Distances: `Nyholm` ≥ 3 from every bank token; `Blenda` minimum 2 (the brief-listed *Alenga*, and
  the ordinary word *bland*) — no name-axis collision below the bar.

**Real entities used generically:** none beyond **Amerika**, named once as a destination for
emigrant labour with nothing invented attached. **No province, socken or parish is named at all** —
the setting is carried entirely by the coined names, which is stricter than the lane brief's
"real province names generically". `Mikaelitiden` is a calendar term, not a place.

**All kept names are FLAGGED for V-FINAL re-verification, not certified.** Every count above is a
figure the recorded queries return and can be re-run; nothing is asserted that was not executed.

---

## 12. Agrarian-history sources checked

- `hhogman.se/fabodar.htm` — fäbodvall as a summer station for one or several farms' animals;
  workers young women of roughly 15–25 (*fäbodstintor*, *fäbodjäntor*, *vallpigor*), boys
  assisting, men and older women needed at home for the crops; *smör*, *ost* and *messmör* stored
  in cellars until they could be carried home; *kulning* (Dalarna) and *kaukning*
  (Jämtland/Härjedalen); horns of cow, buck and bark-wrapped spruce used to call animals, scare
  predators and send messages; the system across Värmland, Dalarna, Gästrikland, Härjedalen,
  Jämtland, **Hälsingland**, Medelpad and Ångermanland; decline from the mid-19th century,
  surviving in places to WWII.
- `fabod.nu/fabodvarlden/vad-ar-fabodbruk` — the point of the system was to use the feed resources
  of forest and mountain while the home ground made winter fodder; production was of *seasonally
  storable* milk products; roughly 200–250 fäbodar in grazing use today.
- Swedish local-history / agrarian summaries retrieved the same day (`sollero-hembygd.se`,
  `matkult.se`, `vnmuseum.se`) — *handelsgödsel* and better implements solved the manure and
  fodder problem; the *mejeriväsen* that grew up at the end of the 1800s needed milk all year,
  which kept cattle at home in summer; peak in the 1870s–80s with more than 20 000 fäbodar, then a
  fast fall.

**What is the generator's own, not the sources':** the specific formulation this passage turns on
— that a buyer collecting fresh milk daily along fixed rounds converts distance from something a
keeping product neutralised into the thing that sets the price. Pilhammar's route comparison, its
sixty-odd fäbodar in four socknar, the *mansålder* spread, the self-stated confounder, the 1897
account-book line, the 1904 creamery, the 1931 date and all three named people are **invented**.


---

## 13. Independent native-expert Swedish review — all findings applied

An independent reviewer read the title, passage, prompts, options and rationales under the
`expert-language-review` skill, with the rationales given the same severity as the passage.

**Verdict: MINOR_EDITS, no KILL** — 4 MAJOR, 11 MINOR, 7 TASTE. **Every one of the 22 findings was
applied**, including all seven TASTE items, and the discharge was then verified mechanically: all
22 defect strings are absent from the final bytes and all 25 replacement strings are present.

**The four MAJOR findings, and why they mattered:**

1. `Avståndet ordnades också med ljud.` → `Avståndet överbryggades också med ljud.` — `ordna` takes
   a task or an arrangement, never a physical fact. A paragraph-opening topic sentence, and the
   reviewer's judgement was that this single string was the most likely kill vote in the unit.
2. **Q2 option C** `hornsignalerna av folket på grannfäboden` → `hornsignalerna på grannfäboden`.
   The gapped parallel paired a *place* adverbial with an *agent* `av`-phrase, so the option said
   *taught by the neighbours* while the rationale argued *learned in the wrong place*. **An
   option/rationale mismatch, not just a style defect.** The trap is unchanged.
3. `lära djuren sitt eget läte` (plus two echoes in the q2 rationale) → `lära djuren att känna igen
   just hennes rop`. `läte` is the word for an *animal's* sound; of a human's kulning it is marked,
   and because it prototypically belongs to animals `sitt` flickered between subject and object —
   the first parse was the nonsensical "teach the animals their own call".
4. `fanns inget sätt att komma i tid` → `gick det inte att hinna fram i tid` — a `there is no way
   to` calque, plus `komma i tid` (a person being punctual) used of goods reaching a dairy.

**One defect the review found in my own repair.** Discharging MINOR 12 I rewrote
`B är den försiktigt formulerade invändningen och låter därför rimlig` to `B är försiktigt
formulerad och låter därför rimlig` — and deleted the utrum noun that was carrying the agreement.
Bare `B` leaves no salient utrum antecedent, and the head a Swedish reader supplies for an answer
option (`alternativet`, `svarsförslaget`, `påståendet`) is neuter. Now `B är försiktigt formulerat
och låter därför rimligt`. Q4's `C är för vid` is correctly utrum because those options *are*
rubriker. **This is the argument for a second read after a repair round, in one line.**

**Where the damage was.** Roughly half the findings were in the **rationales**, not the passage —
`räknas av` for *deduct* where *count* was meant, `vänta sig X av Y` making a pasture the source of
an explanation, `Texten binder lönen` making the text the agent, an ambiguous `varorna` (wage goods
or dairy produce), a singular predicative under three coordinated subjects. That is exactly the
pattern the batch20 lesson names, and it is why the reviewer was briefed to weight them equally.

**Cleared explicitly, zero findings:** every compound joint on the risk list (`räkenskapsboken`,
`byastämman`, `klövjehästarna`/`klövjesadeln`, `hemängen`, `betesdjur`, `järnvägsbyggena`,
`handelsgödseln`, `skogsbetet`, `sommararbetet`, `tjänsteår`, `grannfäboden`, `mikaelitiden`,
`björksly`, …) — **no `lönboken`-class defect anywhere**; BIFF in both directions; all archaic and
technical vocabulary real and correctly used (`läte` was the sole misapplication); gender and
definiteness; numbers and measures including invariant `två mil` and `1880- och 1890-talen`;
typography (no em dash, no curly quote in any student-facing layer); the glossary defining only
words that occur; and **no dev vocabulary in the rationales** — no snake_case, no English
metawords, no rule or gate references.

**No key moved and no distractor was defused** by any edit. Keys remain C, D, A, B.

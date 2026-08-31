# gen-elf-long — authoring notes (batch16)

**Unit:** ELF `long_passage_5q`, science journalism, BrE.
**Title:** Smoke in the Skins
**Family:** `smoke-taint-volatile-phenol-glycosides-science-journalism-long`
**candidate_id:** `PLACEHOLDER` (orchestrator assigns at assembly).

---

## 1. Domain choice and graze check

Four lane candidates were offered. Rejected three:

- **dendrochronology / dating historic buildings** — grazes
  `maritime-archaeology-science-journalism-long` (dendro dating of hulls is the
  standard move in that field) and the several shipped Swedish
  building-antiquarian longs.
- **honey provenance by DNA barcoding** — the ELF blueprint's own worked
  example is urban beekeeping and wild pollinators; building next door to the
  spec's illustration is the wrong kind of resemblance.
- **prescribed-burn heathland management** — the ecology/restoration lane is
  the most crowded in the bank (`fog-harvesting-restoration`,
  `beaver-reintroduction`, `new-island-colonization`, `airport-bird-strike-grass`,
  `popularvetenskap-ekologi-lang`, `stadsekologi-igelkott`).

Chose **smoke taint chemistry in vineyards after wildfires**.

Graze evidence — `grep -ril` over all 100 shipped units in
`batches/*/candidates-final/`:

| term | hits |
|---|---|
| wine / vineyard / grape / vintner / winery / viticultur / smoke taint / guaiacol / ferment | **0** |
| smoke | **0** |
| wildfire | **0** |
| phenol | **0** |
| prescribed burn | **0** |

The lane is untouched. The two nearest adjacent surfaces were checked by hand:
`elf-b13-004` (bread staling) uses a sensory panel, and `elf-b13-001` (sea-salt
certification) is a craft-verdict long — neither shares mechanism, thesis shape
or trade with this unit. M-ECHO indexed all 100 shipped units and passed.

## 2. Science verification — done BEFORE writing

Batch15's ELF short was refuted at V-FINAL for stating welded-rail thermal
physics backwards, so the mechanism was verified first and the fiction built on
top of it, not the other way round. The session's **WebSearch budget was
exhausted (200/200) before the first query**, so all verification ran through
Exa (addendum rule 4). Every claim below is re-runnable; the full citation list
is in `generator_meta.science_verification`.

| passage claim | status |
|---|---|
| volatile phenols (guaiacol, cresols) come from pyrolysis of lignin | verified — Molecules 26(15):4519 |
| entry is directly through the waxy berry cuticle, within hours | verified — AWRI 'entry into grapes' fact sheet (Oct 2025) |
| the berry glycosylates them into an odourless, non-volatile compound held mainly in the skins | verified — Molecules 26(15):4519; J Nat Prod 2022 (PMC8961875) |
| the practical window before the sugars go on is ~a day or two | verified — Wine Australia puts it at ~48 h |
| **washing/hosing does not work** — the compounds are already inside the skin cells | verified — Wine Australia 'Smoke damage'; OSU EM 9253 |
| leaves absorb phenols but do **not** translocate them to the fruit; they matter as MOG in the fermenter | verified — AWRI fact sheet; Washington Wine smoke FAQ |
| release in the mouth by salivary enzymes and oral bacteria → delayed ashy retronasal finish | verified — Mayr et al./Parker et al. via Krstic et al. 2015 review |
| **strong inter-taster variation** in that in-mouth release | verified — Krstic et al. 2015 ("great dependency on… the individual taster") |
| the old "pre-véraison smoke is harmless" rule was withdrawn; post-véraison is still worst | verified — AWRI fact sheet (2019/20 events); Beverages 2021 7(1):7 |
| particulate density does not track what gets into the fruit | verified — PMC7464031; AWRI |
| glycosides hydrolyse slowly in wine's acidity → a wine can turn in bottle | verified — Singh et al. 2011 via Krstic et al. 2015 |

The passage asserts **nothing** outside this set. Every number, date, person and
event layered on top is invented.

One deliberate consequence: because the real literature contains a
"chemistry improved, taste didn't" result (in-canopy misting), that shape is
planted as **Q1/C** — a distractor that punishes a solver importing outside
knowledge instead of reading.

## 3. Names — search log (NOT a certificate)

Three names, no toponym, no institution, no publication, no region — the
real-entity surface is deliberately as small as it can be for a
science-journalism long.

| name | role | Exa result (2026-08-26) | disposition |
|---|---|---|---|
| **Corin Pemberdine** | analytical chemist (m) | no bearer of *Pemberdine* returned; every hit was the distinct real name *Berdine* (Bessie Lea, Dennis Franklin; Berdine Tarigan / Preuter / Comnelly). | KEPT |
| **Tamsin Quennerly** | sensory scientist (f) | no bearer of *Quennerly* returned; hits were the distinct names Quenner, Queener, Quennell. No hit on the full name. | KEPT |
| **Rhodri Kettlestrand** | byline | no bearer returned; hits were Kettlestring, Kasselstrand, Kjellstrand, Kjetil Strand — all distinct. | KEPT |

**Intra-batch collision, resolved here.** The chemist was first drafted as
**Corin Brindlow**, and that surname *was* checked and *was* clean in domain
(real UK bearers exist — Jennifer Brindlow, payroll; Nick Brindlow, tutor;
Robert Brindlow, project co-ordinator; Sian Brindlow, teacher; Stephanie
Brindlow, directory — none in wine, chemistry or journalism, with
britishsurnames.uk recording "very low" instances). It was dropped for an
**internal** reason, not a real-world one: a sibling batch16 unit
(`gen-elf-short-2`) independently took *Brindlow* for its byline, and a
duplicate surname inside one batch is exactly what rules 8–9 and law 13 exist
to prevent. Renamed rather than shipped. The superseded log is kept verbatim in
`originality_note`.

One honesty note recorded in the JSON as well: the **full name** "Corin
Pemberdine" was never searched as a pair after the rename. The surname query
returned no bearer at all, so a full-name bearer is not possible on that
evidence — but that is an *inference*, and it is logged as one rather than as a
query that was run.

Three candidates were **rejected on their search results**:
- *Aldercott / Aldercotte* — **Andrew H. Aldercotte is a real publishing
  ecologist** working on crop pollination. Same broad field as an
  agricultural-science passage: rejected.
- *Marrowby* — an established fictional character surname (Manly Wade
  Wellman's "Crett Marrowby") plus a 19th-c. genealogy record: rejected as not
  cleanly invented.
- *Dulverne* — **Sir Ralph de Dulverne, Margery de Dulverne and Richard de
  Dulverne, Prior of Trentham, are documented 13th–14th c. English people**
  (Derbyshire Record Office D410/T/502, D410/T/549; Stirnet; British History
  Online): rejected.

Given names **Corin / Tamsin / Rhodri** appear nowhere in the addendum's
214-name used list; no given name repeats inside the unit; no full-name pair
from rule 9 is used.

**All three names are FLAGGED FOR V-FINAL RE-VERIFICATION.** Exa is not
WebSearch, and nothing above is certified — the claim is only that these
queries returned no same-domain bearer on the date given.

## 4. Architecture — divergence from shipped units (law 12)

Reviewed the opening and closing moves of every shipped ELF long before
committing.

- **Opening:** a *communal remedy that failed* — half a district turning its
  sprinklers on the rows, for a reason the passage lets the reader feel before
  refuting. This is not the saturated "For years the case for X has been made
  by…" frame (`elf-b5-001`, `b6-001`, `b7-001`), not the procedural workshop
  scene (`elf-b14-001/002`), and not batch15's institutional
  failure-to-supply.
- **Thesis shape:** **mechanism-is-the-point.** One molecular fact — the vine
  bolts a sugar onto the phenol — is made to explain four separate practical
  puzzles (why washing fails, why the nose finds little, why the taste arrives
  after swallowing, why a wine can turn at eighteen months). Deliberately
  *not* the saturated "the metric measures the wrong thing", which the topic
  invites and which law 12 caps.
- **Skeptic slot:** the two voices do not dispute the facts, only what should
  decide. Gender pattern reversed against the 18-of-18 careful-woman /
  overconfident-man finding: the **hedged, limiting voice is the man**
  (Pemberdine), the **flatly assertive one is the woman** (Quennerly).
- **The writer takes a side.** Most shipped longs hold the balance; this one
  says "She is right about that" and is the load-bearing fact for Q4.
- **Coda:** no aphorism, no "not A, but B" chiasmus, no repetition triad, no
  "the object is still sitting there" residue (batch15's close). It stops on an
  unrecoverable counterfactual: forty tonnes on the ground and nobody will find
  out what they would have made. The residue does **not** all point at the
  answer — the fruit was condemned on a *reading*, but the wines that turned at
  eighteen months had passed a *tasting* at bottling.
- **Title:** noun + prepositional phrase. Not "The + modifier + noun" (capped),
  not the "X and Y" pair shape used by the previous batch.
- Typography: curly English quotes and apostrophes, spaced en dash only, **zero
  em dashes** in the file (checked mechanically).

## 5. Question architecture

Block budget per `families.md` (2× TYPE-001, 1× TYPE-002/003, 1× TYPE-004 at an
edge, 1× TYPE-005/006/007) — matched exactly.

| q | family | anchor | key | key derivation |
|---|---|---|---|---|
| 1 | ELF-TYPE-001 | ¶1, the hosing trial | **B** | paraphrase of two adjacent sentences |
| 2 | ELF-TYPE-001 | ¶2, the leaves clause | **D** | paraphrase_one_sentence (**short-breath item**) |
| 3 | ELF-TYPE-002 | ¶3, in-mouth release + panel spread | **C** | one_inch_inference |
| 4 | ELF-TYPE-005 | whole text | **A** | stance_of_writer_not_quotee |
| 5 | ELF-TYPE-004 | whole text, **edge position 5** | **B** | whole_text_gist |

Local items follow passage order; both whole-text items sit at the block edge.
Key letters **B, D, C, A, B** — all four used, none more than twice, no run, no
alternation.

**Short-breath item (addendum rule 5):** Q2 — 10-word stem, all four options
eight or nine words.

### Planted trap per distractor (no filler)

| q | opt | trap | how it is defeated |
|---|---|---|---|
| 1 | A | condition graft on a real hedge ("day or two" window misapplied to washing) | "cross the waxy skin of a grape within hours"; "nothing on the outside of a berry left to wash off" |
| 1 | C | half-right conjunction + **outside-knowledge punisher** (the real misting result) | the one washed lot that read *higher* |
| 1 | D | invented attribution | "though Pemberdine will not build on a single pair" |
| 2 | A | reversed direction of transfer | "what a leaf takes up stays in the leaf" |
| 2 | B | outside_knowledge | never stated |
| 2 | C | outside_knowledge (leaf plucking is a real practice) | the passage prescribes hand-picking, and for the fermenter |
| 3 | A | locus shift (palate → nose) | these wines "gave the nose very little" |
| 3 | B | reversal + absolute | the spread; the taster who called the worst lot clean |
| 3 | D | two-step leap | the median "has ever predicted what a drinker will say"; January readings unremarkable |
| 4 | B | **role_or_attribution_swap** (TYPE-005 signature) | the threshold wish is Pemberdine's own ¶5 line, answered by Quennerly |
| 4 | C | tone_misread | "She is right about that" |
| 4 | D | polarity overshoot | the lab's trial and measurement are credited without demur |
| 5 | A | scope_error | one paragraph of five |
| 5 | C | surface_word_match (phenols, lignin) | combustion gets one subordinate clause |
| 5 | D | outside_knowledge | no argument about losses; no dispute with a buyer is described |

No option reproduces a passage sentence; the longest shared token run between
any option and the passage was checked mechanically and is short.

## 6. Hedge map — addendum rule 10 (**PASS**)

batch15's ELF long carried a live residual: the "pick the qualified option"
heuristic reached ~4/5 there. Here it reaches **1/5**.

| q | key form | is the key the most-qualified option? | the cautious-sounding option is… |
|---|---|---|---|
| 1 | flat two-part factual assertion | **no** | **A** ("removes *some*… *if* it is done within a day") — wrong |
| 2 | flat | **no** — all four options flat | n/a |
| 3 | hedged ("*Some* of the ashy finish…") | **yes** (1 of 5) | the key |
| 4 | flat, unhedged assertion of a side ("backs the panel **outright**") | **no** | **C** ("leaves the choice to the reader") and **B** (soft, hopeful) — both wrong |
| 5 | descriptive | **no** — all four descriptive | n/a |

A form-only reader who always picks the most qualified option scores **1/5**.
A form-only reader who always picks the flattest scores 3/5 with no textual
reason to prefer that rule, and would be wrong on Q3. Q4 is the engineered
law-10 break: the key is the flattest option in the set and **two** cautious
options are wrong, one of them the classic "judicious reporter" answer.

M-FORM is also clean by construction — no question has the shape
"measured key, absolutized distractors".

## 7. Self-blind-solve

Solved all five from the passage alone, arguing actively **for** each non-keyed
option before rereading the keys: **Q1=B, Q2=D, Q3=C, Q4=A, Q5=B — 5/5.**

Every distractor is defeatable by pointing at a sentence (table in §5). No key
is recoverable from a sibling key: the five propositions are the trial result,
the leaf pathway, the in-mouth contribution, the writer's stance and the
whole-text focus.

**Three items were rewritten during the solve rounds** rather than passed
through:

1. **Q1** — the key originally read only "their wine was indistinguishable from
   the blocks left alone", which a reader who knows the smoke-taint literature
   could answer *without the passage* (a G-STEM kill). The invented higher
   reading was folded into the key to make it text-dependent.
2. **Q3** — the key originally restated the six sensitive tasters literally.
   That is retrieval, not inference, and arguably a second defensible answer,
   so it was moved to the in-mouth release and the literal restatement was
   distorted into the locus shift now sitting at A.
3. **Q5** — the key originally read "in a form **only the mouth releases**",
   which paragraph 4 contradicts: acid slowly frees the phenol in bottle too,
   which is why a wine can turn at eighteen months. Rewritten to "in a form the
   nose cannot find", which every paragraph supports and none qualifies.

Residual risk, stated rather than hidden: **Q2 and Q3 are partly answerable by a
solver with viticulture or flavour-chemistry knowledge** (leaf non-translocation
and inter-taster variation are both real findings). Q1 and Q5 were repaired to
remove exactly this exposure; Q2 and Q3 keep it because the alternative was to
weaken the passage's two best-attested mechanisms. G-STEM may flag them.

## 8. Mechanical self-check (`run_mech.py`, all 6 gates)

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```
(M-ECHO run against all 100 shipped units via `--p5-corpus-dir auto`;
M-PLAGIARISM against `data/parsed`.)

| stat | value | band |
|---|---|---|
| passage_words | 754 | ELF long 332–873 (blueprint 550–825) |
| paragraph blocks | 6 (5 paragraphs + byline line + glossary block) | union band 0–8 |
| mean_sentence_words | 20.4 | 14.9–35.4 (blueprint 16–30) |
| within-passage sentence-length sd | **11.23** | ≥7 required; corpus long-passage mean 10.6 |
| prompt_words | 6–11 | 3–30 |
| option_words | 8–17 | 0–31 |
| option_length_ratio (max per q) | **1.25** | cap 2.36 |
| key strictly longest | **0 / 5** | M-TELL flags at ≥75% |

Frame: title in `title` (not repeated in `passage`); byline and glossary inside
the `passage` string, byline last, glossary at the tail. Glossary defines
exactly two terms, **both of which appear in the passage** (*véraison*,
*glycoside*).

Spelling variety: **BrE, held throughout** — *colour, grey, odourless,
fortnight, tonnes, kilograms*. Zero unambiguous AmE tokens (checked
mechanically against a 14-token AmE probe list).

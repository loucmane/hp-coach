# gen-elf-short-2 — "Sittings to Let" (ELF short_text, TYPE-002, 1q)

Batch18 lane: ELF short_text TYPE-002, 105–160 words, exactly one question —
economic/social-history inference from a concrete documentary detail.

## Topic choice

The brief offered three candidates. Chosen: **(c) pew rents and the church
seating plans that priced proximity.** The other two were dropped on
family-exclusion graze, not on taste:

- **(a) turnpike shunpikes in survey maps** — grazes the shipped and excluded
  `ELF-TYPE-002 / turnpike-side-bar-what-a-gate-is-worth-history-essay-short`
  (same turnpike-toll economics, same document-reading angle).
- **(b) ice-house rental ledgers** — grazes the excluded
  `isupptagning-ishandel-facktext-long` (ice trade) and sits next to the
  shipped cold-chain-logistics family; the bank also already carries the
  full pair "Tannerfeldt Ishuset".

Pew rents was considered in batch17 and dropped there as a setting collision
with `elf-b16-004` (the village pound). The batch18 brief re-offers it
explicitly, so the collision is managed by architecture rather than avoidance
— see the law-12 section below for the move-by-move diff.

## Design

The passage is written as a present-tense reading of surviving documents: an
annual seating plan priced from pulpit to door. The documentary sequence is
the whole machine:

1. 1848 plan: prices graded 18s → 3s, free benches at the door; six
   middle-aisle pews **marked vacant**, four the next year.
2. 1851 plan: the vacant marks are **gone**, and the same plan first shows
   **ruled lines cutting the boxes into single sittings at 2s apiece**, with
   names crowding where one household's name stood.
3. Pew 9: an 18s box in 1848, three surnames by 1856 (Tebbenholt among them).
4. The minutes record the new lettings **without a word of explanation** —
   the cause is explicitly withheld.
5. Loose residue: 1861, front boxes raised to a pound (front demand held
   while the middle failed; consistent with the key, points at no option).

**Key inference (one inch, never stated):** letting seats singly was the
wardens' way of filling pews that would no longer let whole. The reader must
connect vacancy marks → their disappearance in the very plan where the
subdividing lines appear → crowding names. No general knowledge of
pew-renting supplies this parish's documented sequence, so a knowledgeable
solver still has to read (law 1).

## Trap architecture (q1, key B)

| opt | trap operation | why it tempts | why it dies |
|---|---|---|---|
| A | reversed reading of the crowding detail + outside knowledge (Victorian church-room-shortage narrative), hedged "mainly" | "names crowd" read as demand pressure | six then four pews stood vacant in the plans immediately before; benches were free — room existed |
| B | **KEY** — flat causal assertion | — | carries all four documentary facts |
| C | two-step leap (cheap → for the poor) + unsupported clientele claim, cautious "meant chiefly" | 2s is the cheap end; poor-relief framing feels period-true | text silent on takers; pew 9 was in the dearest class; benches stayed free |
| D | too-literal price recall with the unit bent (2s bought a sitting, not a box) — law-11 corollary: detail distorted, never quoted faithfully | recycles the passage's own figure | "let at two shillings **apiece**", several sittings per box |

## Self-blind-solve (skeptical, passage only)

Argued for each non-key option in turn: A dies on the vacant marks (a church
short of room does not carry vacant pews two plans running), C on the total
absence of taker information plus the wrong-direction pew 9 example, D on
"apiece". B survives alone; no pair jointly defensible. Single-answerable.

## Rule 10/13 hedge map

Key B is flat and unhedged. TWO distractors carry the cautious surface
(A "mainly", C "chiefly") — the qualified form is split across wrong options,
never concentrated on exactly one option, and the qualified-option heuristic
scores 0/1. No option carries a hard absolutizer (checked against mech.py's
list including the efterhandstillägg additions), so M-FORM's shape is absent
and "strip the absolutes" gets no purchase. This also varies the hedge
architecture from elf-b17-004 (whose set had exactly one hedged option).

## Rule 11 (cross-question lexical bridges)

One question — vacuous. Lemma table across ≥2 option sets: empty. Within the
single set, shared words are the passage's unavoidable subject terms
(sittings, box, shillings); no key mechanism word (filling, let whole,
singly) recurs in a distractor.

## Rule 12 (stem entailment)

Stem: "What can be concluded here about the letting of single sittings?" —
corpus-attested form ("What can be concluded here…?", cf. the authentic
17th-century-silver-coins stem). It presupposes only the verbatim-stated fact
that single sittings were let; it entails no cause, clientele or price-unit,
so it hands the blind solver nothing.

## Law 12 divergence (move-sequence diff)

- **elf-b16-004** (village pound — the unit this topic was once dropped
  against): institution + unwaged officer + vestry fee table + Sunday crying
  mechanism + two worked micro-cases in one week + artefact-until-demolition
  coda; inference = the calendar set the bill. **Here:** no officer, no named
  actor at all, no "vestry" (churchwardens, collective), no fee-table
  recitation (one gradient, described once), no notice mechanism, no worked
  sums (pew 9 is a static entry), coda = a forward price fact; inference =
  cause of a documented format change. "Sixpence" (b16's title word) never
  appears; prices run in shillings and a pound.
- **elf-b17-004** (milk round): flat past-tense narration of a trade
  convention with a transaction and a career coda. **Here:** present-tense
  document reading — the plans are the grammatical subject — which neither
  neighbour does.
- **Excluded archival-silence family:** that family infers from what records
  lack; here the silence line is one framing sentence and the inference runs
  on marks that are present (vacancy marks, ruled lines, crowding names).
- **elf-b4-004** ("Take a Seat"): shares only the word "seats" — different
  century, domain, mechanism; it has a quoted researcher, this unit has no
  voice at all.
- No received-view-then-corrective skeleton, no historian, no ledger/day-book
  sourcing, no aphoristic or "not A, but B" coda — the passage ends on a flat
  documentary fact and stops. Skeptic slot: none (varied per law 12).

## Law 16 / rule 14 search log (summary — full log in generator_meta.originality_note)

Names: **Stintbury** (toponym), **Dorothea Fetterlow** (byline),
**Tebbenholt** (surname on the plan).

- en.wiki CirrusSearch exact phrase — control "Pellew" 701 hits PASS; all
  four candidate queries (incl. full name) totalhits 0.
- Nominatim (UA header, ≥1s spacing) — control "Nether Stowey" PASS;
  Stintbury 0 (gb and worldwide); one-letter probes Stinbury / Sintbury /
  Stantbury all 0; Tebbenholt and Fetterlow as places 0.
- Exact-quoted WebSearch — recipe control "Robert Brindlow": live index,
  fuzzy near-names only, no exact bearer; supplementary positive control
  "Syd Dernley" PASS (real bearer, top hit). Stintbury: no exact match;
  nearest real places Stanbury / Kintbury / Saintbury / Stantonbury, all ≥2
  edits. Fetterlow: no exact bearer (Fetterman / Fetterolf / Fetterangus /
  Fetterley, none within one letter). Tebbenholt: no exact bearer; nearest
  real is living Dutch surname Tebbenhof at edit distance 2, unrelated
  domain — noted, kept. "Dorothea Fetterlow": no exact match.
- NOT consulted: forebears.io (HTTP 403 on its own control "Skelhorn" — no
  incidence data obtained, no claim made from it); Companies House; OS
  gazetteer; census indexes.
- All three names KEPT and **flagged for V-FINAL re-verification** per
  rule 14. Historical-genealogical near-bearers: none found for the exact
  names; the Tebbenhof near-name is a living bearer two edits away in an
  unrelated domain (note, not a reject under the exact-name rule).

Rule 8/9: Dorothea absent from the 231+14 given-name lists; full pair absent;
no one-letter variant of listed surnames or toponyms; no Hal-, no Ingrid,
no Qu-. Sibling gen-elf-short-1 declares only Edith Gimberfold (roofing
domain) — no overlap; "Edith" was dropped from consideration here once the
sibling's declaration landed.

## Bands / mechanics

Passage 152 tokens incl. byline, measured with mech.py tokenize (105–160
target; hard band 101–368). Sentence token counts 23/33/16/10/26/16/12/16 —
varied, mean 19.0 (band 12.0–47.2); the punctuation-light byline folds into
the final sentence per the law-6 note. One paragraph + byline. Option tokens
A15 B16 C18 D17 (mech tokenize, verified) — key second-shortest, ratio 1.20
(cap 2.36). Key letter B (spread vs b17-004's C).
Spaced en dash only (byline); no em dash; no quotation marks; straight
apostrophes; BrE throughout.

## fleet-repair-4 — 2026-09-01 (round-4 consolidated repair)

First repair round on this unit. **Rationale and metadata only.** The passage,
the stem, all four options and the key are byte-identical to the shipped bytes —
**`Stintbury` is an OWNER item and was not touched** — so no re-gate is owed and
every declared statistic still holds (A 15 / B 16 / C 18 / D 17, ratio 1.20, key
second-shortest). The three sheets came back byte-identical.

**1. Two unlicensed documentary claims in the teaching payload (V-FINAL INT-3;
pedagogy FIX 1; integrated MINOR_NOTES 2).** The rationale asserted *"the
benches at the door were free the whole time"* and *"the free benches stayed in
the plan throughout"*. The passage places the benches **only** inside the
1848-plan sentence, and that plan is said to price **pews**; benches are never
said to appear in any plan, and the passage never restates them after 1848.
`the whole time` / `throughout` convert a standing property into a claim about
what successive documents show, in a passage otherwise scrupulous about exactly
that distinction. Rescoped to *"the 1848 plan records free benches at the west
door, with nothing in the passage reporting their removal"* and *"the free
benches at the west door are recorded in 1848 and never reported as withdrawn"*.
The A-defeat and the C-defeat survive at full force.

**2. The key's premise, stated as a terminated process on a falling series
(V-FINAL INT-4).** The rationale read the vacancy data as *"whole boxes at
whole-box prices **had stopped** finding takers"*. The series is **six in 1848,
four in 1849** — falling, by a third in a year, and extrapolating it reaches
zero right where the vacant marks disappear. That is the single best move
available to counsel for A, and it was disclosed nowhere in `generator_meta`,
this file, or any of the eleven gate records. Restated as the passage states it:
*"pews still stood unlet in the two plans before the change — six in 1848, four
in 1849, a shortfall that was narrowing but had not closed"*. B needs no more
than that (four documented empty middle-aisle pews at the last observation just
**are** pews that "would no longer let whole"), and B remains the only option
that uses the vacancy data at all.

**3. The price-coherence gloss: one invalid step, one unstated assumption
(V-FINAL INT-2).** *"an eighteen-shilling box against back pews at three
shillings suggests several sittings per box"* does not follow — the passage
states that spread as a **proximity** gradient (*"eighteen shillings for the
boxes nearest the pulpit, falling row by row to three shillings at the west
door"*), so it carries no information whatever about seats per box. The real
evidence is elsewhere and is perfectly good: the ruled-lines sentence (*"Thin
ruled lines now cut the boxes into single sittings"*, plural per box) and pew 9's
three surnames. And *"two shillings a sitting undercuts the old per-seat rate of
the dear boxes"* holds only if a box held fewer than nine sittings, which the
passage nowhere states, and is inapplicable to the boxes that actually stood
vacant, which were middle-aisle boxes on the gradient rather than the dearest.
Re-attributed and conditioned; *"no arithmetic is needed to answer"* is retained,
because it is true.

**4. `residue_note` contradicted the rationale (V-FINAL INT-1) — the SECOND
consecutive batch in this lane.** It declared the free benches, pew 9's three
surnames and the ruled lines to be *"concrete residue the question does not
test"*, while the rationale rests two distractor defeats and (now) its
several-sittings evidence on them. The same charge was made against
`elf-b17-004` one batch earlier, which means the batch17 finding was not fed
back into the generator brief. All three are struck from the list with their
load-bearing role named. Law 9 still holds — the surviving residue (the spring
redrawing, the ink, the deliberately loose 1861 coda) is real and non-zero — but
the honest slack is roughly half what was declared.

**5. `rule_11_note`: a false claim, plus the undisclosed stem-lexis tilt
(integrated MINOR_NOTES 1; V-FINAL DISC-2).** *"no mechanism word from the key
(filling, let whole, singly) recurs in any distractor"* is false on the bytes:
`whole` recurs in D (*"a whole box in the middle aisle"*) and the key's `singly`
pairs with C's — and the stem's — `single sittings`. Within-question repetition
is harmless and the unit has one question, but the claim was wrong. The note now
also carries the **stem-lexis tilt** derivation, which was disclosed nowhere:
stem bare forms {letting, single, sittings}; overlap A 0, B 1, C 2, D 0, so
"pick the option carrying the most stem lexis" returns **C, a distractor**, and
the verbatim stem phrase sits on a wrong answer. Net: no free pick either way.

**6. Adversarial blind floor — STATED FOR THE FIRST TIME (V-FINAL DISC-1;
pedagogy FIX 2).** This was the only flagged unit in batch18 with **no floor
statement anywhere**, so condition (a) of the batch16 calibration policy was
unmet on its face. Now stated in `generator_meta.adversarial_blind_floor` at
**1-in-2**, with both channels written out: (i) D strips on form and topic — a
bare price datum about *whole boxes* under a stem asking what can be concluded
about *single sittings*; (ii) A and B are exact converses, and on a four-option
set with one converse pair a test-wise solver expects the key inside the pair.
The residual channel does **not** resolve to the key — the pair is broken only
by the vacancy sentence, and the world-knowledge prior pushes toward A, a
distractor.

### Mech re-run (fleet-repair-4)

`run_mech.py batches/batch18/candidates/elf-b18-004.json --parsed-dir
/home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto` (M-ECHO indexed
114 shipped units): **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass ·
M-ECHO pass · M-PLAGIARISM pass** — six of six, zero findings, exit 0.

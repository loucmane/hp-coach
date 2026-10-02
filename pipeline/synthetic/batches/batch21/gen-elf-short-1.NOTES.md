# gen-elf-short-1 — authoring record (verifier-completed)

**Unit.** `batches/batch21/gen-elf-short-1.json` — ELF `short_text_1q`, family
`ELF-TYPE-001 / pressure-sensitive-tape-adhesive-ageing-paper-conservation-reportage-short`,
title **“A Conservator on Tape”**, one question, **key C**.
`candidate_id` is the literal `PLACEHOLDER`; the orchestrator assigns the real id.

---

## 0. Completion note — read this first

**The generator did not write this file.** The generator wrote
`gen-elf-short-1.json` in full (passage, one question, rationale, 31
`generator_meta` fields) and was then killed by a rate limit before writing the
NOTES. This NOTES was written on 2026-09-02 by a **verifier**, from the unit's
own metadata plus live re-checks. Nothing in the unit — passage, options, key,
names, rationale, metadata — was changed by the verifier.

Two consequences of the interruption are material and are reported, not repaired:

1. **`generator_meta.originality_note` is `{}` and `generator_meta.measured_stats`
   is `{}`.** The law-16 SEARCH LOG that GENERATION.md law 16 and RULE 14
   require does not exist in the unit; `rule17_and_rule16_tension_note` points
   at it (“recorded in originality_note”) and it is empty. The only law-16
   claims the unit actually records are the three inside the tension note, and
   those were re-run live (§7). The verifier ran the full RULE 14 / RULE 16
   probe set itself and logs it in §7 so V-FINAL has something re-runnable; the
   field itself still has to be filled before G-REGISTER, and a verifier's log
   is not the generator's record.
2. **The verifier's RULE 16 one-letter sweep found a real-surname collision at
   Levenshtein distance 1** — *Fauldingham* ~ **Faulkingham** — which is exactly
   the Stintbury~Saintbury failure RULE 16 was written against (§7, DEFECT 1).
   Whether the generator had found and dispositioned it cannot be known,
   because the log it would have gone into was never written.

Everything below that is stated as the *unit's own* claim is quoted or
paraphrased from `generator_meta`; everything marked **[verified live]** or
**[recomputed]** was re-run by the verifier on 2026-09-02.

---

## 0b — Rename (added 2026-09-02, pre-gate repair round)

**The coined surname is now `Fenniscarth`.** *Fauldingham* was withdrawn on the
§7 finding and no longer appears anywhere in the unit's student layer or in its
live metadata; **every `Fauldingham` entry in §7 and §8 below is historical**,
kept as the verifier wrote it because it is the record of what was found. The
unit now reads *“says Odette **Fenniscarth**, a paper conservator”* and
*“What does **Fenniscarth** say about mends made with clear tape?”*. All eleven
occurrences were reached: passage 1, stem 1, and nine `generator_meta` fields
(`named_figures` object key, `name_blocks`, both `lane_constraints_rule20b`
spans, `stem_entailment_audit`, `registry_correction_ack`, and
`rule17_and_rule16_tension_note`). Given name **Odette** and the RULE 17
ordinary figure **Oscar Goddard** are unchanged.

**The sweep on the new name.** All **586** edit-distance-1 strings of
*Fenniscarth* were enumerated by code (every a–z substitution at 11 positions,
every deletion, every insertion at 12 gaps) and probed as quoted exact phrases
on en.wikipedia CirrusSearch in **40 OR-batches of 15**: **40 of 40 returned
totalhits 0**. Two salted batches proved a hit inside a batch is visible
(`“Bennistarth” OR “Cennistarth” OR “Pellew”` → 701;
`“Bennistarth” OR “Cennistarth” OR “Aldingham”` → 80), and the session control
`“Pellew”` returned **701 at start and 701 at end**. Exact-phrase probes on the
name itself: en.wikipedia **0**, sv.wikipedia **0**, OSM Nominatim **0**
worldwide / **0** GB / **0** SE, full pair *“Odette Fenniscarth”* **0**, quoted
web search **no bearer**, in-domain web query (conservator / conservation /
archivist / archive / paper) **no bearer**. Nearest real neighbour of any kind
is at **5** (*Scarth*, en.wiki 479; *Fennimore*, 412); nearest string in the
2,397-item bank-plus-brief screen is at **6**. Distance from the whole rejected
neighbourhood — *Faulkingham* 10, *Falkingham* 9, *Folkingham* 9,
*Fillingham* 9, *Frodingham* 9, *Aldingham* 10, *Faldingworth* 7 — is 7 or
more; the replacement was deliberately taken **off** the `F?l?ingham` surface
rather than moved one letter along it.

Also filled in the same round, both empty at §0: `originality_note` (the RULE 14
search log, including the *Faulkingham* rejection written down as the reason for
the rename) and `measured_stats` (RULE 19, recomputed with `mech.py`'s own
tokenizer on the final bytes — the figures reproduce §8 exactly, since the
rename is same-length). The two mis-stated distances §7 found are corrected:
**Goddard–Hebden 6**, and the surname–Hoskadale figure recomputed for the new
coinage at **Fenniscarth–Hoskadale 10**. Full record: `repair_log[0]` in the
unit, round `pre-gate-rename`. Gates on the final bytes: M-SCHEMA, M-BANDS,
M-TELL, M-FORM, M-ECHO and M-PLAGIARISM all **pass**, no findings.

---

## 1. The three binding constraints (RULE 20b), each with the span that discharges it

The brief's own warning, verbatim, because the brief asks for it to be stated:

> *“Three simultaneous binding constraints on one lane slot is the point at which
> a lane brief usually starts producing strained units.”*

The brief's resolution — **move the subject far** — was applied: a paper
conservator's bench is not a building, not a craft adjacent to one, and not
coastal (batch20's setting lesson). The trade supplies its own speaker and its
own surname stock.

### Constraint 1 — quoted voice (deferred twice, not deferrable again)

**DISCHARGED.** A named practitioner speaks in two whole quoted paragraphs with
present-tense attribution and contractions:

> “People ask me to take the tape off,” says Odette Fauldingham, a paper
> conservator. “Mostly there’s no tape left; the film let go years ago. What’s
> left is the glue. …”

> “Tape holds a tear for ten years and marks the sheet for a hundred. A mend from
> last year I warm, and the film lifts and brings most of the glue with it. One
> like this, heat won’t shift. … I don’t promise to take it out.”

Contractions in the quoted speech **[recomputed]**: *there’s, What’s, that’s,
sheet’s, won’t, glue’s, it’s, that’s, don’t* — nine U+2019 apostrophes in the
passage, all inside the quotation marks. The batch20 gate lesson (“quoted speech
must contain contractions”) is met.

### Constraint 2 — leave the domestic building envelope entirely

**DISCHARGED.** No wall, roof, chimney, flue, mortar, damp, brick, tile, joint,
cavity, stack, batten, loft or dwelling anywhere in the unit; also no boat, harbour
or coast. The object is a torn paper certificate; the setting is a conservation
bench. Discharging span (opening sentence):

> The certificate came in wrapped in a tea towel, torn across in about 1974 and
> mended at home with a strip of clear tape.

Against the predecessors: b16-003 cavity wall (envelope), b17-003 lock gate (built
fabric), b18-003 roof torching (envelope), b19-003 chimney pots (envelope),
b20-003 trawl cod end (maritime). This unit is neither envelope nor maritime.

### Constraint 3 — no `-by` surname coinage

**DISCHARGED.** The unit's only coined surname is **Fauldingham**: not `-by`, not
`-ius`, not `-vall`; neither given name is `Mar-*` (Odette, Oscar). Discharging
spans: `says Odette Fauldingham, a paper conservator` (passage) and
`– Oscar Goddard` (byline). Those are the only proper names in the unit
**[recomputed]**: capitalised tokens in the student layer are *Conservator,
Fauldingham, Goddard, Odette, Oscar, Tape* plus sentence-initial ordinary words.

**Blocks [recomputed]:** given names O/O (assigned N/O), surnames F/G (assigned
F/G); no name alliterates within itself.

---

## 2. RULE 17 / RULE 21 — the ordinary figure and the coinage, split as the brief asks

The unit records the split in `rule17_and_rule16_tension_note`, as RULE 21 requires:

- **Odette Fauldingham** — the coinage (surname), and the figure with invented
  words in her mouth. Carries the full law-16 + RULE 16 burden (§7).
- **Oscar Goddard** — the RULE 17 ordinary figure. Byline only; no quoted words,
  no attributed act.

RULE 21's three legs for the ordinary name, the unit's claims and the live re-run:

| leg | unit's claim | **[verified live 2026-09-02]** |
|---|---|---|
| (a) no notable bearer | en.wikipedia exact `"Oscar Goddard"` totalhits=0, control `"Pellew"`=701 | **0**; control `"Pellew"` **701** before and after the session |
| (b) no bearer in the unit's domain | web query `"Oscar Goddard" conservator OR conservation OR archivist OR archive OR librarian OR library OR museum` → no bearer in those trades | same query (+ `journalist`): results are generic conservator-career pages and Paul N. Banks; **no Oscar Goddard in any of those trades**. Bare-pair query: Find a Grave memorials for Oscar D. Goddard (1876–1944), Oscar Wilde Goddard (1885–1960), Oscar Hillard Goddard (1870–1940), one funeral-home obituary (Samson Oscar Goddard), one TikTok handle — diffuse private bearers, exactly as the note says |
| (c) no quoted words, no attributed act | byline only | the string `Goddard` occurs once in the student layer, in the final line `– Oscar Goddard` |

Exactly one coined surname in the unit, so no cluster (RULE 17's texture point).

---

## 3. The mechanism, and the sources for it

The unit's `mechanism_verification_note` lists seven sources (five fetched, two
403). The verifier re-fetched independently on 2026-09-02. **Verdict: the
mechanism holds; every arrow runs the documented direction.** Detail:

| passage claim | source (verifier-fetched unless marked) |
|---|---|
| tape adhesive is rubber with plasticiser in it (“The rubber in it … the plasticiser that kept it soft”) | Smith, Jones, Page & Dirda, *Pressure-Sensitive Tape and Techniques for its Removal From Paper*, JAIC 23(2) 1984, §1: “adhesive mass, which is usually composed of a synthetic or natural rubber … and which may contain a variety of softeners, antioxidants, plasticizers, and curing agents” |
| oxidation is the brown (“The rubber in it has oxidised – that’s the brown”) | JAIC §2: “As oxidation progresses … The adhesive mass gets very sticky and oily … It also starts to yellow”; later “the adhesive residues crosslink, becoming hard, brittle, and highly discolored.” Tate NANORESTART PST-removal workshop page: “they start to oxidise and the backing becomes yellow … the adhesive starts to yellow.” West Dean College blog: “After a longer period of time oxidation occurs and the adhesive becomes sticky, oily and yellow, staining the substrate.” The passage's lay attribution of the colour to “the rubber” is a simplification of “the rubber-based adhesive mass” (resins oxidise too); no source contradicts it and the direction is right. |
| plasticiser soaks into the sheet; the sheet goes translucent (“gone like greased paper; you can read the back through it”) | JAIC §2: “various components of the adhesive soak into the paper, rendering it translucent.” Tate: “penetrating into the substrate, making it translucent.” The specific word *plasticiser* rests on JAIC's component list plus the unit's quoted Heritage Science 2020 line (“tackifying resins and plasticizers can migrate into the underlying paper fibers making them translucent”) — **that source could not be re-fetched** (nature.com and the springeropen mirror both redirect to a login wall); the quote is carried as the generator's, not reproduced. |
| the film let go; the glue stayed (“Three flakes of film clung … the rest was a hard brown band”) | JAIC §2: “The carrier may fall off, and the adhesive residues crosslink, becoming hard, brittle, and highly discolored.” Tate: “The carrier may also fall off.” West Dean: “the carrier would peel off, leaving adhesive residue on the substrate.” |
| heat lifts a young mend's film with most of the glue; a hardened one “heat won’t shift” | Book and Paper Group Annual 17, *A Tool for Pressure Sensitive Tape Removal: The AirPencil*: “an effective tool for removing pressure sensitive tapes, which are still soft and pliable”; “Pliable adhesive residue can be reduced mechanically with a crepe rubber block.” JAIC §6.1 lists “a hand-held heat gun, or … a tacking iron” among carrier-removal techniques. West Dean: heated spatula “proved to be successful” on the pastedown tape. **Honestly scoped:** no fetched source states in terms that heat *fails* on crosslinked residue; it is implied by the AirPencil's “still soft and pliable” scope and by JAIC's stage-escalating solvent regime, and it is standard bench practice (crosslinked adhesive is no longer thermoplastic). The passage's flat form is a practitioner's, not a textbook's. |
| hardened glue is a solvent job, and “which solvent depends on what the glue was made of” | JAIC §3.1: “The most effective solvent in a given situation is the one whose solubility parameter matches the solubility parameter of the materials to be dissolved”; §4.2 (Magic Mending Tape, acrylic) ethyl alcohol vs §4.4 (cellophane tape, rubber): “During the induction period, hexane, cyclohexane, petroleum benzine, and ethyl alcohol release cellophane tape. As oxidation proceeds, stronger solvents, such as a mixture of cyclohexane and toluene, or toluene alone, may be necessary.” West Dean: benzyl alcohol vs acetone trial, “acetone was chosen as the best option.” |
| the brown in the fibres “I can lighten. I don’t promise to take it out.” | JAIC §2: “Once it has reached this condition, the adhesive residue and the stain it has created are very difficult, sometimes impossible, to remove.” West Dean rejected benzyl alcohol because it “left a slight stain” — residual staining assumed. |
| “clear tape”, home mend, about 1974 → cellulose-film carrier with rubber adhesive | JAIC §4.4 is the cellophane-tape section and describes exactly this browning class; acrylic “Magic” tape does not brown (JAIC §4.2; Tate: acrylics “do not discolour as much over time”). Period-correct. |

**Not fetched by the verifier:** Heritage Science 8 (2020) (login-wall redirect);
AIC BPG wiki *Hinge, Tape, and Adhesive Removal* (HTTP 403, same as the
generator); Preservation Equipment blog (not attempted; the generator had a
snippet only). Two primary and two secondary sources were read in full, which
satisfies the “at least two conservation sources” bar.

---

## 4. Trap design

Stem: **“What does Fauldingham say about mends made with clear tape?”** —
referential; names speaker and subject, predicates nothing contested. Corpus
frame (*“What does the writer say about X?”*). Longest stem↔passage shared run
**[recomputed]**: 2 tokens (“clear tape”).

| opt | trap (unit's `planted_traps`) | the span that kills it |
|---|---|---|
| **A** “The brown along the tear is plasticiser that has oxidised since the film came away.” | component role swap + surface word match: two true facts (glue oxidised; film came away) kept, browning reassigned from rubber to plasticiser | “**The rubber in it has oxidised – that’s the brown – and the plasticiser that kept it soft has soaked into the paper.**” |
| **B** “Heat is for mends whose adhesive has hardened, and solvent for those still soft.” | reversed method pairing | “**A mend from last year I warm, and the film lifts … One like this, heat won’t shift. The glue’s gone hard, so it’s solvent**” |
| **C** *(key)* “Where the adhesive gets into the paper, the sheet turns translucent enough to read through.” | — | “**the plasticiser … has soaked into the paper. Where the glue went in, the sheet’s gone like greased paper; you can read the back through it.**” |
| **D** “Once the solvent is matched to the adhesive, the brown comes out of the fibres with it.” | outcome overshoot | “**The brown that’s in the fibres I can lighten. I don’t promise to take it out.**” |

Balances **[recomputed on the option bytes]**: `mech._ABSOLUTIZERS` hits 0 of 4;
softener/hedge hits (*usually, often, may, some, tends, mainly, mostly,
sometimes, can, could, generally, rarely*) 0 of 4; option tokens 15/14/15/17,
key not longest; longest option↔passage shared run 3 tokens (C, “into the
paper”), so no option reproduces a passage sentence (law 3). Law 11 holds: A, B
and D are each false against a quotable sentence, not merely less good.

**Hedge map (rule 10):** one question; key unhedged; A, B, D unhedged. Neither
“pick the qualified one” nor “strip the absolutes” selects anything.

---

## 5. The option-sortability test — the unit's own, and the verifier's re-run

**The unit's own test** (`generator_meta.option_sortability_test`, run with the
passage covered): no contradictory dyad; no hedging axis; no shape singleton
(C and D open on subordinate clauses, A and B on main clauses); no scope
singleton; no polarity singleton; length gives nothing; no remedy corroboration
and no reversed-arrow mirror of the key. Thesis-versus-detail: the passage's
thesis (“the stain is the glue, not the film”) is stated by none of A–D. **Its
stated residual:** A and C read as damage-chemistry claims, B and D as
removal-practice claims — a 2/2 split — so a solver who bets “the passage is
about the damage” is at **1-in-2 between A and C**; a domain expert clears A, B
and D from knowledge. **Its finding: 1-in-4 on form; 1-in-2 for a test-wise
non-expert; solvable for a domain expert.**

**The verifier's re-run — with a disclosure.** The verifier had read the whole
unit (passage, rationale, metadata) before covering the passage, so this is a
form analysis of the four option strings, not a clean blind solve. On wording
alone:

- The unit's negative findings all reproduce: 0/4 absolutizers and 0/4 softeners
  **[recomputed]**, no contradictory dyad, no length or polarity singleton, D is
  the longest.
- **Two test-wise routes the unit did not list.** (i) **D is a full-success
  outcome claim** (“the brown comes out … with it”) in a piece whose title puts a
  conservator in it; genre-wise readers expect conservators to be quoted being
  cautious, so D reads as the optimistic distractor. (ii) **B is an explicit
  two-term assignment** (heat for P, solvent for Q) — the canonical shape of a
  swap-trap — so a test-wise solver discounts it on shape. Both are soft
  heuristics, not eliminations, but together they leave **A versus C: the same
  1-in-2 the unit disclosed, reached by a different route.** Between A and C,
  A's compound temporal reassignment (“plasticiser that has oxidised since the
  film came away”) is busy in the way swapped-component distractors are, and C
  is a plain sensory observation; the verifier would have picked C at roughly
  55 %.
- **Stated plainly, since the brief asks: the re-run beats 1-in-3.** It lands at
  1-in-2 for a test-wise non-expert, agreeing with the unit's own residual and
  not exceeding it, and it does not certify the unit's 1-in-4 form floor. The
  key is not thesis-shaped (none of the options is), which is the unit's
  strongest defence. This is a G-STEM judgement, recorded here for it; the
  verifier did not rebuild the option set.

---

## 6. Self-blind-solve — arguing FOR each distractor, then killing it on a span

**FOR A.** “She says the glue oxidised and she says the film came away; the
brown appeared after the film went — that is exactly what A says, and
‘plasticiser’ is her word.” **KILLED BY:** the one sentence that assigns the two
components: “The rubber in it has oxidised – that’s the brown – and the
plasticiser that kept it soft has soaked into the paper.” The brown is the
rubber; the plasticiser went *into* the sheet. A fails on attribution, not on
vocabulary.

**FOR B.** “Heat softens hard things; solvent dissolves soft sticky things.
Everyday sense says B, and she does use both methods.” **KILLED BY:** “A mend
from last year I warm … One like this, heat won’t shift. The glue’s gone hard,
so it’s solvent.” Heat is for the young mend, solvent for the hardened one — the
exact reverse of B.

**FOR D.** “She matches the solvent to the glue — the passage says so — and once
the glue is dissolved its colour goes with it; that is what dissolving means.”
**KILLED BY:** “The brown that’s in the fibres I can lighten. I don’t promise
to take it out.” D upgrades a limited result to a complete one; the passage's
last two sentences exist to deny exactly that.

**Verdict: exactly one defensible answer, C.** It is the only option that
survives its span check; A, B and D each fail against a sentence a careful
reader can point to.

---

## 7. Law 16 / RULE 14 / RULE 16 — the search log the unit lacks, re-run by the verifier

**What the unit records:** `originality_note` is **empty** (§0). The only law-16
claims in the unit are the three in `rule17_and_rule16_tension_note` (Oscar
Goddard: wiki 0 with control 701; domain query clean; diffuse private bearers)
and the six Levenshtein figures in `registry_correction_ack`.

**Spot-checks of the recorded claims [verified live, 2026-09-02 09:17 UTC]:**

- `"Oscar Goddard"` en.wikipedia CirrusSearch exact phrase → **0**; control
  `"Pellew"` → **701** at session start and **701** at session end. Reproduced.
- `"Odette Fauldingham"` en.wikipedia exact phrase → **0**. Reproduced (the
  unit asserts this only implicitly, via “the full law-16 … burden recorded in
  originality_note”).
- Domain query for Oscar Goddard (§2 leg b) → reproduced; bare-pair query →
  same Find a Grave / obituary / TikTok set the note lists.
- `registry_correction_ack` distances **[recomputed]**: Odette–Fiona 6 ✓,
  Oscar–Gordon 5 ✓, Goddard–Gordon 4 ✓, Fauldingham–Pärlhage 9 ✓;
  **Goddard–Hebden is 6, not the claimed 5; Fauldingham–Hoskadale is 11, not the
  claimed 8.** Both errors run in the safe direction (real distance larger),
  but RULE 16 says *compute, do not quote*, and two of six “computed” figures
  are wrong. Minor; recorded.

**The verifier's own probe set for the coinage `Fauldingham`:**

| probe | endpoint | result |
|---|---|---|
| control `"Pellew"` | en.wikipedia CirrusSearch exact | 701 (start), 701 (end) |
| control `Flarken` countrycodes=se | OSM Nominatim | 5 places |
| `"Fauldingham"` | en.wikipedia exact | **0** |
| `"Fauldingham"` | sv.wikipedia exact | **0** |
| `Fauldingham` (world) | OSM Nominatim | **0** |
| `"Fauldingham"` | web search, exact-quoted | no exact bearer; fuzzy neighbours returned: Fauldhouse, Foderingham, Framlingham, North Frodingham, Faldingworth |
| `"Odette Fauldingham" OR "O. Fauldingham" OR "Fauldingham" conservator` | web search | no bearer; returned **Gail Falkingham** and Jonathan Falkingham (see below) |
| `Fauldingham~1` (fuzzy, d≤1) | en.wikipedia | **200** — top hit *Billy Bob Faulkingham* |
| `Fauldingham~2` (fuzzy, d≤2) | en.wikipedia | 566 — Faulkingham, Josh/Edward Falkingham |
| `"A Conservator on Tape"` (title) | en.wikipedia exact | 0 |

**Computed one-letter sweep (RULE 16, enumerated by hand — i.e. by code, not
read off a result page):** all **587** edit-distance-1 strings of *Fauldingham*
(every a–z substitution at 11 positions, every deletion, every insertion at 12
positions) probed against en.wikipedia CirrusSearch in **40 OR-batches of 15**.
Batch controls in the same session: `"Bauldingham" OR "Cauldingham" OR "Pellew"`
→ 701; `"Bauldingham" OR "Cauldingham" OR "Aldingham"` → 80 — so a hit inside a
batch is visible and the zeros are real zeros. **Result: 39 batches zero; one
batch positive, drilled to a single variant:**

> **`"Faulkingham"` → 200 totalhits.** Real surname. Notable bearer: William
> “Billy Bob” Faulkingham, Minority Leader of the Maine House of Representatives,
> self-employed lobsterman, Winter Harbor, Maine. Distance from *Fauldingham*:
> **1** (d→k).

### DEFECT 1 — RULE 16 breach: `Fauldingham` is at Levenshtein distance 1 from the real surname `Faulkingham`

RULE 16: “Every coined name must sit at Levenshtein distance ≥ 2 from BOTH (a)
every proper noun already shipped in the bank and (b) its real gazetteer/surname
neighbours — and the one-letter variants must be enumerated BY HAND.” Leg (a)
passes (bank screen below). **Leg (b) fails.** This is the Stintbury~Saintbury
case: a fuzzy engine silently corrected past it (the exact-phrase probes were
all clean), and only the enumeration found it. The batch20 generator rejected
its own first choice *Jerrimond* on *Perrimond* at 11 hits; *Faulkingham* is at
200. The bearer is not in the unit's domain (politics/fishing), which is the one
mitigating fact; the rule as written does not turn on domain.

Also at distance **2** (allowed by the rule's letter, recorded because they
cluster on the same `F?l?ingham` surface): **Falkingham** — real surname;
*Gail Falkingham FSA*, archaeologist, archivist and Assistant Curator of
Archaeological Archives at the Yorkshire Museum, i.e. **heritage/archives, the
domain next door to paper conservation**; *Jonathan Falkingham*, architect —
and **Aldingham** (real Cumbrian parish; en.wikipedia 80, Nominatim 2 places).
At 3: Folkingham, Fillingham, Frodingham (Lincolnshire/Yorkshire places),
Faulding (F.H. Faulding & Co.).

**Not fixed by the verifier.** A rename touches the passage (one occurrence),
the stem (one occurrence) and six metadata fields, and the choice of a
replacement F-block surname at distance ≥ 2 from Faulkingham, Falkingham,
Folkingham, Fillingham, Frodingham, Aldingham and the bank is the generator's
(or the orchestrator's) call, with the sweep re-run on the new string. The
rationale does not name her (“the conservator’s”), and the title does not.

**Bank screen [recomputed]:** every capitalised token in every shipped/queued
title, passage, prompt and option (`batches/*/candidates-final` +
`batch18/19/20/candidates`, 135 units, 2,082 tokens) plus every capitalised
token in the batch21 brief (974) — 2,349 strings — Levenshtein against each name:

| name | in any brief list? | nearest bank/brief string | distance |
|---|---|---|---|
| Fauldingham | no | Fading | 5 |
| Goddard | no | Gotland | 3 |
| Odette | no | Odile (listed given name) | 3 |
| Oscar | no | Osian, Assar (listed given names) | **2** |

Full pairs *Odette Fauldingham*, *Oscar Goddard* and the title are absent from
the brief; the five correction names (Kajsa, Birger, Gordon, Fiona,
Skrömtbäcken/`Skrömt-`) are absent from the student layer (they appear only in
the unit's `registry_correction_ack`, quoting the correction). *Oscar* at 2 from
two listed given names is recorded, not flagged: RULE 16 governs coinages and
*Oscar* is real stock; RULE 8's near-duplicate clause is about surname
one-letter variants.

**RULE 8 sibling sweep:** `batches/batch21/` contained only this unit's JSON at
verification time (as at authoring time), so the sweep is still vacuous. **The
orchestrator must re-run it for *Odette* and *Oscar* once sibling units land.**

**Flagged for V-FINAL regardless**, per RULE 14 — and doubly so here, because the
unit's own log does not exist.

---

## 8. Measured band statistics — recomputed on the shipped bytes (RULE 19)

`generator_meta.measured_stats` is empty (§0). Every figure below was computed by
the verifier with `mech.py`'s own `tokenize()` / `sentences()` over
`batches/batch21/gen-elf-short-1.json` as it stands; nothing is carried forward.

| stat | value | band (`gates/bands.json`, ELF `short_text` / `reading`) | verdict |
|---|---|---|---|
| passage tokens (mech) | **197** (188 by a plain word regex) | 101–368 | pass — but **above the GENERATION.md blueprint authoring target of 105–160**; declared in §10 |
| paragraphs | **4** | 0–8 | pass (blueprint 1; deviation declared, §10) |
| sentences (mech splitter) | 10 | — | — |
| sentence token lengths | 24, 46, 6, 22, 33, 19, 7, 20, 10, 10 | — | short verdicts beside a 46-token period; not uniform |
| mean sentence words | **19.70** | 12.0–47.2 | pass |
| sentence length SD (population) | **11.96** | blueprint ≥ 7 | pass |
| prompt tokens | **10** | 3–30 | pass |
| option tokens | **15, 14, 15, 17** | 0–31 | pass; matches the unit's `length_tell_note` |
| option_length_ratio_max | **1.214** (17/14) | ≤ 2.36 | pass; key C (15) is not the longest |
| longest shared token run, key ↔ passage | **3** (“into the paper”) | — | law 3 holds; A 2, B 1, D 2 |
| em dashes, whole file (literal or `—`) | **0** | rule 3 | pass |
| spaced en dashes, passage / rationale | 3 / 4 | rule 3 | pass |
| absolutizers among the four options | **0 of 4** | — | M-FORM cannot fire |

**Gate run**, `run_mech.py` over this exact file with
`--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir
batches/batch*/candidates-final batches/batch18/candidates
batches/batch19/candidates batches/batch20/candidates` (glob word-split in zsh),
2026-09-02T09:16:52+00:00 → *M-ECHO: indexed 135 shipped unit(s)*;
**M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass, M-ECHO pass,
M-PLAGIARISM pass — all six, no findings.**

**Key letter C — both populations recomputed, sums shown [recomputed]:**

- All ELF one-question shorts in `batches/*/candidates` and `candidates-final`,
  deduplicated by `candidate_id`, **n = 38**: A 6, B 14, C 11, D 7 →
  6 + 14 + 11 + 7 = **38** ✓ (matches the unit's `key_letter_note`).
- TYPE-001 one-question shorts alone, **n = 17**: A 5, B 6, C 3, D 3 →
  5 + 6 + 3 + 3 = **17** ✓ (matches).
- Lane sequence by id **[recomputed]**: … b16-003 **D**, b17-003 **A**, b18-003
  **D**, b19-003 **A**, b20-003 **D**. The brief asked for B or C to break the
  five-long run; C is the rarer of the two in the lane (3 vs 6) and bank-wide
  (11 vs 14). **C breaks the run and is the right choice on the counts.**

---

## 9. Typography and spelling variety — one system across all layers

**[recomputed by layer]:**

| layer | “ | ” | ’ | – | — | straight `'` | straight `"` |
|---|---|---|---|---|---|---|---|
| title | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| passage | 3 | 3 | 9 | 3 | 0 | 0 | 0 |
| prompt | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| options A–D | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| rationale | 5 | 5 | 8 | 4 | 0 | 0 | 0 |

One system: U+201C/U+201D quotes, U+2019 apostrophe, spaced U+2013, zero em
dashes, zero straight ASCII quotes or apostrophes in any student-facing layer or
the rationale. The file is pure ASCII (every non-ASCII character written as a
`\uXXXX` escape), as the typography lesson requires. No snake_case trap labels,
no `KEY`, no `(lag N)`, no gate names in the rationale.

**BrE, all layers [recomputed]:** *oxidis-* 5, *plasticiser* 6, *fibre* 3; zero
AmE counterparts across 31 BrE/AmE pairs; zero `-ize`/`-ization` tokens in the
student layer or rationale. One variety held.

Observation for G-ENG, not a defect: the conservator's speech runs over two
paragraphs and each paragraph is closed with ” and reopened with “ (the
each-paragraph-closed convention) rather than the newspaper convention of
leaving the first paragraph's quotation open; the third paragraph carries no
fresh attribution. The speaker is unambiguous; the choice is a house-style one.

---

## 10. Declared deviations, and the checks that are vacuous here

- **Passage length 197 mech tokens** against the GENERATION.md unit spec of
  105–160 for ELF `short_text` (batch20's NOTES cited a 150–170 aim). Inside
  `bands.json` 101–368, so M-BANDS passes and the blueprint figure is the
  authoring target, not the gate. Recorded for the orchestrator; a passage
  carrying two quoted paragraphs plus a narrative opening is the structural
  reason.
- **Paragraphs 4** against the blueprint's 1: the quotation cannot run into the
  narration without misreading as the writer's voice, and the byline is its own
  line. Same declared deviation as elf-b20-003.
- **`generator_meta.model` = `"claude-fable-5-1"`**, not the rule 7 literal
  `"claude-opus-5"`; the unit's `model_note` says why (the literal would misstate
  the model that wrote the bytes). Disclosed deviation; not the verifier's to
  change.
- **`date` = 2026-09-01** (the brief's fixed value); actual authoring 2026-09-02
  per `date_note`. Disclosed.
- **Readability:** not measured, therefore not asserted (law 7, RULE 19).
- **RULE 11** (cross-question bridges) and **RULE 15** (inventory + stance
  pair): vacuous for a one-question unit; the single-question analogue is the
  stem-entailment audit (§4), which passes.
- **`originality_note` and `measured_stats` empty** — see §0 and §7. Not a
  deviation the unit declares; a consequence of the interruption.

---

## 11. Clone check (law 12 / law 13) — the unit's claim, spot-checked

The unit's `clone_check_note`: opens on an object arriving, moves to a quoted
correction of a lay misreading, then to method, closes on a concession (“I don’t
promise to take it out.”) — not an aphorism (the aphorism is mid-quote), not a
flat operational fact, not a dating. Against b18-003 (survey instruction → flat
construction fact), b19-003 (count instruction → flat trade fact), b20-003
(skipper's action → unbargained complication). No money arithmetic. Inland.

**Phrase grep reproduced [recomputed]** over every shipped/queued ELF student
layer (135 units): zero hits for *for a living, years ago, won’t shift, don’t
promise, tea towel, greased paper, read the back, holds a tear, let go, what’s
left, take the tape off, mended at home, which solvent, gone hard, gone like,
clung at*; generic bigrams *ten years* (elf-b14-001), *the width of*
(elf-b9-002, b10-001, b10-004), *for a hundred* (elf-b17-004) hit exactly as the
unit says and are not signature strings. M-ECHO against 135 units: pass.

---

## 12. Summary of findings for the orchestrator

| item | result |
|---|---|
| names vs all brief lists incl. the five correction names | **clear** — none of Odette, Oscar, Fauldingham, Goddard, the two pairs or the title appears in any list; blocks N/O + F/G honoured; no `-by`, `-ius`, `-vall`, `Mar-*` |
| RULE 20b constraints 1–3 | **discharged**, spans in §1 |
| RULE 17 / RULE 21 split | **clean**; Oscar Goddard (a)(b)(c) re-verified live |
| mechanism | **holds** — JAIC 1984, Tate NANORESTART, BPG Annual 17, West Dean read live; Heritage Science 2020 not re-fetchable (login wall) |
| option sortability | unit's own test says 1-in-2 for a test-wise non-expert; **verifier's re-run agrees at 1-in-2 (A vs C, C favoured ~55 %) by a different route — above 1-in-3, not above the disclosed residual**; G-STEM judgement |
| law 16 spot-checks | the three recorded claims **reproduce**; control 701/701 |
| **DEFECT 1 — RULE 16** | **`Fauldingham` ~ `Faulkingham` at distance 1** (real surname, 200 en.wikipedia hits, notable bearer). Rename required unless the owner rules otherwise. Falkingham (d2, heritage-domain bearer) and Aldingham (d2, real parish) cluster beside it. |
| **DEFECT 2 — missing log** | `originality_note` and `measured_stats` are `{}`; the law-16 search log required by law 16 / RULE 14 does not exist in the unit. This NOTES §7–§8 is a verifier's log, not a substitute for the field. |
| minor | two of six `registry_correction_ack` distances mis-stated (safe direction); passage 197 tokens above blueprint target; model literal deviates from rule 7 (disclosed) |
| mech gates | **6/6 pass**, M-ECHO indexed 135 |
| typography / BrE | **one system, one variety, all layers** |
| RULE 8 sibling sweep | still vacuous — no siblings present; **re-run when they land** |

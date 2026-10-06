# gen-elf-short-2 — "Before the Pillar Boxes" (ELF short_text, TYPE-002, 1q)

Batch19 lane: ELF short_text TYPE-002, 105–160 words, exactly one question —
economic/social-history inference from a concrete documentary detail.

## Topic choice

The brief offered three candidates. Chosen: **(b) letter receiving houses
before the pillar boxes, the keeper allowed a rate per window hour.** The
other two were dropped on family/motif graze, not on taste:

- **(a) coaching-inn horse-change ledgers, entry gaps and road seasons** —
  two independent grazes. Law 13 lists **ledger-study sourcing** as a
  saturated motif, and the road-toll economics sits on the shipped and
  excluded `ELF-TYPE-002 / turnpike-side-bar-what-a-gate-is-worth-history-essay-short`
  (elf-b15-004, same family, same format, same road-revenue domain).
- **(c) lighthouse keepers' visitor books, signatures stopping mid-season** —
  grazes the shipped `history-of-navigation-history-essay-long` (elf-b5-002,
  same section and genre, maritime domain) and the shipped cloze family
  `disappearing-handwritten-signature-society-commentary-cloze`; the natural
  reading (you cannot land in autumn) is also a law-1 risk, since a solver
  who knows nothing about the passage can supply the seasonality.

Postal history is touched once elsewhere in the bank, by the Swedish LÄS long
`postvasende-landsbygdshistoria-facktext-long` (las-b7-001). That unit is a
historian's archival study of rural **delivery** rounds and a correlation
thesis about carrier residence and rail distance; this one is an English ELF
short about letters handed **in** over a counter, with no researcher, no
study and no correlation. The graze is domain-level only and is declared
here rather than papered over.

## Design

Flat past-tense narration — deliberately **not** the present-tense
document-reading voice the batch18 addendum marks as saturated ("två
short-históriker i rad"), and not b17-004's transaction-plus-career-coda
narration either. The machine is a contrast the passage lays out and never
performs:

1. Frame: before the pillar boxes, letters went in at a hatch beside a shop
   door; such shops were receiving houses.
2. The rule: threepence **for every hour the hatch stood open**, and not a
   penny for the letters. The returns record hours and letters both.
3. The two shops face each other across the same market place — one town,
   one trading day, so the comparison is fair without being argued.
4. Michaelmas 1846: the chandler opens at **seven in the morning** and takes
   **412** letters; the bookseller opens at **two** and takes **390**.
5. **Both shut when the evening cart went at eight.**
6. Coda: the surveyor's only remark that quarter is that the chandler's flap
   wanted a new spring.

**Key inference (one inch, never stated):** seven extra hours of opening
bought about twenty-two extra letters, while the six hours the two shops
shared carried nearly four hundred at each counter — so what a hatch took in
was governed by the hour the cart went, not by how long it stood open. The
two divisions the reader needs (13 against 6; 412 against 390) are never
performed on the page.

## Trap architecture (q1, key D)

| opt | trap operation | why it tempts | why it dies |
|---|---|---|---|
| A | incentive misread / causal glue — the per-hour allowance offered as the cause of long hours | the passage hands over a per-hour rate and a shop open thirteen hours; the economics writes itself | the bookseller kept **six** hours on the identical allowance; a rule that leaves one keeper at six and another at thirteen did not settle either man's hours, and no keeper is said to stretch anything |
| B | magnitude distortion (law-11 corollary: the detail bent, never quoted faithfully) | right direction, and the figures are the passage's own | 412 against 390 is twenty-two letters; "far more" is the one thing the numbers refuse |
| C | reversed causality + outside knowledge; the sheet's one hedged option | "largely fixed to suit" sounds administratively true | the passage says nothing about how the cart's hour was set, and two shops on different hours cannot both have had it arranged around them |
| D | **KEY** — flat causal assertion | — | the only reading that carries both hour-counts and both letter-counts |

**Note on A:** it is the machine of the shipped `elf-b1-004` ("Paid by the
Ship", the excluded family *economic-history-incentives-inference*) —
payment scheme explains behaviour. Putting that reading in a distractor and
refuting it with the second shop is the deliberate way this unit stays off
that family: same evidence domain, opposite conclusion type.

## Self-blind-solve (skeptical, passage only)

Argued for each non-key option in turn. A dies on the bookseller's six hours
under the same rule. B dies on 412 against 390. C dies on the text's total
silence about how the cart's hour was set, plus its own incoherence given two
shops on different hours. D survives alone; no pair is jointly defensible.
Single-answerable.

**Adversarial blind floor (stem + options, no passage):** stated explicitly —
no better than 1 in 4 by content, and no better than **1 in 2** on any
surface heuristic I could construct (three of the four options are
contrastive "X rather than Y" claims; the odd one out, B, is a comparative,
and it is a distractor, so "pick the odd shape" scores zero).

## Rule 10/13 hedge map

Key D is flat and unhedged. **Exactly one** option carries the qualified
surface — C, "largely fixed to suit" — and it is a **distractor**, so the
"pick the qualified/moderate answer" heuristic scores 0/1 and rule 10's cap
(key qualified in at most half the questions) is met at zero. A and B are
flat and sweeping in different registers (a bare purpose claim; a bare
comparative), so "qualified" and "correct" nowhere line up. No option
contains a token from mech.py's `_ABSOLUTIZERS` set, including the
efterhandstillägg additions (`nothing`, `nobody`, `no one`), so M-FORM's
key-is-the-sole-measured-option shape is absent and "strip the absolutes"
gets no purchase. This also varies from elf-b18-004, which split the cautious
surface across **two** distractors.

## Rule 11 (cross-question lexical/conceptual bridges)

One question — vacuous. Lemma table across ≥2 option sets: **empty**. Within
the single set the recurring words are the passage's unavoidable subject
terms (hatch, hours, letters, shop, cart). Mechanism words are disjoint by
construction: the key's ("governed", "the length of opening") appear in no
distractor, and each distractor's ("stretched"/"allowance" in A, "far more"
in B, "fixed to suit" in C) appears nowhere else.

## Rule 12 (stem entailment)

Stem: **"What is implied here about the two receiving houses?"** — the
corpus-attested inference form ("What is implied here?" is the single most
frequent authentic ELF stem, 11 of 405) with a neutral referential anchor.
It presupposes only what the passage states verbatim (the town had two
receiving houses) and predicates nothing contested: no cause, no quantity,
no hour, no agent. It therefore entails and excludes none of A–D. Read
alone it gives a blind solver the topic and nothing else.

## Law 12 divergence (move-sequence diff)

- **elf-b1-004** ("Paid by the Ship"): key *is* the incentive reading. Here
  that reading is option A and is refuted; the key is a claim about what
  determined a count, not about what motivated a person.
- **elf-b18-004** ("Sittings to Let"): present-tense document reading,
  documents as grammatical subjects, price gradient, vacancy marks, a format
  change, minutes that withhold the reason. **Here:** past tense, no format
  change, no silence-of-the-record move (the surveyor writes — about a
  spring), and a quantitative contrast instead of a sequence of marks.
- **elf-b17-004** ("Selling the Doorstep"): named buyer, transaction, worked
  sums, career coda. **Here:** no individual, no transaction, no arithmetic
  performed on the page.
- **elf-b16-004** ("Sixpence a Night"): unwaged officer paid in fees, vestry
  fee table, weekly crying mechanism, two paired micro-cases. **Here:** the
  fee rule is one background clause; no officer, no table, no notice
  mechanism, no case.
- **elf-b15-004** ("Quarnley Bar"): counterfactual across seasons at one
  gate, named surveyor reporting at length. **Here:** two contemporaneous
  shops in one quarter; the surveyor is unnamed and writes one triviality.
- **las-b7-001** (shipped postal family): Swedish, LÄS long, delivery rounds,
  named historian, archival study, correlation thesis. **Here:** English,
  ELF short, letters handed in, no researcher, no study, no correlation.
- Saturated motifs avoided: no ledger or day-book sourcing (the word
  *ledger* does not appear), no measurement-book or wedge-gauge coda, no
  institution-in-decline arc, no received-view-then-corrective skeleton, no
  aphoristic or "not A, but B" close — the passage ends on a broken spring
  and stops. Skeptic slot: none.

## Law 16 / rule 14 search log (summary — full log in `originality_note`)

Names committed: **Draystow** (toponym) and **Clement Nabbsworth** (byline).
No other proper name appears in the unit; the chandler, the bookseller and
the surveyor are trades and an office, unnamed and ungendered. The real
Post Office is never named as the actor of an invented rule — the fee rule
is given in the passive ("the keeper was allowed threepence").

- **en.wiki CirrusSearch exact phrase** — control "Pellew" 701 hits (top hit
  Edward Pellew, 1st Viscount Exmouth), run twice in session: PASS.
  Draystow 0; Nabbsworth 0; "Clement Nabbsworth" 0; one-letter probe
  Nabsworth 0.
- **Nominatim** (UA header, ≥1.3 s spacing) — control "Nether Stowey" gb
  returned the Somerset village, run twice: PASS. Draystow gb 0, worldwide
  0, se 0; probes Braystow / Drayston / Draystowe all 0; Nabbsworth gb 0 and
  worldwide 0; Nabsworth gb 0.
- **Exact-quoted web search** — recipe control `"Robert Brindlow"`: live
  index, fuzzy near-names only (Brindley, Bristow, Brudenell, Brerewood), no
  exact bearer — so an independent positive control was run,
  `"Ebenezer Prout"`, which returned the real 1835–1909 music theorist as top
  hit: PASS. Then `"Draystow"` — no exact bearer; nearest real places
  Drayford, Draycote, Draycott, Draycott in the Clay, each ≥4 edits.
  `"Nabbsworth"` — no exact bearer; nearest are the real surname Nabb (the
  novelist Magdalen Nabb) and a last.fm handle *nagsworth* at 2 edits —
  noted, unrelated domain, kept. `"Clement Nabbsworth"` — no exact bearer.
- **Rejections made on these checks** (recorded because the rejects are the
  evidence that the checks were real):
  - **Culmshaw** — drafted as byline surname, REJECTED: the web search
    surfaced **Culshaw** (John Culshaw of Decca, Jon Culshaw, and the
    Liverpool surveying firm Culshaw and Sumners; en.wiki 1009 hits).
    Culmshaw is Culshaw plus one letter, in the surveying domain this
    passage touches.
  - **Kirtlewood** — drafted, REJECTED: `"Kirtlewood"` surfaced
    **KirtleyWood LLC**, a live US governance firm at kirtleywood.com
    (Olivia Kirtley, Phoebe Wood) — one letter away, living bearers, live
    domain.
  - **Marrowdene** — drafted, REJECTED on our own bank: elf-b14-002 carries
    **Larrowden**, two edits away.
  - **Sallowmere** — drafted as toponym, dropped: not a real-world collision
    (a D&D will-o'-wisp page and fantasy name generators) but it reads as
    generated fantasy rather than as an English market town.
  - Screened out on wiki hits before any web search: Ockleford, Trenowden,
    Whelpstone, Bramsell, Dunthorn, Sallowby. Rejected on one-letter
    reasoning against real places without a search: Harnwick (Hardwick),
    Feltcham (Feltham), Purlbeck (Purbeck), Bramfold (Bramford), Tarbolt
    (Tarbolton), Stennifold (Pennifold), Vennerby (bank near-pair
    Quennerby).
- **NOT consulted:** forebears.io, Companies House, the Ordnance Survey
  gazetteer, census indexes, the Post Office archive catalogue. No
  surname-incidence or archival claim is made from any of them.
- Both committed names are **KEPT and flagged for V-FINAL re-verification**
  per rule 14.

Rule 8/9: *Clement* is absent from the 231-name list and from the batch17 and
batch18 additions; a bank grep returns one hit only, inside elf-b15-002's
`originality_note` naming the real Cornish place Saint Clement — not a
character. Full pair absent. No one-letter variant of any listed surname or
toponym; no Hal-, no Ingrid, no Q-onset. Byline gender: man (alternating from
elf-b18-004's woman); nobody in the passage is gendered at all.

**Declared for batch19 siblings:** Draystow; Clement Nabbsworth; the trade
nouns chandler / bookseller / surveyor. At drafting time `batches/batch19/`
held only `BRIEF-ADDENDUM.md`, so no sibling declaration existed to check
against.

## Bands / mechanics

Measured with `mech.py` `tokenize`/`sentences`:

- passage **138 tokens** (authoring target 105–160; hard band 101–368)
- 7 sentences, token counts **19 / 30 / 9 / 20 / 31 / 9 / 20**, mean **19.7**
  (band 12.0–47.2), sd **8.14** (blueprint floor ≥7). The punctuation-light
  byline folds into the final sentence per the law-6 note.
- 1 paragraph + byline (band 0–8)
- prompt 9 tokens (band 3–30)
- options A 15 / B 16 / C 18 / D 16; key **not** longest; ratio
  **18/15 = 1.20** (cap 2.36)
- key letter **D** (b18-004 keyed B, b17-004 C, b16-004 B, b15-004 C; D has
  not keyed an ELF short since elf-b1-004)
- BrE throughout; one spaced en dash (byline), zero em dashes; no quotation
  marks; straight apostrophes; numeric register mixed (digits 412 / 390 /
  1846, words *threepence / seven / two / eight*), and the two hour-spans the
  item turns on are never given as numerals.

**Six mechanical gates: all pass.** Run as briefed
(`--p5-corpus-dir auto batches/batch18/candidates`, which indexes the 7
batch18 candidates only, since `auto` expands only when it is the sole dir
argument) and re-run twice more for real coverage: `auto` alone (114 shipped
units) and all `candidates-final` dirs plus `batch18/candidates`
(121 units). M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM all
`pass` with zero findings in every run.

---

## Appendix A — fleet-repair-1 (2026-09-01): rule-11 and rule-12 re-audits

The repaired unit lives at `batches/batch19/candidates/elf-b19-004.json`. This
file, `gen-elf-short-2.json`, is the pre-repair generator artifact and is left
as written, per the batch18 convention.

### What changed

| # | Gate | Change |
|---|---|---|
| 1 | G-STEM **near-kill** | Options B and D were contradictories on the opening-hours-versus-collection-time axis while A and C sat off it, so a blind solver who spots the pair knows the key is one of two. **Option C moved onto the axis.** Was: *"The hour of the evening cart was largely fixed to suit the shops that took the letters in."* Now: *"The bookseller made up for much of his later start by staying open after the cart."* |
| 2 | Typography | The unit carried **8** straight ASCII apostrophes in student-facing strings against **0** in each of its three siblings. All eight normalised to U+2019: seven possessives in the passage (*town’s, chandler’s, bookseller’s, chandler’s, bookseller’s, surveyor’s, chandler’s*) and one in option D (*cart’s*). Rationale and `generator_meta` keep straight quotes, which is what elf-b19-002 and elf-b19-003 also do. |
| 3 | G-REGISTER note | `law_12_divergence` denied a "silence-of-the-record move" that the passage's closing sentence in fact performs. Corrected **by append**, false clause left verbatim. |

On (1): **A was deliberately not touched.** G-DISTRACTOR had already found A
ARGUABLE, and any rewrite of A risks promoting it to DEFENSIBLE, so the axis-mate
was built out of C. The new C is refuted by the single sentence the key rests on
— *"Both shut when the evening cart went at eight."* — which leaves the
bookseller no hours after the cart in which to make anything up. It is also
distinct from B and from D rather than a restatement of either: B is a magnitude
claim comparing the two counts, C is a compensation claim about closing times, D
denies that opening length governed the counts at all. Three options now engage
the axis, so the sheet no longer offers a bare true/false pair with two off-axis
options beside it. The cautious surface was kept on C (*much of his later
start*), so the hedge map is unchanged: exactly one qualified option, and it is a
distractor.

Rationale sync: four spans in the single rationale — the C analysis, the hedge-
balance sentence, the option-length line, and the self-blind-solve. Metadata:
`engineered_traps`, `hedge_balance_note`, `length_tell_note`, `rule_11_note`,
`spelling_note` (apostrophe claim corrected by append) and `law_12_divergence`.

### RULE 11 — cross-question option-set audit (post-repair)

Single-question unit, so **no cross-question bridge can exist**; the content-
lemma table across two or more option sets is empty (vacuously). Within the one
set, re-run after the C rewrite: the recurring words are the passage's
unavoidable subject terms (*hatch, hours, letters, shop, cart*) and they remain
deliberately distributed rather than concentrated. The key's mechanism words —
*governed*, *the length of opening* — appear in no distractor. Each distractor
keeps its own mechanism word, appearing nowhere else: *stretched* / *allowance*
(A), *far more* (B), *made up for* / *staying open* (C). The new C adds
*bookseller, made, up, for, much, his, later, start, staying, open*; of these
only *open* recurs, and *open* / *opening* was already shared between A, B and
the key as the axis word the question is about. **No new word bridges C to the
key alone.**

### RULE 12 — stem-entailment audit (post-repair)

Stem read **alone**: *"What is implied here about the two receiving houses?"* —
the corpus-attested inference form (*"What is implied here?"* occurs 11 times in
the 405 authentic ELF stems, the single most frequent stem in the section) with a
neutral referential anchor. It presupposes only what the passage states verbatim,
that the town had two receiving houses, and predicates nothing contested about
them: it names no cause, no quantity, no hour and no agent. Re-checked against
the **repaired** four (incentive-stretching / far-more-letters / later-closing
compensation / the cart's hour governed the count): the stem entails, favours and
excludes none of them. Read alone it gives a blind solver the topic and nothing
else. The stem was not touched this round.

### Post-repair measurements and gate run

Passage **138** mech tokens (bands.json short_text 101–368; lane band 105–160) —
unchanged by the repair, since the typography pass swaps a glyph the tokenizer
does not consume and the option rewrite touches no passage word. **7** sentences,
mean **19.71** (band 12.0–47.2), population SD **8.14**; **1** paragraph; prompt
9 (band 3–30). Options **A 15, B 16, C 16, D 16** (band 0–31): three options tie
for longest, so there is **no strict-longest option on the sheet at all** and
M-TELL's shape cannot arise; ratio **1.07** against the 2.36 cap, down from 1.20.

`run_mech.py` with `--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed`:
**M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM — all pass, zero
findings**, both with `--p5-corpus-dir auto` (114 shipped units) and with every
`batches/*/candidates-final` directory listed explicitly plus
`batches/batch18/candidates` (**121 units indexed**).

### Carry-forward

The **record-notices-a-triviality coda** (the surveyor's flap-spring note) is a
member of the silence-of-the-record family, not a departure from it, and
elf-b18-004's minutes-withhold-the-reason close is the family's other member. The
motif has therefore now run in **consecutive batches**. The next ELF short in
this lane should close some other way.

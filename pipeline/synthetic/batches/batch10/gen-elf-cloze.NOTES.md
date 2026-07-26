# gen-elf-cloze — "Buttered Margins" (ELF cloze_5gap)

## Topic / genre rationale

**Topic:** why cinema foyers are engineered to smell of popcorn — the concession
counter as the place where an exhibitor's margin actually lives, and who ends up
paying for it.

**Genre:** `society_commentary` (the blueprint's ≈20% slot), BrE, which the
genre note in `elf/blueprint-template.md` §1 pairs with commentary. The topic is
commerce commentary with a mild moral turn, not science journalism: no lab, no
study design, one consultant's figures and one natural experiment.

**Novelty check against batches 1–9.** The used-topic list contains
repair/secondhand economy, cashless society, board-game cafés, phone-call
decline, hotel key cards and queueing culture — all consumer-facing — but none
touches film exhibition, distributor splits, or the two-part pricing of a venue.
The nearest neighbour is the phone-call cloze (batch 8, also society commentary,
also BrE); it is a manners topic, not a pricing one, and shares no vocabulary
field. Deliberately avoided any framing that would read as a restatement of the
standard two-part-tariff literature (law 1): the argument is carried by invented
particulars — Halvard Meng, the Lyric in Ardenshaw, four sites in 2024, one
northern independent's 2023 season — not by an appeal to a known thesis.

**Fictional entities:** Halvard Meng (exhibition-pricing consultant), the Lyric
in Ardenshaw (cinema and town), the unnamed northern independent, Ines Halloway
(byline). No real chain, town, publication or trade body is named.

**Spelling variety: BrE, held throughout.** Markers: *pavement*, *per cent* as
two words, *takings*, *till*, *foyer*, *maize*, pound sterling. Deliberately
avoided the AmE lexical set that this topic invites — no *concession stand*, no
*movie theater*, no *candy*, no *check* for the bill. One variety, no mixing.

## House shape (matched to the gate-passed elf-b8-002)

- Gap marker `___(n)___` inline; 5 gaps → 5 `questions[]`, `prompt` = `Gap (n)`.
- Single-word options, POS-uniform per gap, ≥2 shape-matched to the key in
  every set (all four are shape-matched in gaps 1, 2, 3 and 5).
- Byline inside the `passage` string, last line, no glossary (no specialist term
  is used that a Swedish HP candidate would not meet in ordinary business
  prose — *gross margin* and *distributor* are glossed by context, so inventing
  a glossary line would have defined words the passage explains itself).
- 4 paragraphs (cloze band max), 395 tokens, mean sentence 26.3 words,
  sentence-length sd 15.5 (band floor 7): a 9-word verdict sentence
  ("Admissions rose by a little over four per cent.") sits beside a 61-word
  subordinated sentence in the final paragraph.

## Planted trap architecture per gap

Gap-type coverage required by the blueprint (≥1 collocation, ≥1 polarity, ≥1
connective) is met by gaps 1/5, 4, and 2 respectively.

| gap | type | key | traps |
|---|---|---|---|
| 1 | collocation | **overheads** (D) | *overtures*, *overhangs*, *overspills* — all real plural `over-` nouns, none collocates with "cover the ___" for a building's running costs |
| 2 | connective | **Consequently** (B) | *Conversely* (polarity/wrong logic), *Ostensibly* (marks a claim about to be undercut — the paragraph does the opposite), *Historically* (promises a then/now contrast that never arrives) |
| 3 | sense/collocation | **unprofitable** (A) | *unaffordable* (right money domain, **wrong party** — the customer's problem, not the exhibitor's), *unassailable*, *unrepeatable* (both real `un-…-able` adjectives failing on sense) |
| 4 | polarity | **slipped** (C) | *soared*, *swelled* (polarity mirrors — the reader has just read "Admissions rose" and reaches for a rising verb), *sprouted* (collocation misfit with a thematic lure: the passage is full of maize) |
| 5 | collocation | **remedy** (B) | *reminder*, *remnant* (sense misfits), *remittance* (collocation misfit that would promise a refund the passage never raises) |

Two design decisions worth recording:

1. **Gap 3's distractor `unaffordable` is the deliberate near-miss.** It is the
   only distractor in the unit drawn from the same semantic field as the key,
   and it is defeated not by sense but by *whose* accounts the frame names
   ("an exhibitor's accounts once the distributor has been paid"). A skimmer who
   reads "however dear it looks at the till" without the preceding clause takes
   it. Rejected `unpalatable` at draft stage: figurative "hard to accept" gives
   it a genuine second reading in this frame, which would have double-keyed the
   gap.
2. **Gap 4 is the unit's one true polarity gap** and it is set against the
   reader's momentum: the sentence immediately before it reports a rise, so both
   mirrors (*soared*, *swelled*) are locally primed. The not-X-but-Y frame and
   the downstream "by the spring the old prices were quietly back" are the only
   things that defeat them.

## Hedge-balance / blind-answerability

Cloze options are single words, so the hedge and length tells that M-FORM and
M-TELL police cannot arise (all option sets have ratio 1.00 and no
absolutizers). The relevant blind-answerability risk for cloze is a
**semantic-odd-one-out tell**: if the key were the only negative-pole or only
concrete word in every set, "pick the odd one" would score. Broken deliberately —
gap 1's key is the mundane technical term, gap 2's is the plain causal
connective, gap 3's key is negative like all three distractors (all `un-`), gap
4's key is the only negative word (that is the polarity gap's whole point, so it
is confined to one gap), gap 5's key is the ordinary word. Keys spread **D / B /
A / C / B**.

## Self-blind-solve result

Solved cold from the passage with the rationales hidden, arguing for each
non-keyed option in turn.

- **Gap 1 → overheads.** Argued for *overhangs* (a building has them) — dies on
  "cover the ___", which needs a cost, not a structure. Single defensible.
- **Gap 2 → Consequently.** Argued for *Conversely* by reading the counter as
  opposed to the box office — but the sentence states a result of the shortfall,
  and the following figures corroborate rather than contrast. *Ostensibly* fails
  because nothing undercuts the claim. Single defensible.
- **Gap 3 → unprofitable.** Argued hardest for *unaffordable*; blocked by "on an
  exhibitor's accounts" plus "once the distributor has been paid". Single
  defensible.
- **Gap 4 → slipped.** Argued for *soared* on the strength of the preceding
  admissions rise; blocked by "had not risen with them but", which is an
  explicit inversion, and by the prices going back up. Single defensible.
- **Gap 5 → remedy.** Argued for *remittance* (a refund would be something to
  offer); blocked by "beyond the observation that", which frames what follows as
  the substitute for the missing thing — an argument, not money. Single
  defensible.

**Outcome: 5/5 single-answerable.** No gap survived as two-way; nothing was
rewritten after this pass except the length trim described below.

## Mechanical self-check

`run_mech.py` on the final file: **M-SCHEMA pass, M-BANDS pass, M-TELL pass,
M-FORM pass, M-PLAGIARISM pass** (no findings on any gate).

One deliberate revision: the first draft ran to 408 tokens. That passes M-BANDS
on the union rule (it falls inside the `long_passage` class band), but it sits
above the `cloze` class maximum of 401 in `bands.json`, which would have left the
unit outside its own format class. Trimmed to **395** across five sentences
without touching any gap frame or any string the rationales quote.

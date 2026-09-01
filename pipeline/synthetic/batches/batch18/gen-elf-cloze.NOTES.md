# gen-elf-cloze — "Left to Soak" — generator notes (batch18)

Unit: ELF cloze, 5 single-word gaps, society commentary, BrE.
Family: `ELF-CLOZE-001 / office-kitchen-washing-up-society-commentary-cloze`.
Mech result: **all six gates PASS with zero findings, first run** (M-SCHEMA,
M-BANDS, M-TELL, M-FORM, M-ECHO vs 114 shipped units, M-PLAGIARISM), run with
`--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto`.

## Topic choice (from the three assigned candidates)

- **(b) local notice boards — REJECTED before drafting.** The exclusion list
  already carries `ELF-CLOZE-001 / village-noticeboard-pruning-society-commentary-cloze`;
  a notice-board unit would graze a shipped family at the family level.
- **(a) shared laundry rooms — set aside.** Etiquette among strangers in a
  shared facility grazes elf-b9-002's queueing-culture lane (unwritten rules
  obeyed without a warden).
- **(c) office kitchen washing-up — CHOSEN.** Colleagues, not strangers; the
  unit's rules are *written* (a laminated sign, a signed rota) and the point is
  that they fail — the inverse of the queueing unit's tacit consensus that
  holds. Topic-graze grep verified: 'washing-up', 'dishwasher', 'draining
  board', 'teaspoon', 'saucepan', 'mug' occur in **no** shipped unit; 'kitchen'
  in no shipped passage/title/prompt/option (only one rationale + three meta
  blocks).

## Randomisation log (honest rolls, python `random`, OS entropy, 2026-09-01)

- **Connective ordinal:** pool `{2, 4, 5}` (1 excluded = batch17's slot;
  3 excluded = six shipped units, barred in the batch17 brief).
  `random.choice` → **4**. Disclosed: ordinal 4 was last used by batch16, but
  with a different connective class (causal *Consequently*, key A) — mine is
  temporal-culminative (*Eventually*, key B), a fourth class after b15
  concessive / b16 causal / b17 expectation. True randomisation repeats
  positions; the roll is logged rather than rigged.
- **Byline gender:** `random.choice` → female → Prudence Dabbershaw.
- **Key letters:** candidates generated under two filters (all four letters
  used; no match to any shipped cloze key string) → picked **C D A B C**.

## Gap architecture (why each wrong word fails)

### Gap 1 — noun, collocation. Frame: "quietly takes its ___ on the general mood"
Options: A price / B charge / C **toll** (KEY) / D cost — monosyllabic
payment-field nouns, POS-uniform.
- **toll** locks: *take its toll on* is the fixed idiom for slow cumulative damage.
- *cost* — collocation_misfit, strongest lure (nearest synonym; "count the
  cost" real) but "takes its cost on" has no reading.
- *price* — collocation_misfit ("pay the price", "exact a price" are the real
  neighbours; "takes its price on" is not English).
- *charge* — collocation_misfit ("take charge" real but = assume control; no
  possessive, no "on"-phrase).

### Gap 2 — adjective, POLARITY. Frame: "The tone is light, but nobody misreads it; beneath the sponge the message is ___"
Options: A relaxed / B spirited / C amused / D **pointed** (KEY) — four -ed
adjectives, fully suffix-rhymed.
- **pointed** locks: "but" + "beneath" force the opposite pole of "light";
  *a pointed message/reminder* is the collocation for a barbed communication;
  "aimed at certain chairs" confirms it.
- *relaxed* — polarity_mirror: the light pole the frame just ruled out.
- *spirited* — polarity_mirror + collocation_misfit: "a spirited defence" is
  real, but spirited = lively belongs with the breezy surface the gap must
  contradict.
- *amused* — polarity + sense misfit: a message cannot be amused (state of a
  mind, not a text), and it also sits on the wrong pole.

### Gap 3 — noun, collocation via IDIOM ASSEMBLY. Frame: "you cannot hold the moral high ___ and a dripping brush at the same time"
Options: A **ground** (KEY) / B field / C horse / D floor — monosyllabic
terrain/surface nouns.
Each distractor completes a *different real idiom* with a *different word of
the frame*, but fails the full NP "the moral high ___":
- **ground** locks: *the moral high ground* (held, taken, occupied).
- *floor* — "hold the floor" is real (parliamentary) but "the moral high
  floor" is not assembled English.
- *field* — "hold the field" is real (military) but "the moral high field"
  does not exist.
- *horse* — "moral high horse" is informally attested but fails the verb
  frame: one gets **on/off** a high horse, never *holds* it.
This idiom-assembly mechanic (three distractors, three different real idioms,
one per frame-word) is not used by any shipped cloze gap.

### Gap 4 — CONNECTIVE adverb, ordinal 4. Frame: "So the kitchen waits. ___, somebody cracks – nearly always the same somebody…"
Options: A Similarly / B **Eventually** (KEY) / C Presumably / D Ironically —
sentence-initial -ly adverbs; classes: parallel / temporal-culminative /
epistemic / evaluative.
- **Eventually** locks: the upstream is a completed escalation compressed into
  "So the kitchen waits."; the gap marks the terminal event of a drawn-out
  process. Pedagogic bonus: the classic Swedish false friend (*eventuellt* =
  possibly) — the key rewards knowing English *eventually* is temporal, not
  modal. Layer-2 gold.
- *Similarly* — wrong_logic: nothing parallel exists to resemble.
- *Presumably* — wrong_logic + the hedge trap in the wrong column (rule 10):
  the writer immediately demonstrates certain knowledge ("nearly always the
  same somebody"), contradicting an epistemic guess.
- *Ironically* — wrong_logic: someone finally yielding is exactly the expected
  outcome; an expected outcome cannot be ironic.
- Option-freshness: none of the four appears in ANY shipped cloze option set
  (all 239 shipped cloze option words checked programmatically); the saturated
  Conversely / Consequently / Ostensibly / Meanwhile / Accordingly / Admittedly
  are all avoided.

### Gap 5 — verb, collocation. Frame: "most kitchens ___ an uneasy balance between confrontation and squalor"
Options: A casts / B deals / C **strikes** (KEY) / D lands — monosyllabic
-s verbs, each idiom-adjacent.
- **strikes** locks: *strike a balance* is the fixed collocation.
- *deals* — collocation_misfit lured by "deal a blow"; "deals a balance" has
  no reading.
- *casts* — collocation_misfit lured by "cast a shadow / a vote"; nothing with
  "balance".
- *lands* — collocation_misfit lured by "land a blow / a job"; "lands a
  balance" is not English.
- **Design honesty:** *hits* was drafted and REJECTED because "hit the right
  balance" is colloquially attested — a second-key risk. The shipped set has
  no such reading.

## RULE 11 mechanical self-check (cross-gap option bridges)

All 20 option words listed and compared programmatically:
`price charge toll cost | relaxed spirited amused pointed | ground field horse
floor | Similarly Eventually Presumably Ironically | casts deals strikes lands`
— **no word and no content lemma appears in ≥2 gaps' option sets** (verified:
zero duplicates, zero shared stems). No survivor needs justification. Also
checked the other direction: none of the 20 words (or their stems) appears
anywhere in the passage text, so no gap's answer is corroborated by passage
vocabulary and no distractor is passage-echoed (the "spirit of fairness"
phrasing was rewritten to "with some ceremony" during drafting to kill a
*spirited* surface-echo).

## RULE 12 (stem entails no option)

Cloze prompts are bare "Gap (n)" — no stem predicates anything. Trivially
satisfied.

## Rule 10 / RULE 13 hedge map

- Gaps 1, 3, 5: lexical-idiom gaps — no option is hedged or absolute; the
  moderate-option heuristic returns nothing.
- Gap 2: key is the strict/barbed adjective; all three softer options wrong.
- Gap 4: the cautious option (*Presumably*) is wrong; the key is flat.
- Net: qualified/moderate heuristic selects the key in **0 of 5** gaps.
- M-FORM: no option in any gap is an absolutizer; gate passes with zero
  findings.

## Self-blind-solve (adversarial, passage only, after a cooling pass)

Solved all five gaps from the passage alone, arguing FOR each non-key:
1. Argued "takes its cost on" (synonym pressure) — cannot produce an attested
   frame; *toll* alone survives.
2. Argued "the message is spirited" (lively surface) — killed by "but nobody
   misreads it": the gap must oppose the light tone; *pointed* alone survives.
3. Argued "hold the floor" and "hold the field" — both real idioms, but the
   frame fixes the full NP "the moral high ___", which only *ground*
   completes; "moral high horse" fails on *hold*.
4. Argued "Ironically" (the-one-who-minds-most-pays reading) — the connective
   governs "somebody cracks" relative to "the kitchen waits", a culmination;
   and the mechanism is presented as expected, not ironic. Argued
   "Presumably" — refuted by the writer's stated certainty in the same
   sentence. *Eventually* alone survives.
5. Argued "deals/casts/lands a balance" — no attested readings. *strikes*
   alone survives.
Result: exactly one defensible answer per gap; keys C D A B C, all four
letters, no length or form tell (all options 1 token, ratio 1.00).

## Law 16 / RULE 14 name verification — summary

Full re-runnable SEARCH LOG lives in `generator_meta.originality_note`.
Short form: en.wiki CirrusSearch exact-phrase with live positive control
("Pellew" → 701 hits) gave 0 hits for "Dabbershaw" and "Prudence Dabbershaw";
quoted web search with control "Robert Brindlow" (fuzzy neighbours, no exact
bearer — index proven to fuzz-match rather than go silent) found no bearer of
surname or full pair. Three earlier coinages were REJECTED on quoted-search
residue despite 0 wiki hits (Quiverdale, Sallowgate, Marrowfen — all in use by
fantasy/cozy-mystery properties), which is itself evidence the sweep bites.
No Swedish person/toponym exists in the unit, so the sv.wiki/Nominatim leg was
not applicable. **Prudence Dabbershaw is FLAGGED FOR V-FINAL**, not certified.

## Measured stats (mech.py functions)

passage 394 words (band 228–401); 4 paragraphs (band 1–4); 20 sentences,
mean 19.70 (band 13.1–34.8), sd 9.02 (floor 7), lengths 5–34; prompts 2
tokens; options 1 token; option-length ratio 1.00 (cap 2.36). Typography:
2 spaced en dashes, 0 em dashes, curly apostrophes, no quotation marks.

## fleet-repair-4 — 2026-09-01 (round-4 consolidated repair)

One two-word passage edit and five metadata corrections. **All five gap frames
are byte-identical** to the pre-round bytes (verified after the edit, character
for character on the 45 characters either side of each marker); no prompt,
option, key or rationale argument moved.

**1. Passage: the presupposed mug (V-FINAL VF-08; integrated MINOR_NOTES 1).**
¶1 enumerated *"a saucepan, two plates and the lid of somebody's lunchbox"*,
bound `them` to that list in the next sentence, and then wrote *"The mug among
them is never anonymous"* — an object the inventory never listed, on the same
pronoun, across a sentence boundary with no signal. The mug is load-bearing:
the coda is *"That colleague's mug, at least, is clean"* and the title pun pays
off through it. Repaired with the audit's own minimal fix, adding the mug to
the inventory: **"a saucepan, two plates, a mug and the lid of somebody's
lunchbox"**. Gap 1 sits at the end of the same paragraph and turns entirely on
*"it quietly takes its ___ on the general mood"*, where `it` is the contest and
not the crockery, so no key is touched.

**2. `clone_note` (e): a false bank-wide claim (V-FINAL VF-01, the audit's only
major and the reason it derived REFUTED).** The clause *"no shipped ELF title
uses a participial-phrase shape"* is refuted by the bank — `elf-b7-002` **Cut
to Size** and `elf-b1-004` **Paid by the Ship** are the same past-participial
shape, with roughly a dozen further counterexamples (*Bought Quiet*, *Borrowed
Suppers*, *Agreed, Unread*, *Reading the Crust*, *Holding the Line*, …). The
false universal is dropped; the true law-15 point is kept and stated on the
test that actually applies — no shipped ELF title shares a lexeme with *Left to
Soak*, and M-ECHO passes against all 114 shipped units, so the unit is not a
title clone.

**3. `typography_note`: a falsified whole-file claim (V-FINAL VF-04).**
*"NO em dash (U+2014) anywhere in the file"* was true when written and was
falsified by one character that **the fleet-repair-1 repair introduced into its
own ticket prose**. The note is narrowed to the student-facing layers, which is
what addendum rule 3 reaches (it is a prose-typography rule), and the whole-file
count is now stated: exactly one em dash, in `repair_log[0].ticket`. Nothing
added by this round carries one — re-counted after the edit: whole file 1,
passage 0, en dashes in passage 2.

**4. `repair_log[fleet-repair-1].edits`: not exhaustive (V-FINAL VF-05).**
The array listed two paths; a third field was changed in the same round —
`generator_meta.gap_pos_map["5"]`, *"verb (present tense, third person)"* →
*"verb (present tense, plural)"* — and G-ENG run 3 quotes the pre-repair value
verbatim, which is the evidence. Added **in place, to that round's array**, so
it is exhaustive for the round it names; the unit is untracked in git, so the
`repair_log` is the only record of the pre-repair state.

**5. G-STEM r1's gap-1 major: a disposition, at last (V-FINAL VF-02).**
The flag was filed at the gate's own major severity and answered nowhere —
no `repair_log` entry, no rebuttal, and `report-final.json` records the unit as
`"flags": []`. `generator_meta.gstem_r1_q1_disposition` now records one:
**direction accepted, reasoning rejected, honest floor 1-in-3, ship as is.**
The reasoning fails because `charge` is *not* near-interchangeable with `price`
and `cost` (*the price/cost of X* alternate freely; *the charge of X* does not
join them) and `toll` is itself inside the payment field (a road toll, a toll
booth); what survives is that `toll` is the marked member in figurative
frequency, which is a property of every well-formed collocation gap and is
bounded here at a 1-in-3 field, inside the policy's 1-in-2 bar. The cross-gap
aggregation (VF-07: key is the marked member at 3 of 5 gaps) is recorded for the
ELF-CLOZE-001 **family**, not litigated on this unit — forcing an unmarked key
at gaps 1, 2 and 4 would mean weakening the frames that make the keys unique.

**6. gap-5 design note: residual 3sg (V-FINAL VF-06; language CORRECTED).**
*"'hits' was considered for this slot"* → **'hit'**, so the note agrees with the
idiom it quotes one clause later (*hit the right balance*) and with the shipped
bare-form set.

### Mech re-run (fleet-repair-4)

`run_mech.py batches/batch18/candidates/elf-b18-002.json --parsed-dir
/home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto` (M-ECHO indexed
114 shipped units): **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass ·
M-ECHO pass · M-PLAGIARISM pass** — six of six, zero findings, exit 0.
Restated stats: passage **396 words** (band 228–401; was 394), 4 paragraphs
(band 1–4), 20 sentences, mean 19.80 (band 13.1–34.8), sd 9.03 (floor 7);
prompts 2 tokens; options 1 token; option-length ratio 1.00 (cap 2.36).
`blind/` and `distractor/` regenerated from the repaired candidate (`stems/`
is passage-free and came back byte-identical), all three machine-verified in
sync: prompts, option texts and key identity match; no `key`, `rationale`,
`generator_meta` or `family` in `blind/` or `stems/`; no `passage`/`title` in
`stems/`.

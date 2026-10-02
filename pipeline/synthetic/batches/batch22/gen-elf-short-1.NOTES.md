# gen-elf-short-1 — NOTES (elf-b22-003 lane: ELF TYPE-001 short, reportage with a quoted voice)

**Unit:** `batches/batch22/gen-elf-short-1.json` · `candidate_id` = `PLACEHOLDER`
**Family:** `ELF-TYPE-001 / pneumatic-tube-sample-haemolysis-hospital-laboratory-reportage-short`
**Title:** Blood by Tube · **Key:** D · **Spelling variety:** BrE · **Date:** 2026-09-09

---

## 1. Subject: how far the lane brief made me move, and why this one

The bars were: not conservation, not the domestic building envelope, not fisheries, not any
craft adjacent to those (b18 tile mortar, b20 trawl mesh, b21 tape conservation). The wider
TYPE-001 lane is also, on inspection, almost entirely built environment and materials
engineering — vault doors, welded rail, cavity walls, canal-lock gates, chimney pots, clay
tiles, playground surfaces, road marking, stadium turf. So the move had to be out of that
whole family, not one topic sideways.

The subject is **hospital pathology logistics**: a pneumatic tube system, and the blood
samples it spoils on the way to the laboratory. Nothing in the passage is a craft, a
building, a coastline or an artefact. The domain supplies its own natural speaker, which is
what RULE 20(b) said the resolution would look like: a senior biomedical scientist holding a
spun tube up to the window is a person who explains things to visitors for a living, so the
quoted-voice constraint is satisfied *by* the subject instead of fighting it. It also
supplies its own surname stock (an English hospital), so the coinage constraint costs
nothing.

Novelty check: `pneumatic`, `haemoly*`, `potassium`, `phlebotom*` return **nothing** anywhere
in the shipped P5 bank and nothing in the authentic corpus at `data/parsed`.

## 2. Passage architecture

Four paragraphs (three plus a bare byline), 158 mech tokens, mean sentence length 19.8.

1. **Scene, no quotation.** The rhythm of the machine, one named person, one object held to
   the light, one image: pink plasma above packed cells.
2. **The fault, in her voice.** Two quoted spans with `she says` between them, then one
   narrative sentence that closes the paragraph and plants the visibility fact.
3. **What she did about it, and what changed.** The accelerometer week, one quoted verdict,
   then three flat sentences: the loop's speed is unchanged, the bins were lined, the rejects
   halved, and blood gases never went by tube at all.
4. **Byline.**

**Concrete residue that does not point at the answer** (law 9): the arrival rate, the packed
cells, the spun tube, the week's duration, the number of lined bins, the roughly-half figure,
the porter on the stairs. Two of these (the direction of the potassium error; the pink being
haemoglobin) are load-bearing for the *rationale's* mechanism paragraph but are not asserted
by any option.

**Coda:** resolved and concrete — `Blood gases have never gone by tube; a porter walks those
down.` Not unresolved, not an aphorism, not a dating, not a *not-A-but-B* chiasmus. Against
RULE 24's batch quota this unit offers itself as the *resolved* coda.

## 3. The one question — trap architecture

Stem: **What does Ashvenor say about the samples sent by tube?** Corpus-attested referential
form; it predicates nothing contested about the samples. The earlier draft read *the samples
that arrive by tube* and was changed, because `arrive` throws a lexical bridge to the key's
`reaches the far end` (RULE 12 / the batch20 "stem announces the shape" channel).

| opt | variable it turns on | trap | dies on (citable span) |
|---|---|---|---|
| A | which change brought the rejects down | likely-remedy substitution: a true fall, a plausible false cause | `The loop runs at the speed it always has.` |
| B | where in the chain the fault is visible | location-of-evidence shift: the vivid detail carried back to the ward | `Nothing shows on the ward; the colour comes with the spinning.` |
| C | which samples travel by tube | half-right conjunction: true premise, false route | `Blood gases have never gone by tube` |
| D | **KEY** — where in the journey the harm happens | — | supported by `the trace barely moved` + `It’s the stop at the far end that does it` |

Every non-key option is **refuted**, not merely unsupported, and the rationale cites the span
(RULE 23's "good distractor shape").

**Form checklist, run with the passage covered** — four different variables, so no 2+2
contradictory dyad and no 3+1 exclusivity cluster; zero hedged options and zero absolutizers,
so neither the hedge heuristic nor M-FORM has anything to select on; identical shape (main
clause + one subordinate clause: *once / before / because / at the moment*); no negation, no
scope singleton, no mirrored twin of the key; tokens A 12, B 14, C 13, D 13, so the single
longest option is a distractor.

## 4. Self-blind-solve

**Pass 1 (options only, passage and stem covered):** the four texts give a topic and four
claims on four unrelated variables, with no form signal of any kind. I could not rank them —
**1-in-4**, the bar.

**Pass 2 (passage read, key hidden):** D. A dies on the speed sentence, B on the ward
sentence, C on the blood-gases sentence. Exactly one option survives.

**Disclosed residual — adversarial domain-expert floor 1-in-2.** A solver who works in a
hospital laboratory eliminates B (haemolysis is invisible before centrifugation) and C
(blood-gas samples are commonly hand-carried) from world knowledge, leaving A and D. It stops
there: reducing carrier speed is a *real* remedy in this field, so A stays live for that
expert and only the passage rules it out. Stated rather than left for a reviewer to find; the
tested population is Swedish upper-secondary candidates, for whom the floor is 1-in-4.

**Hedge map (rule 10 / RULE 23):** one question, key unhedged, all three distractors
unhedged. "Pick the qualified option" selects nothing.

## 5. Key letter — recomputed counts (RULE 19)

Recomputed on 2026-09-09, deduplicated by `candidate_id` over `batches/*/candidates-final/*.json`
and `batches/*/candidates/*.json`. **Both sums shown.**

* **TYPE-001 lane** (family contains `TYPE-001`, one question), **n = 18**: **A 5, B 6, C 4, D 3 = 18**.
  b1-003 C · b2-003 B · b3-003 B · b4-003 A · b8-003 B · b8-004 A · b9-003 A · b9-004 C ·
  b10-003 B · b11-003 C · b12-003 B · b15-003 B · b16-003 D · b17-003 A · b18-003 D ·
  b19-003 A · b20-003 D · b21-003 C.
* **All ELF one-question shorts**, **n = 40**: **A 7, B 14, C 12, D 7 = 40**.

C is excluded by the brief (do not start a C run after b21-003). B is the *most* common letter
in both populations and is rejected on the counts. Of the two left, **D is strictly rarest in
the lane (3 of 18 against A's 5) and joint-rarest bank-wide (7, tied with A)** — so D.

**Disclosed against my own unit:** the D, A, D, A, D alternation (b16-003 … b20-003) was
already broken by b21-003's C, so with this unit the lane reads **D A D A D C D** — no longer
an alternation, but D takes an even-numbered batch's slot for a fourth time, and a reader
counting only recent slots sees three D's among the last four non-C keys. The counts are on
the record so the trade is visible rather than silent.

## 6. Names — distances, legs run, RULE 17/21 split

**Blocks (binding):** given names **C / J**, surnames **A / L**. Used: **Jocelyn Ashvenor**
(J + A) and **Cheryl Ludlow** (C + L). Neither name alliterates; the two figures share no
initial on either axis.

**The coinage carries the voice.** *Ashvenor* is the unit's single coined surname and holds
every quoted word and every contested claim. *Ludlow* is the RULE 17 ordinary figure: a bare
byline, no quoted words, no attributed act.

**RULE 16 distances — computed, not read off a result page.**

* **Bank screen** (mechanical, over every distinct capitalised token in every shipped title,
  passage, prompt and option, my own file excluded): Ashvenor nearest at **4**; Jocelyn **4**;
  Ludlow **3**; Cheryl **3**. Nothing at 1 or 2. The *size* of that token population is
  deliberately not fixed as a number, because it grows while sibling drafts land in
  `batches/batch22` and a later round would increment it (RULE 22): 2,398 tokens when the
  screen was first run, 2,487 on the final re-run of 2026-09-09 — the four minima above are
  the **final** re-run figures and were unchanged by the growth.
* **Real neighbours** (hand-enumerated, then computed): Ashvenor — Grosvenor 4, Ashbery 4,
  Ashbrook 4, Ashenden 4, Ashley 4, Ashmole 5, Ashworth 5. Nothing real at ≤ 3, so the
  batch22 disposition (**≥ 3 from a real surname with a notable bearer**) is met with a
  margin of one and **no distance-2 disclosure is owed**. One string at 2 named for honesty:
  *Avenor*, a defunct Canadian pulp-and-paper company — not a surname, no person, no
  medical field.
* **One-letter variants**, enumerated by hand: Ashvenon, Ashvener, Ashvanor, Ashvenors,
  Cashvenor, Ashvenoy — none real to my knowledge, none returning anything on the index.
* **Coinages rejected in drafting, so the reasoning is reproducible:** *Attlebrook* (bank 6,
  real 4) dropped because it is **one letter** from **Rattlebrook**, a real Dartmoor stream
  and peat works; *Lethbrook* dropped at 2 from the real surname *Ledbrook*; *Ambrell* at 2
  from the bank's own *Ambrey* (batch14); *Lomberdine* at 2 from the bank's *Pemberdine*;
  *Almerwick* at **1** from the real surname *Alderwick*, whose bearers include a
  health-policy researcher — i.e. in domain.

**Legs that ran** (en.wikipedia CirrusSearch exact phrase, WebFetch, one session, control
first):

| # | query | totalhits |
|---|---|---|
| 1 | `"Pellew"` (CONTROL) | **701** — Edward Pellew, 1st Viscount Exmouth; Viscount Exmouth; Sir Edward Pellew Group of Islands |
| 2 | `"Ashvenor"` | **0** |
| 3 | `"Jocelyn Ashvenor"` | **0** |
| 4 | `"Cheryl Ludlow"` | **0** |
| 5 | `"Cheryl Ludlow" OR "C. Ludlow" biomedical pathology laboratory NHS` (domain leg) | 85, all generic domain articles (Biomedical scientist, Medical laboratory scientist, Cambridge University Hospitals NHS FT, Addenbrooke's, Maudsley, Health informatics, Bernie Croal…) — **no Cheryl Ludlow among them** |
| 6 | `"Craig Lawton"` | **20, with an article titled exactly that** (a rugby league player) → this pair was my first choice for the byline and was **dropped** on RULE 21(a) |

Plus a local grep leg: *Ashvenor, Jocelyn, Ludlow, Cheryl* return nothing in the authentic UHR
corpus (`data/parsed`) and nothing in the shipped P5 bank.

**Legs that did NOT run:** there is no general-web index and no exact-quoted web search in
this harness, so RULE 21 leg (b) was run in the substitute form the batch22 amendment
prescribes (encyclopaedia domain articles + repo/corpus grep). No web leg is claimed.
Nominatim was not used because **no toponym is invented in this unit** — the hospital, the
ward and the town are all deliberately unnamed, so the unit carries exactly one coinage.

**RULE 21 split, stated:** (a) no notable bearer for *Cheryl Ludlow* — encyclopaedia zero in a
control-passing session; (b) no bearer in the unit's domain, by the substitute legs above;
(c) she is given no quoted words and no attributed act. The riskier role — the person with
invented words in her mouth — is the coinage.

**RULE 8 sibling sweep:** run against the sibling files present in `batches/batch22/` at write
time (`gen-elf-cloze.json`, byline *Sheila Dawes*; `gen-elf-long.json`; `gen-elf-short-2.json`;
`gen-las-debatt.json`; `gen-las-essa.json`). No sibling uses Jocelyn, Cheryl, Ashvenor or
Ludlow. *Colin* was rejected at distance 1 from the bank's *Corin* and *Clare* at 1 from
*Clara*.

## 7. Quotation load (RULE 25)

**216 of 840 passage characters inside the three quoted spans = 25.7 %**, against the ceiling
of 30 % and the authentic-corpus p95 of 22.4 %. Excluding the quotation marks themselves,
25.0 %.

**No paragraph is pure quotation.** ¶1 has no quotation; ¶2 opens on a quoted clause but
carries two `she says` attributions and closes on a narrative sentence; ¶3 sets one quoted
sentence between four narrative sentences; the byline has none.

**Deixis anchored** — Ashvenor is named before she speaks and every span is tagged. **Attribution
matches the stem** — the stem asks what she *says*, and the key paraphrases her own quoted
sentence. **Contractions in speech:** *They’ve, I’d, It’s*.

**Rationale fidelity:** all **7** quoted spans in the rationale were tested *mechanically* for
substring membership in `$.passage` (not by eye) — **7 / 7 byte-identical, 0 failures**.

## 8. Mechanism — every causal direction (the axis batch21's short got wrong)

1. Cells break **first**; the potassium that was inside them then passes **out into** the
   plasma. Direction cell → plasma; consequence the measured figure is **too high**, never
   too low.
2. The pink is **free haemoglobin from the broken cells**, not a property of the
   anticoagulant and not anything added to the tube.
3. The colour is invisible until the tube is **spun**, because whole blood is opaque red and
   the plasma must be separated before its own colour shows.
4. The shock is greatest at the **arrival**, where motion stops — deceleration, not distance.
   Hence lining the landing bins, and not slowing the loop, is what halves the rejects.
5. The clinical consequence runs the right way too: a falsely high potassium is a **false
   alarm about a patient who is fine**, not a false reassurance.

## 9. RULE 24 prose convergence

* **Opening:** not the received-explanation template; the passage opens on a machine's rhythm
  and an object held to the light. No sentence anywhere says what the usual explanation is.
* **Motifs:** no record's-silence motif (the evidence is an instrument trace and a reject
  rate, not an absent document); no labour-drain motif; no
  researcher-with-self-stated-survey-weakness frame; **no money arithmetic and no sum**.
* **Setting:** inland and indoors.
* **Skeptic slot:** deliberately empty — nobody in the piece disputes anybody.
* **Phrase-level diff, n ≥ 5, ALL layers** (title, passage, prompt, options **and rationale**)
  against `batches/*/candidates-final/*.json` + `batches/batch18..21/candidates/*.json`,
  **142 units indexed**, run on the final bytes with mech's tokenizer:
  **zero shared n-grams at n ≥ 5.** Longest shared run **4 tokens** — `rather than in the`
  (b10-001, b13-001, b14-001), `the whole of it` / `who has registered the` (b12-002),
  `at the end of` (b14-001); student-facing layer alone also 4 (`it she says the`, b21-001).
  An earlier rationale draft did carry three 6-token formulas shared with shipped rationales
  (`the passage says the opposite about`, `and the passage does report a`,
  `so a reader who has`); they were rewritten **before** the file was written, and the screen
  was re-run on the result rather than assumed.
* **Move-sequence diff** vs the last three TYPE-001 shorts: b19-003 opens on an instruction to
  count and closes on a flat trade fact; b20-003 opens on the skipper's action and closes on
  an unbargained complication; b21-003 opens on an object arriving wrapped and closes on a
  concession inside a quotation. This one opens on a machine's rhythm, states the fault in the
  practitioner's voice, reports a measurement she made and what was changed because of it, and
  closes on a resolved operational fact carrying a concrete image.
* **Thesis-shape check across the other six lanes** (not only my own): mine is
  *a routine piece of building plant quietly spoils what it carries; an instrumented week
  localises the damage to one instant nobody was watching, so the remedy is fitted there
  rather than to the thing everyone would have blamed.* The sibling cloze (read at write time)
  is a coordination-norm essay on clapping; the other five briefs are an inland long, a
  non-ledger history essay, a facktext long, a debatt and an essä. The one lane that could
  converge is **las-b22-001** if it takes an infrastructure subject — the shapes still differ
  (mine turns on one instrumented week and a remedy fitted at the measured point, and its coda
  is resolved), and the coordinator's cross-lane diff should check that pair specifically.
* **Title:** `Blood by Tube` — flat descriptive, **no number**, not a *The + modifier + noun*.

## 10. Mechanical self-check

```
python3 gates/scripts/run_mech.py batches/batch22/gen-elf-short-1.json \
    --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --no-plagiarism
```
→ **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass — 4/4.**

Run again with the authentic corpus and the shipped bank indexed
(`--p5-corpus-dir auto`, 114 units): **M-ECHO pass · M-PLAGIARISM pass** as well.

**Measured on the final bytes** (mech's own `tokenize`/`sentences`): passage 158 tokens,
4 paragraphs, 8 sentences `[13, 13, 55, 18, 19, 9, 17, 14]`, mean 19.8 (band 12.0–47.2),
population sd 13.66; prompt 10 tokens; options A 12 / B 14 / C 13 / D 13, ratio 1.167
(cap 2.36); rationale 411 tokens. The 55-token entry is mech's splitter, which breaks only
before an uppercase letter, so a full stop followed by an opening curly quote does not split —
stated rather than corrected, because the band is defined by that splitter.

**Typography:** one system in all four layers — U+201C/U+201D, U+2019, one spaced U+2013 in
the byline. Zero em dashes and zero straight apostrophes under the five student-facing and
rationale paths. The file is `json.dumps(ensure_ascii=False, indent=2)` with no trailing
newline, so it stores **literal** characters; **no `\uXXXX` escaping is claimed** (RULE 22).

## 11. Disclosures, in one place

1. **Domain-expert blind floor is 1-in-2**, not 1-in-4 (§4). Disclosed, not designed away —
   removing it would have cost the two distractors that teach the most.
2. **Key D lands in the lane's even-batch slot a fourth time** (§5). Chosen on the counts, with
   the pattern named.
3. **RULE 21 leg (b) has no general-web index in this harness**; the substitute legs are named
   and no web leg is claimed (§6).
4. **The passage's mean sentence length is computed over a splitter artefact** — one counted
   "sentence" spans a quotation boundary (§10).
5. `Ashvenor` sits at edit distance **2 from *Avenor***, a defunct Canadian company — named
   because it is the nearest string of any kind, though it bears no person and stands in no
   related field (§6).
6. **This lane's scratchpad is shared with the sibling generators** — a sibling overwrote a
   build script at a shared path mid-run. The unit's own bytes were unaffected (verified), and
   the rest of the work moved to a lane-private directory with lane-unique filenames
   (`scratchpad/b22-elf-short-1/b22-elf-short-1-*.py`). Flagged because the same shared path
   could bite a later wave.
7. **Every asserted statistic was re-derived from the FINAL JSON on disk**, by a lane-private
   verifier (`b22-elf-short-1-verify.py`) that imports no intermediate module and re-reads the
   file: serialisation and trailing-newline, all of `measured_stats`, the numbers embedded in
   the `quotation_ratio` / `length_tell_note` / `option_form_checklist` prose, the 7 rationale
   quoted spans, the typography and BrE/AmE claims, both key-letter tallies with their sums,
   the n-gram screen, the RULE 16 bank minima and the name blocks — **62 checks, 0 failures**.
   It found and fixed exactly one drift of the kind the coordinator warned about: the
   `rule16_distances` field asserted a bank-screen population of **2,398** capitalised tokens,
   measured before the sibling drafts landed; the live figure is **2,487**. The four distance
   *minima* were unaffected (re-derived against the larger population, unchanged), and the
   field now discloses both figures and declines to fix the population as a number that a
   later round would increment (RULE 22).

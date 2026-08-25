# gen-elf-long — batch15 generator notes

**Unit:** ELF `long_passage_5q`, science journalism, AmE.
**Title:** *Plaques and Patients*.
**Family tag:** `phage-therapy-matching-science-journalism-long`.
**Topic:** matching bacteriophages to an individual patient's bacterial isolate
in infected joint implants — the collection, the match rate, a thin case
series, what escape costs a bacterium, and the logistical gain that is the
real change.

---

## 1. Domain lane and graze check

The brief's excluded lanes are ecology / marine / infrastructure / craft
workshop / metrology-and-tolerance / cryosphere / colour-and-optics /
cognition-and-sleep / archives-and-handwriting. This unit sits in **clinical
microbiology**, which no shipped P5 unit occupies.

Verified mechanically, not by impression:

```
grep -ril "phage"      batches/  -> 0 hits
grep -ril "antibiotic" batches/  -> 0 hits
grep -ril "bacteri"    batches/  -> 0 hits
```

Candidates I considered and **rejected on graze**, recorded so the next
generator does not re-tread them:

| candidate | why rejected |
|---|---|
| museum conservation climate control | it is a *tolerance-band* story, and the metrology lane is saturated (`golf-ball-dimple-tolerance`, `rounded-window-corners-tolerance`, `paper-size-standardisation`, `offentliga-ur`); also grazes `cold-chain-logistics` on environmental control |
| lichen-based air-quality monitoring | its natural thesis is "the index tracks a pollutant that no longer dominates", i.e. the *metric-measures-the-wrong-thing* shape that law 12 caps at ~1 unit/batch |
| firn / avalanche forecasting | cryosphere graze with `glacier-fiber-sensing`, `klimatanpassning-snohantering`, `isupptagning-ishandel` |
| urban heat / pavement albedo | grazes `road-marking-lifespan`, `swimming-pool-colour-optics`, `paint-shade-naming`, `stadium-mowing-stripes` |
| wind-tunnel testing of cycling gear | grazes `golf-ball-dimple-tolerance` (sports-equipment aerodynamics and tolerance) |
| antivenom / venom variation | animals-in-human-care graze (`zoo-enrichment`, `animal-behaviour-science-detail`); also forces either a real bite-burden geography or an awkward invented one |

Law-1 check on famous theses: the piece is deliberately **not** built on the
one phage-therapy idea a knowledgeable solver might already hold ("phage
resistance carries a fitness cost, so escape is good news"). That idea is
stated in the passage as *the field's hopeful story* and then partly refused by
invented numbers (9 of 34). Every question hangs on invented particulars — the
1,140-phage collection, the species-split match rate, the sixty-three-patient
series, the 19-days-to-6 turnaround — none of which is answerable from prior
knowledge.

## 2. Frame, register, structural choices

- **Byline kept, glossary kept.** `– Neil Hollowmere, science correspondent` on
  the last line of the passage string, then a two-line glossary paragraph.
  Both glossed terms (`isolate`, `plaque`) occur in the passage; `plaque` is
  introduced in paragraph 1 and is the title word.
- **Publication is a *type*, never a name** (`popular-science monthly, AmE
  house style`, recorded in `generator_meta.fictional_source`). No institution,
  hospital, university, city or journal is named anywhere in the passage — a
  deliberate reduction of the law-16 attack surface.
- **Typography per the batch15 addendum:** curly English quotation marks
  “ … ” (the authentic ELF corpus shows 1057 “ / 1047 ” and 2176 ’, versus 5 em
  dashes in the whole corpus), curly apostrophes including in the question
  stems (the corpus's 405 ELF prompts use ’ 108 times and straight `'` zero
  times), spaced en dash ` – `, **no em dash anywhere**. Verified by dumping the
  passage's full character inventory.
- **Title style:** flat alliterative noun phrase, not "The + modifier + noun"
  (law 15's capped shape).
- **Sentence rhythm:** measured sd 17.9 words with a 5-word verdict sentence
  ("Ninety plates came back cloudy.") beside 40+ word subordinated sentences.
- **Genre arc:** failed case → resource and mechanism → thin evidence with two
  voices → the complication that refuses the tidy story → unglamorous verdict
  and unresolved residue.

## 3. Anti-clone check (law 12)

Diffed against the nearest shipped ELF long units, especially batch14's
*Inside the Bell at Kerrig* (mechanism → cost → craft dispute → one thin trial
→ physical residue).

- **Opening:** a documented **failure** (ninety cloudy plates, a knee removed),
  not an in-medias-res workshop scene and not a claim frame.
- **Skeptic slot:** the two named voices do **not** dispute the facts. They
  differ only in readiness — a lab head who will not let her own series carry
  weight, and a clinician who would use the treatment now in one named setting
  and says so with the limit attached. No overconfident challenger, no
  vindication scene.
- **Gender:** both named researchers are women (the challenger role is not
  handed to a man); the byline is male. This avoids both the saturated
  careful-woman/overconfident-man pattern and a straight repeat of batch14's
  flip of it.
- **Evidence pattern:** a case series plus a sequencing result, both hedged —
  not a blind screen test.
- **The "experiment nobody has run" move is deliberately avoided** (batch14
  used it). Here the deciding trial *is* enrolling, and the writer says so.
- **Coda:** no aphorism, no "not A, but B" chiasmus, no verdict paragraph. The
  passage stops on an isolate still in a freezer that two hundred newer phages
  still cannot clear.

## 4. Trap architecture (passage and questions designed together)

The passage plants exactly the hedged, attributed, scoped claims the questions
then operate on:

| planted claim | where | operated on by |
|---|---|---|
| "a usable match for rather more than half of the isolates sent to it"; "close to three in four for Klebsiella, well under half for the staphylococci" | ¶2 | Q2 key; Q2/B quantifier upgrade; Q2/A rate inversion |
| "some four hundred have been sequenced and described in full" | ¶2 | Q2/C referent swap (sequenced ≠ given to patients) |
| "in forty-one the infection was under control at six months"; "eleven had the implant taken out anyway"; "Every patient in it was also on antibiotics"; "referred the cases they judged most likely to respond"; "without a comparison group" | ¶3 | Q3 key and all three Q3 distractors |
| Bellinghast's hedged quote: "phages add something in a subset of these infections… They cannot tell us how large that something is." | ¶3 | Q5 (writer's stance is aligned with, but distinct from, this hedge) |
| Quilvey's scoped stance: standard option **in infected joint replacements**, "not resistant infection at large" | ¶3 | Q5/C attribution swap |
| the field's hopeful story about escape + "Nine had paid a price of that kind… The other twenty-five clung to plastic" | ¶4 | Q4 key; Q4/A quantifier upgrade; Q4/D polarity overshoot |
| "that trial, not any series, will decide whether the treatment becomes ordinary" | ¶5 | Q4/B wrong-location; Q5 key |

Per-question family and traps:

- **Q1 — ELF-TYPE-004, edge position 1.** Key C (whole-text gist: the matching
  work + how far the results reach). A = scope_error (the vivid opening case
  promoted to subject). B = surface_word_match ("sewage outfalls, hospital
  drains" recycled into a claim about medicine at large). D = outside_knowledge
  (resistance-outpacing-drug-development truism the text never argues).
- **Q2 — ELF-TYPE-001.** Key D. A = swapped particulars + causal graft
  (Klebsiella/staph rates inverted, plus an invented consequence). B =
  quantifier_upgrade (refuted by ¶1's ninety cloudy plates). C =
  surface_word_match with a swapped referent (the real "four hundred" counts
  sequenced phages, not treated patients).
- **Q3 — ELF-TYPE-001.** Key A. B = quantifier_upgrade (ignores the eleven
  removals). C = inverted referral attribution. D = outside_knowledge about
  method (the passage says "without a comparison group" in the next sentence).
- **Q4 — ELF-TYPE-002, one inch beyond ¶4.** Key C. A = quantifier_upgrade
  ("always"). B = wrong_location, **hedged in form** so that "pick the
  qualified option" does not identify the key. D = polarity overshoot.
- **Q5 — ELF-TYPE-005, edge position 5.** Key B. C = role_or_attribution_swap
  (Quilvey's readiness handed to the writer — the ELF signature trap). A =
  polarity overshoot to dismissal. D = tone_misread ("no view of his own",
  refuted by three explicit evaluative sentences).

**Hedge-balance (law 10).** Q2's key is the confident, specific numeric claim
while its distractors are the absolute one, the inverted one and the
misreferenced one; Q4's hedged key sits beside a hedged distractor. So
"correct" and "qualified" do not line up across the unit.

**Key letters:** C, D, A, C, B — all four letters used, no letter more than
twice, no run and no alternation. The key is the strict-longest option in
**0 of 5** questions (M-TELL measured clean).

## 5. Self-blind-solve

Solved all five from the passage alone, arguing actively **for** each non-keyed
option before rereading the key list: **Q1=C, Q2=D, Q3=A, Q4=C, Q5=B — 5/5, no
item two-way.**

Each distractor is defeated by pointing at a sentence, not by taste:

- Q1: A and B fail on proportion (one paragraph each, and the drains are this
  collection's source, not medicine's); D fails on absence.
- Q2: A inverts the two stated rates; B is refuted by the opening failure; C
  misreads what "about four hundred" counts.
- Q3: B is refuted by the eleven removals; C inverts the referral sentence; D
  is refuted by "without a comparison group".
- Q4: A is refuted by the twenty-five; D by the nine; B by what the trial is
  actually enrolling to decide.
- Q5: A by the credited pipeline improvement; C by Quilvey's own voice and her
  own limit; D by "which is worth saying before any of the numbers that
  follow", "the care is warranted", and "that trial, not any series, will
  decide".

No key is recoverable from a sibling key: the five propositions are the
whole-text focus, the match rate, the series result, the cost of escape, and
the writer's stance.

## 6. Measured band compliance

Recomputed with `mech.tokenize` / `mech.sentences` (the same functions the gate
imports), then confirmed by running the gate itself.

| stat | measured | band (`gates/bands.json`, ELF) |
|---|---|---|
| passage words | 783 | 332–873 (long_passage); blueprint target 550–825 ✅ |
| paragraphs | 6 (5 body + glossary) | union band allows ≤8; matches shipped batch11–13 ELF longs ✅ |
| mean sentence words | 28.0 | 14.9–35.4 ✅ |
| within-passage sentence sd | 17.9 | blueprint ≥7 ✅ |
| prompt words | 6–14 | 3–30 ✅ |
| option words | 9–15 | 0–31 (corpus mean 11.5) ✅ |
| option length ratio (max/min) | 1.08–1.67 | cap 2.36 ✅ |
| key strict-longest | 0/5 | M-TELL threshold 0.75 ✅ |

Gate run (`run_mech.py --parsed-dir <main checkout>/data/parsed
--p5-corpus-dir auto`, 93 shipped units indexed for M-ECHO):

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```

## 7. Name verification (law 16 — this is a search log, not a certificate)

Run 2026-08-25 through the Exa web-search MCP tool (the session's WebSearch
budget was already exhausted; the queries below are re-runnable there).

| name | query | outcome |
|---|---|---|
| **Bellinghast** (lab head, kept) | `"Bellinghast" surname person` | no bearer of *Bellinghast* returned; all hits were the distinct real surname **Bellingham** (thepeerage.com, CWGC, libraryireland pedigree) |
| **Quilvey** (clinician, kept) | `"Quilvey" surname person` | no bearer returned; hits were the distinct names Quivey (WikiTree, Philomath News), Quilley and McQuivey (LinkedIn) |
| **Hollowmere** (byline, kept) | `"Hollowmere" surname person or place` | no real person returned; hits were fictional/generated uses only (a Bookmate author page, an FFXIV character, two fantasy surname-generator lists) |
| ~~Wilbray~~ (**rejected**) | `"Wilbray" name` | documented real given name in Canadian records (Wilbray Lacerte, CEF; Wilbray Garand) — dropped |
| ~~Quernhall~~ (**rejected**) | `"Quernhall" place name town` | *Quernhale* is a real boundary point in the 1300 Wychwood perambulation (british-history.ac.uk) — dropped, and with it the idea of naming a town at all |

Scope of the claim: these queries returned **no same-domain bearer**
(microbiology, medicine, science journalism) on that date. No claim is made
that these strings have no bearer anywhere in the world.

Registry check against the batch15 addendum name list: none of *Rhiannon*,
*Josephine*, *Neil*, *Bellinghast*, *Quilvey*, *Hollowmere* appears there; no
given name repeats inside the unit; no "Hal-" prefix and no "Ingrid".
*Klebsiella* and *staphylococci* are ordinary taxonomic nouns, not invented
entities.

## 8. Residual risks flagged for adjudication

1. **Q5 is the usual TYPE-005 exposure.** Option D ("Detached… without any view
   of his own") is the one a solver could argue if they read the passage as
   pure reportage. Three explicit authorial sentences were planted to defeat
   it; if a blind gate still splits, the fix is to sharpen the ¶3 endorsement,
   not to weaken option D.
2. **¶5 mentions that the group stopped fully sequencing a phage before use**
   as one reason turnaround fell from nineteen days to six. It is deliberate
   texture (an operational trade-off a careful reader will notice) and no
   question depends on it; a reviewer who considers it an unwanted implication
   about safety can cut the clause without touching any key.
3. **Mean sentence length 28.0 words** sits in the upper half of the ELF long
   band. It is inside the band and close to the shipped batch14 unit (27.3),
   but it is the stat with the least headroom if an editor adds subordination.

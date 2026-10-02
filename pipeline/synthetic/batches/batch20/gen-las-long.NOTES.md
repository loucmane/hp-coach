# gen-las-long — authoring record (batch20)

**Unit:** LÄS long, 4 questions, Swedish.
**Title:** Sextio dagar vatten över myren
**Family:** `angsvattning-silangar-facktext-long`
**Keys:** q1 **C**, q2 **B**, q3 **D**, q4 **A**
**candidate_id:** `PLACEHOLDER` (orchestrator renumbers).

All statistics below are **recomputed on the final bytes of
`gen-las-long.json`** with `gates/scripts/mech.py` (`tokenize()` /
`sentences()`), per RULE 19. Nothing is carried forward from an earlier draft.

---

## 1. Family, genre, lane

- `macro_genre` sakprosa, `fine_genre` facktext_larobok, `size` long.
- Subject: **ängsvattning / silängar** — flooding hay mires with diverted
  stream water through dug channels. Hydrology and agrarian economy.
- **RULE 20(a) compliance, checked mechanically on the student-facing layer:**
  zero occurrences of `ugn`, `brän-`, `brand`, `brinn`, `eld`, `kol`, `glöd`,
  `rök`, `smält`, `hytta`, `mila`, `tjärdal`, `bål`, `aska`, `härd`. (A `fyr`
  regex matched only the numerals *fyra / fyrahundra / fyrtiotal*.) No
  experimental reconstruction anywhere: nobody rebuilds or runs a system. The
  evidence in the passage is documents, compared chronologies, field survey and
  laser-scanned elevation data.
- The barred b19 frame is absent item by item: no low furnace in a named
  parish, no work rhythm set by frost and firewood, no researcher who has
  inventoried the remains, no reconstruction beside the excavated sites, no
  remains-as-overgrown-mounds, no three-or-four-term craft glossary (two
  entries here), and **no coda that dates the practice**.

## 2. Move sequence, and how it differs from shipped LÄS longs (law 12)

| move | this unit | what the bank already does |
|---|---|---|
| opening | **calendar/procedure-first** — the working year stated as an operation (water on after the spring flood, off before the mowing), no researcher, no artefact, no definition, no count | b5/b6/b7/b8/b9/b10/b11 all run the saturated *researcher-goes-through-the-ledgers* lede; b19 sensory scene-first; b18 source-first on a handbook; b16 static artefact in a wall; b12/b13 a count; b14-001/b14-002 a definitional negation; b14-003 the start of a process; b15 an administrative order; b17 a supply constraint; b3 a result |
| thesis shape | **straight reconstruction ending genuinely unresolved** | b19 mechanism-is-the-point; *metric-measures-the-wrong-thing* is capped and not used |
| skeptic slot | **two named scholars, neither refuted**; each lands a real objection on the other's *source base* | b19 one skeptic who loses; the careful-woman/overconfident-man pairing the whole-bank scan found 18 of 18 |
| coda | stops on an **unresolved field-identification problem** (a watering channel and a drainage ditch look alike, and the 1930s drainage crews reused the old channels) | b19 closes on a dating fact; the aphoristic two-sentence close and the "not A, but B" chiasmus are retired |
| byline | **bare name, no role label** | b19/b14-002/b3/b5/b7/b8/b9 all carry a role |
| glossary | **two** entries | near-universally three |

**Motif hygiene (law 13).** No ledger study: Pärlhage argues from *compared
timings across parishes*, Nolvide from *field survey and maps*. No
weakest-link chain, no institution-in-decline. Genders randomised
independently — the agrarian historian is a woman, the cultural geographer a
man, and **neither wins**.

Paragraph plan: (1) working year and the movement requirement; (2) the winter
fodder bottleneck; (3) construction and the levelling rule; (4) what the water
did; (5) winter watering; (6) labour and coordination; (7) the unresolved
abandonment dispute; (8) what survives, and the coda.

## 3. Mechanism — sources checked before drafting

Every claim about how the systems worked is checked against real sources
(re-runnable), because a backwards mechanism is a kill:

- **sv.wikipedia "Siläng"** (full plaintext extract fetched): definition; the
  layout (a channel or ditch dug upstream from the watercourse, simple
  *fördämningar*, distribution through *grunda silfåror*, an even and **moving**
  surface film); the mechanism (*rörligt vatten* gives the soil and the plants
  more oxygen, so decomposition in the top soil layer speeds up and nutrients
  are released and become available); the season (on after the spring flood has
  receded, latter half of May or start of June; off one to two weeks before the
  mowing, which falls in early August); **vinteröversilning** (autumn damming
  held over winter — the ice crust and the snow on it stop the *tjäle*
  penetrating deep, weak roots are protected, growth starts faster in spring;
  at the spring flood the ice tears away moss, *ris* and bushes frozen into it);
  and the history (in the 1840s the *hushållningssällskap* of the Norrland
  counties noted that *vattenöversilning* beat *dammängar*; strong spread to the
  1870s, then decline, with mire-to-arable conversion and *konstgödsel* named;
  most abandoned in the 1930s–40s).
- **sv.wikipedia "Ängsbevattning"**: c. 1850–1930; *lucksystem*; "syrerikt och
  växtnäringsrikt vatten"; the Skåne estates; the occupation **ängsvattnare**.
- **Länsstyrelsen Skåne, kulturmiljöprogram, "Ängavattning"**: broad
  *tilloppsdike* into a network of dug channels, "flack ängsbyggnad";
  introduced early 1800s, widespread in Skåne by the 1850s; c. 33 000 ha
  1833–1911; built with estate capital; few new systems after 1900, ended by
  the 1940s.
- **Historic England / floodplainmeadows.org.uk** water-meadow introductions:
  the thermal leg — winter floating raises soil temperature, reduces frost and
  produces the "early bite" weeks ahead of unwatered ground.

Two authorial choices, stated so an auditor can check them rather than guess:

1. The passage puts **this district's** yield gain chiefly on **oxygenation of
   the peat** rather than on silt, says so explicitly (brown, silt-poor mire
   water; no appreciable mineral soil deposited), and concedes that silt
   weighed more along the siltier southern rivers. That follows the
   sv.wikipedia mechanism paragraph and is the planted target for q2.
2. The gradient figures (main channel roughly 1:800, mire surface roughly
   1:400) are **invented particulars for an invented system**. The *relation*
   they instantiate — the carrier must fall **less** than the ground it feeds,
   so the water leaves it along its whole length instead of running to the low
   point — is the real engineering constraint and is the planted target for q1.

## 4. Trap design — a named operation on a named target

| q | family | target in the passage | key | distractor operations |
|---|---|---|---|---|
| 1 | `enligt_texten_detalj` | P3: "rännan skulle luta mindre än marken nedanför den" + the two gradient figures | **C** | **A** reversed_direction (the drainage-ditch orientation named in P8); **B** the intuitive equal-fall reading the rule exists to reject; **D** plausible_worldknowledge, deliberately **over-hedged and false** |
| 2 | `detalj_ospecificerad` | P4: syre → nedbrytning → näring ur torven; standing water does the opposite; silt relocated to the southern rivers | **B** | **A** reversed_causality (what *standing* water does, offered as the gain); **C** reversed_causality (oxygen/nutrient arrow inverted); **D** scope_shift/attribution (the silt story the passage blocks twice) |
| 3 | `struktur_funktion` | P6: the 1858 agreement, introduced right after "Till detta kom samordningen" | **D** | **A** scope_shift (the 1870 lawsuit in the *next* sentence promoted to the agreement's function); **B** surface_lexical_echo (keeps *fördela*, swaps water for hay); **C** detail_as_main (the *dagsverken* figure earlier in the same paragraph) |
| 4 | `inference_slutsats` | P7: the two mutual source objections + the closing twenty-year overlap and the missing labour records | **A** | **B** overgeneralisation (a contested map dating raised to decisive proof); **C** plausible_worldknowledge, **hedged and false in fact** (they use different materials); **D** true_but_irrelevant (dismisses a question the passage treats as open) |

Law 11 (no verbatim-true distractor in a "bäst"-item) does not bite — there is
no "bäst" item — but the rule was applied anyway: every distractor in all four
questions carries an identifiable flaw a careful reader can point at.

## 5. Self-blind-solve (arguing FOR each non-key, then killing it on a span)

Solved all four from the passage alone, twice.

**q1.** *A* is the strongest rival, because running a channel straight downhill
is the intuitive picture — killed by P8, which makes exactly that orientation
the definition of a drainage ditch ("en vattningsränna går tvärs över
sluttningen och faller nästan inte alls, ett dike går rakt nedför den"). *B* is
the reading the rule exists to reject and is refuted twice: by the rule itself
and by the two gradient figures (channel ≈ half a metre in four hundred, mire
surface ≈ twice that). *D* is refuted by "Hela konsten låg i avvägningen" and by
the levelling instruments in the next sentence. **C** stands alone.

**q2.** *A* is defensible only if one ignores that the passage assigns exactly
that behaviour to standing water ("Stillastående vatten gör tvärtom: det
stänger ute luften, nedbrytningen avstannar och marken surnar"). *C* is A's
mirror and inverts the stated arrow. *D* is the real-world-plausible silt
story, blocked in two places ("brunt och slamfattigt"; "Någon nämnvärd mängd
mineraljord avlagrades inte") and then relocated ("Längs de grumligare åarna i
söder vägde slammet tyngre än här"). **B** is the only option left.

**q3.** *A* is genuinely tempting because the 1870 lawsuit stands in the very
next sentence — but a private agreement between neighbours is not a court
judgment. *B* keeps the verb and swaps the object; the passage never says
anything about how the hay was divided. *C* names a figure that stands earlier
in the same paragraph and belongs to the digging, not the agreement. **D** is
what the paragraph introduces the agreement to show.

**q4.** *B* requires ignoring Pärlhage's unanswered objection about map dating.
*C* is the historiographic cliché and is simply false here: she works from
compared timings across parishes, he from surveyed channel systems. *D* asserts
the question does not matter, which the passage never suggests and which the
two different causes contradict. **A** is the only option that combines the
mutual source objections with the closing statement that the two processes fall
inside the same twenty years and that nobody recorded the labour.

## 6. Hedge balance (rule 10) and form (rule 13)

- Keys on **q1, q2, q3 are flat, unhedged, absolute-free specific claims**;
  only **q4's key** carries a hedge ("i första hand"). "Pick the qualified
  option" therefore selects the key **1 of 4** — under the ≤ one-half bar.
- Two questions carry a **hedged FALSE distractor**: q1 D ("Den kunde läggas
  fritt på jämn mark.") and q4 C ("Den beror **sannolikt** på …"). The
  heuristic misfires twice.
- **Absolutizers from `mech.py:_ABSOLUTIZERS`: ZERO** across all sixteen
  options and all four prompts, measured on the final bytes. `framför allt` in
  q4 A was rewritten to `i första hand` in the last round precisely to clear
  the token `allt`. No question has an absolutized distractor set, so the
  strip-the-absolutes heuristic has nothing to strip anywhere in the unit.
  M-FORM passes with nothing to report.
- Short-breath question (batch16 rule 5): **q1** — 8-word stem, all four
  options 6–7 words. No semicolons in any option; longest option 13 words.

## 7. RULE 11 — cross-question option-set sweep (mechanical)

Run over the final bytes with a **minimal** stoplist (function words only).
The **only** token shared by any two option sets is the determiner **`samma`**
(q1 B "samma fall som marken" / q4 D "pekar åt samma håll"), which carries no
content. **Zero content or mechanism lemmas cross.**

The partition was designed, not discovered:

- q1 owns `fall`, `luta`, `sluttning`, `mark`
- q2 owns `syre`, `nedbrytning`, `näring`, `torv`, `slam`
- q3 owns `gårdar`, `fördela`, `dagsverken`, `häradsrätt`
- q4 owns `källmaterial`, `kartor`, `vallar`

Two collisions found while drafting were removed **before** the file was
written: `grävas` (q1 A) against `grävningen` (q3 C) — q1 A rewritten to
`dras`; and `Bäcken` (q2 D) against `bäckens` (q3 D) — q2 D rewritten to
`Vattnet`. The topic words `vatten` and `myr` appear in more than one question
and are declared as the passage's unavoidable topic vocabulary.

## 8. RULE 15 pair check, and the stems-only floor

Four questions, so rule 15's two-question pairing does not apply literally; the
principle was applied anyway.

Only **q2** enumerates candidate mechanisms (oxygen / preserved peat / reversed
arrow / silt). No other question's option field is drawn from that space: q1
turns on a geometric rule, q3 on the rhetorical function of one document, q4 on
the source basis of a historiographic dispute. The two "why" questions (q2 =
why the yield rose, q4 = why the practice ended) sit over **disjoint**
hypothesis spaces, so neither discloses the other's field.

**Joint floor, adversarial estimate.** The four stems name *huvudrännan*, the
harvest, an 1858 agreement and two researchers, and none predicates anything
contested (RULE 12). With **stems alone** a solver is at chance on q1, q2 and
q4 and can at best prefer a generic "purpose" reading on q3. With **stems and
options but no passage**, the floor rises to roughly **1-in-2 on q3** — a
purpose question where one option reads most purpose-like — and stays near
chance elsewhere, because q1's two rival options differ only in a comparative,
q2's four options are all mechanism-shaped, and q4's four are all
dispute-shaped. **Joint stems-plus-options floor for the set: no better than
about 1.4 of 4.**

## 9. Measured band statistics — recomputed on the final bytes (RULE 19)

| statistic | measured | band (LÄS long) |
|---|---|---|
| `passage_words` | **856** | 215–1260 (brief's aim 750–850) |
| `paragraph_count` | **9** | 1–35 |
| `sentence_count` | 50 | — |
| `mean_sentence_words` | **17.1** | 8.2–30.9 |
| sentence words min / max | **4 / 37** | — |
| sentence words population stdev | **7.9** | — |
| `prompt_words` q1–q4 | **8 / 14 / 6 / 14** | 3–31 |
| `option_words` q1 | 6, 7, 7, 7 | 0–23 |
| `option_words` q2 | 12, 10, 10, 11 | 0–23 |
| `option_words` q3 | 11, 11, 10, 11 | 0–23 |
| `option_words` q4 | 11, 13, 13, 10 | 0–23 |
| `option_length_ratio_max` | 1.17 / 1.20 / 1.10 / 1.30 | ≤ 5.25 |
| key is the single longest option | **none of the four** | law 10 |
| longest shared token run, any option vs passage | **3** | law 3 (verbatim) |
| title words | 5 | — |

`run_mech.py --parsed-dir data/parsed --p5-corpus-dir auto` →
**M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass, M-ECHO pass (114
shipped units indexed), M-PLAGIARISM pass.**

Surface conventions: **0** em dashes (U+2014); **1** spaced en dash (the
byline); **0** straight or curly double quotes (the passage has no quotations);
no semicolons in any option.

## 10. Law-16 / RULE 14 / RULE 16 log

Full re-runnable log lives in `generator_meta.originality_note`. Summary:

**Positive controls first, same session, same endpoints — all three PASS.**
sv.wikipedia CirrusSearch exact phrase `"Flarken"` → totalhits **56**
(re-confirmed by a direct curl mid-run, still 56). OSM Nominatim
`countrycodes=se q=Flarken` → **n=8** first run, **n=5** on the post-cooldown
re-run. Person index (Exa `category:people`), exact-quoted `"Robert Brindlow"`
→ real bearer returned.

**Kept**

| name | role | sv-wiki | Nominatim | person index | nearest real neighbour (computed) |
|---|---|---|---|---|---|
| **Nolvide** | kulturgeograf | 0 | 0 | no exact bearer | Nolvi d=2, Nivide d=2, Nolte d=3 |
| **Pärlhage** | agrarhistoriker | 0 | 0 | no exact bearer | **Perhage d=2**, Ollhage d=3, Orrhage d=4 |
| **Ovanlid** | byline | 0 | 0 | no exact bearer | **Ovelid d=2, Odenlid d=2**, Övrelid d=3 |
| **Vråbäcken** | the one invented watercourse | 0 | 0 | — | variants Bråbäcken / Gråbäcken / Vråbacken / Vråbäck / Vrångbäcken all 0 |
| **Knut Olofsson** | RULE 17 ordinary figure | — | 2 (streets/firms) | — | deliberately ordinary; see below |

One-letter variants were **enumerated by hand and probed**, not inferred:
Norvide 0, Nolvid 0, Solvide 0; Perlhage 0, Pärlhaga 0, Pärlhagen 0; Ovanlida
0, Övanlid 0.

**RULE 17.** `Knut Olofsson` is deliberately ordinary and is **not** a
coinage — Olofsson is one of the commonest Swedish patronymics. No individual
is implicated: he is an 1858 signatory in an unnamed invented parish, he is not
quoted, and no claim is attached to any real bearer. This is the "one wholly
ordinary figure" the rule asks for, placed where a common name identifies
nobody. The three coined surnames therefore sit against an ordinary anchor
rather than forming an unbroken cluster.

**Rejections (recorded so they are auditable).** `Ossmark` — sv-wiki 0 and
Nominatim 0, but the person index returns **six** real Swedish bearers; the
two-endpoint zero was a **false clean**, and that is why the person leg was
added. `Pihlgärde`, `Nordanmyr`, `Nyhage`, `Pilhem`, `Nätterlund`, `Ohrstedt`,
`Ordell`, `Nybrink`, `Nyrell`, `Nybohm`, `Ohrfeldt`, `Persäter`, `Ollhage`,
`Orrhage` — real bearers. `Perslund`, `Persmark` (via Persmarksvägen),
`Orrhult`, `Orrelund`, `Nortorp`, `Nyvarp`, `Norrsäter`, `Nyhamre`, `Ovrelid`,
`Ormestad` — real places or real bearers. Distance-1 rejections: `Orrestad` ~
Orresta, `Norhed` ~ Norrhed / Nordhed, `Ollenäs` ~ Olenäs, `Ohlsäter` ~
Dohlsäter, `Nolskär` ~ Solskär, `Olvestad` ~ Ulvestad.

Two rejections are worth naming because they are the rules working:

- **`Pilryd`** was 0 on sv-wiki **and** all its sv-wiki variants were 0 — and
  the person index returned real **`Pileryd`** bearers at **d=1**. A single
  index would have shipped it.
- **`Rävlingsån` / `Rävlinge`** was clean on **both** public endpoints (0/0,
  and Rävlingeån, Rävelsån, Rävlingsbäcken, Rävlingsåns all 0) and was still
  discarded, because the **mechanical bank screen** put it at **d=1** from the
  bank's own invented toponym **`Sävlinge`** (batch14, las-b14-002). That is
  the Vässlinge lesson, caught by RULE 16 leg (a) and by nothing else.
  `Sölvbäcken` was likewise externally clean but grazes the barred `Sölvinge`
  stem.

**Mechanical bank screen (RULE 16 leg (a)).** Levenshtein distances
**computed, not quoted from result pages**, over **2126** capitalised tokens
harvested from every shipped candidate (`batches/*/candidates*/*.json` plus
`batches/*/gen-*.json`) and every capitalised token in this batch's
BRIEF-ADDENDUM. Minimum distances: Nolvide **3**, Pärlhage **4**, Ovanlid
**3**, Vråbäcken **4**, Sigbritt **3** (Sigrid), Anton **3** to the nearest
real name (Algot; the 2 is to the English word *Anyone*), Knut **2** with only
English common words at that distance (But/Cut/Not/Put), Linnea **3** to the
nearest real name (Gunnel/Ines; the 2 is to English *Line*/*Inne*), Olofsson
**4**. Given names Sigbritt, Anton, Knut and Linnea appear on **none** of the
brief's used-given-name lists (231 + 25). Barred endings avoided: no `-by`, no
`-ius`, no `-vall`; no `Mar-*` given name. All three coined surnames begin with
**N, O or P** — one of each.

**Tool honesty.** The WebSearch budget was exhausted mid-run (200 of 200) after
the hydrology searches, so the general-web leg fell back per the RULE 8
addition. **Mojeek refused automated requests** (captcha to curl, HTTP 403 to
the fetcher), **DuckDuckGo returned HTTP 403**, and **firecrawl returned HTTP
401**. The person-index leg therefore ran on **Exa `category:people` only**,
with a passing positive control — a **weaker instrument** than the two-index
recipe the addendum prefers, and it is reported as such rather than dressed up.
Nominatim rate-limited with **HTTP 429** for one stretch; every affected probe
was re-run after a cooldown with the control passing. **Flagged for V-FINAL
regardless.**

**Real entities, used generically with nothing invented attached:** the
provinces **Ångermanland** and **Skåne**, and **Amerika**; plus **one**
documented institutional fact — that the *hushållningssällskap* of the Norrland
counties began advocating *silning* over *dämning* in the 1840s (sv.wikipedia,
"Siläng", § Historik). **No named institution, no real person and no real
publication is named or quoted anywhere in the unit.**

**Intra-batch — re-run after the six sibling batch20 units landed.**
Levenshtein computed over all **124** capitalised tokens in the six siblings'
student-facing layers. Minimum distances: Nolvide **4**, Pärlhage **4**,
Ovanlid **4**, Vråbäcken **5**, Sigbritt **4**, Anton **3**, Knut **3**, Linnea
**3**, Olofsson **4** — and every one of those minima falls on an ordinary word
(*Nobody*, *Färglagt*, *And*, *Vilken*, *Vidbring*, *Alison*, *Att*, *Since*,
*Jansson*), not on a sibling name.

Sibling given names in the batch are Gudrun, Torgny, Hildur, Konrad, Alison,
Julian, Kathleen, Trevor, Desmond, Hazel, Carol, Robert, Philippa and Ebenezer;
mine are Sigbritt, Anton, Knut and Linnea — **no given name repeats across the
batch** (and `Torgny`, which a sibling took, had already been rejected here for
sitting at distance 2 from the listed `Torun`). Sibling surnames are Sundström,
Jansson, Vidbring, Gregson, Gaddermoor, Frembleton, Hebden, Hoskadale,
Kembersall, Prout, Cattermay, Bexwarden, Cottam and Dowlesham; sibling toponyms
include Kvillnäs, Sarvhed, Vinnerdal, Vitthamn, Brackenhithe and Hurstleford.
**No collision and no near-duplicate with any of them.** No sibling LÄS unit is
a facktext-long and none touches ängsvattning.

## 11. Law tension and how it was resolved

**RULE 17 ("one wholly ordinary figure") pulls against law 16 ("reject any
name with a real bearer").** In Sweden every naturalistic surname coinage
either has a real bearer or sits one letter from one — that is exactly what
this round demonstrated, with `Ossmark`, `Pihlgärde`, `Nordanmyr`, `Persäter`,
`Pilryd` and a dozen others all falling to real people. Making the *ordinary*
figure a present-day writer or scholar would have attached invented words to a
name a real professional could plausibly hold.

Resolution: the ordinary name is placed where an ordinary name identifies
**nobody** — an 1858 patronymic (`Knut Olofsson`) signing an agreement in an
unnamed invented parish, never quoted, carrying no claim. The three coined
surnames were then pushed toward the *distinctive* end that law 16 asks for
(`Nolvide`, `Pärlhage`, `Ovanlid`), each cleared on three endpoints with
hand-enumerated one-letter variants, and each honestly reported with its
nearest real neighbour and that neighbour's computed distance. `Ovanlid` is the
tightest of the three (d=2 from both *Ovelid* and *Odenlid*) and is named as
such rather than smoothed over.

**Second tension: the brief's word aim (750–850) against law 9 (no
manufactured tidiness).** The first complete draft measured 1060 words. It was
trimmed to **856** in four measured passes, but the trimming stopped short of
stripping the concrete residue that does not point at any answer — the 1912
*syneförrättning*, the 1870 lawsuit, the Skåne estates and their *ängsvattnare*,
the laser-scanned elevation model, the 1930s drainage. Six words over the aim
was judged the cheaper cost.

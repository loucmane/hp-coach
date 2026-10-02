# gen-las-debatt — authoring record (batch20, LÄS short, debatt)

**Title:** Vägen ut till Kvillnäs
**Family:** `vintervaghallning-enskilda-vagar-debatt-short`
**Keys:** q1 **C**, q2 **B**
**Subject:** a kommun withdraws the per-metre bidrag to vägsamfälligheter *and* stops
ploughing the last 1,9 km of its own plough route on an enskild väg. The writer accepts
the withdrawal and argues only about the 1,9 km.

---

## 1. Genre, stance and why this shape

`sakprosa / debatt_opinion / short`, 2 questions, 425 words.

The brief's constraint was that batch19's debatt shape — a board member recanting her own
vote with a declared conflict of interest — must not be rebuilt. This unit takes the other
option the brief named: **a writer who agrees with the decision's aim and attacks only its
instrument, and who gets there from a boundary case rather than from a principle.**

Three deliberate departures from the recant shape:

- **There is no recant.** The writer never voted for anything and never changes position.
  He held one position from the start: the reform is right, the ploughing cut is a mistake.
- **The self-implication is inverted.** las-b19-002's writer implicated herself in a decision
  she now regrets. This writer implicates himself in the *unfairness the reform corrects*: his
  own road was the one the old rule over-paid, and the passage opens with the numbers that
  prove it, before the reader knows whose side he is on.
- **The counter-voice is an ally, not a critic.** The one named antagonist, the samfällighet's
  chair, is on the writer's *side of the road* and wants to fight the whole decision. He
  rejects her line. This replaces the announced-objection move rather than performing it.

Nearest neighbours in the bank were checked for architectural cloning (law 12):

| unit | shape | how this one differs |
|---|---|---|
| `las-b19-002` badbrygga | stake(self-implication) → concession → proposal-facts → teardown(precedent) → teardown(geography)+proposal → **counted-scene close** | no recant, no fee, no displacement argument, no scene close |
| `las-b18-002` elljusspår | scene open → self-as-affected → decision+kalkyl → **"the saving figure is wrong"** teardown | this unit **accepts the kommun's saving as correctly calculated** and never disputes a municipal figure; the argument is a physical constraint, not an arithmetic error |
| `las-b16-002` skolskjuts | decision+budget claim → contract mechanism → named person's data → person objects to own numbers | no named person supplies data here; the named person supplies a *position*, which the writer rejects. **skolskjuts is deliberately absent from the passage** so as not to graze the excluded `skolskjuts-landsbygd-debatt-short` family |

## 2. The reordered five-move skeleton (law 15)

```
1  EVIDENCE, first and against the writer's own interest
     the per-metre rate + the two roads' lengths and household counts
2  CONCESSION of the principle
     "Kommunen har alltså haft rätt i sak" — the reform is correct and it costs us
3  MECHANISM at the boundary
     the kommunala vägen ends at the bridge; a plough cannot turn there;
     the only yard nearby slopes and belongs to the milk lorry
4  COST OF THE ALTERNATIVE
     180 000 kr for a turning circle vs 43 × 400 kr a winter for the driving
5  THE ALLY REJECTED
     Sarvhed wants the whole decision torn up; "jag tycker inte att den är riktig"
6  NARROW ASK
     1,9 km, into the driftbudget
7  FLAT ADMINISTRATIVE CLOSE  → byline → glossary
```

**Dropped, per law 15:** the announced objection (there is no pre-emption of a critic
anywhere in the passage) and the "Jag har X i N år" credential (the writer's only
self-positioning is that he lives on the road). **Also avoided:** the scene opening, the
aphoristic two-sentence coda, the "not A, but B" chiasmus, and the counted-scene close.
The passage stops on a committee date.

Anti-tidiness residue (law 9), none of which points at an answer: the land for the turning
circle is not yet bought and the landowner has not replied; the writer says outright that he
does not know what happens to the post and the home-care if the road goes unploughed, and
refuses to claim he does; the ambulance has been out twice since Christmas **and the road was
ploughed both times** — a detail that mildly undercuts his own case.

## 3. Arithmetic, worked

Every figure reconciles exactly; a reviewer recomputing will get these.

**Bidrag (the conceded ground, q1's material).** Rate: 2 kr per metre per year, paid to the
samfällighet, independent of household count.

| road | length | → metres | bidrag | hushåll | per hushåll |
|---|---|---|---|---|---|
| Kvillnäsvägen | 5,4 km | 5 400 | 5 400 × 2 = **10 800 kr** | 4 | 2 700 kr |
| Ulvbråtsvägen | 1,8 km | 1 800 | 1 800 × 2 = **3 600 kr** | 24 | 150 kr |

- Ratio of bidrag: 10 800 / 3 600 = **3** (identical to 5,4 / 1,8, because the rate is per metre)
- Ratio of households: 24 / 4 = **6**
- Ratio per household: 2 700 / 150 = **18**

**The two totals, 10 800 and 3 600, are never printed in the passage.** q1's key is the 3×
ratio, so the question turns on a derivation, not on a stated sentence. The rationale's
"arton gånger" for distractor B is the third row, also derived.

**Ploughing (the contested ground, not questioned).** 43 turer × 400 kr = **17 200 kr** per
winter. Turning circle at the bridge: **180 000 kr**.
10 × 17 200 = 172 000 < 180 000 < 189 200 = 11 × 17 200, so the passage's "drygt tio
vintrars plogning" is exact (180 000 / 17 200 = 10,47).

**Road split.** 5,4 − 1,9 = **3,5 km**, which is what the samfällighet ploughs itself.

## 4. Trap architecture

### q1 — `enligt_texten_detalj`, key **C**, short-breath question

Stem: *Vad gällde för det gamla vägbidraget, enligt texten?* (8 words, neutral referential,
predicates nothing contested — RULE 12.)

| opt | trap | why it tempts | why it fails |
|---|---|---|---|
| A | `reversed_causality` (rule turned back to front) | it is exactly the allocation logic the kommun is *moving to*, and the reader has just read a paragraph about households | the passage says the bidrag was paid "oavsett hur många som bodde vid vägen" |
| B | over-cautious, false in fact | the most restrained option in the set; rewards guessing over arithmetic | 2 700 vs 150 kr per household — eighteen times apart, not "ungefär lika" |
| **C** | **KEY** | — | 2 kr/m × 5,4 km vs 2 kr/m × 1,8 km = 3 : 1 |
| D | `scope_shift` / `surface_lexical_echo` | "entreprenören" and "400 kronor" are salient in the passage | those belong to the ploughing contract; the bidrag "betalades ut till samfälligheten", and "har aldrig legat i bidraget" |

### q2 — `forfattarens_hallning`, key **B**

Stem: *Vilken av följande uppfattningar om beslutet ger textförfattaren uttryck för?*
(corpus-attested form — the authentic corpus has "Vilken av följande uppfattningar om svenska
bankers bolåneverksamhet ger textförfattaren uttryck för?"; deliberately **not** las-b18-002's
"Vilken hållning till nämndens beslut ger texten uttryck för?", which is one noun away.)

| opt | trap | why it tempts | why it fails |
|---|---|---|---|
| A | `attribution_swap` | it is Gudrun Sarvhed's position verbatim in substance, she is the only named person, and the writer says "Jag förstår henne" | he then refuses it twice: the line "förlorar" and "jag tycker inte att den är riktig" |
| **B** | **KEY** | — | "Kommunen har alltså haft rätt i sak" + "Jag har inget att invända mot besparingen" + "Det jag begär är 1,9 kilometer" |
| C | `plausible_worldknowledge` / `scope_shift` | the obvious compromise after a passage that shows so precisely how skewed the old rule was | "jag begär det inte tillbaka – inte heller ett nytt räknat per hushåll" |
| D | `detail_as_main` | the turning circle is the passage's most concrete object and 180 000 kr its largest number | the point of the cost is that **no** turning circle needs building; the ask is that the plough keeps going to the one that exists |

Law 11 check (no verbatim-true distractor): none of the six distractors is fully true of the
passage. A misattributes, B is numerically false, C is administratively false, D misassigns
the cost, and q2's A/C/D each state a position the text explicitly declines.

## 5. RULE 15 — the pair, measured as a pair

**Is either question a mechanism inventory?** No. q1's four options are rival factual claims
about a single settled past rule — a rule claim (A), a per-household outcome claim (B), a
ratio (C) and an administrative-recipient claim (D). That is not an enumeration of candidate
causes for the thing the essay argues over; the essay argues about a plough route, and none of
q1's options is about ploughing. q2 is the stance question and its space is "what should now
happen to the decision". **The two option fields do not overlap**, which is what RULE 15
requires when one of the questions is a stance question.

**Written out honestly: what a candidate can reach from the two stems and eight option texts
alone, passage unopened.**

From the stems they learn: there was an old road subsidy, and there is a kommun decision the
writer has an opinion about. From the eight options they learn: two named roads exist; a
subsidy might have gone by household count, by some ratio, or to a contractor; a chair-like
voice calls the decision a betrayal of the countryside; a turning circle and a bridge exist;
a road association exists.

- **q1 alone ≈ 1-in-3.** D (a subsidy paid straight to the contractor) is the option a blind
  solver drops as administratively odd, leaving {A, B, C}. Nothing then discriminates: A and
  B both invoke households and could look like a converging pair, which if anything pulls a
  bridge-hunting solver *away* from the key. A test-wise solver's "the specific numeric option
  often keys" heuristic does lean toward C, so the honest floor is 1-in-3 with a lean, not
  a clean 1-in-3.
- **q2 alone ≈ 1-in-2 on {B, C}.** Both are reformist; A is sweeping and D is odd. The
  qualified-middle heuristic picks B and wins. This is at the ceiling the batch16
  efterhandstillägg permits, and it is the pair's binding constraint.
- **Joint ≈ 1-in-2, with no inheritance in either direction.** Reading q1's options tells you
  nothing about which of q2's four stances the writer holds: q1's field is a distribution rule
  in the past, q2's is an action in the future. Reading q2's options tells you nothing about
  the 3× ratio.

One inheritance channel existed in draft and was closed. q2's C first read *"Bidraget bör
återinföras men räknas om efter antalet hushåll"*. A solver who (wrongly) keyed q1 to A —
"the subsidy already went by household count" — could then discard q2-C as incoherent and be
walked to B, i.e. to the key, through a chain that never touched the passage. q2-C was
rewritten to a sweeping restore-position with no household basis (*"eftersom vägen behövs för
hela bygden"*), which removes the household lemma from q2 entirely and breaks the chain. That
edit is the reason "hushåll" now appears in q1-B and q2-C only, and in neither key.

## 6. RULE 11 — cross-question lemma audit

Content lemmas appearing in ≥2 questions' option sets, and the justification for each survivor:

| lemma | where | verdict |
|---|---|---|
| `bidrag` | q1 A, D; q2 A, C | **exempt** — one of the passage's two unavoidable topic nouns. Sits in distractors on both sides; in neither key. |
| `väg` | q1 A, B and inside both road names; q2 C | **exempt** — the other unavoidable topic noun. |
| `hushåll` | q1 B; q2 C | **survivor, justified** — distractor-to-distractor only, and the eliminate-C chain that made it dangerous was removed (§5). |
| `plogning`, `vändplan`, `beslut`, `kommun`, `entreprenör`, `samfällighet` | one question only each | no bridge |

Decisive: **neither key shares a content lemma with the other question's options.**
q1 key = {Kvillnäsvägen, fick, tre, gånger, så, mycket, som, Ulvbråtsvägen};
q2 key = {beslutet, riktigt, plogningen, vändplanen, fortsätta}. A solver corroborating across
the sheet is led into the distractor field, not the key field.

**Title leak check.** "Vägen ut till Kvillnäs" is a flat place-name title carrying no
mechanism word. The two drafts that were rejected for leaking were *Där plogbilen vänder*
(points straight at q2's key and at q2-D) and *Två kronor metern* (discloses the per-metre
basis and thereby refutes q1-A for free).

## 7. Self-blind-solve

Solved both questions from the passage alone, arguing actively for each non-keyed option.

**q1.** A: found the refutation in the first sentence — "oavsett hur många som bodde vid
vägen" — so the rule is length-based; A is the inversion. B: computed 10 800/4 = 2 700 and
3 600/24 = 150; not "ungefär lika" by any reading. C: 5,4 / 1,8 = 3, and because the rate is
per metre the money ratio is the length ratio; defensible. D: the passage puts the bidrag with
the samfällighet and the 400 kr with the entreprenör and says in so many words that the
ploughing never sat in the bidrag. **One defensible option: C.**

**q2.** A: he says he understands her, but "jag tycker inte att den är riktig" is a flat
rejection, and he opens by conceding the kommun is right. B: three separate sentences support
it, and the ask is stated in the imperative. C: refused explicitly, including the recalculated
version. D: he proposes no turning circle for anyone; the 180 000 kr is cited as what the
decision *creates*, not as a bill to be reassigned. **One defensible option: B.**

Neither question was solvable for me from the stems and options alone beyond the floors in §5.

## 8. Hedge balance (rule 10, RULE 13)

| q | key | is the key the qualified option? | is the hedged option wrong? |
|---|---|---|---|
| 1 | C — a flat, unhedged, specific numeric claim | **no** | **yes** — B ("ungefär lika mycket") is the cautious-sounding option and it is false |
| 2 | B — two-part, qualified | yes | — but A ("även om…") and C ("eftersom…") are *also* two-part, so B is not the sole measured option among sweeping siblings (RULE 13) |

"Pick the qualified/moderate option" selects the key in **1 of 2** questions — exactly half,
which is the limit, not over it. No option in either question carries an M-FORM absolutiser
(`alltid/aldrig/samtliga/alla/allt/varje/enbart/endast/ingen/inget/inga/helt/omöjligt/
garanterat`), so the strip-the-absolutes tell is absent; q1-A's "varje" was removed when the
option was rewritten. M-FORM: pass.

Key spread: C and B — no A, no repeat, no positional column.

## 9. Band statistics, recomputed on the final bytes (RULE 19)

Measured with `gates/scripts/mech.py` `tokenize()` / `sentences()` on `gen-las-debatt.json` as
it now stands, after the two language-repair rounds. No figure here is carried forward from an
earlier draft; the 415-word / 13.83-mean pair from the first draft is superseded.

| stat | value | band (LÄS short) | verdict |
|---|---|---|---|
| passage_words | **425** | 188–588 (authoring target 380–450) | pass |
| paragraph_count | **9** | 1–20 | pass |
| sentence_count | 30 | — | — |
| mean_sentence_words | **14.17** | 10.1–36.5 (blueprint target 14–25) | pass |
| sentence length min / max / stdev | 3 / 29 / **7.01** | — | varied |
| prompt_words | q1 **8**, q2 **10** | 3–31 | pass |
| option_words | q1 8/7/8/8, q2 11/9/9/9 | 0–23 | pass |
| option_length_ratio_max | q1 **1.14**, q2 **1.22** | ≤ 5.25 | pass |
| key is unique longest option | q1 no (tied with A and D), q2 no (A is longest) | — | no length tell |

Sentence word lengths, in order:
`24, 14, 13, 3, 7, 22, 20, 9, 5, 26, 7, 9, 21, 7, 7, 17, 9, 14, 15, 15, 13, 18, 3, 15, 16, 7, 20, 26, 14, 29`

Short-breath question (rule 5): **q1** — 8-word stem, every option ≤ 8 words.

Mechanical gates on these bytes: **M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM —
all pass.** M-ECHO indexed 114 shipped units; M-PLAGIARISM ran against
`/home/loucmane/dev/hpfetcher/data/parsed`.

## 10. Frame, register and language

Credited-excerpt frame (law 6): title in the `title` field and not repeated in the passage;
byline `– Torgny Sundström, Kvillnäs` (spaced en dash, never em dash — rule 3) second-to-last;
two-entry glossary at the very tail, matching `las/reference-unit.json`'s order. Both glossed
terms occur in the passage (`vägsamfällighet` in §5 of the passage, `vändplan` in §4 and §6);
"vändplats" was changed to "vändplanerna" so the passage keeps one term for one thing.

Register markers: nominalisations (*bidraget, besparingen, kalkylen, kostnadsuppskattning,
plogningen, driftbudgeten*) and `-s`-passives (*betalades ut, plogades, måste anläggas*) present.
Numeric register mixed on purpose (law 15): digits `5,4 · 1,8 · 1,9 · 3,5 · 43 · 400 · 180 000`
beside spelled-out `två kronor · fyra · tjugofyra · tio · två gånger · elfte`.

Read aloud as a native, sentence by sentence. Two defects were found and repaired in the
second pass: *"fyra permanentbebodda hushåll"* (a *hushåll* cannot be *permanentbebott*; a
building can) → *"längs den bor fyra hushåll året om"*; and *"Marklösen är inte klar"* →
*"Marken är inte inlöst"*. A comma was added to the conditional inversion *"Ska plogbilen
vända där, måste…"*. BIFF/V2 order checked at every subordinate-clause-first sentence
("När fullmäktige … gick det", "Vad som händer … vet jag inte", "De återstående 3,5
kilometrarna sköter vi"). Swedish curly quotes were not needed — the passage quotes no one
directly.

## 11. Names — law 16 / RULE 16 / RULE 17

Full search log with counts, endpoints, controls and the rejected names is in
`generator_meta.originality_note`. Summary:

| name | role | status |
|---|---|---|
| **Torgny Sundström** | byline, the writer | RULE 17 ordinary figure — deliberately a common Swedish name, verified as having no identifiable bearer (sv.wiki 0, Wikidata 0). First choice *Kjell Sundström* discarded: sv.wiki 14 hits, article of that exact title. |
| **Gudrun Sarvhed** | chair of the vägsamfällighet | coined surname, S-initial per the batch's name-space split. sv.wiki 0, Wikidata 0, Nominatim 0; bank distance 3. |
| **Kvillnäs / Kvillnäsvägen** | the writer's village and road | coined. All four indexes 0 / no exact; nearest real neighbour *Kvinäs* at 2. Bank distance 4 and 7. |
| **Ulvbråten / Ulvbråtsvägen** | the comparison road | coined. All four indexes 0 / no exact; nearest real neighbours *Ulvdrågen* 2, *Ulvramsvägen* 3. Bank distance 4 and 6. |

Gender was randomised against the saturated pattern the whole-bank scan found
(careful-woman / overconfident-man, 18 of 18): here the qualified, conceding voice is the man
and the uncompromising one is the woman — and she is written sympathetically, not as a foil.

Thirteen candidate names were **rejected on evidence** during this run, including four that a
single-index fuzzy search would have cleared: *Hägerbol* (real *Hägerbo*, distance 1),
*Sköldmyravägen* (real *Sköldmyrvägen*, distance 1), *Yxbol* (real *Yxbo*, distance 1) and
*Vråkbolsvägen* (real *Vråbolsvägen*, distance 1). That is RULE 16's point demonstrated four
times in one unit: the one-letter neighbour is invisible unless you enumerate it by hand.

Transport honesty: Nominatim's control passed, then the endpoint 429'd mid-run (six generators
on one IP) and Photon was used in its place; Nominatim recovered and the four final toponyms
were re-run on it with the control re-passed. Mojeek served a CAPTCHA to its control and
DuckDuckGo returned zero for *"Astrid Lindgren"*, so **both runs are recorded as void and no
result from either is claimed**. The WebSearch tool reported its 200-call session budget
already spent, so **no general-web index was available**; every kept name is flagged for
V-FINAL on that ground.

## 12. Registry additions this unit introduces

For the batch21 brief: given names **Torgny**, **Gudrun**; full pairs **Torgny Sundström**,
**Gudrun Sarvhed**; surname **Sarvhed**; toponyms **Kvillnäs**, **Kvillnäsvägen**,
**Ulvbråten**, **Ulvbråtsvägen** (and the stems `Kvillnäs-`, `Ulvbråt-`); title
**Vägen ut till Kvillnäs**; family `vintervaghallning-enskilda-vagar-debatt-short`.
Names invented and rejected but never printed — and therefore invisible to
`registry_extract.py`, per RULE 18's note — are all listed in `originality_note`.

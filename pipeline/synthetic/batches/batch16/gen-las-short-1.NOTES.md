# gen-las-short-1 — LÄS short, debattartikel

**Unit:** `gen-las-short-1.json` · `candidate_id: "PLACEHOLDER"` · family
`skolskjuts-landsbygd-debatt-short` · sakprosa / debatt_opinion / short (2 questions).

---

## 1. Topic and lane check

**Topic:** the municipal distance threshold for rural school transport
(*skolskjuts*) — a nämnd proposal to raise the entitlement limit for
årskurs 4–6 from two to three kilometres, and whether the budgeted saving
exists.

Picked from the lane's candidate list (`skolskjutsar på landsbygden`). The
other four were rejected on graze grounds:

- **kommunala musikskolans köer** — queue/allocation of scarce municipal slots
  is exactly the framing batch15 shipped in `foreningslokaler-halltider-debatt-short`
  (bokningssystem / lokalfördelning). Explicitly excluded by the brief.
- **offentliga grillplatser** — shared municipal outdoor facility with
  shared-use conflict; grazes `hundrastgardar-delade-ytor-debatt-short`.
- **parkeringsnormer vid nybyggen** — the live real-world thesis here
  ("parking minimums raise housing costs") is a well-known policy argument, so
  a knowledgeable solver could answer without reading. Law 1 / G-STEM risk.
- **återvinningsstationernas placering** — workable, but siting/NIMBY overlaps
  the "public facility in the neighbourhood" register already used twice
  (`offentliga-toaletter`, `hundrastgardar`), and `glass-recycling-…` sits in
  the ELF list.

**Family-list check:** no shipped family touches school transport. The three
school-adjacent entries (`skolbibliotek-bemanning`, `laxor-grundskolan`,
`skolmatslogistik`) are about staffing, homework and meal logistics — distinct
subject matter, and none of them is about how a municipal contract is priced.
`grep -ril "skolskjuts|avståndsgräns|turlist" batches/` returned only
`las-b7-001` (postväsende), and only for the word *turlista* used of postal
route timetables — a shared domain noun in a different field. Its glossary
defines *turlista*; mine deliberately does not, and glosses
*skjutsberättigad* / *entreprenadavtal* instead so the two units' glossaries
do not echo. M-ECHO passes against all 100 shipped units.

## 2. Architecture — deliberately not the shipped debatt mould

The shipped LÄS debatt shorts converge hard on one skeleton (checked against
`las-b8-003`, `las-b10-002`, `las-b11-002`, `las-b12-003`, `las-b13-003`,
`las-b15-002`):

> meta-framing lede ("Diskussionen om X förs som om…" / "Ett X utan Y är
> inte…") → concede the opposing case → a named researcher's
> *undersökning/kartläggning/mätning* → one objector who has a point → author
> narrows the proposal → aphoristic coda.
> Q1 = "Vad visade X:s undersökning…" (detail), Q2 = hållning/kritik.

This unit breaks that at five points:

| beat | shipped mould | here |
|---|---|---|
| opening | meta-framing claim about "the debate" | institutional case: the decision, its date, its number, then a flat verdict on the number |
| evidence | an outside researcher's study | an internal administrative overlay (the coordinator laid pupil addresses on the route lists) — no study, no researcher |
| thesis shape | "the metric measures the wrong thing" (las-b15-002: booking form vs attendance) | **mechanism-is-the-point**: cost is priced per *tur*, not per pupil, so the rule change moves seats and not vehicles |
| skeptic slot | a separate objector the author partly concedes to, then narrows their own proposal | the *same* person who supplies the ammunition supplies the counter-argument, and the author concedes she cannot cost it out — no narrowed proposal follows |
| coda | aphorism / "not A, but B" chiasmus | it stops on a flat concrete fact (the spring routes are already laid) |
| question order | detail → hållning | **hållning → detail** |

Also observed: no "Jag har X i N år" credential (rule 15), no announced
objection, no negation headline (title is flat descriptive with spelled-out
numerals — a numeric register the bank under-uses), skeptic and author are
male/female respectively with no careful-woman/overconfident-man pairing (law
13), no blocklisted phrase family (law 14).

**Residue against manufactured tidiness (law 9):** the author loses an
argument on the page and says so ("Det argumentet kan jag inte räkna bort,
och jag tänker inte låtsas att jag kan"); the 2016 exemption figures and the
2019 road-safety assessment are consequences that do not point at her thesis;
the two *stickvägar* concede a real, small saving that undercuts a cleaner
version of her own case.

## 3. Planted targets and trap architecture

**Planted target for Q2** (stycke 2 + 3, hedged / directional / scoped):
the contract pays a fixed rate *per fordon, tur och skoldag* with four of five
kronor in the fixed part; 58 of the 61 affected pupils board on routes that
run for other year-groups anyway, so the vehicles stay; three pupils sit on
two spur roads that could be struck. Direction (cost follows *turer*, not
pupils), hedge (*nästan lika mycket*, 58 of 61), scope (årskurs 4–6, 2–3 km).

**Planted target for Q1** (stycke 4 + 6): the explicit stance — the budgeted
1,4 mkr is not obtainable; the only defensible figure is just under 90 000 kr
— planted *next to* a concession she refuses to convert into endorsement.

### Q1 — `forfattarens_hallning` (key **C**, short-breath question)

Stem 9 words, all options ≤ 8 words.

| opt | trap | why it tempts / why it fails |
|---|---|---|
| A | `detail_as_main` | Näversved's 2029 argument, which the author says she cannot dismiss — a **concession promoted to stance**, the canonical hållning trap. Refuted by "fordonsstorleken går att anpassa efter det faktiska resandet ändå. Någon ny avståndsgräns krävs inte för det." She never endorses the raise at any date. |
| B | `plausible_worldknowledge` | The reasonable middle ("försiktigt och stegvis") — the hedge-bait, see §4. No textual anchor whatsoever: her objection is to the amount, not the pace. |
| **C** | **key** | Flat, unhedged paraphrase of the stance: budget says 1,4 mkr/year, the only figure she will stand behind is just under 90 000 kr. The word *bråkdel* appears nowhere in the passage. |
| D | `overgeneralisation` | Absolutises the criticism to zero kronor. The passage explicitly concedes the ~90 000 kr on the two spurs, so "inte en enda krona" is refutable by a careful reader — the reason the lede was phrased as "den summan" (the 1,4 mkr) and never as "sparar inga pengar". |

### Q2 — `detalj_ospecificerad` (key **A**)

| opt | trap | why it tempts / why it fails |
|---|---|---|
| **A** | **key** | Paraphrases stycke 3 with synonym shift; hedged ("nästan alla") and scoped, like the passage. No sentence is reproduced. |
| B | `reversed_causality` | The intuitive answer and the dominant corpus trap: makes cost follow pupil numbers. The passage says the opposite — fixed per vehicle/tur/school day, four of five kronor fixed, six pupils cost nearly what twenty do. |
| C | `overgeneralisation` | Turns "almost no route can be shortened" into "none can", against the two named spur roads. Echoes the salient *tjugotre morgonturer*. |
| D | `scope_shift` | Answers from stycke 5 (the 2019 trafiksäkerhetsbedömning), not from the address overlay, **and** upgrades the quantity: three vägsträckor becomes "de flesta av hållplatserna". Not verbatim-true — it carries an identifiable flaw (law 11). |

## 4. Hedge map (rule 10 — required)

| q | key's rhetorical shape | the hedged/moderate option | does "pick the qualified answer" work? |
|---|---|---|---|
| 1 | **flat, unhedged assertion** ("blir en bråkdel av den budgeterade") | **B**, "försiktigt och stegvis" — **WRONG** | **No.** The heuristic actively misfires. |
| 2 | hedged ("Nästan alla…") | key itself; B and C are absolutes | Yes. |

**Balance: 1 of 2 — exactly half, not more.** Q1 is the engineered break, on
the same pattern as las-b15-002's law-10 break: the cautious-sounding
compromise position is the distractor, and the confident specific claim is the
key. A test-wise student who scores by picking the qualified option gets Q2
and loses Q1.

Key letters: **C, A** — no A-default, no positional tell. Key is not the
single longest option in either question (Q1 8w key vs 8w distractor A;
Q2 15w key vs 16w distractor D).

## 5. Self-blind-solve (skeptical, passage only)

Solved cold from the passage, arguing actively *for* each non-keyed option.

- **Q1 → C, single defensible.** A was the only serious rival: the author does
  grant that the deferred-saving argument survives. But granting that an
  argument cannot be dismissed is not asserting that the raise "behövs" — and
  she closes the door explicitly ("Någon ny avståndsgräns krävs inte för
  det"). B has no anchor at all. D is killed by the ~90 000 kr she herself
  concedes. Verdict: one answer.
- **Q2 → A, single defensible.** B is refuted by the fixed-rate sentence, C by
  the two spur roads, D by both its source paragraph and its quantity. Verdict:
  one answer.
- **Cross-question leak check.** Q2's mechanism does *not* settle Q1: Q1's
  distractor A ("behövs, men först vid nästa upphandling") is fully compatible
  with the vehicles staying, so a solver who has Q2 right still has to read
  stycke 4 and 6 to place the author's stance. Conversely Q1's options say
  nothing about which routes can be shortened. The two keys corroborate each
  other (the mechanism explains the arithmetic) without either being derivable
  from the other's option set.

## 6. Language pass (batch15's foge-s failure mode)

Every compound was read aloud and checked individually:

`avståndsgräns` · `avståndsspannet` · `årskurs` · `trafiksäkerhetsbedömning` ·
`undantagsansökningar` · `fordonsstorleken` (all take the **foge-s**);
`skolskjuts` · `budgetunderlag` · `entreprenadavtal` · `kilometertillägg` ·
`turplanering` · `turlistor` · `elevunderlag` · `grundersättning` ·
`hållplatser` · `vägsträckor` · `stickvägar` · `morgonturer` ·
`skolskjutsverksamheten` (correctly **without** — note `skolskjuts` already
ends in -s, so no doubled joint).

Other checks: `Sextioen elever` (not *sextioett* — *elev* is an en-word);
en/ett agreement on *ett rörligt kilometertillägg*, *ett minskat
elevunderlag*, *det nya avståndsspannet*, *Kommunens egen …bedömning*;
BIFF holds in every subordinate clause with a negation ("som ännu **inte** är
skriven", "att jag kan"); `-s`-passives present (*bestäms, avgörs, körs,
trafikeras, handläggs, beviljades, ändrades, dras*) alongside nominalisation
(*ersättningen, besparing, upphandling, prövning, bedömning, turplaneringen*),
as the sakprosa register markers require. Swedish curly quotes ”…” on the one
quotation (rule 2); spaced en dash only, zero em dashes anywhere in the file
(rule 3); no semicolons in any option, all options ≤ 21 words (rule 5).

## 7. Measured stats (mech.py units)

| stat | value | band |
|---|---|---|
| passage_words | 436 | 188–588 (bands.json short) · 290–500 (blueprint) ✔ |
| sentence_count | 23 | 15–29 (blueprint short) ✔ |
| mean_sentence_words | 18.96 | 10.1–36.5 (bands.json) · 14–25 (blueprint) ✔ |
| paragraph_count | 7 | 1–20 (bands.json) · 3–13 (blueprint) ✔ |
| LIX | 46.5 | 46–56 (debatt_opinion preset) ✔ |
| sentence-length spread | 3, 4, 6, 7, 8, 11, 11, 11, 14, 15, 16, 17, 19, 19, 25, 25, 25, 26, 27, 27, 36, 37, 48 | varied, not uniform ✔ |
| prompt_words | 9 / 10 | 3–31 ✔ |
| option_words | Q1 [8,7,8,7] · Q2 [15,14,12,16] | 0–23 ✔ |
| option_length_ratio | 1.14 / 1.33 | ≤ 5.25 ✔ |

The 48-word final "sentence" is the byline + glossary fold described in
GENERATION.md law 6, as expected.

**Mechanical gate self-check** (`run_mech.py … --p5-corpus-dir auto`, M-ECHO
indexed 100 shipped units, M-PLAGIARISM against `data/parsed`):

```
M-SCHEMA -> pass   M-BANDS -> pass   M-TELL -> pass
M-FORM   -> pass   M-ECHO  -> pass   M-PLAGIARISM -> pass
```

## 8. Name verification — tool used, and what it does NOT establish

**WebSearch was unavailable for this unit.** The first call returned
`session has used its web search budget (200 of 200 WebSearch calls)`. Per
batch16 addendum rule 4 the fallback path was used and is named here rather
than papered over: **Exa (`web_search_exa`) + the sv.wikipedia search API.**
The full re-runnable query log lives in
`generator_meta.originality_note`. Summary:

**Rejected on evidence of a real bearer** (three candidate names discarded
before drafting):

- *Tjärnhage* — real Swedish surname, ~12 bearers (hitta.se, allabolag,
  LinkedIn). Not used.
- *Brannmo / Brännmo* — real bearers (hitta.se, krimfup.se, Norwegian
  Hemneslekt). Not used.
- *Kvarnsele* — **a real by** in Degerfors socken, Vindeln kommun (isof.se
  ortnamnsregister; sv.wikipedia "Lista över länsvägar i Västerbottens län").
  Not used.
- *Ösjödalen* — **a real valley** in Härjedalen/Funäsfjällen
  (funasfjallen.se, ramundberget.se). Not used; the unit consequently names
  **no village at all**, and states no region.

**Rejected on a REGISTRY collision** (law 13, caught after drafting):

- *Vresmark* — clean against the real world, but the shipped bank already
  contains the invented toponyms **Vretmark** (20 occurrences) and
  **Vresfallet/Vresfallets** (30), and the `-mark` element is saturated across
  16 invented bank names (Vretmark, Vrenmark, Wrennmark, Frejmark, Hyttmark,
  Oldenmark, Radmark, Ranmark, Rådmark, Vallmark, Vidmark, Wirenmark,
  Drenmark, Ödmark …). The sibling `gen-las-long.json` independently rejected
  *Vresmark* on the same grounds. Renamed to **Ödsmyra**: `Öds-` appears
  nowhere in the bank, `-myra` appears once with a different first element
  (*Hällmyra*), sv.wikipedia exact-phrase search returns `totalhits: 0`, and
  Exa surfaced no bearer (nearest real names are the unrelated *Gullsmyra* in
  Heby and *Ödsbyn* in Örnsköldsvik).

**Kept:** `Majken Brantmyr`, `Sivert Näversved`, `Ödsmyra` (municipality).
Evidence: Exa returned no Swedish bearer for any of the three (the only
*Brantmyr* hit is a fictional prince in an English fairy-tale text); the
sv.wikipedia search API returns `totalhits: 0` for each as an exact phrase.
That endpoint was **positive-controlled** in the same session —
`"Kvarnsele"` returns `totalhits: 2` — so it does resolve small real Swedish
byar and the zero-hit results are informative rather than an artefact.

**Sibling deconfliction (rule 8):** `gen-las-short-2.json` read this unit and
records *Majken* / *Sivert* in its own avoid-list, so the given names are not
shared across batch16. No sibling uses *Brantmyr*, *Näversved* or *Ödsmyra*.

Both given names are absent from the rule-8 list of 214 used given names, and
`grep -ril "Brantmyr|Ödsmyra|Näversved" batches/` finds nothing anywhere in
the shipped bank.

**These three names are NOT certified fictional.** Exa is a semantic search,
not an exact-phrase index, and no general web exact-phrase check could be
performed. They are **flagged for V-FINAL re-verification**. No real person,
institution, publication or place is named anywhere in the unit; the
municipality, the contractor, the coordinator and the author are all invented.

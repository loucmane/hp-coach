# gen-las-long-3 — "Ishuset vid Långudden"

**Slot:** LÄS long (750–1135 words, 4 questions), replacement for retired `las-b11-001`
(apotekshistoria; retired as a clone of `las-b10-001`).
**Anti-model:** `pipeline/synthetic/batches/batch10/candidates-final/las-b10-001.json`
("Räknat i dagar, inte i stockar", flottningshistoria).
**Topic:** isupptagning och isförvaring före kylskåpet — issjöar, ishus och ishandeln.
**Genre:** sakprosa / facktext (teknik- och näringshistoria), opening move = scene.

---

## 1. Divergence check against the anti-model (law 12)

Move sequence, side by side. Every row differs.

| # | las-b10-001 (anti-model) | this unit |
|---|---|---|
| Opening | Result-lede through a *defeated expectation*: the researcher opens the ledgers expecting brötar, the books say otherwise | Wordless procedural **scene**: the ice is thick enough to bear a horse, the snow is swept, the grid is scored, blocks are sawn free. No researcher, no expectation, no result in the lede |
| Thesis shape | "the thing everyone pictures / the metric everyone quotes is not what the record measures" (the saturated shape) | **mechanism-is-the-point + conventional-view-confirmed**: storage was a geometry-and-drainage problem, and the old merchant's rule of thumb turns out to be right when it is finally tested |
| Evidence pattern | Archival **ledger study** — 23 000 day-notations, 19 leder, 1908–1962, sorted by marginal note (a motif GENERATION.md law 13 names as saturated) | A **physical reconstruction**: a rebuilt ice house filled three winters running, two stacks of different height under the same roof, weighed. One archival object only (a single handwritten instruction from 1901) |
| Method self-criticism | Dedicated paragraph ("Materialet har sina hål", a sixth of the notations unsortable, "den som vill ha exakta tal får söka sig till ett annat material") | No method-confession paragraph at all. The limitation surfaces socially instead — the challenger identifies it and the researcher deletes a conclusion |
| Skeptic slot | Male economic historian, **penultimate-but-one**, objection "bites", author recomputes, "mönstret försvagas men står kvar" — the author still wins | **Female** conservation antiquarian, **paragraph 5 of 8** (mid-passage, with two substantive paragraphs after her), and she simply **wins**: Frödell strikes the insulation conclusion from his report. What survives survives for a reason *she concedes*, not because he out-argued her |
| Gender pattern | careful woman researcher / overconfident man challenger (the 18-of-18 bank pattern) | **inverted**: male researcher, female challenger, and the challenger is right |
| Unresolved thread | "Entydig blir bilden ändå inte" — five leder show nothing, one runs the other way; the finding is downgraded to "ett drag i materialet" | A *different* question is left open (whether Mörtsjö ice really kept worse), for a stated and narrow reason: only Sävlången ice was ever stacked at Långudden. The main finding is **not** downgraded |
| Scope limiter | none — the passage narrows itself instead | Own paragraph: the fish-dealer's five-ton cupboard under the stairs, where waste was cheaper than carting. The rule is right *and* not universal |
| Coda | Aphoristic two-sentence close with a "not A, but B" turn ("Det som försvann var inte bara ett sätt att förflytta timmer, utan …" / "I dagens skogsstatistik räknas kubikmeter. Vem som gick längs stranden står det ingenting om.") | The passage **stops**. Staged decline (dairies, brewery, hospital, households), a dated last delivery, the demolition year, then one flat measurement: the floor slopes an inch to the metre toward the drain, as the drawing specifies. No aphorism, no chiasmus, no elegy |
| Title | "Räknat i dagar, inte i stockar" — a *not-A-but-B* headline | "Ishuset vid Långudden" — flat place-name title (law 15) |
| Furniture | byline **and** a 3-entry glossary | byline only, and in **initial form** ("— M. Tannerfeldt"). Glossary deliberately dropped; the two hard terms are glossed inline instead ("två fot i fyrkant, knappt sextio centimeter"; "fyra alnar eller knappt två och en halv meter") |
| Numeric register | percentage-heavy ("knappt sju procent", "nära hälften", "var sjätte", "var tionde") + spelled-out five-figure counts | measures and units instead — fot, alnar, kilo, ton, kronor, a slope in inches per metre; two fractions only, and no percentages at all |
| Question tail | detail, detail, inference, **huvudbudskap** ("Vilket påstående överensstämmer bäst med texten?") | detail, detail, **struktur_funktion** (a 2.4 % family the bank rarely uses), inference. No "bäst"-item, so law 11's failure mode is out of scope by construction |

**Names / motifs (law 13).** Every invented name was grepped against all 87 shipped units
(`grep -ril` over `batches/*/candidates-final/`): Sävlången, Mörtsjön, Hulterud, Långudden,
Lorentzon & Kompani, Fabian Lorentzon, Yngve Frödell, Vendela Karnstedt, M. Tannerfeldt —
**zero hits**. None of the banned surnames (Öberg, Frisk, Sundqvist, Lindqvist, Åkerlund,
Brandt, Halloran, Sahlberg, Ahlgren, Sundelius), no "Hal-" prefix, no "Ingrid". The topic
terms *isupptagning / ishus / ishandel* also return zero hits across the shipped bank.
Motifs avoided: ledger-study sourcing, weakest-link chain, institution-in-decline as thesis.

**Phrase blocklist (law 14).** Checked and clear — no "Materialet har sina hål",
"Invändningen kommer genast", "Entydig är bilden inte", "Undersökningen vilar på ett tålmodigt
räknande", "medger … men håller fast vid att mönstret återkommer", "Vi ser ett mönster, inte
en lag", or close variants.

**M-ECHO / M-PLAGIARISM.** `run_mech.py --p5-corpus-dir auto` indexes all 87 shipped units:
M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM all **pass**.

---

## 2. Passage architecture (8 paragraphs, 851 words)

1. **scene** — the cut on Sävlången: sweeping, the horse-drawn scoring plough, hand-sawing,
   block dimensions, the channel and the plank hoist. *(Q1 target: a fixed square measure, a
   variable thickness, a doubly hedged weight.)*
2. **background** — the trade: customers, contracts written in *lass* not in kilos, the price
   curve from April to September, and one inert detail (the oldest surviving contract, six
   loads for a wedding, paid in butter).
3. **mechanism** — the thesis. Surface-to-volume; tight joints because loosely packed ice melts
   from within; sawdust insulates only while dry; the sloping floor and the stone drain; the
   small high north-facing door.
4. **rule + test** — Lorentzon's 1901 instruction (never lower than four alnar, never narrower
   than it is high), long read as a rule of thumb without backing; Frödell's 2011 rebuild;
   the full-height stack loses about a fifth by mid-September, the deliberately half-height
   stack nearly half. Plus residue: a sensor cracked in year two. *(Q4 target.)*
5. **disagreement** — Frödell credits packing and calls insulation overrated (one wall left
   bare, no measurable difference); Karnstedt answers that this speaks to the new building,
   not the old ones; he concedes and deletes the claim; the two-stack comparison survives for
   a reason she does not dispute — same roof, same summers, same house. *(Q2 target.)*
6. **open question** — Mörtsjö ice: some merchants held it porous, others paid the same price;
   no Mörtsjö stack was ever built at Långudden. Deliberate residue, keyed by nothing.
7. **scope limit** — the fish dealer's five-ton cupboard: badly packed, opened twenty times a
   day, and rational, because carting cost more than the melt. *(Q3 target.)*
8. **close** — refrigeration arrives in stages; the last load leaves in July 1953; the building
   stands until 1968; the floor of the rebuild slopes an inch to the metre. Byline.

Sentence rhythm: 43 sentences, mean 19.8 words, ranging from 6-word verdicts ("Utfallet talade
för Lorentzon.", "Slutet kom i etapper.") to 45-word subordinated periods.

---

## 3. Question sheet — traps and self-blind-solve

Family mix: 2 detail + 1 struktur_funktion + 1 inference. Key spread **C / A / D / B**.

| q | family | key | planted traps |
|---|---|---|---|
| 1 | enligt_texten_detalj | C | A reversed_causality (fixed/variable dimensions swapped) · B overgeneralisation (strips "ett gott år" and "omkring") · D surface_lexical_echo (invented stamping, real plank hoist) |
| 2 | detalj_ospecificerad | A | B reversed_causality (Frödell's own position turned back to front) · C plausible_worldknowledge, **hedged** ("tycks avvika") · D overgeneralisation ("kan aldrig") |
| 3 | struktur_funktion | D | A reversed_causality (rule sourced to the small traders) · B plausible_worldknowledge (refrigeration) · C scope_shift, **hedged** ("För att antyda"), weaponising "tekniskt undermåliga" against the text's "var inga misstag" in the same sentence |
| 4 | inference_slutsats | B | A overgeneralisation ("enda", "samtliga") · C half_right_conjunction with a balanced, judicious tone · D reversed_causality **in time** (measurement before the rule) |

**Cross-question corroboration — checked, none.** The four keys assert four disjoint
propositions: (1) the block's square measure was fixed while its thickness was not;
(2) Karnstedt's objection is that the rebuilt shell is tighter than the historical ones;
(3) the fish dealer's cupboard is there to limit the rule's reach, not to contradict it;
(4) the 1901 rule was written without measurement and was borne out 110 years later. No key
entails, confirms, or narrows the answer space of another. Q2 and Q4 both concern the
reconstruction but point at different things — Q2 at the sub-conclusion that was *withdrawn*
(insulation), Q4 at the stacking rule that was *upheld* — and neither option set discloses the
other's direction.

**Blind-solve as a passage-blind reader.** Reading only the stems and options:

- Q1 — A and C are exact mirrors; nothing outside the text says which dimension was fixed.
  B is the absolute and D the invented-specific. A passage-blind reader is at chance between
  A and C. **Not solvable.**
- Q2 — all four are shaped like real antiquarian objections; D is the generic methods
  complaint a test-wise student reaches for, and C carries the cautious "tycks". No form cue
  favours A. **Not solvable.**
- Q3 — all four options open "För att…"; the key is neither longest nor most hedged (C is the
  hedged one, B and A are longer). **Not solvable.**
- Q4 — C is the balanced, two-clause option that usually reads as correct; A is the absolute;
  D is a plausible chronology. B wins only for a reader who knows the rule *preceded* the
  measurements. **Not solvable.**

**Self-blind-solve from the passage alone**, arguing actively for each non-keyed option:
Q1 = C, Q2 = A, Q3 = D, Q4 = B, each with exactly one defensible answer. Nothing turns on
world knowledge; the one shared fact in the passage (mechanical refrigeration displaced
natural ice) sits in the closing paragraph and keys nothing.

**Hedge balance (law 10).** The key is the qualified option only in Q1. In Q2, Q3 and Q4 the
key is a confident, specific claim while the *distractor* carries the hedge (Q2 C "tycks
avvika", Q3 C "För att antyda", Q4 C's judicious "höll för … men motsades av …"). "Pick the
cautious one" therefore scores at chance across the sheet.

**Length tell.** The key is not the longest option in any of the four questions
(Q1 17/14/**16**/15 · Q2 **19**/17/21/16 · Q3 18/19/16/**18** · Q4 16/**16**/18/16).
Longest-to-shortest ratio per question: 1.21 / 1.31 / 1.19 / 1.12, well inside the 5.25 cap.

---

## 4. Band compliance

| stat | value | band (LÄS long) |
|---|---|---|
| passage words | 851 | 215–1260 (blueprint target 750–1135 ✓) |
| sentences | 43 | ~35–66 ✓ |
| mean sentence words | 19.8 | 8.2–30.9 (blueprint 14–25 ✓) |
| paragraphs | 8 | 1–35 (blueprint 4–17 ✓) |
| questions | 4 | hard invariant for LÄS long ✓ |
| option words | 14–21 | 0–23 ✓ |
| option length ratio | ≤ 1.31 | ≤ 5.25 ✓ |

`run_mech.py --p5-corpus-dir auto`: **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass ·
M-ECHO pass (87 shipped units indexed) · M-PLAGIARISM pass.**

Language: read aloud as Swedish sakprosa. `-s`-passives (*sopades, sågades, drevs, hissades,
lades, hölls, lästs*) and nominalisations (*lagringen, packningen, isoleringen, hämtningen,
avrinningen*) are present; no calques; en/ett and definiteness checked; no chat register. The
one term that could mislead — *spån* as roofing shingle versus *sågspån* as loose insulation —
was removed by giving the roof tarred felt (*tjärpapp*) instead.

# gen-las-long — author notes

## Slot
Batch-6 LÄS **long** unit (843 words, 4 questions). Regenerates a batch-4 slot
killed on the **distractor-plausibility** axis ("B absurd overclaim, D circular,
A off-cause"). Every distractor here is a plausible-but-wrong *mechanism* a
passage-blind reader cannot dismiss on sight.

## Genre / topic rationale
- **Topic (from exclusive pool):** *fäbodbrukets återkomst* — why some Swedish
  summer mountain-pasture farms (fäbodar) came back into use in the 2000s.
  Chosen over torvmosse-restaurering and ålfiske because it yields a clean
  hedged/directional/scoped core claim (valley farm + young successor → fäbod
  revival, *mainly* where predator-fence support existed, *only* while the
  EU environmental subsidy covered the labour) plus a natural cause/effect
  counterpoint researcher. Not a neighbour of any batch 1–5 topic.
- **Genre:** sakprosa / populärvetenskap, result-lede opening — the corpus-median
  regime for a 4-question long passage. Register: nominalisation + -s-passives
  present, varied sentence length (short verdicts beside long subordinated
  method sentences), fictional byline, 3-entry glossary defining only words that
  appear (fäbod, buföring, messmör).
- **All entities fictional:** Ingrid Halvardsson (etnolog), Sten Ohlander
  (kulturgeograf), Märta Bäckström (byline), the Grönvallen fäbod. No
  famous-thesis anchoring; miljöersättning/rovdjur are generic background
  (like "skolbudget" in the reference unit), not a named study.

## Planted trap architecture (passage and questions are one design)
The lede plants the load-bearing claim: **hedged** (sällan / oftast / främst),
**directional** (brukad dalgård → fäbodens återkomst), **scoped** (predator-fence
trakter; only while subsidy lasts). Stycke 4 gives the mechanism (labour + animals
already in the valley) and an explicit denial ("inte att just dessa fäbodar hade
friskare bete eller stod bättre till") that a scope-shift distractor walks into.
Stycke 5 gives Ohlander the reversed-causality counter-view — a wrong answer by
attribution on Q1/Q2, never a second key. Stycke 6 gives the two-sided stance.

- **Q1** `enligt_texten_detalj` — key A paraphrases the lede.
  - B = **reversed_causality** (fäbod revival → valley gets a young successor); it
    is deliberately *hedged* ("tycktes/oftare") so hedge alone can't pick the key.
  - C = **overgeneralisation** ("Varje … oavsett trakt och stödform").
  - D = **scope_shift** (method-as-result; also self-defeating since the text says
    abandonment was seldom recorded).
- **Q2** `detalj_ospecificerad` — key C is the confident, specific mechanism
  (*not* hedged), breaking the correct=qualified correlation.
  - A = **scope_shift** to a different factor (higher/fresher grazing) the text
    explicitly denies.
  - B = **overgeneralisation** ("helt oberoende av … miljöersättningen").
  - D = **reversed_causality** (fäbod economy funded the valley farm).
- **Q3** `forfattarens_hallning` — key B is the explicit "varken … eller" stance.
  - A = **stance_inversion / plausible_worldknowledge** (advocates large-scale
    revival the text never urges).
  - C = **overgeneralisation of a concession** ("genomgående … saknar all grund").
  - D = **half_right_conjunction**, balanced in *form* ("både … men") but adds an
    unheld verdict ("var likväl riktigt att det till slut övergavs"). B and D are
    both two-sided in shape, so "pick the nuanced one" does not solve it.
- **Q4** `huvudbudskap_syfte` — key D spans lede+finding+stance ("finansiering och
  bemanning … historia som bör läsas nyktert").
  - A = **detail_as_main** (method).
  - B = **overgeneralisation** ("alltid … oavsett trakt och stöd").
  - C = **true_but_irrelevant**, hedged ("tycks") — right topic zone, wrong focus.

## Hedge balance (M-FORM / pedagogy)
Key is the sole hedged option in **no** question: Q1 key A and distractor B are
both hedged (direction separates them); Q2 key C is confident while B is absolute;
Q3 key B and distractor D are both balanced-form; Q4 key D is qualified but C is
also hedged and B absolute. "Pick the qualified/nuanced answer" scores nothing.

## Self-blind-solve
Solved all four from the passage alone, arguing actively for each non-keyed
option. Exactly one defensible answer each: **Q1=A, Q2=C, Q3=B, Q4=D**.
- Q1/Q2 stems pin to *Halvardsson's* result/explanation, so Ohlander's reversed
  counter-view is wrong by attribution, not a rival key.
- Q3's closest challenger D and Q4's closest challenger C were each re-checked:
  D carries an unheld "abandonment was right" clause; C states background, not the
  thesis. Neither survives as a second key.

## Band / mechanical compliance
`run_mech.py` → all five gates **pass** (M-SCHEMA, M-BANDS, M-TELL, M-FORM,
M-PLAGIARISM). Passage 843 words (band 750–1135), 36 sentences, mean 23.4 words
(band 14–25). Every option ≤22 tokens (cap 23); option-length ratio ≤1.4 per
question (cap 5.25). Key is **not** the longest option in any question. Key spread
A/C/B/D — no positional or length tell.

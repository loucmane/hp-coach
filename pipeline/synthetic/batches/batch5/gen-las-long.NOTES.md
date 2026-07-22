# gen-las-long — author notes

## Topic & genre
- **Topic:** history of Swedish municipal public bathhouses (*folkbadhus*) and why some
  survived into the 1960s while others were demolished within decades. Chosen from the
  batch-5 exclusive pool ("Swedish public everyday institutions"). Not neighboured by any
  batch 1–4 topic (checked: no water-cure/spa, no institutional-history overlap; the
  bathhouse here is a *social-funding* history, not the water-cure/wellness angle explicitly
  reserved out).
- **Genre:** sakprosa / populärvetenskap, result-lede opening. Register: nominal, some
  `-s`-passives (`rivits`, `bokförd`, `förlagt`), specialist lexis glossed. Sentence length
  deliberately varied — short verdicts ("Svaret blev inte det hon väntat sig.", "Alla håller
  inte med.", "Att bada blev en medborgerlig plikt.") beside long subordinated sentences.
- **Frame:** title line (not repeated in passage); fictional byline `— Vidar Lindqvist,
  kulturredaktör`; two-entry glossary tail (`karbad`, `koks` — both appear in the passage).
- **All entities fictional:** Astrid Wennberg (idéhistoriker), Gösta Frimansson
  (arkitekturhistoriker), Vidar Lindqvist, the 1911 Bergslagen bathhouse, the 1930s
  residensstad "badpalats". No famous-thesis anchoring; a knowledgeable reader cannot
  shortcut any item from prior knowledge of bathhouse history.

## Planted target architecture (passage and questions are one design)
The lede plants the load-bearing claim: **hedged** ("i regel"/"sällan de största"),
**directional** (municipality couples a house to *simundervisning* → that house survives
longer), **scoped** ("främst i inlandsstäderna", "bara fram till" home bathrooms). Stycke 4
plants the **mechanism** (school coupling → a fixed line in the school budget → the boiler
stays financed even as paying visitors fall) and explicitly rules out the building-quality
explanation ("inte att just dessa hus var bättre byggda"). Stycke 5 plants Frimansson's
**reversed-causality counter-view** (municipalities picked the already-sound houses; the
survival is a cause mistaken for an effect) — deliberately, so the reversal distractors have
a real in-text target while remaining *wrong answers* to stems pinned to "Wennbergs" result.
Stycke 6 plants the **balanced stance** (neither glorify nor dismiss).

| Q | family | key | distractor traps |
|---|---|---|---|
| 1 | enligt_texten_detalj | A | B reversed_causality (Frimansson's arrow, hedged with "tycktes"), C overgeneralisation, D scope_shift (method-as-result) |
| 2 | detalj_ospecificerad (mechanism) | C | A scope_shift (building-quality factor Wennberg rejects), B overgeneralisation ("fullständigt oberoende"), D reversed_causality |
| 3 | forfattarens_hallning | B | A stance_inversion (advocates rebuilding — unheld), C overgeneralisation of a concession, D half_right_conjunction (both-sides true, false "should have been razed earlier" tail) |
| 4 | huvudbudskap_syfte | D | A detail_as_main (method), B overgeneralisation ("alltid...oavsett"), C true_but_irrelevant (home-bathroom background, hedged) |

## Law-11 / distractor-form discipline
- **No verbatim-true distractor.** Every distractor carries one identifiable flaw. The Q4
  `true_but_irrelevant` option (C) is a *background* fact (home bathrooms ended the era), not
  a faithful thesis restatement — flaw = wrong focus/scope, verified not defensible as "best
  summary".
- **Hedge-balance (Law 10), per question, to kill the "pick the qualified one" blind route:**
  - Q1: key A hedged ("i regel", "mest i inlandsstäderna") **and** distractor B hedged
    ("tycktes") → hedge cannot select; direction must be read.
  - Q2: key C is the **confident, specific** claim (not hedged) — inverts the correlation.
  - Q3: key B ("varken...eller") **and** distractor D ("både...men") are both balanced in
    form → the both-sides shape does not identify the key.
  - Q4: key D qualified, but distractor C also hedged ("tycks") and B absolute → qualification
    does not isolate the key.
- **Length tell:** the key is **not** the longest option in any of the four questions
  (verified via mech tokenizer); ratios 1.06–1.42, far under the 5.25 cap.

## Self-blind-solve (skeptical, arguing each non-key)
Solved all four from the passage alone; exactly one defensible answer each: **Q1=A, Q2=C,
Q3=B, Q4=D.** Key letters spread A/C/B/D.
- **Q1:** stem asks *Wennbergs* result. B is Frimansson's reversed view (stycke 5), not
  Wennberg's — rejected. C absolutises past the "främst i inlandsstäderna / bara fram till"
  scope. D names the method. Only A survives.
- **Q2:** stem asks how *Wennberg* explains it. Wennberg names the budget post (C) and
  explicitly rejects "bättre byggda" (kills A). D reverses the arrow; B absolutises. Only C.
- **Q3:** stance is the "varken förhärliga...eller avfärda" of stycke 6 (B). A (rebuild) is
  never advocated; C absolutises a concession and contradicts "en verklig...tillgång till
  hygien"; D's second clause ("borde ha rivits tidigare") is unheld. Only B.
- **Q4:** whole-text span = funding-over-grandeur + read soberly (D). A=method,
  B=absolute-contradicted-by-scope, C=background fact. Only D.
- **Closest challengers examined:** Q3-D and Q4-C (each confirmed to carry a concrete,
  pointable flaw). No two-way item remained.

## Mechanical self-check (run_mech.py, full corpus)
`M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-PLAGIARISM pass`.
passage_words 801 (blueprint 750–1135; hard band 215–1260) · mean_sentence_words 20.5
(band 14–25) · 39 sentences · 8 paragraphs · option_length_ratio 1.06–1.42 (cap 5.25).

# Pass-4 verification — apply-ready fix list

## Counts

- **Verified, ready to apply**:  1,590
- **Rejected/filtered**:         124
  - fix-wrong (verifier veto):    0
  - all-caps removal blocked:     30
  - duplicate (qid, snippet):     63
  - no-op (fix == snippet):       31
  - empty final_fix:              0
  - missing context:              0
- **Cascade-risk flags in verified**: 464

## By class

- `style`: 362
- `inflection`: 328
- `wordchoice`: 324
- `malformed`: 283
- `anglicism`: 135
- `spelling`: 52
- `cascade`: 52
- `sarskrivning`: 42
- `register`: 11
- `word_choice`: 1

## Sample verified fixes (first 20)

- `host-2013-kvant1-KVA-014` [wordchoice] Spegelvändningen är inte symmetrisk i procentvillkoret → Spegelvändningen är inte symmetrisk i produktvillkoret
- `host-2013-kvant1-XYZ-006` [spelling] Om du räknar HALV cirkel istället för kvartcirkel → Om du räknar HALV cirkel istället för kvartscirkel
- `host-2013-kvant2-NOG-025` [inflection] Total − summa(övriga) = sökta värde. → Total − summa(övriga) = sökt värde.
- `host-2013-kvant2-XYZ-004` [style] Yttervinkel = summa motstående inre vinklar (här 120 = somet → Yttervinkel = summan av de motstående inre vinklarna (här 12
- `host-2013-verb1-LÄS-012` [wordchoice] är en biotrops poäng om språk → är en biologs poäng om språk
- `host-2013-verb1-MEK-024` [malformed] det skulle snarare förstärka traditionellbilden → det skulle snarare förstärka den traditionella bilden
- `host-2013-verb1-MEK-029` [malformed] dermatologi eftersom det är vanligt medicintermin. → dermatologi eftersom det är en vanlig medicinsk term.
- `host-2013-verb1-ORD-005` [inflection] 'brådstörtat avresa' = snabb avfärd → 'brådstörtad avresa' = snabb avfärd
- `host-2013-verb1-ORD-005` [wordchoice] Sammansatta bråd- + verbalt particip (brådstörtat, brådmoget → Sammansatta bråd- + verbalt particip (brådstörtat, brådmoget
- `host-2013-verb1-ORD-010` [wordchoice] Latinska 'subt-/subtil-' rotord (subtil, subtilitet, subtili → Latinska 'subt-/subtil-' rotord (subtil, subtilitet, subtilt
- `host-2013-verb2-MEK-023` [inflection] ·hög skyddsvärde· → högt skyddsvärde
- `host-2013-verb2-MEK-028` [spelling] och 'strömt lopp' (= stridt) passar inte slätt-floder → och 'stritt lopp' (neutrum av 'strid') passar inte slättflod
- `host-2013-verb2-MEK-030` [inflection] attestera = godkänna intern, inkassera = driva in extern → attestera = godkänna internt, inkassera = driva in externt
- `host-2013-verb2-ORD-005` [wordchoice] Latinska 'em-/imin-' rotord (eminent, prominent, imminens) → Latinska 'em-/imin-' rotord (eminent, prominent, imminent)
- `host-2014-kvant1-KVA-014` [spelling] Reglen är multiplikation av exponenter, inte addition → Regeln är multiplikation av exponenter, inte addition
- `host-2014-kvant1-NOG-023` [wordchoice] Hypotetisk fraktion av efterläget eller utvidgning av förelä → Hypotetisk andel av sluttillståndet eller utvidgning av star
- `host-2014-kvant1-XYZ-002` [inflection] Det minsta gemensamma multiplet (MGM) av 6 och 9 är 18 → Den minsta gemensamma multipeln (MGM) av 6 och 9 är 18
- `host-2014-kvant1-XYZ-005` [wordchoice] mer maskiner alltid bättre → fler maskiner alltid bättre
- `host-2014-kvant1-XYZ-006` [inflection] Bästa rät linje genom punkter → Bästa räta linjen genom punkter
- `host-2014-kvant1-XYZ-008` [wordchoice] en kvadrat minus en kvadrat med ANDRA INNEHÅLL → en kvadrat minus en kvadrat med ANNAT INNEHÅLL
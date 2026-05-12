# 3-pass audit merge report

## Summary

- **To Pass-4 verification (HIGH-confidence)**: 815
- **Review queue (MEDIUM-confidence)**:           499
- **Log only (LOW-confidence)**:                  86
- **Drift-dropped (stale snippets)**:             252
- **Pass-3 explicitly rejected**:                 1,275
- **Systemic patterns (≥3 instances)**:           5
- **Cascade-risk flags in Pass-4 queue**:         264
- **Qids with any flag**:                         1,094

## To Pass-4 — by class

- `inflection`: 270
- `malformed`: 187
- `wordchoice`: 159
- `anglicism`: 99
- `spelling`: 46
- `style`: 37
- `sarskrivning`: 15
- `register`: 2

## Review queue — by class

- `wordchoice`: 175
- `style`: 95
- `malformed`: 83
- `inflection`: 62
- `anglicism`: 41
- `sarskrivning`: 28
- `register`: 9
- `spelling`: 5
- `word_choice`: 1

## Top systemic patterns (≥ 3 instances)

- [style] × **16** → `undvik all-caps.` (samples: `översättning är BERIKANDE, inte utjämnande`, `Texten säger TVÄRTOM — lärarna ska få stöd`, `Det är PRAKTIKERFORSKNING — praxisnära är något annat`)
- [style] × **12** → `använd kursivering.` (samples: `läsare KONSUMERAR information`, `'såväl X SOM Y'`, `Texten avslutar i HOPPFULL ton`)
- [style] × **4** → `undvik versalisering för betoning` (samples: `det specifikt VÄRDEFULLA är arbetet med icke-digitalt material`, `Det är att fenomenet UPPTÄCKTS — inte att det blir vanligare`, `Recensenten säger TVÄRTOM — alternativet inverterar`)
- [style] × **4** → `genomgående all-caps-kodor i hela entryt.` (samples: `Tvång är YTTRE PRESS att handla; möda är INRE ANSTRÄNGNING`, `Giftig är TOXISK; eterisk är FLYKTIG`, `Mur är BYGGNADSDETALJ; gondol är BÅT`)
- [anglicism] × **3** → `kancellerar → tar ut varandra` (samples: `Det är lätt att glömma att −2x och +2x kancellerar`, `gemensamma termer kancellerar i differensen`, `De kancellerar i båda; bara konstanterna spelar roll`)

## Sample HIGH-confidence (first 30 of to-Pass-4)

- `host-2013-kvant1-KVA-014` [wordchoice] Spegelvändningen är inte symmetrisk i procentvillkoret → Spegelvändningen är inte symmetrisk i produktvillkoret (×1)
- `host-2013-kvant1-XYZ-006` [spelling] Om du räknar HALV cirkel istället för kvartcirkel → kvartscirkel (×1)
- `host-2013-kvant2-NOG-025` [inflection] Total − summa(övriga) = sökta värde. → Total − summa(övriga) = sökt värde. (×2)
- `host-2013-kvant2-XYZ-004` [style] Yttervinkel = summa motstående inre vinklar (här 120 = something + y) → Yttervinkel = summan av de motstående inre vinklarna (här 120 = x + y). (×1)
- `host-2013-verb1-LÄS-012` [wordchoice] är en biotrops poäng om språk → är en biologs poäng om språk (×1) ⚠ determiner-internal
- `host-2013-verb1-MEK-024` [malformed] det skulle snarare förstärka traditionellbilden → det skulle snarare förstärka den traditionella bilden (×1) ⚠ determiner-prefix,determiner-internal,modal-verb
- `host-2013-verb1-MEK-029` [malformed] dermatologi eftersom det är vanligt medicintermin. → dermatologi eftersom det är en vanlig medicinsk term. (×1) ⚠ determiner-internal
- `host-2013-verb1-ORD-005` [inflection] 'brådstörtat avresa' = snabb avfärd → 'brådstörtad avresa' = snabb avfärd (×1)
- `host-2013-verb1-ORD-005` [wordchoice] Sammansatta bråd- + verbalt particip (brådstörtat, brådmoget, brådis) → Drop 'brådis' or replace with another bråd-compound such as 'brådska' or 'brådsk (×1)
- `host-2013-verb1-ORD-010` [wordchoice] Latinska 'subt-/subtil-' rotord (subtil, subtilitet, subtilitera) → Remove 'subtilitera' — no such verb exists in Swedish; substitute 'subtilt' or o (×1)
- `host-2013-verb2-MEK-023` [inflection] ·hög skyddsvärde· → högt skyddsvärde (×1)
- `host-2013-verb2-MEK-028` [spelling] och 'strömt lopp' (= stridt) passar inte slätt-floder → och 'stritt lopp' (neutrum av 'strid') passar inte slättfloder (×1)
- `host-2013-verb2-MEK-030` [inflection] attestera = godkänna intern, inkassera = driva in extern → attestera = godkänna internt, inkassera = driva in externt (×1)
- `host-2013-verb2-ORD-005` [wordchoice] Latinska 'em-/imin-' rotord (eminent, prominent, imminens) → Replace 'imminens' with 'imminent' (adj., 'överhängande') or with 'eminens'. (×1)
- `host-2014-kvant1-KVA-014` [spelling] Reglen är multiplikation av exponenter, inte addition → Regeln är multiplikation av exponenter, inte addition (×1)
- `host-2014-kvant1-NOG-023` [wordchoice] Hypotetisk fraktion av efterläget eller utvidgning av föreläget → → 'Hypotetisk andel av sluttillståndet eller utvidgning av starttillståndet'. 'F (×1) ⚠ definite-form-swap
- `host-2014-kvant1-XYZ-002` [inflection] Det minsta gemensamma multiplet (MGM) av 6 och 9 är 18 → 'Den minsta gemensamma multipeln' — 'multipel' is en-gender; definite form is 'm (×1) ⚠ determiner-prefix,determiner-internal,definite-form-swap
- `host-2014-kvant1-XYZ-005` [wordchoice] mer maskiner alltid bättre → fler maskiner alltid bättre (×1)
- `host-2014-kvant1-XYZ-006` [inflection] Bästa rät linje genom punkter → Bästa räta linjen — after superlative 'bästa', the following adjective takes wea (×1) ⚠ definite-form-swap
- `host-2014-kvant1-XYZ-008` [wordchoice] en kvadrat minus en kvadrat med ANDRA INNEHÅLL → ANNAT INNEHÅLL — 'innehåll' is neuter (ett innehåll); takes 'annat' singular. (×1) ⚠ determiner-prefix,determiner-internal
- `host-2014-kvant2-KVA-014` [malformed] 355/113>3{,}1>3{,}1. Korrekt: I = 355/113 ≈ 3,1415 → Remove the broken '>3,1>3,1. Korrekt:' fragment — the author left a self-correct (×1)
- `host-2014-kvant2-XYZ-012` [wordchoice] Felflip ger w istället för z → → 'Felaktig kvotriktning ger w istället för z' or 'Att vända kvotriktningen ger  (×1)
- `host-2014-verb1-LÄS-011` [wordchoice] Det handlar om hantera algebraiska uttryck. → → 'Det handlar om att hantera algebraiska uttryck.' Missing infinitive marker 'a (×1) ⚠ determiner-prefix,determiner-internal
- `host-2014-verb1-LÄS-012` [wordchoice] författarens explicita ordnings-mening → → 'författarens explicita yttrande om ordningen' or 'författarens uttalande om o (×1) ⚠ definite-form-swap
- `host-2014-verb1-LÄS-018` [inflection] hitta recensentens egna 'i mina ögon'-formulering → recensentens egen 'i mina ögon'-formulering (×1) ⚠ determiner-internal
- `host-2014-verb1-MEK-022` [spelling] passar exakt det textens beskriver → passar exakt det texten beskriver (×1) ⚠ determiner-internal
- `host-2014-verb1-ORD-002` [inflection] Torkskåp är VÄRMEDRIVEN torkning; centrifug är ROTATIONSDRIVET → Gender mismatch: 'torkning' is en-gender → 'värmedriven torkning' (OK). But 'cen (×1)
- `host-2014-verb1-ORD-003` [inflection] I djup sömn är HELT SOVANDE; sömndrucken är HALVVAKEN → Add subject: 'I djup sömn är man helt sovande' (or 'Djup sömn är att vara helt s (×1) ⚠ definite-form-swap
- `host-2014-verb1-ORD-003` [inflection] Försovit sig är ATT VAKNAR FÖR SENT → → 'Att försova sig är att vakna för sent.' After 'att' the infinitive 'vakna' mu (×1)
- `host-2014-verb1-ORD-010` [malformed] domesticering är GRADVIS TILLBÄNJANDE till mänsklig vistelse → → 'GRADVIS TILLVÄNJANDE' (or 'GRADVIS TILLVÄNJNING'). 'Tillbänjande' is not a Sw (×1)

## Sample drift-dropped (first 10)

- `host-2013-kvant1-XYZ-008` [style] halverar volymen: \frac{12}{2}=6 … nej, 2 stämmer inte heller. 12/6 = 2 — fast g (pass3-confirmed but snippet not in current corpus)
- `host-2013-kvant1-XYZ-011` [style] x+\frac{x}{3}=\frac{4x}{3}=\frac{12x}{9}\approx\frac{13x}{3} (pass3-confirmed but snippet not in current corpus)
- `host-2013-kvant2-XYZ-005` [style] 10\cdot(-8)=-80 … nej, snarare 10\cdot 8=80 → 10^18 (av att glömma negativt teck (pass3-confirmed but snippet not in current corpus)
- `host-2013-kvant2-XYZ-005` [style] Faktiskt korrekt: 10+(-8)=2 → 10². (pass3-confirmed but snippet not in current corpus)
- `host-2013-verb1-MEK-024` [inflection] Det semantiska kontrasten (ursvensk ↔ internationellt) (pass3-confirmed but snippet not in current corpus)
- `host-2013-verb1-MEK-028` [inflection] alla fyra första ord (utrustats, förbundits…) (pass3-confirmed but snippet not in current corpus)
- `host-2013-verb2-LÄS-012` [inflection] den anmärker på dikotom tänkande. (pass3-confirmed but snippet not in current corpus)
- `host-2013-verb2-MEK-024` [inflection] och är en 1900-talsfenomen, inte ett yrke i tryckerier (pass3-confirmed but snippet not in current corpus)
- `host-2014-kvant1-XYZ-008` [wordchoice] Utvecklingen av (x+y)^{2} har en kvadrattermin 2xy mellan x² och y². (pass3-confirmed but snippet not in current corpus)
- `host-2014-verb2-MEK-029` [wordchoice] ·bedyrar· är att betyga sig högtidligt (pass3-confirmed but snippet not in current corpus)

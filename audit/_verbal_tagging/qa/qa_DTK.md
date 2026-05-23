# DTK QA — 12-item sample

Independent classification of `audit/_verbal_tagging/qa/sample_DTK.json` against the proposed `framework_id` tags.

Tactics: `app/public/frameworks/dtk_tactics.json` (DTK-TACTIC-001 … 010).

Agent priority order applied during tagging: **T8 → T4 → T9 → T1 → T10 → T7 → T5 → T3 → T2 → T6 (fallback)**.

Verdict legend: **CORRECT** = my independent pick matches proposed; **WRONG** = better tactic available; **AMBIGUOUS** = multiple defensible picks, proposed is one of them but priority order is debatable.

---

## 1. host-2022-kvant1-DTK-029 — proposed DTK-TACTIC-003

Prompt: *"Hur stor andel av försäljningsvärdet av livsmedel och drycker 2007 utgjordes av Vin inklusive cider?"*

- Triggers fired: T3 ("Hur stor andel av"), T6 (year "2007", named category "Vin inklusive cider").
- My pick: **T3**. The dominant work is verifying the right nominator/denominator pair; the year/category lookup is auxiliary.
- Verdict: **CORRECT**.

## 2. var-2013-kvant2-DTK-037 — proposed DTK-TACTIC-003

Prompt: *"Studera behandlingarna av kolik bland hästar i Svealand 2006. Hur stor andel av dessa behandlingar utfördes under de tre månader då antalet utförda behandlingar var som störst?"*

- Triggers fired: T3 ("Hur stor andel av"), T2 ("störst").
- My pick: **T3**. The student must compute andel; extremvärde-skanningen is a sub-step. Priority T3 > T2 matches.
- Verdict: **CORRECT**. (T2 also defensible; the priority bias toward andel-verification feels right here because that's where the alternativen cluster.)

## 3. var-2013-kvant1-DTK-038 — proposed DTK-TACTIC-010

Prompt: *"Studera åldersgruppen 15–24 år. Vilket år noterades det största sammanlagda antalet vårdtillfällen i sluten vård för missbruk orsakat av opiater och amfetamin med mera?"*

- Triggers fired: T10 ("Vilket år"), T2 ("största"), T7 (sum across two tables — borderline composite).
- My pick: **T10**. Hitta-året är huvuduppgiften.
- Verdict: **CORRECT**.

## 4. var-2018-1-kvant1-DTK-029 — proposed DTK-TACTIC-003

Prompt: *"Hur stor andel av kommunernas totala utgifter för kultur 2010 utgjorde utgifterna för musik- och kulturskolor?"*

- Triggers fired: T3 ("Hur stor andel av"), T6 (year "2010").
- My pick: **T3**.
- Verdict: **CORRECT**.

## 5. var-2014-kvant2-DTK-040 — proposed DTK-TACTIC-003

Prompt: *"Hur stor andel av antalet vårdtillfällen i sluten vård 2004 avsåg patienter som var 65 år eller äldre?"*

- Triggers fired: T3 ("Hur stor andel av"), T6 (year "2004"), T7 (summera tre åldersgrupper — sub-step).
- My pick: **T3**. Risken är fel nämnare (totalt i kolumnen) — exakt T3:s kärnvarning.
- Verdict: **CORRECT**.

## 6. host-2013-kvant1-DTK-031 — proposed DTK-TACTIC-008

Prompt: *"Anta att antalet beslut om miljösanktionsavgifter hade samma procentuella fördelning … år 2002 som 2004. Hur många beslut fattades i så fall av kommuner 2002?"*

- Triggers fired: T8 (prompt börjar med "Anta att", och "i så fall"). Cleanest possible T8 hit.
- My pick: **T8**.
- Verdict: **CORRECT**.

## 7. var-2023-kvant2-DTK-031 — proposed DTK-TACTIC-003

Prompt: *"År 2014 var det 234 av de verkställda avhysningarna som berörde barn. Hur stor andel av det totala antalet verkställda avhysningar 2014 berörde barn?"*

- Triggers fired: T3 ("Hur stor andel av"), T6 (year "2014").
- My pick: **T3**.
- Verdict: **CORRECT**.

## 8. host-2013-kvant2-DTK-031 — proposed DTK-TACTIC-006

Prompt: *"Hur många miljoner ton gods per hamn hanterades i Sverige år 1920 respektive 1995?"*

- Triggers fired: T6 (specific years 1920 and 1995). Weak T5 case ("per hamn" — but that's a fixed unit, not a comparative kvot-prompt).
- My pick: **T6**. Two explicit year-cells to lokalisera, sedan dela två avläsningar.
- Verdict: **CORRECT**. (Priority's T6-as-fallback default behaves sensibly here — there's no stronger trigger.)

## 9. var-2016-kvant2-DTK-031 — proposed DTK-TACTIC-010

Prompt: *"Vilket år avses? Detta år var antalet outhyrda lägenheter mindre än 70 000. Av dessa var andelen lägenheter som var utrymda på grund av förestående rivning eller annan orsak ungefär lika stor som andelen lägenheter under reparation eller ombyggnad."*

- Triggers fired: T10 ("Vilket år"), T7 (two conjoined conditions — strong real signal).
- My pick: **T10**. Frågan är fundamentalt hitta-året; T7-disciplinen är hur du filtrerar kandidaterna.
- Verdict: **CORRECT**. (Reasonable priority call. T7-as-pick would also be defensible since the cognitive bottleneck is "check BOTH conditions per year".)

## 10. host-2015-kvant2-DTK-030 — proposed DTK-TACTIC-010

Prompt: *"Vilket år noterades den lägsta halten kadmium per kilogram fosfor i slam respektive i fosforgödsel?"*

- Triggers fired: T10 ("Vilket år"), T2 ("lägsta"), borderline T5 ("per kilogram" — fixed unit, not a kvot-fråga).
- My pick: **T10**. Hitta-året huvuduppgift, extremvärde-skanning är sub-step.
- Verdict: **CORRECT**.

## 11. host-2025-kvant2-DTK-035 — proposed DTK-TACTIC-009

Prompt: *"I vilken ort slutar vägbeskrivningen? Du startar i Falköping och åker normalspårig järnväg i västsydvästlig riktning i 30 km. Därefter åker du vidare … i nordlig och därefter västnordvästlig riktning i sammanlagt 40 km."*

- Triggers fired: T9 (väderstreck, riktning, km — multiple). Textbook map question.
- My pick: **T9**.
- Verdict: **CORRECT**.

## 12. host-2017-kvant1-DTK-039 — proposed DTK-TACTIC-006

Prompt: *"Hur många vårdades för yrsel under 1990-talet?"*

- Triggers fired: T6 (named category "yrsel" anchors which stapel-serie att läsa). Decade "1990-talet" is not a single year — and there's no extremvärde, andel, anta, map, "Vilket år", filter-pair, eller förhållande-trigger.
- My pick: **T6** (fallback). The work is: pin the right series (yrsel), then sum across the decade. None of T1–T10 cleanly cover decade-summation; T6's "lokalisera entiteten innan du räknar" still applies via "yrsel".
- Verdict: **CORRECT**. The fallback handles this gracefully.

---

## Priority-order check

The priority **T8 → T4 → T9 → T1 → T10 → T7 → T5 → T3 → T2 → T6** behaved correctly across this sample:

- **T8 first**: Item 6 cleanly disambiguated — "Anta att" is high-leverage and rare, deserves top priority.
- **T9 over T10/T6**: Item 11 — map directives dominate even when years appear; correct.
- **T10 over T2**: Items 3, 10 — "Vilket år"-prompter med "största/lägsta" should classify as hitta-året, not extremvärde-skanning. Right call: T10's strategy (skanna år med villkor i bakhuvudet) subsumes T2's extremvärde-skanning för år-axeln.
- **T10 over T7**: Item 9 — borderline; T7 (two filter conditions) is a genuinely strong signal here. Both readings are defensible; T10 reasonable.
- **T3 over T2**: Item 2 — correct; the alternativen-cluster is around the andel-värdet, not the extremvärde.
- **T3 over T6**: Items 1, 4, 5, 7 — clearly right. "Andel av"-fällan (fel nämnare) is a higher-leverage warning than "lokalisera cellen".
- **T6 as fallback**: Items 8, 12 — sensible default for "specific entity, no other trigger". My priors going in were that T6-fallback might feel weak vs T2-extremvärden, but on this sample T6 catches the residual category cleanly. **T2 as a fallback would mis-fire on items like 12 where there's no extremvärde at all.** T6 is the right default.

No items in the sample triggered T1 (Identifiera … Hur/Vilk …) or T4 (procent vs procentenheter) cleanly, so those priority slots weren't exercised.

---

## Summary

DTK QA: 12/12 correct.

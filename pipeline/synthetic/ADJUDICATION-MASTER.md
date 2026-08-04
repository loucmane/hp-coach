# ADJUDICATION MASTER — hela banken (13 batcher, 87 enheter, 246 frågor)
*Genererad 2026-07-30 av adjudikationspipelinen: 13 färskögon-läsare (nyckelstrippade blad, kalla lösningar),*
*korsbatch-mönsterskanning (första läsningen någonsin av alla 87 texter sida vid sida), flagg-triage,*
*mekanisk vikning (`adjudicate_fold.py`, 70/70 tester — agenter producerar bevis, skriptet härleder rekommendationen).*

## Sammanfattning

- **Kalla lösningar: 246/246 frågor** — varje läsarsvar matchade nyckeln, över hela banken.
- **Naturlighet: 87/87 enheter** lästa som naturliga; 0 läsar-blockerare utom de två innehållsfynd nedan.
- **ÄGARBLICK: 10 enheter** (nedan). **GODKÄNN MED ANTECKNING: 77** (tabell sist; anteckningarna är
  redan-dispositionerade grindflaggor + småobservationer — inget kräver beslut).

## ÄGARBLICK — dina 10 beslut

### A. Korsbatch-KLONER (5 enheter) — skanningens huvudfynd
Samma textarkitektur återanvänd: **elf-b6-001** och **elf-b7-001** är styckesnivå-kloner av elf-b5-001
(en student som löst en löser de andra utan att läsa); **las-b6-001** klonar las-b5-001; **las-b8-001**
klonar las-b7-001 (inkl. ordagrant forskarcitat); **las-b11-001** klonar las-b10-001.
**Rekommendation: ÄNDRA** — behåll originalen, skicka de fem klonerna genom en avkloningsvåg (ny
arkitektur enligt de 14 nya mallreglerna) + omgrindning. Alternativ: godkänn ändå (schemaläggaren
separerar dem) eller avvisa+regenerera.

### B. Namnkollisioner (2 enheter) — triviala fixar
**elf-b5-002** ('Ottilie Brandt' = kemisten i elf-b5-001, samma batch); **las-b10-002** ('Ingrid
Salomonsson' vs 'Ingeborg Salomonsson' i las-b10-001). **Rekommendation: ÄNDRA** (byt ett namn per
enhet, mekanisk omgrind — inga designändringar).

### C. Ämnespar (1 enhet)
**las-b3-002** argumenterar nattågsfrågan på samma axel som elf-b3-002 (samma batch, båda språken) —
ELF-texten skänker studenten LÄS-textens argument. **Rekommendation: GODKÄNN med schemaläggar-regel**
(servera aldrig båda nära varandra) eller ÄNDRA (omtopica en senare).

### D. Läsarfynd (2 enheter) — färska ögon hittade det grindarna missat
**elf-b8-001**: texten §2 motsäger sig själv (ostron-nacre-påståendet) och Q2:s nyckel reproducerar den
omöjliga satsen — **Rekommendation: ÄNDRA** (textreparation + omgrind, samma recept som tidigare vågor).
**las-b2-003**: en tredje oberoende läsare anser fortfarande att fråga 1 har två försvarbara svar
('bäst'-stammen). Enheten är tvåfaldigt reparerad och fyra blindlösare valde nyckeln — **din blick
avgör**: godkänn (corpus-autentisk 'bäst'-konstruktion) eller ÄNDRA (tredje redesign av fråga 1).

## Korsbatch-fynd för FRAMTIDA generering (14 mallregler)
Se `adjudication/cross-batch-report.md` — bl.a. frasblocklista, namn/plats-register, varierad
skeptikerplats, könsrandomisering av forskare/utmanare, titelformkvot, kloze-gap-randomisering.
Dessa blir generatorlagar 12–15 inför parity-marschen.

## Svarsinstruktion
Svara t.ex.: **'godkänn enligt rekommendation'** (= 77 godkända nu; kloner+namn+elf-b8-001 till
ändringsvåg; las-b2-003 och las-b3-002 enligt rek ovan) — eller override per enhet.

## GODKÄNN MED ANTECKNING (77)

| enhet | främsta anteckning |
|---|---|
| elf-b1-001 | Q4 option D (scores rising simply from being tested twice) is a real-world plausible alternative, bu |
| elf-b1-002 | Gap (4) sits in a clause that already said “Margins are narrow” two clauses earlier, so “its slim ma |
| elf-b1-003 | “Venn calls the arrangement eavesdropping on someone else’s dinner bell” presents a coined phrase wi |
| elf-b1-004 | The incentive logic is stated plainly in the second sentence, so the correct option is reachable wit |
| elf-b10-001 | Prose reads as high-quality British-register feature journalism; sentence rhythm and vocabulary are  |
| elf-b10-002 | Cloze unit. Each gap has exactly one option that fits both sense and collocation; the three foils in |
| elf-b10-003 | Short single-question unit. The passage pre-empts each wrong answer explicitly (weight in A is denie |
| elf-b10-004 | Short single-question unit. The Hallvik example is constructed so that all three competing explanati |
| elf-b11-001 | Register is markedly literary for ELF — long periodic sentences ('A cumulative list is a ratchet', ' |
| elf-b11-002 | The closing sentence ('The flourish she expects to survive: a scrawl dragged across a courier's scre |
| elf-b11-003 | The foam-lined tray is introduced as an explicit aside ('though that is a separate problem'), which  |
| elf-b11-004 | Option C ('money set aside for enrichment is quietly being spent on ordinary keeping duties') is a g |
| elf-b12-001 | Q4 asks for the writer's attitude, but the concession-and-limit structure is voiced mainly through F |
| elf-b12-002 | Gap 2 is the one that takes a moment: 'Naturally' wins on discourse logic (introducing the received  |
| elf-b12-003 | Distractor A is well-built: it lifts the passage's closing exception (brick/ash/sand) and misstates  |
| elf-b12-004 | Option D is a good over-reach trap: Steinvik explicitly declines to call the patterns decorative, so |
| elf-b13-001 | q:1 option D says the mark covers 'about two thirds of the pans'; 212/340 is 62.4%, slightly under t |
| elf-b13-002 | Gap 4: 'uneventful' exerts mild pull, but 'not the language of a comfortable ritual' pins 'untrouble |
| elf-b13-003 | Single-question unit; the inference distance is right — C restates 'buys tolerance' / 'no margin' wi |
| elf-b13-004 | Option D is a well-built direction-reversal distractor (inwards vs outwards, softening vs stiffening |
| elf-b2-001 | Reads as polished long-form science journalism; no self-contradictions on a careful second pass. The |
| elf-b2-002 | Cloze passage reads as competent broadsheet prose; each gap has enough local and paragraph-level con |
| elf-b2-003 | Short single-question unit; the mechanism (crack tears capsule, slurry seeps out, reacts with moistu |
| elf-b2-004 | Dense but well-controlled historical prose; the argument is built from three placed facts (the ledge |
| elf-b3-002 | Fluent broadsheet-columnist English; the argument arc (decline, revival, economist's caveat) is cohe |
| elf-b3-003 | Compact and technically coherent: laser pulse, backscatter off flaws in the glass, nanometre-scale s |
| elf-b3-004 | Convincing county-history register; "a Doctor Aldous Frane" is period-appropriate rather than an art |
| elf-b4-001 | Q1 option C ends '…though only a raised wreck can be studied', which sits in mild tension with the p |
| elf-b4-002 | Gap (5) has an echo trap: 'seam' is used earlier in the same paragraph ('a thin seam of high-value g |
| elf-b4-003 | Short single-question unit; the stem is answerable from one sentence ('what set the steadiest perfor |
| elf-b5-001 | The researcher here is 'the glass chemist Ottilie Brandt'; a historian with the identical name (Otti |
| elf-b5-003 | The aside 'on unheated — but far from cold — loading docks' is the densest phrase in a short text; i |
| elf-b5-004 | 'the sensor reversed barely one call in thirty' leaves the denominator implicit — one in thirty of a |
| elf-b6-002 | Very clean English; the 'the tide is free, but the boat is not' line lands well and the closing sent |
| elf-b6-003 | Short single-question unit; period vocabulary (draper's, day-books, to let) is contextually recovera |
| elf-b6-004 | Tight and well-paced; the three-sentence opening ('The forecasts proved good. The losses barely move |
| elf-b7-002 | Well-constructed piece: the opening 'looks like its own explanation' frame is paid off by the closin |
| elf-b7-003 | Short unit, tightly written; the 'force a grip' vs. 'only invite one' contrast is stated in a single |
| elf-b7-004 | The counterintuitive mechanism ('tall grass hides an approaching fox or hawk from the birds, not the |
| elf-b8-002 | Gap (5): 'collapsed' and 'lapsed' are both grammatical in the slot; I settled on 'lapsed' because th |
| elf-b8-003 | Short single-question unit; the text states the aim explicitly ('He wanted the guest's credential to |
| elf-b8-004 | The passage explicitly pre-empts distractor B ('A tyre almost never passes directly over the painted |
| elf-b9-001 | Long and dense for an ELF passage (~900 words of literary-journalistic British English), but every s |
| elf-b9-002 | Gaps (1) and (2) sit close together in the opening two sentences, so the reader has to hold two blan |
| elf-b9-003 | Single-question mini unit, fully self-contained: the passage states the mechanism (light thrown back |
| elf-b9-004 | The question asks for two things at once ('how gently it stops a falling head, judged against the ta |
| las-b1-001 | “överröstar” (a verb of sound) is used of light drowning out the horizon glow; the metaphor works bu |
| las-b1-002 | The headline is repeated as the first line of the passage body; this matches real HP layout, but dup |
| las-b1-003 | Same title-repeated-in-body duplication as las-b1-002. |
| las-b10-001 | Long LAS unit. Swedish is idiomatic and consistently held in a kulturskribent register; period vocab |
| las-b10-003 | Short opinion piece; the Swedish is idiomatic and the closing two-sentence turn ('De blir bra av att |
| las-b11-002 | Fråga 1 alternativ D handlar om chattgrupperna och inte om frågans premiss (fysiska träffar); det är |
| las-b11-003 | Fråga 1 kräver att man tar med gruppstorleksförbehållet ('Men skillnaden fanns bara i grupper om hög |
| las-b12-001 | Q1 option C compresses 'inte redan hade något högt att se upp mot' into 'där staden i övrigt var låg |
| las-b12-002 | Q1's distractors map neatly onto three misreadings (reversed causality, over-generalized scope 'cent |
| las-b12-003 | Q2 option D says the homework measures hemmets förutsättningar 'lika mycket som' elevens insats, whi |
| las-b13-001 | q:1 hinges on mapping 'ligger fritt mot söder' to option B's 'solbelysta sträckor' — a fair paraphra |
| las-b13-002 | Clean separation between Sturk's finding (q:1) and the essayist's own stance (q:2); the 2004/2021 qu |
| las-b13-003 | q:1 option C is the strongest distractor in the unit — it supplies the causal story the author consp |
| las-b2-002 | Idiomatisk och levande svenska genomgående; debattartikelformen är konsekvent hållen, inklusive sign |
| las-b3-001 | Idiomatic, well-paced Swedish popular science; idioms ("runnit ut i sanden", "bränna sina fingrar",  |
| las-b3-003 | Clean, natural Swedish; the design is stated well enough to be checkable (half the offices got pink  |
| las-b4-002 | 'Det blev tvärtom' in the opening slightly overstates what the article actually settles on — the con |
| las-b4-003 | 'Ett mönster steg fram' — 'trädde fram' or 'framträdde' is the idiomatic collocation; 'steg fram' re |
| las-b5-001 | Talet trettiofyra dyker upp både som hela materialet ('gick igenom kassaböcker ... från trettiofyra  |
| las-b5-002 | Vinterräkningen går inte riktigt ihop vid noggrann läsning: Ahlgren 'lät under tre vintrar mäta halt |
| las-b5-003 | Fråga 2 (B) bygger på ett påstående som texten faktiskt medger ('En professionell mätstation ger för |
| las-b6-002 | Clean, confident opinion-piece Swedish; the title, the concession paragraph ('Det ligger något i det |
| las-b6-003 | Elegant essayistic Swedish; 'Det var som om handen såg en lösning som pennan aldrig fick syn på' is  |
| las-b7-001 | Idiomatisk och välskriven svenska genomgående; ordval som 'hemmansägare', 'utsocknes', 'mantalsskriv |
| las-b7-002 | Läser som en äkta debattartikel: tes, konkret exempel (Ringleden), expertröst, medgivande av motargu |
| las-b7-003 | Personlig essä med tydlig linje: mormoderns regel, allemansrätten som tyst överenskommelse, mötet vi |
| las-b8-002 | 'i vad de gör när marken blöter ner' skaver: 'blöta ner' är transitivt på svenska (man blöter ner nå |
| las-b8-003 | Välskriven debattext med tydlig disposition: kartläggning, egen position, motargument, slutsats. Sve |
| las-b9-001 | Idiomatic, well-controlled Swedish throughout ('Att kalla en sådan uppskattning ett mått är att ta i |
| las-b9-002 | The opinion piece signposts its own thesis unusually plainly ('Min invändning gäller inte att kommun |
| las-b9-003 | Arithmetic and hedging are internally consistent: 96 inventoried, 32 still correct, 27 of those at f |

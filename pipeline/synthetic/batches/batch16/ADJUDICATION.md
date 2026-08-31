# Batch 16 — adjudikationspaket (2026-08-26)

**7 enheter / 20 frågor.** Formen är densamma som i batch15 — LÄS 4+2+2 och ELF 5+5+1+1 —
men vägen hit är det inte: batch16 är den första P5-batch som behövde **tre rundor**. Alla
sju skrevs under `BRIEF-ADDENDUM.md`, den bindande fälllistan som samlar varje grindfällning
och ägarflagga från batch 1–14, och batch16 är dessutom den första batchen som skrivits under
ägarpolicyerna från 2026-08-26: **bankövergripande förnamnsunikhet** (regel 8) och
**deklarerad hedge-balans** (regel 10).

## Sammanfattning

**Vägen hit — tre rundor, noll grindkills.**

- **Runda 1** gav **3 PASS utan reparation** (elf-b16-001, elf-b16-004, las-b16-001) och
  **4 V-FINAL-refutationer**: elf-b16-002 (passagen intygade att svaret var rätt och
  föreslog en mening senare att erkänna okunskap som alternativet), elf-b16-003 (nyckeln var
  det enda vindbärande alternativet mot en stam vars hela ram är vinden), las-b16-002 (en
  originalitetsuppgift som en enda `grep` falsifierar bar hela namnbeslutet), las-b16-003
  (q:2 fortfarande blindlösbar ur q:1:s stam plus alternativform). **Grindflottan dödade
  ingen enhet i någon runda** — alla fyra fällningarna kom från metagranskningen.
- **Runda 2** löste in alla fyra biljetterna, men rundan reste **tre nya håll**:
  **las-b16-001** fick **INCONSISTENT** i den integrerade granskningen (kronologin —
  magasinsväggen daterades av passagens egen aritmetik till 1879, fem år före den ringugn
  vars kammareffekt är hela stödet för q:2:s nyckel); **las-b16-002** fick en **REFUTERAD**
  metagranskning med två majors (runda 3:s egen stängning av G-STEM-flaggan var falsk mot de
  byte runda 3 själv installerade); **elf-b16-003** fastnade på en **kraschsöm** —
  `reviews/pedagogy.jsonl` hade åtta rader men bara sex enheter, elf-b16-004 och las-b16-003
  dubblerade, så det alternativset som en pedagogik-MAJOR hade tvingat fram omskrivning av
  granskades aldrig av den etapp som äger blindlösbarheten. Blockeraren bokfördes av
  reparationsagenten själv, i dess egen `not_done`.
- **Runda 3** reparerade alla tre, körde en **full benvåg** på dem och utfärdade tre
  **omgjorda metagranskningar**. **Noll kills någonstans.**

**Blindlösning: 174/174 över tio unika ben.** G-KEY kördes med två ben i flottan och två i
V-FINAL i vardera runda 1 och runda 2 (fyra ben × 20 svar = 80 + 80), plus två färska ben i
runda 3 över de sju omlagda frågorna (14 svar). **Varje avgivet blindsvar matchade nyckeln**
— i varje ben, i varje runda, på varje fråga, före och efter varje reparation. Räkningen är
gjord på ben, inte på filer: `*-resolved*`-filerna är sammanslagningar av rundans två ben,
`*-1v`/`*-2v` är samma ben med `vote`-fältet påfört, och
`verdicts-vfinal/verdicts-gkey-zr3.jsonl` är **byteidentisk** med
`verdicts-r3/verdicts-gkey-resolved-v.jsonl`. Utöver flottan cold-solvade de tre omgjorda
metagranskningarna sina enheter självständigt, med varje icke-nyckel aktivt försvarad först:
**7/7 mot nyckeln** (las-b16-001 4/4, las-b16-002 2/2, elf-b16-003 1/1).

**Runda 3:s benvåg (`verdicts-r3/`).** G-KEY 14/14. G-DISTRACTOR 7/7 pass, noll fynd.
G-SPRÅK tre körningar × två enheter med `target: unit` i stället för `passage` — **noll
fynd**, och därmed har de två ombyggda svenska alternativsträngarna äntligen lästs av ett
språkben. G-ENG en körning på elf-b16-003, pass. G-STEM tre flaggor, noll pass — alla tre
självförsvarade av grinden som *flag, inte kill*.

**Kanoniskt aggregat (`report-final.json`): 5× SURVIVED_FLAGGED, 2× SURVIVED_CLEAN, 0 DEAD,
0 INCOMPLETE.** Sammanslagna `verdicts.jsonl` bär 157 poster: G-STEM 10 pass / **10
flaggor**, G-SPRÅK 11 pass / 4 flaggor, G-REGISTER 6 pass / 1 flagga, G-DISTRACTOR 20/20
pass, G-ENG 13/13 pass, mekanik 35/35.

**Kanonisk mekanik: 35/35** — M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM.
**M-ECHO ingick inte i flottkörningen** (samma lucka som batch15), och körningen är daterad
12:47, alltså före tre av de sju skeppande filerna. → **ÄGARBLICK 8a**

**Metagranskning: 7× CONFIRMED_NOTES.** Noll majors på någon enhet; 35 fynd totalt, alla
inom det bindande severity-kontraktet {minor, note, info}. Tre av de sju är **omgjorda**
(elf-b16-003, las-b16-001, las-b16-002, alla daterade 2026-08-26) och bär dispositionerna,
de självständiga cold solves, källverifieringarna och lag 16-omkontrollerna.

**Vikning: 7× VERIFIED_NOTES. Promote: 7 PASS / 0 HOLD.**

**Skeppningsintegritet, maskinkontrollerad.** Jag har jämfört alla sju enheters `blind/`-,
`stems/`- och `distractor/`-ark mot `candidates-final/` sträng för sträng: **passage, stam,
samtliga alternativtexter och nyckel är byteidentiska i alla 21 jämförelserna.** Passagerna
och frågorna nedan är injicerade ur `candidates-final/` — de är skeppningsbyten, inte en
avskrift.

## Dina beslut ligger sist — åtta stycken

1. **Stance-kompositionskanalen på las-b16-002** — metagranskningen dömer den TOLERABEL på
   en empirisk korpusmätning (5 av 8 autentiska LÄS-hållningsfrågor bär samma skevhet) och
   **ber om att domen lyfts till bankpolicy**. Det är din policyfråga, inte enhetens.
2. **mech:s `_ABSOLUTIZERS`-lucka** — `none` finns i listan, `nothing` saknas. Verifierat i
   grindkällan. Att laga den är en grindändring med egen körning.
3. **Quennerby / Quennerly** — korsbatch-närpar, en bokstav isär, utan skriven disposition.
4. **las-b16-002 F2 och F4** — stycke 6:s ytstöd för distraktor C (buret, ej åtgärdat) och
   det ärliga blindgolvet 1-på-2 i värsta fall.
5. **elf-b16-003** — en levande G-STEM WORLD_KNOWLEDGE-flagga och en levande
   G-REGISTER-genremajor, båda dispositionerade SHIP i metagranskningen. Bekräfta eller
   upphäv.
6. **Layer-2-renderspecen** — snake_case-etiketter, ordet *hedgat* och grindinterna
   heuristiksektioner i rationalfältet. Bankövergripande: 112 av 114 enheter.
7. **Lag 16 kördes degraderat igen** (Exa-eran). Två enheter fick färska omkontroller med
   positiv kontroll; fem fick ingen.
8. **Batchövergripande processluckor** — M-ECHO, mekanik före skeppningsbyten, sju
   dubblettposter i `verdicts.jsonl`, ett föråldrat citat i aggregatet, en ologgad skeppad
   reparation, två burna runda-1-poster, en flagga vars blindval landar på fel svar, och
   tre levande G-SPRÅK-minorer på samma mening.

Allt annat i listorna nedan är redan dispositionerat och kräver inget beslut.

---

## elf-b16-001 · ELF · Smoke in the Skins
*Grind:* SURVIVED_FLAGGED · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* MINOR_NOTES ·
*final_verify:* VERIFIED_NOTES · *metagranskning:* CONFIRMED_NOTES (0 major / 5 minor)
*Runda 1:* PASS utan reparation — enheten har **ingen `repair_log`**, och dess elevriktade
byte är oförändrade sedan runda 1 (bara Q4:s WHY-KEY-rationale rördes) ·
*familj:* smoke-taint-volatile-phenol-glycosides-science-journalism-long

**Flaggor och öppna poster**
- [G-STEM q:1 · `verdicts/verdicts-gstem.jsonl`] PARTIALLY, blindval **null** (lutar B/D).
  "Domain knowledge of smoke taint eliminates A and C passage-blind: volatile phenols are
  bound as glycosides inside the berry, so hosing the fruit is documented as ineffective.
  B and D remain substantive and the passage still decides between them, so this is
  world-knowledge answerability, not a structural leak."
- [G-STEM q:2 · `verdicts/verdicts-gstem.jsonl`] WORLD_KNOWLEDGE, **blindval A — och nyckeln
  är D.** "Standard smoke-taint viticulture: leaves absorb volatile phenols and translocate
  them to the bunches, so A is pickable without the passage." Runda 1:s ben läste samma
  uppgift åt **motsatt** håll ("leaf-uptake studies … report … little translocation to the
  bunches, so a domain reader leans D"). Ett blindval som landar på en distraktor är en
  missfyrning, inte en läcka — men flaggan bärs vidare till `report-final.json` som en levande
  major utan att någon etapp skrivit ned motsägelsen. → **ÄGARBLICK 8e**
- [G-STEM q:3 · `verdicts/verdicts-gstem.jsonl`] WORLD_KNOWLEDGE plus en partiell formtell,
  blindval C (= nyckeln). "B is the only absolute ('always') and D is a sweeping dismissal of
  the panel, both eliminable test-wise; domain knowledge that the ashy finish is partly
  generated in-mouth by salivary hydrolysis of glycosides then selects C. Form alone still
  leaves A vs C undecided, so flag, not structural leak." — q:4 och q:5 är rena pass.
- [G-DISTRACTOR q:4 · `verdicts-vfinal/verdicts-gdistractor.jsonl`] ARGUABLE på alternativ C,
  ej dubbelnyckel. "a reader who weighs the ending can build a neutral-journalist case. It is
  beatable: the writer states his own verdict verbatim in the third paragraph, 'She is right
  about that.' … Attractive but not complaint-worthy; the key remains clearly best." Enda
  G-DISTRACTOR-flaggan i hela batchen; alla 20 flottposter är pass.
- [metagranskning · `audits/elf-b16-001.json`] minor (utmanar *pedagogy*): Q3 är deklarerad
  som slutledningsuppgift (ELF-TYPE-002) men nyckeln återger ett påstående passagen gör rakt
  ut **en mening innan** oenigheten ens introduceras, och stammens premiss — panelens
  oenighet — gör inget arbete i urvalet. WHY-KEY argumenterar dessutom för ett vidare
  påstående ("mouths differ") som alternativ C inte innehåller.
- [metagranskning · `audits/elf-b16-001.json`] minor (utmanar *language*): verdictet höjdes
  från CORRECTED (runda 1) till CLEAR (runda 2) på en Q2 som **inte ändrades**, och Q2 bryter
  fortfarande mot addendum regel 5:s "options ≤8 words" — nyckeln D är nio ord, en brist som
  enhetens egen rationale skriver ut i klartext. Enheten har därmed ingen regel 5-konform
  kortandad fråga: övriga alternativrader ligger på 12–17 ord.
- [metagranskning · `audits/elf-b16-001.json`] minor (utmanar *pedagogy*): `key_letters`
  intygar "the key is never the strict-longest option in any of the five questions
  (M-TELL 0/5)". Under **ordräkning** är det falskt i Q2 (A/B/C = 8 ord, nyckeln D = 9).
  Under teckenräkning är C längst, vilket är varför den mekaniska grinden gav pass.
  Självcertifikatet togs för gott två gånger.
- [metagranskning · `audits/elf-b16-001.json`] minor (utmanar *integrated*): den mening Q4:s
  nyckel hänger på — Quennerlys "a reading that contradicts it should give way" — är tvetydig
  i sin närmaste kontext (en avvikande provsmakares poäng mot ett laboratorievärde), och både
  Q3:s och Q4:s rationaler tar tyst laboratorieläsningen. Nyckeln överlever: skribenten själv
  levererar laboratorieläsningen i nästa mening.
- [metagranskning · `audits/elf-b16-001.json`] minor (utmanar *integrated*): **två runda-1-poster
  överlever ordagrant** in i skeppade byte, utan att runda-2-protokollet bär någon
  notpayload som visar att de adjudicerades snarare än missades. → **ÄGARBLICK 8d**
- [`ASSEMBLY.md` flagga] **korsbatch-närpar utan disposition:** batch15 skeppar *Verity
  Quennerby*, denna enhet skeppar *Tamsin Quennerly*. G-REGISTER gav pass med noll fynd i
  båda rundorna. → **ÄGARBLICK 3**

### Text

The fires came down the range in the third week of January, and by Saturday half the growers in the district had sprinklers running along the rows. Ash lay on the leaves in grey drifts, the fruit was a fortnight from picking, and hosing a dirty thing clean is what anybody would try. Corin Pemberdine, who runs the laboratory most of them use, made a trial of it: two blocks washed down, two left alone, all four picked and fermented in the same shed that afternoon. It made no difference. One washed lot even read a little higher than the block beside it, though Pemberdine will not build on a single pair. By then there was nothing on the outside of a berry left to wash off.

Wood smoke carries a family of small molecules called volatile phenols – guaiacol and the cresols among them – set free when the lignin in the wood comes apart in the heat. They cross the waxy skin of a grape within hours. Once they are inside, the berry joins a sugar to each one, as it does with other foreign compounds, and the result is a glycoside: odourless, and unable to evaporate. Most of it stays in the skin. Pemberdine puts the window at a day or two. After that the fruit carries its smoke in a locked form, and what a nose can find in the juice is a small remainder. Four weeks after the fires his laboratory was finding nine parts bound for every part free. Leaves take the phenols up too, but what a leaf takes up stays in the leaf. They matter only when they reach the fermenter with the grapes, which is why the district picks by hand after a fire.

That is the awkward part for anyone judging affected fruit by nose. Tamsin Quennerly, who runs a tasting panel of twenty-four, describes January wines that gave the nose very little and then turned dry and ashy half a minute after they were swallowed. The sugar comes off in the mouth. Enzymes in saliva, and the bacteria alongside them, cut the phenol loose, and it reaches the nose from behind, after the glass has been put down. Her panel does not agree with itself about how much of it there is. Six of the twenty-four mark the ashy finish harder than the rest, year after year; one tasted the worst lot of the vintage and called it clean. Quennerly is untroubled by the spread. “The median is the only figure that has ever predicted what a drinker will say,” she says, “and a reading that contradicts it should give way.” She is right about that. The January readings were unremarkable and the January wines were not.

Two other rules of thumb have not survived either. Growers were told for years that smoke before véraison did not count, until a season in which fruit smoked a fortnight before the colour turned produced wine that the panel marked down. The advice has been withdrawn, though the weeks after véraison are still the worst time to be downwind. Thickness of smoke is no guide either. Pemberdine’s instruments logged the particulate load hour by hour, and that record does not follow what turned up in the fruit. “A number tells you the fruit met smoke,” he says. “It does not tell you what the wine will be.” There is also a delay nobody has an answer for. Acid works slowly on a glycoside, so a wine can pass at bottling and be ashy at eighteen months. Two of the January reds have done exactly that.

What the district does now is small and unglamorous. Growers ferment five kilograms from each block in a shed the week before picking, and taste it warm out of a jar, because ten days of that is the shortest honest test anybody has. It is the sensible answer, and it is still too slow for a fire that comes in the last fortnight. Pemberdine wants a threshold a grower could act on sooner. Quennerly thinks any threshold will be wrong in both directions, and would spend the money on more tasters. Forty tonnes went on the ground in March, on a reading and a nervous buyer. Nobody will now find out what that fruit would have made.
– Rhodri Kettlestrand, staff writer

véraison = the point in the season when grapes change colour and begin to ripen in earnest
glycoside = a compound formed when a sugar is joined chemically to another molecule

### Fråga 1

What are we told about the blocks that were hosed down?

- **A.** Hosing removes some of the smoke if it is done within a day of a fire.
- **B.** Their wine was no different, and one of them measured slightly higher than its neighbour. **◀ NYCKEL**
- **C.** Their fruit held less of the smoke compounds, though the wine tasted much the same.
- **D.** Pemberdine put the higher of the two washed readings down to ash blown back onto the bunches.

### Fråga 2

What are we told about the leaves of the vines?

- **A.** They carry the phenols through to the bunches.
- **B.** They release the phenols again as they dry.
- **C.** They are stripped off before a smoke-affected harvest.
- **D.** They take up the phenols and keep them there. **◀ NYCKEL**

### Fråga 3

What is implied by the disagreement inside Quennerly’s panel?

- **A.** The six who mark hardest are more sensitive to smoke in the air than the rest.
- **B.** An ashy finish belongs to the wine alone, and a trained taster will always find it.
- **C.** Some of the ashy finish is made in the taster’s own mouth, not the glass. **◀ NYCKEL**
- **D.** Panels of this kind cannot be trusted, and the laboratory should decide instead.

### Fråga 4

What is the writer’s attitude towards the laboratory readings?

- **A.** He backs the panel outright where its verdict and a reading disagree. **◀ NYCKEL**
- **B.** He shares the chemist’s hope that a workable threshold will soon be found.
- **C.** He sets the two positions side by side and leaves the choice to the reader.
- **D.** He treats the testing as an expense the growers would be better off without.

### Fråga 5

What is this text mainly about?

- **A.** The trial in which some blocks were hosed down after the fires and others left alone.
- **B.** How grapes store smoke in a form the nose cannot find, and what that costs growers. **◀ NYCKEL**
- **C.** How the phenols in wood smoke are formed when the lignin in a log breaks down.
- **D.** The losses that fire seasons impose on growers and the arguments with buyers that follow.

---

## elf-b16-002 · ELF · Past the Brewery *(cloze, 5 luckor)*
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* MINOR_FIXES · *integrated:* MINOR_NOTES ·
*final_verify:* VERIFIED_NOTES · *metagranskning:* CONFIRMED_NOTES (0 major / 2 minor)
*Runda 1:* **V-FINAL REFUTED** (1 major, 3 minor) → reparerad i runda 2 + rationalrättelser i
runda 3 · *familj:* ELF-CLOZE-001 / landmark-directions-etiquette-society-commentary-cloze

**Flaggor och öppna poster**
- **Noll grindflaggor i båda rundorna.** mech 5/5, G-KEY 4 ben (20 avgivna svar, alla rätt),
  G-ENG 3 ben utan ett enda fynd, G-STEM 5/5 pass, G-DISTRACTOR 5/5 pass, G-REGISTER pass.
  Enhetens fällning och korrigeringar kommer alltså enbart från granskningsstegen.
- [V-FINAL runda 1 · `audits-round1/elf-b16-002.json`] **REPARERAD — MAJOR, passagen motsade
  sig själv en mening isär.** Fällningen: stycke 3 intygade att svaret var rätt ("because the
  answer was never wrong") och erbjöd i nästa mening "Admitting to not knowing" som det
  alternativ som skulle ha sparat samma tjugo minuter — men ingen i passagen saknar kunskap,
  så gångjärnet vilade på en premiss texten redan förnekat, och klausulen efter ("the town
  will take being wrong over being thought cold") hade ingen betydelse av *wrong* kvar att
  peka på.
  > **Före:** "The cost is duller and is paid one person at a time: twenty minutes, a wrong
  > turning, and the same answer at the same corner, because the answer was never wrong.
  > **Admitting to not knowing** would have cost nothing and saved the twenty minutes."
  > **Efter (skeppad text):** "The cost is duller and is paid one **asker** at a time: twenty
  > minutes, a wrong turning, and the same answer at the same corner, because the answer was
  > never wrong **where it was given**. **Half a sentence about what the landmarks are now**
  > would have cost nothing and saved the twenty minutes."
- [`repair_log` runda 2] tre följdreparationer i samma ticket, alla utanför elevtexten eller i
  rationaler: q2-rationalens påstående att engelskan har **ett** verb som tar kvalitetsadverb
  i den figurativa betydelsen ("wine travels badly") skrevs om till ett jämförande påstående
  om just de fyra alternativen; `typography_note` rättades (det fanns ett andra U+2013 i
  `key_letters`); `originality_note` fick en daterad CORRECTION om att sökloggens post (1)
  citerade en *people search* på det **förkastade** namnet *Kester Ollerby* som stöd för en
  slutsats om *Kester Orrenshaw*. **Ingen luckmening, inget luckord, ingen alternativtext och
  ingen nyckelbokstav rördes** — alla fem luckor och deras alternativset är byteidentiska med
  runda 1, och nyckelsträngen D / B / C / A / B står orörd.
- [`repair_log` runda 3] fyra rationalrättelser efter pedagogikens MINOR_FIXES, retroaktivt
  loggade eftersom de gjordes mellan `candidates-corrected/` och `candidates-final/` utan
  loggrad vid tillfället. Bytediff före tillägget: **exakt två ändrade löv**, båda rationaler.
- [metagranskning · `audits/elf-b16-002.json`] minor (utmanar *integrated*): **en söm som
  reparationen själv lämnade efter sig.** Den lagade motfaktiskan handlar om att **lägga till**
  en halv mening, medan den orörda meningen efter den handlar om **att inte svara**
  ("a shrug is heard as ___(3)___"). *Though*-vändningen bärs nu av läsarens slutledning i
  stället för av texten. Rör ingen nyckel: lucka (3) låses av "thought cold" i samma mening
  och lucka (4) av det kausala förhållandet till "an answer is always produced".
- [metagranskning · `audits/elf-b16-002.json`] minor (utmanar *pedagogy*): q4-glosan påstår att
  "all four options are formal sentence-initial adverbs of the same class", men *Conceivably*
  är ett epistemiskt hållningsadverb, inte en konnektiv — vilket samma rationale själv säger
  tre meningar senare, och vilket `gap_type_map`:s etikett "connective" inte täcker.

### Text

Ask anyone on the high street here where the swimming baths are, and you will be sent past the old brewery, left at the chemist, and on until the road bends at the bus station. The brewery has been eleven flats since 1998. The chemist moved to the retail park and the unit is a barber’s. Only the bus station is still a bus station. None of it is offered apologetically, and none of it slowly: the whole set arrives in one breath, and the person answering has moved off before the last turning is out of their mouth. Naming a shop that shut before the asker was born is second ___(1)___.

The practice gets read as carelessness, or as fondness for a town that no longer exists. The landmarks are not picked for visibility; they are the points at which the person speaking has turned for thirty years. The route therefore comes out in the right order while the names on it stay private. Directions built like this ___(2)___ badly. Passed to a second stranger, they keep their shape and lose their meaning. Almost every set ends with the same warning: if you reach the river, you have gone too far. That sentence asks nothing at all of whoever hears it.

The usual complaint is that the habit is sentimental. It is not. Nobody names the brewery fondly; anyone asked will tell you the beer was bad. The cost is duller and is paid one asker at a time: twenty minutes, a wrong turning, and the same answer at the same corner, because the answer was never wrong where it was given. Half a sentence about what the landmarks are now would have cost nothing and saved the twenty minutes. Here, though, a shrug is heard as ___(3)___, and the town will take being wrong over being thought cold. ___(4)___, an answer is always produced, and it comes at the speed of a reflex.

A shopkeeper near the level crossing, asked for the baths four or five times a week, now comes out onto the pavement and points. It works, and nobody else has copied it. Most visitors take all this in their ___(5)___; a few go home with something to say about the place. The pointing arm goes back inside when the shop gets busy.
– Kester Orrenshaw, from a monthly column on English towns

### Fråga 1 — lucka (1)

- **A.** juncture
- **B.** fixture
- **C.** texture
- **D.** nature **◀ NYCKEL**

### Fråga 2 — lucka (2)

- **A.** commute
- **B.** travel **◀ NYCKEL**
- **C.** journey
- **D.** migrate

### Fråga 3 — lucka (3)

- **A.** docility
- **B.** futility
- **C.** hostility **◀ NYCKEL**
- **D.** civility

### Fråga 4 — lucka (4)

- **A.** Consequently **◀ NYCKEL**
- **B.** Conceivably
- **C.** Conversely
- **D.** Concurrently

### Fråga 5 — lucka (5)

- **A.** gait
- **B.** stride **◀ NYCKEL**
- **C.** pace
- **D.** step

---

## elf-b16-003 · ELF · Open Joints *(kort, 1 fråga)*
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* SOUND · *integrated:* MINOR_NOTES ·
*final_verify:* VERIFIED_NOTES · *metagranskning:* CONFIRMED_NOTES (0 major / 8 poster: 2 minor,
3 note, 3 info)
*Runda 1:* **V-FINAL REFUTED** → reparerad · *Runda 2:* **V-FINAL REFUTED igen** + kraschsöm
(ingen pedagogikpost fanns) → reparerad i runda 3 med full benvåg och omgjord metagranskning ·
*familj:* ELF-TYPE-001 / cavity-wall-open-joint-drainage-wind-pressure-building-science-short

**Flaggor och öppna poster**
- [V-FINAL runda 1 · `audits-round1/elf-b16-003.json`] **REPARERAD — MAJOR, den enda
  vindbärande optionen.** Fällningen: "D is the ONLY option that mentions the wind, against a
  stem whose whole frame is 'before the wind drops'", ett stam-till-alternativ-lexikalt brygga
  som inget annat alternativ delade. Runda 2 skrev in vinden i A, B och C och lämnade D orörd:
  > **A före:** "…, which is exactly what those gaps are there for." → **efter:** "…, **since
  > the wind forces the water out through them**."
  > **B före:** "**The brick is still soaking up the rain**, so nothing has reached the tray
  > yet." → **efter:** "**The wind is still driving the rain into the brick**, so …"
  > **C före:** "Nothing comes out of them, which usually means the tray was laid without stop
  > ends." → **efter:** "Nothing comes out of them **while the wind blows**, which usually
  > means a missing stop end."
- [V-FINAL runda 2 · superseded audit] **REPARERAD — MAJOR, blindheuristiken som rationalen
  intygade utan att ha förtjänat det.** "strip-the-absolutes … applied in the flag-word form
  students are taught, it struck A ('Every'), B ('nothing has reached the tray yet') and C
  ('Nothing comes out of them') and left key D as the sole survivor — invisible to M-FORM
  because mech.py's `_ABSOLUTIZERS` lists 'none' but not 'nothing'." Runda 5 lagade det med
  **ett token**:
  > **Före:** "The wind is still driving the rain into the brick, so **nothing** has reached
  > the tray yet."
  > **Efter (skeppad text):** "… so **little** has reached the tray yet."
  Det färska G-STEM-benet bekräftar oberoende: "absoluteness splits 2-2 … A crude 'pick the
  lexically hedged option' solver now lands on B, a distractor — the heuristic misfires rather
  than leaks. **Repair verified effective.**" Grindluckan i sig är **inte** lagad. →
  **ÄGARBLICK 2**
- [V-FINAL runda 2 · superseded audit] **REPARERAD — BLOCKERARE, kraschsömmen.** Det fanns
  ingen pedagogikpost för elf-b16-003 alls: `reviews/pedagogy.jsonl` bar åtta rader men bara
  sex enheter. Stängd i runda 3 med en post daterad 14:13:12, mot skeppningsbyten 13:59:19 —
  alltså **efter** alternativändringen, verifierat på mtime och inte på påstående.
- [`repair_log` runda 3, språk] **REPARERAD:** passagens obundna pronomen efter tre
  mellanliggande referenter.
  > **Före:** "The lull is when it lets go." **Efter:** "**In the lull, the tray lets go.**"
- [`repair_log` runda 4] två metadatarättelser, båda mot enhetens egen källa: `mechanism_verification_note`
  påstod att "every half-metre or so" ligger **inom** de citerade 450 mm — en halvmeter är
  500 mm, alltså **över**; omskrivet till en as-built-approximation utan efterlevnadspåstående.
- [G-STEM q:1 · `verdicts-r3/verdicts-gstem.jsonl`] **LEVANDE major**, WORLD_KNOWLEDGE,
  blindval D (= nyckeln). "cavity-tray/weep-hole building pathology decides it for a domain
  reader … A/B/C are all substantive positions in that same domain … No passage-free,
  domain-free mechanism delivers D." Metagranskningens N1 dispositionerar den **SHIP**. →
  **ÄGARBLICK 5**
- [G-REGISTER passage · `verdicts/verdicts-gregister.jsonl`] **LEVANDE major**, genre- och
  källtrovärdighet: "the implied reader is a practising surveyor deciding what to record on an
  inspection, not the general educated reader the short-ELF exemplars address … This text opens
  cold inside the trade ('Above a window head') and stacks window head / cavity / tray / stop
  end / outer skin unglossed. **Sits at the edge of the exemplar genre range rather than
  outside it; adjudication decides.**" Dispositionerad, inte redigerad. → **ÄGARBLICK 5**
- [metagranskning · `audits/elf-b16-003.json`] N2 note: en redovisad ordformstell — på råa
  ordformer ur stammen är D ensam toppnoterad (2 mot 1/1/1); på lemman leder i stället A.
  Nettot är {A, D}, exakta kontrarier. SHIP som redovisad rest.
- [metagranskning · `audits/elf-b16-003.json`] N3 minor: enhetens egen heuristiksektion
  härleder inte den sammansatta testvana väg dess **eget** G-STEM-ben hittade (tvåstegsnedskärning
  till {C, D} på 50/50) och landar i "the best any of them manages is a two-way between A and D".
- [metagranskning · `audits/elf-b16-003.json`] N4 minor: **skeppningsbytena för alternativ B
  har aldrig setts av ett engelskt språkben.** G-ENG kördes i runda 2 över "so nothing has
  reached the tray yet", språkgranskningen i runda 3 över samma sträng; runda 5:s ändring till
  "so little …" drog inget språkben. `verdicts-r3/verdicts-geng-elf003.jsonl` finns och ger
  pass — men den är daterad 14:41, efter metagranskningen skrevs, så granskaren kunde inte
  räkna den.
- [metagranskning · `audits/elf-b16-003.json`] N5 note: rationalen bär nu **pipelineintern
  metakommentar** — "the round-2 version of this paragraph claimed the same conclusion without
  having earned it", "mech.py's absolutiser list holds none but not nothing" — korrekt i ett
  adjudikationsartefakt och diskvalificerande i elevtext. → **ÄGARBLICK 6**
- [metagranskning · `audits/elf-b16-003.json`] N6–N8 info: två poster utanför enheten var
  föråldrade när granskningen skrevs (viknings­posten är sedan omkörd 14:42:58 och läser nu
  CONFIRMED_NOTES); G-DISTRACTOR-passet bär ingen skriven motivering; verdict-schemat är
  stängt (`additionalProperties:false`) medan ~1000 poster i trädet bär `date`,
  `justification` och `blind_pick`; passagen använder rak apostrof där två av fyra
  batch16-ELF-passager använder den typografiska; och Tier-2-frassvepet återstår med sex
  oprövade strängar.
- [`measured_stats`, redovisad avvikelse] fk_grade **8,7** mot blueprintens 11,0–15,0.
  Metagranskningen räknade om över **alla 31 skeppade ELF-korttexter i trädet**: spannet är
  7,0–16,2, och 8,7 är femte lägst — inne i fördelningen. Avvikelsen är deklarerad, inte dold.

### Text

Above a window head, a vertical joint is deliberately left free of mortar every half-metre or so. Those gaps are the whole of the wall's drainage. In a long south-westerly the outer skin of brick wets through, as the specification assumes it will. The water that gets past it runs down into the cavity, onto a tray bedded in over the opening, which discharges it through the open joints. While the wind is still on the wall, it pushes in at those same joints, and the tray holds what it has collected. In the lull, the tray lets go. Not all of the joints run, and none for long. A head that gives back nothing an hour after the wind drops is worth recording, though whether the tray has been obstructed by mortar dropped during the build, or is spilling into the cavity past a missing stop end, an open joint cannot say.
– Rhoswen Pellowden, building surveyor

### Fråga 1

What is said about the open joints before the wind drops?

- **A.** Every joint above the opening is running, since the wind forces the water out through them.
- **B.** The wind is still driving the rain into the brick, so little has reached the tray yet.
- **C.** Nothing comes out of them while the wind blows, which usually means a missing stop end.
- **D.** Whatever the tray has caught stays on it, because the wind presses in at those joints. **◀ NYCKEL**

---

## elf-b16-004 · ELF · Sixpence a Night *(kort, 1 fråga)*
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* CONSISTENT ·
*final_verify:* VERIFIED_NOTES · *metagranskning:* CONFIRMED_NOTES (0 major / 2 minor)
*Runda 1:* PASS utan reparation — **ingen `repair_log`**, elevriktade byte oförändrade sedan
runda 1 · *familj:* ELF-TYPE-002 / village-pound-stray-fines-weekly-notice-history-essay-short

**Flaggor och öppna poster**
- **Batchens enda enhet med CONSISTENT i den integrerade granskningen**, och den enda med
  bart pass i alla fyra granskningsetapper utom metagranskningens två minorer.
- [G-STEM q:1 · `verdicts-round1/verdicts-gstem.jsonl`] **ÅTERKOM INTE.** Runda 1 flaggade
  q:1 som PARTIALLY: "C is the only option that supplies its own warrant, and it is the
  coherent inference given general knowledge that village pounds charged poundage per night."
  Frågetexten är **oförändrad** mellan rundorna — det färska benet i runda 2 gav pass. Det är
  benvariation, inte en reparation, och den saknar skriven disposition. (Batch15 bokförde
  exakt samma mönster två gånger.)
- [metagranskning · `audits/elf-b16-004.json`] minor (utmanar *pedagogy*): rationalens första
  uteslutning av distraktor C överläser passagen — den uppgraderar en mening som är **skopad
  till en grupp bönder** ("Farmers on the far side of the common heard of a beast no other
  way") till ett universellt påstående om att söndagsutropet var enda kanalen för **varje**
  ägare. Samma överläsning återkommer i `key_derivation` och `engineered_traps`. Nyckel B
  påverkas inte: båda 1851-fallen löstes ut på utropssöndagen.
- [metagranskning · `audits/elf-b16-004.json`] minor (utmanar *language*): `spelling_note`
  lägger fram *heifer*, *reckoning* och *roofless* som BrE-bevis — de stavas identiskt i AmE
  — och *pinder*, *vestry*, *smithy*, *shilling*, *sixpence* är lexikala/periodmarkörer, inte
  stavningar. Passagen innehåller **ingen** ‑ise/‑ize-, ‑our/‑or-, ‑re/‑er-, ‑ll‑/‑l‑ eller
  ‑ae‑/‑e‑-diskriminator. Defekten ligger i det angivna beviset, inte i engelskan.

### Text

Owlerby's pound was a roofless square of wall behind the church, and any beast found straying on the common was shut in it, at its owner's charge, until he came. The pinder's office carried no wage: Jabez Skellorne had the fees instead, and worked at the smithy between times. The vestry's table of 1846 charged a shilling for taking up a beast and sixpence a night for its keep. Notice was another matter. Skellorne was to cry what he held at the church door each Sunday after service, and nowhere else. Farmers on the far side of the common heard of a beast no other way. In 1851 a heifer taken up on a Monday cost its owner four shillings; another, taken up on the Saturday of that same week, cost one and sixpence. Both were fetched on the Sunday they were cried, and neither owner disputed the reckoning. The table hung on the pound door until the wall came down in 1903.
– Aveline Hemblow

### Fråga 1

What is implied here about the pound at Owlerby?

- **A.** The pound was probably a useful source of income for the parish in these years.
- **B.** An owner's bill turned on which day of the week his beast was taken up. **◀ NYCKEL**
- **C.** Because the table charged by the night, a heavy bill marked an owner slow to miss his beast.
- **D.** Skellorne decided how long a beast stayed in the pound, and a longer stay paid him better.

---

## las-b16-001 · LÄS · Tegel från Sölvinge
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* MINOR_FIXES · *integrated:*
INCONSISTENT (runda 2) → MINOR_NOTES (runda 3) · *final_verify:* VERIFIED_NOTES ·
*metagranskning:* **omgjord 2026-08-26**, CONFIRMED_NOTES (0 major / 8 poster: 1 minor,
5 note, 2 info)
*Runda 1:* PASS utan reparation · *Runda 2:* **INCONSISTENT — kronologin** → reparerad i
runda 3 · *familj:* tegelbrukshistoria-facktext-long

**Flaggor och öppna poster**
- [integrerad granskning runda 2 → `repair_log` runda 3] **REPARERAD — MAJOR, kronologin.**
  Fällningen: passagen öppnar på magasinsväggen som läsbart, icke-slumpartat ugnsbevis och
  daterar den genom aritmetik till **1879** (folkskolan 1904 minus "tjugofem år tidigare") —
  medan den enda färgmekanism passagen tillhandahåller, och hela stödet för q:2:s nyckel
  "Platsen i ugnskammaren", är en kammareffekt i **ringugnen som byggdes 1884**. En vägg från
  1879 brändes i fältugnen, som varken har kamrar eller eldkanaler, så beviskedjan som bär
  hela öppningen var ogiltig.
  > **Före:** "I magasinet vid bryggan, murat **tjugofem** år tidigare, vändes de utåt."
  > **Efter (skeppad text):** "I magasinet vid bryggan, murat **femton** år tidigare, vändes
  > de utåt." — 1889, fem år efter både ringugnen och kollergången, inne i Vrenmarks tenur
  > 1879–1902 och inne i den stämplade perioden som slutar 1897.
- [integrerad granskning runda 2 → `repair_log` runda 3] **REPARERAD — minor, stycke 5 mot
  stycke 1.** Stycke 5 graderade de bleka, porösa stenarna som dugliga "bara till innermurar",
  medan stycke 1 ställer ut blekgult tegel i **de översta skiften i en yttervägg**.
  > **Före:** "… kom ut bleka och porösa **och dög bara till innermurar**. Sorteringen efter
  > bränning gick ut på just detta."
  > **Efter (skeppad text):** "… kom ut bleka och porösa. Sorteringen efter bränning gick ut på
  > just detta. **De bleka gick till innermurar eller till de översta skiften i en yttermur,
  > där de bar minst last och stod torrast.**"
- [språkgranskning → `candidates-corrected`] **REPARERAD, men ologgad:** grindens egen *native
  alternative* tillämpades ordagrant.
  > **Före:** "vattnet i klumparna frös, **vidgade** sig och sprängde sönder dem"
  > **Efter (skeppad text):** "vattnet i klumparna frös, **utvidgade** sig och sprängde sönder
  > dem"
  Ändringen står i **ingen `repair_log`** — enhetens logg dokumenterar bara runda 3 och 3b —
  och `report-final.json` bär fortfarande det föråldrade citatet som en levande G-SPRÅK-minor.
  → **ÄGARBLICK 8c**
- [G-SPRÅK runda 1 · `verdicts-round1/verdicts-gsprak-2.jsonl`] **ÅTERKOM INTE, ej åtgärdad:**
  "malde leran så **hårt** att de flesta kalkkornen krossades till stoft" — "class 6:
  collocation miss — Swedish grades milling as fint/grovt, not hårt (cf. finmalen/grovmalen)".
  Formuleringen står ordagrant kvar i skeppade byte, och varken runda 2 eller runda 3 tog upp
  den igen. Ingen skriven disposition.
- [G-SPRÅK runda 3 · `verdicts-r3/verdicts-gsprak.jsonl`] tre färska körningar med
  `target: unit` på de reparerade byten: **pass, noll fynd** i alla tre.
- [G-STEM q:1 · `verdicts/verdicts-gstem.jsonl`] LEVANDE major, WORLD_KNOWLEDGE, blindval C
  (= nyckeln). "Lime blowing is textbook brick pathology … A, B and D are substantive
  competing mechanisms rather than filler, so flag, not RECALL_ONLY."
- [G-STEM q:3] LEVANDE major, PARTIALLY / WORLD_KNOWLEDGE, blindval D (= nyckeln). "B is the
  only absolute ('inga klagomål') and A asserts a mechanism that is false in the world
  (watering does not harden brick) … The passage still grounds the inference, so flag."
- [G-STEM q:4] LEVANDE major, WORLD_KNOWLEDGE, blindval A (= nyckeln). "The Hoffmann ring
  kiln's fuel saving is exactly this heat recuperation, and the '1884' cue points to a
  ring-kiln installation." — q:2 är rent pass. Tre av fyra frågor bär alltså en levande
  G-STEM-major, alla självförsvarade som *flag, inte kill*.
- [metagranskning · `audits/las-b16-001.json`] **cold solve 4/4** mot nycklarna C/B/D/A, med
  varje icke-nyckel aktivt försvarad före nyckeln godtogs, och en **elva-posters
  datumavstämning** som återhärledde 1889 ur passagen ensam och stämde av mot varenda annan
  siffra i texten (stämpelns trettio år 1868–1897, enkelsortsbränningens slut 1875,
  brandförsäkringens *ugnen* i singular 1896, strejken juli 1893 inne i arbetsåret april–oktober).
  Slutsats: "Every figure in the passage reconciles."
- [metagranskning · `audits/las-b16-001.json`] F1 minor (**åtgärdad, runda 3b**): den ombyggda
  `self_blind_solve` underräknade enhetens G-STEM-flaggor till {Q1, Q4} när aggregatet har
  tre. Rättad till att citera alla tre, inklusive q:3:s positiva blindgissning på nyckeln.
- [metagranskning · `audits/las-b16-001.json`] F2–F6 note, **dispositionerade TOLERABLE**:
  q:1/B:s etikett `reversed_causality` där kausalpilen är intakt och bara processteget flyttas;
  q:4/D:s etikett `overgeneralisation` där den integrerade granskaren föreslog
  `true_but_irrelevant` (förslaget **avvisas på sakskäl**); G-STEM:s odispositionerade
  stam-fit-not på q:4/D (**dispositioneras här**); q:2-rationalens oreserverade "texten stänger
  vägen" (**refuterad vid omläsning**); och q:1-rationalens "sällan … utan"-konstruktion som
  gör passagens gardering till en uteslutning.
- [metagranskning · `audits/las-b16-001.json`] F7–F8 info: `report.json` (12:53) bär ett
  föråldrat G-SPRÅK-citat, och vikningsposten var räknad före runda-3-reparationen mot den
  ersatta granskningen — **omkörning krävd**, och sedan gjord 14:42:58.

### Text

I ytterväggen på magasinet vid Sölvinges ångbåtsbrygga sitter tegel i tre färger. De nedersta skiften är mörkt rödbruna och nästan glasartade i ytan. Längre upp lyser stenarna klart orange, och överst går färgen över i blekgult. Ur några av stenarna har flisor lossnat, som om någon slagit loss dem med en hammare. Ingenting av detta är slumpartat. Hur ett tegelbruk arbetade går i stor utsträckning att läsa ur stenarna, och Sölvinge tegelbruk, som var i drift mellan 1868 och 1913, är ovanligt lättläst, eftersom teglet under brukets första trettio år bar en stämpel.

Leran togs ur två gravar. Den nedre låg närmast ån och gav en styv lera med inslag av kalkstensgrus, medan den övre låg på moränbacken ovanför och gav en magrare och sandigare lera. Leran från de båda gravarna blandades på slagbordet, och efter 1875 brändes inget tegel av enbart den ena sorten. Grävningen skedde på hösten. Leran kastades upp i långa strängar som fick ligga ute till våren, och frosten gjorde sedan det tyngsta arbetet: vattnet i klumparna frös, utvidgade sig och sprängde sönder dem, så att massan i april var lös och lätt att blöta upp. Vintervittringen betydde mest för den styva leran från den nedre graven. På den magra övre leran märktes den knappt.

Teglet slogs för hand under hela brukets tid. Formaren tryckte ner leran i en trälåda med sand i botten, strök av överskottet och vände ut den råa stenen på en bräda. Råteglet bars ut på torkbacken och restes i luftiga staplar under skärmtak. Torkningen tog i regel fyra veckor och i regnig väderlek längre, medan bränningen räknades i dagar. Vad bruket kunde leverera under en sommar avgjordes därför av hur mycket gods som fick plats under taken. Ugnen hann alltid med.

Den första ugnen var en fältugn, som murades upp av råteglet självt, eldades i några dygn och revs när godset tagits ut. År 1884 ersattes den av en ringugn med sexton kamrar. I en ringugn står elden aldrig stilla. Den vandrar runt i ringen från kammare till kammare, medan arbetslagen tömmer de utbrända kamrarna bakom elden och sätter in nytt gods i kamrarna framför. Luften som drogs in mot elden passerade först de färdigbrända stenar som stod och svalnade, och kom därför varm fram. Rökgaserna leddes ut genom kamrarna längre fram i ringen, där de torkade det gods som stod på tur att brännas. Vedåtgången per tusen stenar sjönk med ungefär en tredjedel under de första åren. Elden brann inte hetare än förr. Samma värme fick i stället göra nytta i två led.

Var i kammaren en sten hade stått syntes på den efteråt. De stenar som stod närmast eldkanalerna blev täta och mörka och kunde bli så hårt brända att de vred sig, medan de som stod ytterst mot kammarväggen kom ut bleka och porösa. Sorteringen efter bränning gick ut på just detta. De bleka gick till innermurar eller till de översta skiften i en yttermur, där de bar minst last och stod torrast.

Kalkstensgruset i den nedre leran gav ett fel som visade sig först långt efter bränningen. Ett korn kalksten som följt med i stenen brändes i ugnen till osläckt kalk. Kornet låg sedan kvar i det färdiga teglet och tog upp fukt ur luften, svällde och tryckte loss en flisa ur ytan. I ugnen hände detta sällan. Det hände när stenen hade stått en tid i stapeln eller redan var inmurad, ibland flera veckor efter leveransen.

Mot kalkspräckningen vidtogs två åtgärder. Kollergången, som sattes in 1884, malde leran så hårt att de flesta kalkkornen krossades till stoft och inte längre orkade spränga något. Tegelmästaren Evald Vrenmark, som ledde arbetet vid bruket från 1879 till 1902, lät dessutom vattna de färdiga stenarna i staplarna innan de lastades, så att kalken hann släckas medan teglet stod kvar på bruksgården. Vattningen gjorde ingen sten hel igen, och den nådde bara de korn som satt nära ytan. Ett korn som satt djupt kunde ligga still tills muren hade stått sin första vinter. De stenar som sprack på gården kördes ut i brukets egen vägfyllning. Av de klagomål som bruket tog emot under 1890-talet gällde nästan alla sådant tegel som hade spruckit sedan det murats in.

Arbetsåret började när tjälen gått ur torkbacken, i regel i slutet av april, och slutade i oktober. Under sommaren fanns omkring sextio personer vid bruket. Ett tjugotal av dem var kvinnor och barn som bar råtegel mellan formarna och staplarna, ett arbete som betalades per hundra burna stenar. Formarna betalades också per hundra, och i juli 1893 lade de ned arbetet i nio dagar sedan priset sänkts med två öre. Vad som avtalades när de gick tillbaka är inte känt. I brandförsäkringen från 1896 upptas, förutom ugnen och skärmtaken, en handdriven spruta, sex skottkärror och en kakelugn i kontoret.

Stämpeln, ett S i en oval, var nedskuren i formlådornas bottnar. Den försvann 1897, och varför den gjorde det vet ingen. I en uppteckning som gjordes 1918 nämns två skäl som då gick att höra i socknen. Det ena var att formlådorna byttes ut och att de nya beställdes utan stämpel, eftersom de då blev billigare. Det andra var att uppköparen i staden sålde teglet vidare under eget namn och inte ville ha ett bruksnamn i väggarna. Uppteckningen tar inte ställning, och något underlag som skulle kunna avgöra saken finns inte.

Folkskolan i Sölvinge, uppförd 1904, var det sista större huset som fick tegel från bruket. I dess fasad syns inga lossnade flisor. Stenar med sådana märken murades in med den skadade sidan inåt, vilket var det vanliga. I magasinet vid bryggan, murat femton år tidigare, vändes de utåt.
– Boel Rundhage, byggnadshistoriker

råtegel = formad men obränd tegelsten
kollergång = kvarn där två tunga stenhjul rullar runt och krossar leran
skift = vågrätt lager av stenar i en mur

### Fråga 1

Vad framställs som orsaken till att flisor lossnade ur teglets yta?

- **A.** Frosten i lersträngarna hade lämnat sprickor som öppnade sig i muren.
- **B.** Kalkkornen sprängde sönder stenens yta i ugnens hetta under själva bränningen.
- **C.** Kalkkorn i stenen svällde när de tog upp fukt efter bränningen. **◀ NYCKEL**
- **D.** Stenarna tycks ha kylts för hastigt när de utbrända kamrarna tömdes.

### Fråga 2

Vad avgjorde, enligt texten, en stens färg?

- **A.** Kalkhalten i leran.
- **B.** Platsen i ugnskammaren. **◀ NYCKEL**
- **C.** Tiden på torkbacken.
- **D.** Vilken grav leran kom ur.

### Fråga 3

Vad kan man, utifrån texten, dra för slutsats om vattningen av de färdiga stenarna?

- **A.** Vattningen gjorde stenarna hårdare och därmed mer tåliga mot frost.
- **B.** Sedan vattningen infördes kom inga klagomål på kalkspräckt tegel.
- **C.** Bruket lät kunderna bära förlusten genom att sälja de skadade stenarna billigare.
- **D.** En del av förlusten flyttades från kundens mur till bruksgården. **◀ NYCKEL**

### Fråga 4

Vad förklarar, enligt texten, att vedåtgången per tusen stenar sjönk efter 1884?

- **A.** Luften förvärmdes av svalnande stenar och rökgaserna torkade nästa gods. **◀ NYCKEL**
- **B.** Ringugnen brann hetare än den gamla ugnen, och veden räckte därför längre.
- **C.** Kollergången gjorde leran tätare, så att stenarna krävde kortare bränning.
- **D.** Skärmtaken tycks ha blivit överflödiga sedan rökgaserna kunde torka godset.

---

## las-b16-002 · LÄS · Sextioen elever och tjugotre turer
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* MINOR_FIXES · *integrated:*
MINOR_NOTES · *final_verify:* VERIFIED_NOTES · *metagranskning:* **omgjord 2026-08-26**,
CONFIRMED_NOTES (0 major / 7 poster: 2 minor, 2 note, 3 info)
*Runda 1:* **V-FINAL REFUTED** · *Runda 2:* **V-FINAL REFUTED igen**, två majors → reparerad i
runda 3 (repair_log runda 5) med full benvåg och omgjord metagranskning ·
*familj:* skolskjuts-landsbygd-debatt-short

**Flaggor och öppna poster**
- [V-FINAL runda 1 · `audits-round1/las-b16-002.json`] **REPARERAD — MAJOR, en
  ettgreps-falsifierbar originalitetsuppgift.** `originality_note` påstod ordagrant att
  "the element Öds- appears nowhere in the bank"; `grep` över `*/candidates-final/` ger
  Ödsberga ×5, Ödsbergas, Ödsbergaförsöket, Ödsbol ×3, Ödsbols — och batch2:s las-b2-002 bär
  "I grannkommunen **Ödsberga**", en påhittad **kommun** i en förstapersons kommunal
  skoldebatt: samma entitetstyp, domän och genre. Kommunen döptes om:
  > **Före:** "barn- och utbildningsnämnden i **Ödsmyra**"
  > **Efter (skeppad text):** "barn- och utbildningsnämnden i **Flarkbro**"
  Samma runda skärpte öppningen ("ska … höja" → "ska … **ta ställning till att** höja"),
  ordklassmatchade ordlistan (`skjutsberättigad = som enligt …`, inte `elev som …`) och
  skrev om q:1:s nyckel från "Att besparingen blir en bråkdel av den budgeterade." till
  **"Att bara en bråkdel av besparingen är påvisbar."**
- [G-SPRÅK runda 1 · `verdicts-round1/verdicts-gsprak-3.jsonl`] **REPARERAD — major.**
  > **Före:** "den avgörs i en upphandling som ännu inte är **skriven**"
  > **Efter (skeppad text):** "… som ännu inte är **gjord**" — grindens egen native
  > alternative, ordagrant. Samma runda rättade den strandade prepositionen: "tre vägsträckor
  > som olämpliga **att promenera längs för** yngre skolbarn" → "tre vägsträckor som olämpliga
  > **för yngre skolbarn att gå längs**".
- [V-FINAL runda 2 · superseded audit] **REPARERAD — MAJOR 1, en falsk stängning.** Runda 3
  bokförde batchens öppna G-STEM q:2-läcka som stängd på påståendet "Blind, only C is now
  heuristically eliminable, leaving three live options" — men de ombyggda B och D bar
  fortfarande exakt de två predikat G-STEM hade namngivit som icke-härledbara ur metoden
  (kostnadsrangordning; kommunal gångbarhetsbedömning). Runda 5 drog tillbaka stängningen och
  byggde om **alternativsetet** i stället för protokollet:
  > **B före:** "De turer som har flest skjutsberättigade elever ombord är också de som kostar
  > kommunen mest." → **efter:** "**Antalet fordon som sätts in på morgonturerna styrs av hur
  > många skjutsberättigade elever som stiger på.**"
  > **D före:** "De flesta av de berörda eleverna bor längs vägsträckor som kommunen har bedömt
  > som olämpliga att gå längs." → **efter:** "**De flesta av hållplatserna i turlistorna
  > trafikeras enbart för de berörda elevernas skull.**"
  Det färska benet intygar oberoende: "**REPAIR VERIFIED:** the old 4->1 method-derivability
  path is dead … The previously named non-derivable predicates … do not appear anywhere in the
  current option set."
- [V-FINAL runda 2 · superseded audit] **REPARERAD — MAJOR 2, en självmotsägelse i loggen.**
  Runda 3 skrev om B så att den **inte** skulle kunna avfärdas på stam-fit; runda 4 lagade
  sedan rationalen genom att avfärda B på stam-fit. Runda 5 adjudicerar motsägelsen rakt ut:
  runda 4:s beskrivning **stämmer** mot de byte den läste, runda 3:s beskrivning stämmer
  **inte** mot de byte den installerade, och diagnosen är att runda 3 bara prövade den
  ombyggda B:s subjekts-NP och aldrig predikatet som bär påståendet. Metagranskningen
  verifierade det påstående för påstående mot git: rundorna 2, 3 och 4 är byteidentiska mellan
  935f0e4 och HEAD.
- [`repair_log` runda 5, mekanisk orsak] **det föråldrade `stems/`-arket.** Vid 935f0e4 bar
  `candidates-final` redan runda 3:s B och D medan `stems/las-b16-002.json` fortfarande bar
  **pre-runda-3-alternativen** — så inget G-STEM-ben hade någonsin läst runda 3:s alternativset.
  Det är den mekaniska anledningen till att den falska stängningen överlevde två rundor. Vid
  HEAD är arket i synk (jag har kontrollerat sträng för sträng).
- [G-STEM q:1 · `verdicts-r3/verdicts-gstem.jsonl`] LEVANDE major, PARTIALLY, blindval C
  (= nyckeln). Kedjan: D är den enda hårda absoluten *och* längdavvikaren (34 tecken mot
  46–48); A och B är nära-redundanta "ja, men inte tvärt"-hållningar; C är D:s hedgade tvilling
  med dubbel gardering, kvantitativ ("bara en bråkdel") och epistemisk ("påvisbar").
  **Notera:** q:1 är byteidentisk sedan runda 2, och runda 2:s ben gav **pass** på samma text.
- [G-STEM q:1 + q:2, korsfrågekanalen] LEVANDE major på **båda** frågorna för samma sak:
  "no option anywhere in this sheet asserts that the saving is real … The sheet's own option
  composition therefore constrains the author's stance to savings-sceptical before any passage
  is read." Grinden säger själv "every link is a prior rather than a mechanism". →
  **ÄGARBLICK 1**
- [G-STEM q:2] LEVANDE major, RESIDUAL BLIND FLOOR, blindval A (= nyckeln). Ren form tar bara
  bort C (enda hårda universella negationen, också kortast med 73 tecken) → golv **1-på-3**;
  riktningen är 2–2, längsta alternativet pekar på B och missar, och slutsatsbärandet delar
  2–2.
- [metagranskning · `audits/las-b16-002.json`] **cold solve 2/2**, båda unika och
  passage-härledda, i linje med alla fyra färska G-KEY-lösningar.
- [metagranskning · `audits/las-b16-002.json`] F1 minor: q:1-rationalen och `hedge_map.1`
  kallar båda nyckeln C "ett rakt, ohedgat påstående" — vilket alternativets egen ordalydelse
  motsäger, vilket det färska G-STEM-benet läser tvärtom, och vilket meningen **precis innan**
  i samma rationale själv beskriver. Föreslagen minsta rättelse: "ett rakt påstående i
  modalitet, men avsiktligt avgränsat i omfång".
- [metagranskning · `audits/las-b16-002.json`] F2 minor och F4 note — de två burna resterna.
  → **ÄGARBLICK 4**
- [metagranskning · `audits/las-b16-002.json`] F3 note: **stance-kanalen adjudicerad TOLERABEL**
  med en egen `stance_channel_ruling`. → **ÄGARBLICK 1**
- [metagranskning · `audits/las-b16-002.json`] F5 info: `hedgat` och snake_case-etiketterna.
  → **ÄGARBLICK 6** · F6 info: två em-streck (U+2014) överlever i granskarvänd metadata mot
  addendum regel 3; **varje produktyta är ren** · F7 info: `originality_note` är nu ~5 000
  tecken lagrade tilläggsrättelser, och det tillbakadragna Öds-påståendet står fortfarande
  läsbart **före** stycket som drar tillbaka det.
- [metagranskning · `audits/las-b16-002.json`] R5 — **lag 16 inlöst.** → **ÄGARBLICK 7**

### Text

I november ska barn- och utbildningsnämnden i Flarkbro ta ställning till att höja avståndsgränsen för skolskjuts i årskurs 4–6 från två till tre kilometer, och i budgetunderlaget står förslaget bredvid en beräknad besparing på 1,4 miljoner kronor om året. Den summan går inte att få fram ur kommunens egna turlistor.

Kommunen köper inte elevplatser. Den köper turer. Ersättningen i entreprenadavtalet består av en fast del per fordon, tur och skoldag samt ett rörligt kilometertillägg, och fyra av fem kronor ligger i den fasta delen. Tjugotre turer avgår varje morgon, och en tur med sex elever kostar nästan lika mycket som samma tur med tjugo, så länge fordonsstorleken är densamma. Reglerna för vem som är skjutsberättigad avgör därmed vilka som sitter i fordonen, medan antalet fordon bestäms av turplaneringen.

Sivert Näversved, som samordnar skjutsarna, lade i våras de skjutsberättigade elevernas adresser ovanpå turlistorna. Sextioen elever i årskurs 4–6 bor mellan två och tre kilometer från sin skola, och femtioåtta av dem stiger på vid hållplatser som redan trafikeras av turer som körs för yngre eller äldre elevers skull. Fordonen står alltså kvar oavsett var gränsen dras. De tre återstående bor längs två stickvägar dit fordonen viker av enbart för deras skull, och de avstickarna skulle gå att stryka ur turplaneringen. Näversved beräknar besparingen där till knappt 90 000 kronor om året. Det är den enda besparing som går att belägga i förväg.

Näversved invänder mot sina egna beräkningar. ”Sätena försvinner inte, men de blir tomma, och tomma säten kan skrivas bort när avtalet ska förnyas”, konstaterar han. Den nuvarande entreprenaden löper till juni 2029, och ett minskat elevunderlag kan då ge mindre fordon och lägre grundersättning. Det argumentet kan jag inte räkna bort, och jag tänker inte låtsas att jag kan. Men ingen har prissatt effekten, den avgörs i en upphandling som ännu inte är gjord, och fordonsstorleken går att anpassa efter det faktiska resandet ändå. Någon ny avståndsgräns krävs inte för det.

De sextioen eleverna försvinner inte heller. Förra gången avståndsgränsen ändrades, 2016, kom fyrtiofyra undantagsansökningar in, tjugosju beviljades, och varje sådan prövning handläggs individuellt. Kommunens egen trafiksäkerhetsbedömning från 2019 pekar dessutom ut tre vägsträckor som olämpliga för yngre skolbarn att gå längs, och två av dem ligger inom det nya avståndsspannet.

Det finns besparingar att göra i skolskjutsverksamheten, men vill nämnden hitta dem bör den börja i turplaneringen. Vårterminens turer är redan lagda, och de ser likadana ut vare sig avståndsgränsen dras vid två eller tre kilometer.
– Majken Brantmyr, ersättare i barn- och utbildningsnämnden i Flarkbro

skjutsberättigad = som enligt kommunens regler har rätt till skolskjuts
entreprenadavtal = avtalet mellan kommunen och det företag som utför körningarna

### Fråga 1

Vad anser textförfattaren om den föreslagna höjningen av avståndsgränsen?

- **A.** Att den behövs, men först vid nästa upphandling.
- **B.** Att den bör genomföras försiktigt och stegvis.
- **C.** Att bara en bråkdel av besparingen är påvisbar. **◀ NYCKEL**
- **D.** Att den inte sparar en enda krona.

### Fråga 2

Vad framgick när de skjutsberättigade elevernas adresser lades ovanpå turlistorna?

- **A.** Nästan alla berörda elever åker med turer som ändå körs, och fordonen blir därför kvar. **◀ NYCKEL**
- **B.** Antalet fordon som sätts in på morgonturerna styrs av hur många skjutsberättigade elever som stiger på.
- **C.** Ingen av de tjugotre morgonturerna skulle gå att korta om gränsen höjdes.
- **D.** De flesta av hållplatserna i turlistorna trafikeras enbart för de berörda elevernas skull.

---

## las-b16-003 · LÄS · Måtten på en midsommarstång
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* MINOR_FIXES · *integrated:*
MINOR_NOTES · *final_verify:* VERIFIED_NOTES · *metagranskning:* CONFIRMED_NOTES
(0 major / 3 minor)
*Runda 1:* **V-FINAL REFUTED** (1 major, 4 minor) → reparerad i runda 2. **Ingen
runda-3-benvåg** — enhetens kanoniska protokoll är runda 2:s ·
*familj:* midsommarstangens-lokalformer-essa-short

**Flaggor och öppna poster**
- [V-FINAL runda 1 · `audits-round1/las-b16-003.json`] **REPARERAD — MAJOR, q:2 blindlösbar ur
  q:1.** Fällningen: runda 1:s reparation bytte bara ut det alternativ som **G-DISTRACTOR**
  hade namngivit, satte in ett C som q:1:s stam besegrar minst lika rent, lämnade D:s lexikala
  eko mot syskonstammen orört, körde aldrig om G-STEM i V-FINAL, och bar förnekelsen "No
  cross-question corroboration" ordagrant vidare in i den skeppade filen. Runda 2 byggde om
  **hela q:2-alternativsetet** och skärpte q:1:
  > **q:2 A:** "Varje by har medvetet bevarat sin egen stångform …" → "**Där stommen sparades
  > hade byborna själva valt formen och höll medvetet fast vid den.**"
  > **q:2 B:** "Så länge en by sparade sin stomme förblev midsommarfirandet där oförändrat …"
  > → "**Stommen tycks ha fungerat som ett minnesstöd när stången skulle resas och lövas på
  > nytt.**"
  > **q:2 C:** "Luckorna i Malmgärdes material gör att skillnaden … inte går att belägga." →
  > "**Att byarna över huvud taget fick olika stångformer beror på att somliga sparade sin
  > stomme.**"
  > **q:2 D (NYCKEL, tesen bevarad):** "Formen bars vidare av en stomme som sparades, medan
  > lövningen kunde läggas om ändå." → "**Stommen förde formen vidare mellan somrarna, medan
  > lövningen kunde läggas om på nya sätt.**"
  > **q:1 A/B:** "Den avlägsnade sig …" / "Den kom att likna grannbyns stång." → "**Den tycks
  > ha avlägsnat sig …**" / "**Den tycks ha närmat sig grannbyns form.**"
  **Ingen nyckelbokstav ändrades** (B / D står kvar).
- [`repair_log` runda 2] ordlistan rättades — den gamla glosan var faktiskt fel:
  > **Före:** "stomme = den träställning som midsommarstången kläs på"
  > **Efter (skeppad text):** "stomme = stången med sina tvärslåar och järnringar, alltså
  > skelettet som sedan lövas"
- [G-SPRÅK runda 2 · `verdicts-gsprak-1/-2/-3.jsonl`] **LEVANDE minor, alla tre benen på samma
  mening.** "Stommen bär bara skelettet." läser tautologiskt mot enhetens egen ordlista
  ("stomme = … alltså skelettet"). Grindens native alternatives: "Stommen **för** bara
  skelettet **vidare**." eller "Stommen bär bara **formen**." Enheten fick ingen
  runda-3-omkörning, så fyndet står orört i skeppade byte. → **ÄGARBLICK 8g**
- [G-STEM q:2 · `verdicts/verdicts-gstem.jsonl`] LEVANDE major, PARTIALLY, blindval **null**
  (lutar D). "C overreaches causally and A asserts unsupported deliberate intent; both are
  eliminable passage-blind, leaving B and D, which are near-paraphrases of one another. The
  passage is still needed to choose between them, so flag." — q:1 är rent pass.
- [metagranskning · `audits/las-b16-003.json`] minor (utmanar *language*): **ordlistereparationen
  skapade cirkeln.** Med glosan insatt läser stycke 5:s öppning "skelettet bär bara skelettet"
  — för exakt den läsare ordlistan finns till för. Reparationsnoten påstår motsatsen ("keeps
  paragraph 5's point intact"). Föreslagen fix: låt glosan sluta vid "…järnringar", eller
  skriv "alltså bara skelettet, innan lövningen".
- [metagranskning · `audits/las-b16-003.json`] minor (utmanar *pedagogy*): q:1-rationalens glosa
  av distraktor C tillskriver de stommesparande byarna ett tillstånd passagen **uttryckligen
  förnekar** — rationalen säger att "oförändrad i över tio år" beskriver den sparande gruppen,
  medan passagen skriver "rörde sig måtten knappt" och i nästa mening "Tvärslåns längd
  varierade med någon handsbredd". Eleven lärs alltså en aning falsk fakta i samma andetag som
  en sann fälla. Fixen är en bisats.
- [metagranskning · `audits/las-b16-003.json`] minor (utmanar *integrated*): en skeppad
  `repair_log`-not påstår en längdegenskap som byten inte har — "key is neither the longest nor
  the shortest option (14 / 15 / 15 / 14)"; räknat på skeppad text är nyckeln D **delad
  kortast** med A. Bokföring, ingen testvan hävstång följer — men det är en metadatauppgift som
  motsägs av fältets egna siffror, i just den enhet vars runda-2-biljett restes för att en
  falsk metadataförnekelse bars vidare oförändrad.

### Text

I Hyllemåla har midsommarstången två tvärslåar och tre kransar. I Rossmåla, någon mil därifrån, hänger kransarna på den nedre tvärslån medan den övre är bar. Skarpbo, som ligger mellan de två, reser en stång helt utan övre tvärslå. Frågar man varför blir svaren undvikande. Så har den sett ut, säger folk, och längre än så går svaren sällan.

Att formerna alls går att jämföra över tid beror på Alrik Malmgärde, folkskollärare i Hyllemåla. Mellan 1961 och 1974 cyklade han runt varje midsommarafton med kamera och måttband, och ett tjugotal byar hann han med. Han skrev upp längder och vinklar i ett vaxdukshäfte, antecknade vem som hade rest stången och fotograferade den både före och efter lövningen. Häftet och drygt tvåhundra bilder förvaras i hembygdsföreningens skåp.

Det som framträder i hans material är en skillnad mellan byar, inte mellan år. Där stommen – stången med sina tvärslåar och järnringar – togs in och sparades till nästa sommar rörde sig måtten knappt över de fjorton somrarna. Tvärslåns längd varierade med någon handsbredd. Där man i stället högg en ny stång varje sommar gled proportionerna. Och de gled inte hur som helst, utan tycks ha närmat sig formen i den närmaste by som hade en sparad stomme att gå efter.

En sparad stomme är en instruktion. Den som reser stången nästa sommar behöver varken minnas eller besluta något, eftersom svaret ligger i ladan med hålen redan borrade. Hjördis Bjärnmo, vars familj har haft Hyllemålas stomme hos sig sedan femtiotalet, säger det utan omsvep. ”Vi har aldrig bestämt hur den ska se ut. Den ligger ju där.”

Stommen bär bara skelettet. I Rossmåla sparades den, men lövningen lades om två gånger under samma period, först i band och sedan i spiral, och ingen tycks ha invänt. Det som måste göras om från början varje år kan lika gärna göras annorlunda. Malmgärde hann inte heller överallt. Han for på cykel och nådde sällan mer än fyra byar samma afton, så ingen by finns med varje år, och regniga somrar är tunt företrädda.

Hembygdsföreningen har bett att få ta hand om stommen i Hyllemåla och ställa den inomhus. Bjärnmo har svarat att den gör mer nytta där den ligger, och att den ska resas i juni som vanligt.
– Gertrud Slåtterlund, essäist

stomme = stången med sina tvärslåar och järnringar, alltså skelettet som sedan lövas
lövning = arbetet med att klä stången med löv och blommor

### Fråga 1

Vad hände med stångens form i byar som inte sparade stommen?

- **A.** Den tycks ha avlägsnat sig från grannbyns form.
- **B.** Den tycks ha närmat sig grannbyns form. **◀ NYCKEL**
- **C.** Den låg oförändrad i över tio år.
- **D.** Den avgjordes av hembygdsföreningens önskemål.

### Fråga 2

Vilket påstående överensstämmer bäst med texten?

- **A.** Där stommen sparades hade byborna själva valt formen och höll medvetet fast vid den.
- **B.** Stommen tycks ha fungerat som ett minnesstöd när stången skulle resas och lövas på nytt.
- **C.** Att byarna över huvud taget fick olika stångformer beror på att somliga sparade sin stomme.
- **D.** Stommen förde formen vidare mellan somrarna, medan lövningen kunde läggas om på nya sätt. **◀ NYCKEL**

---

# ÄGARBLICK

## 1. Stance-kompositionskanalen på las-b16-002 — och policyfrågan under den

**Vad grinden hittade.** Det färska G-STEM-benet (`verdicts-r3/verdicts-gstem.jsonl`) lade en
**major på båda frågorna** i las-b16-002 för samma sak: arkets egen alternativkomposition
avslöjar författarens hållning innan passagen är läst. Inget alternativ någonstans i arket
påstår att besparingen är verklig — två q:1-alternativ förnekar den, två viker undan till
process — så nyckeln pressas blint in i {C, D}, och absolutismen på D ("inte en enda krona")
pekar sedan på C. Grinden håller det på *flag*, inte kill, och säger själv att "every link is a
prior rather than a mechanism".

**Vad metagranskningen gjorde med den.** `audits/las-b16-002.json` bär en egen
`stance_channel_ruling` — batchens mest genomarbetade enskilda dokument — som **dömer kanalen
TOLERABEL, ingen reparation**, och som gör det på en **empirisk korpusmätning** i stället för
på smak. Granskaren drog **varje LÄS-hållningsfråga ur den autentiska 27-provsbanken**
(`data/parsed/`, stammar som matchar *vad anser / vilken inställning / hur ställer sig /
författarens hållning*): **8 uppgifter. Fem av åtta bär exakt samma kompositionsskevhet, och i
alla fem sitter nyckeln på den sneda sidan.**

| autentisk uppgift | skevheten |
|---|---|
| host-2020-verb2-LÄS-015 | alla fyra alternativ är kritik, 4–0 |
| host-2022-verb2-LÄS-013 | nära strukturell tvilling till vår q:1 — två *bör*-hållningar mot två sakpåståenden, nyckeln bland sakpåståendena |
| host-2013-verb2-LÄS-020 | 3 av 4 namnger en begränsning, nyckeln bland dem |
| host-2023-verb2-LÄS-016 | 3 av 4 kritiska, nyckeln kritisk |
| var-2025-verb2-LÄS-019 | 3 begränsande mot 1 försvarande, nyckeln i treklustret |

Bara host-ver1/ver2-2019-verb1-LÄS-011 är spegelbalanserad. Granskarens slutsats, ordagrant:
*"A bank that forbade this would generate items LESS authentic than the target corpus."*

Och den lade fram **motargumenten först**, inte sist: kanalen är korsfråge- och inte
intrafråge-, ett tvåfrågeark kopplar maximalt, och kanalen staplas ovanpå två oberoende
formvägar. Den vände ändå — på fjärde punkten: **den enda tillgängliga reparationen gör
uppgiften sämre.** Ett q:1-alternativ som påstod att den budgeterade besparingen är verklig
vore en halmhållning i en signerad kritisk kolumn skriven av en nämndledamot som argumenterar
emot förslaget. Ingen läsare skulle överväga det. Det byter en mjuk, besegbar prior mot ett
hårt dött alternativ och sänker det effektiva alternativantalet från fyra till tre.

**Policyförslaget — det är detta som är ditt beslut.** Granskaren ber uttryckligen om att domen
**lyfts till bankpolicy** i stället för att omprövas per uppgift, med föreslagen lydelse till
nästa addendum:

> Stance-composition skew in single-author opinion passages (no option asserting the position
> the author is arguing against) is WITHIN TOLERANCE and is not a repairable structural leak …
> Cross-question stance correlation is REPORTABLE at note severity but does not block, provided
> (a) no single question is blind-decidable on form alone, and (b) rule 10 holds. G-STEM should
> continue to name it; adjudication should not treat it as an open major.

> **REKOMMENDATION: GODKÄNN enheten — och anta policyn, med en skärpning.**
> Underlaget är starkare än något annat vi lagt fram i den här klassen: det är mätt mot
> målkorpusen i stället för argumenterat mot magkänsla, och villkoren (a) och (b) är exakt de
> två saker som skulle göra kanalen farlig. **Min enda ändring:** villkor (a) bör tvinga fram
> en **redovisad siffra**, inte en bedömning — las-b16-002:s egen granskare skrev ju ned det
> ärliga värsta blindgolvet till **1-på-2** (ÄGARBLICK 4), medan benets protokoll säger 1-på-3.
> Skriv därför "provided (a) the adversarial blind floor is stated **and is no better than
> 1-in-2**". Utan en siffra blir "not blind-decidable" ett omdöme. Säger du nej till policyn
> står enheten ändå — men då lägger nästa batch en runda på samma fynd igen, vilket är precis
> det granskaren varnar för.

## 2. mech:s `_ABSOLUTIZERS` — `none` finns, `nothing` saknas

**Vad som hände.** elf-b16-003:s rationale intygade i två rundor att blindheuristiken "stryk
absoluterna" inte biter på alternativsetet. Det var falskt: i den flaggordsform eleverna
faktiskt lär sig ströks A ("**Every** joint …"), B ("so **nothing** has reached the tray yet")
och C ("**Nothing** comes out of them …") — och nyckeln D stod ensam kvar. **M-FORM såg det
aldrig**, eftersom `_ABSOLUTIZERS` listar `none` men inte `nothing`.

**Verifierat i källan, inte i referat.** `gates/scripts/mech.py:333–341`:

```
_ABSOLUTIZERS = {
    "alltid", "aldrig", "samtliga", "alla", "allt", "varje", "enbart", "endast",
    "ingen", "inget", "inga", "helt", "omöjligt", "garanterat",
    "always", "never", "every", "all", "only", "none", "entirely", "impossible",
    "proves", "guarantees", "certainly",
}
```

`nothing` saknas. Det gör också svenska `ingenting`, trots att `ingen` / `inget` / `inga` alla
finns. Och `gate_form` fyrar bara när nyckeln är det enda omätta alternativet **och varje**
distraktor bär en absolutiserare — ett enda osett ord räcker alltså för att stänga av grinden
helt för den frågan.

**Vad jag mätte, additivt och skrivskyddat.** Jag importerade grindmodulen och körde
`_has_absolutizer` per alternativ över **hela den skeppade banken** — 114 enheter, 333 frågor —
dels som listan står, dels med `nothing` och `ingenting` tillagda:

| körning | M-FORM-flaggor |
|---|---|
| listan som den står i dag | **0 av 333** |
| listan + `nothing` + `ingenting` | **0 av 333** |
| samma utökning på elf-b16-003:s **runda-1-byte** | **flagga** |

Utökningen kostar alltså **noll nya flaggor på allt som redan är skeppat**, och den hade fångat
batchens dyraste enskilda defekt vid första grindkörningen i stället för efter två refutationer
och fem reparationsrundor.

**Vad enheten gjorde i stället.** Runda 5 mjukade upp B:s `nothing` → `little` — ett token,
mech-neutralt. Det fungerade, och det färska benet verifierade det oberoende ("the heuristic
misfires rather than leaks. Repair verified effective"). Grindluckan står kvar.

> **REKOMMENDATION: laga grinden — men som ett eget, spårat ingrepp, inte inuti den här batchen.**
> Enhetsreparationen är verklig och räcker för skeppning; luckan i grinden gör det inte.
> Mätningen ovan säger att tillägget är regressionsfritt mot dagens bank, men en grindändring
> är ändå en grindändring: den ska ha en egen körning över hela banken, ett före/efter-protokoll
> och en rad i `BRIEF-ADDENDUM.md`, så att nästa batch inte ärver en tyst semantikförändring.
> **Ditt beslut är hur brett tillägget ska vara.** En halv fix är sämre än ingen, eftersom den
> återskapar exakt samma falska trygghet på nästa ord som saknas — samma familj rymmer minst
> *nothing, nobody, no one, ingenting, ingenstans, uteslutande*. Jag skulle ta hela familjen på
> en gång och sedan aldrig röra listan igen utan en bankkörning.

## 3. Quennerby / Quennerly — korsbatch-närparet

`ASSEMBLY.md` reste det själv och bad om en skriven bedömning: batch15:s **elf-b15-002** skeppar
*Verity **Quennerby*** (bytt efter godkännande, i lag 16-svepet) och batch16:s **elf-b16-001**
skeppar *Tamsin **Quennerly*** — **en bokstav isär**, båda påhittade, båda röster i ELF-texter.

**Dispositionen, rakt ur rekorden: ingen.** G-REGISTER gav elf-b16-001 **pass med noll fynd i
båda rundorna** (`verdicts-round1/verdicts-gregister.jsonl`, `verdicts/verdicts-gregister.jsonl`).
Metagranskningen av elf-b16-001 nämner Quennerly men bara **inom** batchen ("Pemberdine,
Quennerly and Kettlestrand appear in no sibling passage"). Ordet *Quennerby* förekommer
**ingen annanstans i hela batch16-trädet än i `ASSEMBLY.md`**. Det är exakt batch15 § 3:s
mönster: en namngiven närhet som fick ett bart pass.

**Sakligt.** Namnen bärs av olika slags gestalter i olika batchar — en veckokolumnist i en
bysamhällsessä mot en sensorikforskare i vetenskapsjournalistik — och banken skeppar redan
närmare par än så: *Karin Löfgren* / *Karin Lövgren*, godkända och skeppade. Ingen elev möter de
två i samma provpass.

> **REKOMMENDATION: GODKÄNN paret — och gör processfixen nu.**
> Detta är **andra batchen i rad** där monteringen namnger en närhet och G-REGISTER svarar med
> ett bart pass. Batch15:s ägarblick föreslog redan att en namngiven närhet ska tvinga fram en
> skriven mening från grinden; batch16 visar vad som händer när ett förslag inte blir regel.
> **Gör det till regel:** när `ASSEMBLY.md` lämnar över en flagga med orden *disposition owed*
> ska G-REGISTER antingen skriva meningen eller returnera *not-applicable* med skäl. Ett bart
> pass går annars inte att skilja från "inte tittat på". Vill du i stället att banken ska hålla
> ett **minsta redigeringsavstånd** mellan påhittade efternamn är det ett annat och större
> beslut — det skulle träffa Löfgren/Lövgren retroaktivt och kosta en omgrindning av skeppade
> enheter för noll elevsynlig vinst.

## 4. las-b16-002 — de två bokförda resterna

**F2 · stycke 6:s ytstöd för distraktor C — buret sedan runda 4, ej åtgärdat.**
Passagens sista rad lyder: *"Vårterminens turer är redan lagda, och de ser likadana ut vare sig
avståndsgränsen dras vid två eller tre kilometer."* Läst utan att begränsa anaforen påstår den
att ingen tur skiljer sig med gränsen — vilket är precis vad q:2:s distraktor C påstår
(*"Ingen av de tjugotre morgonturerna skulle gå att korta om gränsen höjdes."*). Stycke 3
förnekar det genom att namnge två stickvägar vars avstickare "skulle gå att stryka ur
turplaneringen".

Granskaren re-kontrollerade tre motskäl på skeppade byte: *de* är anaforiskt till **Vårterminens
turer** — redan lagda, alltså identiska hur som helst — vilket är ett tidsmässigt och
administrativt påstående, inte C:s kontrafaktiska; q:2:s stam skopar frågan till
adressgenomgången i stycke 3, där C är rakt refuterad; och **empiriskt föll ingen lösare för
den** — alla fyra färska G-KEY-poster namnger C och refuterar den på stickvägarna, och
G-STEM:s blindval är A. Kostnaden för att laga: en passageändring drar G-SPRÅK och G-REGISTER,
som just nu är protokollförda mot en byteidentisk passage.

**F4 · det ärliga blindgolvet.** Granskaren jagade fram en kanal **inget ben namngav**: q:2:s A
och D är arkets enda kvantifierade par på samma underliggande fråga, så en testvan läsare kan
stryka C på absolutism och sedan behandla {A, D} som den levande motsättningen. Nedskärningen
**tar slut utan avgörande** — båda bär samma slags gardering ("Nästan alla" / "De flesta"),
längsta alternativet pekar på B som läsaren redan strukit, och slutsatsbärandet delar 2–2.
**Ärligt värsta fall: 1-på-2, inte benets 1-på-3.** Autentiskt prejudikat är direkt:
host-ver1-2019-verb1-LÄS-011 och dess ver2-tvilling skeppar ett fullt 2×2-spegelrutnät i två
provversioner, vilket skär ned blint betydligt renare än detta.

> **REKOMMENDATION: GODKÄNN båda som burna — de är rätt dispositionerade.**
> F2 är den rätta sortens icke-reparation: kostnaden är en omgrindning av två grindar, vinsten
> är noll mot en distraktor som fyra oberoende lösare avfärdade utan att tveka. **Men lägg in
> granskarens skopning om enheten någonsin öppnas av annat skäl** — "och **de turerna** ser
> likadana ut …" — det är tre bokstäver och stänger anaforen för gott. F4 vill jag att du
> uttryckligen **kvitterar**: det är sällsynt att en granskare skriver ned sitt **eget** golv
> mot benets protokoll, och det är den siffran jag vill se citerad i policyn i ÄGARBLICK 1,
> inte den generösare.

## 5. elf-b16-003 — två levande majors, båda dispositionerade SHIP

**(a) G-STEM WORLD_KNOWLEDGE (audit N1).** Flaggan står **levande** i skeppningsenheten,
odischargad av någon textändring: en domänläsare som vet att positivt vindtryck mot fasaden
håller kvar vattnet på fuktspärrplåten tills tryckskillnaden försvinner plockar D utan att läsa
passagen. Granskarens disposition: **SHIP.** Skälen: grinden dömde själv *flag* och inte *kill*;
genvägen kräver specialiserad byggnadsteknisk yrkeskunskap som ingen svensk HP-skrivande
förutsätts ha; och **lekmannaversionen av samma intuition är konstruerad att peka på A** — "the
wind forces the water out" — som är fel. Enheten redovisar detta i klartext i `stem_lexis_note`.

**(b) G-REGISTER genremajor.** Levande på slutmeningen: "the implied reader is a practising
surveyor deciding what to record on an inspection, not the general educated reader the
short-ELF exemplars address … opens cold inside the trade … stacks window head / cavity / tray /
stop end / outer skin unglossed." Grinden avslutar dock själv med **"Sits at the edge of the
exemplar genre range rather than outside it; adjudication decides."** Enheten dispositionerade
den i runda 3 utan textändring — och runda 5 gjorde något ovanligt: den **rev det egna
kostnadsargumentet**. Den ursprungliga motiveringen ("Any real fix is a passage rewrite that
would invalidate the physics verification and every declared statistic") var **falsk**, och
runda 5 lät den stå läsbar, citerade den vid läspunkten och ersatte den med sanningen: batchen
glossar exotiska termer genom att **lägga till glosrader efter bylinen** (elf-b16-001 gör det
med *véraison* och *glycoside*, elf-b15-001 med *isolate* och *plaque*), så en rad
"stop end = …" hade inte rört en enda mekanismmening. Rutten avvisas alltså **på sakskäl**:
*stop end* är den enda term frågan aldrig rör, den sitter i en felmodsklausul uppgiften inte
testar, den är sammansatt engelska snarare än ett ogenomskinligt latinskt lån av det slag
glosskonventionen finns till för, passagen visar redan vad en saknad sådan gör — och en glosrad
skulle inte adressera grindens **faktiska** invändning, som är den kalla in-i-branschen-öppningen
och den underförstådda besiktningsmannaläsaren.

Kringliggande fakta värda att ha när du bestämmer: fk_grade **8,7** mot blueprintens 11,0–15,0,
men femte lägst av **31** skeppade ELF-korttexter (spann 7,0–16,2) — alltså inne i fördelningen,
och redovisad. Mekanismen är dessutom **oberoende korroborerad mot en källa utanför enhetens egen
lista** (Cavity Trays Ltd: "wind pressure can prevent evacuation and cause water to be trapped"),
uttryckligen därför att batch15:s TYPE-001-kort refuterades för att ha ställt sin fysik bakvänd.

> **REKOMMENDATION: bekräfta (a). ÄGARBESLUT på (b).**
> (a) är rätt dispositionerad och jag skulle inte röra den: en genväg som kräver
> byggnadspatologi men vars lekmannaform pekar fel är en **konstruktionsstyrka**, inte en läcka,
> och den ligger i samma klass som de tre WORLD_KNOWLEDGE-flaggorna på las-b16-001 som du redan
> ser i listan ovan.
> (b) är genuint din: grinden lade den på **kanten** av exemplarspannet och överlämnade
> avgörandet. Sakligt håller jag med enheten — rösten är intern konsekvent brittisk fackprosa
> utan vare sig vardagsspråk eller klickbete, fyra av fem termer är funktionellt glossade in
> situ, och en glosrad hade inte lagat det grinden faktiskt klagar på. **Men om du vill att
> ELF-korttexterna ska orientera en lekmannaläsare i första satsen — vilket är vad båda de
> citerade autentiska exemplaren gör — är den här enheten den som ska visa det, och då är
> beslutet "avvisa och regenerera i batch17", inte "lägg till en glosrad".** En glosrad köper
> ingenting.

## 6. Layer-2-renderspecen — snake_case, *hedgat* och grindintern metakommentar

`audits/las-b16-002.json` F5 mätte det i stället för att gissa. I `rationale`-fältet — det fält
`GENERATION.md` rad 266f uttryckligen kallar "Layer-2 explanation source material downstream"
— ligger tre saker som **inte får gå vidare till elevtext**:

1. **snake_case-taxonomietiketter inuti svenska meningar**: "B är `unsupported_causality` och den
   intuitiva fällan", "C är `overgeneralisation`", "D är `scope_shift`", "A är `detail_as_main`".
   Prevalens över hela P5-banken: **112 av 114 enheter**.
2. **anglicismen *hedgat*** ("Påståendet är hedgat (”nästan alla”) och avgränsat …"):
   **30 av 114 enheter**. Native svenska: *reserverat*, *med förbehåll*, *avgränsat*.
3. **grindintern metakommentar**, ny i batch16 (`audits/elf-b16-003.json` N5): rationalen
   innehåller nu meningar som "the round-2 version of this paragraph claimed the same conclusion
   without having earned it" och "mech.py's absolutiser list holds none but not nothing, so
   M-FORM measured only A and passed". Helt korrekt i ett adjudikationsartefakt — och
   diskvalificerande i elevtext.

**Det goda beskedet, också mätt:** den skeppade elevvända butiken
`/home/loucmane/dev/hpfetcher/data/explanations/` innehåller **ingen** av `scope_shift`,
`overgeneralisation`, `detail_as_main`, `plausible_worldknowledge` eller `hedgat`. Nedströms
renderingen bär dem alltså redan inte — men den egenskapen är **odokumenterad**.

> **REKOMMENDATION: GODKÄNN enheterna — och skriv in det i renderspecen, en gång, bankvis.**
> Att laga en enhet vore fel: det bryter bankens interna konsekvens i 1 av 114 filer och river
> den taxonomi grindarna joinar på. Skriv i stället tre rader i renderspecen: (i) strippa eller
> översätt snake_case-etiketter, (ii) ersätt *hedgat/hedgad/hedgar* med native svenska, (iii)
> **strippa hela heuristik- och metakommentarsektioner** ur rationalen innan elevprosa alstras —
> punkt (iii) är ny i den här batchen och är den farligaste av de tre, eftersom den läser som
> vanlig prosa och inte som en etikett. Vill du ha en kontroll som håller: lägg en enkel
> lint i importsteget som fäller på snake_case-tokens och på `hedgat` i renderad elevtext.

## 7. Lag 16 — degraderad igen, men den här gången delvis inlöst

**Vad som hände vid generering.** Sessionens WebSearch-budget var slut (200/200) innan
namnkontrollerna började — i flera fall redan vid första anropet. **Samtliga sju generatorer
körde därför alla lag 16-kontroller via Exa** (semantisk sökning, inte exakt frassökning), plus i
några fall en direkthämtning av svenska Wikipedias söksida. Alla sju loggade omkörbart och
**ingen intygade**: formuleringen "FLAGGED FOR V-FINAL RE-VERIFICATION, not certified" återkommer
i unit efter unit, och las-b16-001:s generator skrev rakt ut "NAMNET BÖR OMPRÖVAS AV V-FINAL mot
Lantmäteriets ortnamnsregister, som inte gick att nå i den här sessionen".

**Vad runda 3 faktiskt gjorde — och det är mer än batch15 klarade.** Två av de tre omgjorda
metagranskningarna körde **färska omkontroller med rätt verktyg**:

| enhet | omkontroll | resultat |
|---|---|---|
| **elf-b16-003** | Exa, `"Pellowden" surname person`, 10 träffar | **0 bärare** av strängen. Varje träff var Pellow / Pellowe / Pellew / Pellen. Ingen bärare inom bygg, besiktning eller angränsande yrke. Regel 8: *Rhoswen* saknas i 214-namnslistan. Regel 9: fullnamnet saknas i uteslutningslistan. **PASSERAR.** |
| **las-b16-002** | sv.wikipedia CirrusSearch, **exakt fras**, plus OSM Nominatim, bank- och korpusgrep | `%22Flarkbro%22` → 0, `%22Brantmyr%22` → 0, `%22Näversved%22` → 0. **POSITIV KONTROLL på samma endpoint i samma session:** `%22Flarken%22` → 56 träffar, topp "Flarken, Luleå kommun" — indexet upplöser alltså små verkliga svenska orter, så de tre nollorna är informativa. Nominatim `Flarkbro&countrycodes=se` → 0. I banken: `Flark` 0 utanför enheten. I den autentiska korpusen (27 prov): 0/0/0/0. **INLÖST.** |

**Fem av sju enheter fick ingen omkontroll alls.** las-b16-001:s metagranskning gjordes om, men
**utan** verklighetsavsnitt — den nämner *Sölvinge* och *Vrenmark* en gång vardera utan att köra
en fråga. Följande vilar fortfarande enbart på generatorns egen Exa-sökning:

| enhet | namn utan omkontroll | generatorns egen reservation |
|---|---|---|
| elf-b16-001 | Pemberdine, Quennerly, Kettlestrand | "NOTHING here is certified"; fullnamnet *Corin Pemberdine* **aldrig sökt som par** — bokfört som en slutledning, inte en körning |
| elf-b16-002 | Orrenshaw, Kester | en verklig bärare av efternamnet finns (Molly Orrenshaw, minnesrulla i Evesham Journal 2013), **ingen inom journalistik** |
| elf-b16-004 | Owlerby, Skellorne, Hemblow | *Skellorne* är ett **belagt** sällsynt engelskt efternamn (Hugh Skellorne, Prestbury c. 1583); ingen känd bärare, inget fullnamn |
| las-b16-001 | Sölvinge, Vrenmark, Rundhage | "NAMNET BÖR OMPRÖVAS AV V-FINAL mot Lantmäteriets ortnamnsregister" |
| las-b16-003 | Malmgärde, Bjärnmo, Slåtterlund, Hyllemåla, Rossmåla, Skarpbo | "NOT a certificate: small Swedish hamlets are often absent from Wikipedia, and no Lantmäteriet query was run" |

**Och en falsk härkomstmening som fortfarande står i skeppade byte.** elf-b16-001:s
`originality_note` påstår att "a sibling batch16 unit (gen-elf-short-2) independently took
'Brindlow' for its byline". Det gjorde den inte: elf-b16-004:s byline är *Aveline Hemblow*, och
det var **elf-b16-003:s** generator som förkastade *Brindlow* — på en levande kollision i samma
bransch (Robert Brindlow, projektsamordnare på Vent-Axia, en brittisk ventilationstillverkare).
Utfallet är rätt, det angivna skälet är fel. Det är exakt den sortens mening som låter nästa
V-FINAL stänga en namnkontroll utan att köra om den; batch15 hade sin motsvarighet i
Malmryd-liggaren.

> **REKOMMENDATION: GODKÄNN enheterna — och lös in resten separat, precis som i batch15.**
> Ingenting här är en blockerare: alla sju loggar är omkörbara, ingen verklig person tillskrivs
> ord, ingen institution eller publikation namnges, och den enda fullständigt belagda bäraren
> (*Skellorne*) är en 1500-talsgenealogisk post utan domänöverlapp. **Tre saker bör göras, och
> ingen av dem rör en skeppad byte:** (i) en exakt frassökning över de ~20 fullnamnen ovan när
> en WebSearch-budget finns — och **kör den mot las-b16-002:s metod**, som nu är den bevisade
> transporten: exakt fras + positiv kontroll på samma endpoint; (ii) rätta elf-b16-001:s
> Brindlow-mening till batch14:s form (*efternamnet finns / fullnamnet fritt / förkastat av
> syskonenheten X på grund Y*); (iii) sök *Corin Pemberdine* som par, eftersom det är den enda
> posten i batchen som uttryckligen är en slutledning i stället för en körning.
> Vill du i stället att lag 16 ska vara **intygad** och inte *best effort*, är det ett annat
> beslut — då håller batchen tills frassökningen är körd.

## 8. Batchövergripande — sju processluckor

**a) M-ECHO kördes inte i flottan, och mekaniken föregår tre av de sju skeppande filerna.**
`verdicts/verdicts-mech.jsonl` innehåller **35 poster = 5 grindar × 7 enheter** (M-SCHEMA,
M-BANDS, M-TELL, M-FORM, M-PLAGIARISM), körda 12:47. `candidates-final/` skrevs 13:18–14:38, och
**tre enheter ändrade elevriktad text efter den körningen**: elf-b16-003 (13:59), las-b16-002
(14:02) och las-b16-001 (14:38, den sista ändringen enbart metadata). Mildringar finns och de är
ojämna: elf-b16-003:s metagranskning körde **själv alla sex grindar på de exakta
skeppningsbytena** och fick pass rakt igenom; las-b16-002:s runda 5 rapporterar "the mechanical
legs are re-run in this round and all six pass" men lämnade **ingen verdict-fil**; las-b16-001:s
runda 3 rapporterar detsamma och skrev in de nya måtten i `convention_checks` (961 ord, 60
meningar), som metagranskningen räknade om och bekräftade.

> **REKOMMENDATION: GODKÄNN — och kör en enda additiv körning före import.** `run_mech.py` med
> alla sex grindar på `candidates-final/`. Den är skrivskyddad, ändrar ingen skeppad byte och
> stänger båda luckorna på en gång. Batch15:s motsvarande körning gav 42/42 och kostade
> ingenting. Går den igenom förändras ingenting; går den inte igenom vill du veta det före
> import, inte efter.

**b) Sju dubblettposter i den sammanslagna `verdicts.jsonl`.** Filen bär 47 G-KEY-poster men bara
**40 distinkta avgivna svar**: runda 3:s **ben 2** finns med två gånger, en gång med `vote: 2`
(från `verdicts-gkey-2v.jsonl`) och en gång utan `vote`-fält (från `verdicts-gkey-2.jsonl`).
Jag har jämfört post för post — `justification`-strängarna är identiska, det är samma ben. Inget
verdict ändrades, ingen post föll bort, ingen siffra i granskningen hänger på det. Men den
**råa** posträkningen i den kanoniska filen överskattar blindtäckningen med sju svar, och det är
den fil en senare läsare kommer att räkna i. Jag lägger fram det i klartext eftersom batch14 § 4c
och batch15 § 5d etablerade principen att röra ett fält en grind läser förtjänar upplysning även
när innehållet bevaras.

> **REKOMMENDATION: godkänn i efterhand — och fixa uppströms.** Benfilerna ligger kvar bredvid
> och är kontrollerbara. Sammanslagningen bör deduplicera på
> `candidate_id + target + executed_by + justification`, **eller** — bättre — ska benskrivaren
> tvingas emittera `vote` vid källan, så att `-1`/`-2` och `-1v`/`-2v` aldrig blir två
> parallella filfamiljer som båda är kvalificerade för sammanslagning. Räkningen **174/174 över
> tio unika ben** ovan är gjord på ben, inte på filer, och är opåverkad.

**c) `report-final.json` bär ett föråldrat G-SPRÅK-citat, och en skeppad reparation saknar
loggrad.** las-b16-001:s flagga citerar "vattnet i klumparna frös, **vidgade** sig och sprängde
sönder dem". Skeppad passage läser "**utvidgade** sig" — grindens egen native alternative,
tillämpad i språkpasset. Citatet finns alltså inte i skeppade byte. Enheten är ren; aggregatet är
historiskt. Men samma ändring står i **ingen `repair_log`** — den kom in mellan `candidates/`
och `candidates-corrected/` och las-b16-001:s logg dokumenterar bara rundorna 3 och 3b. Det är
ett skeppat elevriktat ord utan loggrad, i den enhet vars runda-2-fällning handlade om just
protokoll som inte matchar byten. (Metagranskningen fångade samma klass av fel mot `report.json`
som F7.)

> **REKOMMENDATION: GODKÄNN — och lägg en retroaktiv loggrad.** Enheten är riktig och alla tre
> färska G-SPRÅK-körningar gav noll fynd på de reparerade byten. Men append-forward-principen är
> hela poängen med `repair_log`, och elf-b16-002 visade i runda 3 hur en retroaktiv rad ska se
> ut ("reconciles an edit made between `candidates-corrected/` and `candidates-final/` for which
> no entry was appended at the time"). Gör samma sak här. Bygg om `report-final.json` i samma
> veva, eller lämna det med en rad som säger att aggregatets citat är daterade.

**d) elf-b16-001:s två burna runda-1-poster.** Båda står ordagrant kvar i skeppade byte, och
runda-2-protokollet bär ingen notpayload som visar att de adjudicerades snarare än missades:
(1) den falska Brindlow-härkomstmeningen (→ ÄGARBLICK 7); (2) passagen säger att odlarna jäser
fem kilo "**the week before picking**" och att "**ten days** of that is the shortest honest test
anybody has" — sju dagars framförhållning rymmer inte ett tiodagarsminimum. Ingen nyckel hänger
på någondera.

**e) En G-STEM-major vars blindval landar på fel svar.** elf-b16-001 q:2 bär en levande
WORLD_KNOWLEDGE-major, men benets `blind_pick` är **A** och nyckeln är **D**. Runda 1:s ben läste
samma uppgift åt motsatt håll ("a domain reader leans D"). Under pipelinens egen logik är ett
blindval som hamnar på en distraktor en **missfyrning**, inte en läcka — det är samma resultat
som elf-b16-003:s runda-5-reparation firades för. Ändå bärs flaggan vidare till
`report-final.json` som en levande major, och ingen etapp har skrivit ned motsägelsen.

> **REKOMMENDATION för d + e: GODKÄNN — och kräv en skriven mening.** Batch15:s ägarblick
> föreslog "en skriven mening per levande major-flagga före promote". Batch16 har **tio** levande
> G-STEM-majors och **tre** skrivna dispositioner (elf-b16-003:s N1, las-b16-002:s F3, och
> las-b16-001:s F4). Kostnaden för resten hade varit sju meningar. **Börja med (e)**, eftersom
> den inte bara saknar disposition utan sannolikt är felklassad: ett ben som blindgissar fel bör
> inte lämna en major på uppgiften.

**f) Fyra enheter fick ingen runda-3-benvåg.** elf-b16-001, elf-b16-002, elf-b16-004 och
las-b16-003 vilar på runda 2:s ben. Det är rätt beslut — deras elevriktade byte är oförändrade
sedan dess — och jag har maskinellt kontrollerat att **alla sju enheters `blind/`-, `stems/`- och
`distractor/`-ark är byteidentiska med `candidates-final` på passage, stam, samtliga
alternativtexter och nyckel** (21 av 21 jämförelser). Det var precis den kontrollen som fattades
när las-b16-002:s falska stängning överlevde två rundor: dess `stems/`-ark var föråldrat, och
inget G-STEM-ben hade någonsin läst det alternativset stängningen handlade om.

> **REKOMMENDATION: gör arkssynk-kontrollen obligatorisk.** Den tar sekunder, den är
> skrivskyddad, och den är den enda kontroll i hela pipelinen som skulle ha stoppat batchens
> dyraste fel vid källan i stället för två rundor senare.

**g) las-b16-003:s tre G-SPRÅK-minorer är levande på samma mening.** Alla tre benen i runda 2
fällde **"Stommen bär bara skelettet."** som tautologisk mot enhetens **egen ordlista**
("stomme = … alltså skelettet"), och metagranskningen fäller samma sak som språkminor med
tillägget att ordlistereparationen i runda 2 var det som **skapade** cirkeln. Enheten fick ingen
runda-3-omkörning, så meningen står orörd i skeppade byte. Grindens native alternatives:
"Stommen **för** bara skelettet **vidare**." eller "Stommen bär bara **formen**."

> **REKOMMENDATION: ÄNDRA — det här är den enda posten i batchen jag skulle be dig ändra på.**
> Tre oberoende språkben och en metagranskare pekar på samma mening, den är **elevriktad**, den
> är i praktiken obegriplig för precis den nolkunskapsläsare ordlistan finns till för, och den
> bär q:2:s nyckel ("medan lövningen kunde läggas om på nya sätt"). Fixen är fyra tecken:
> "Stommen för bara skelettet vidare." Den drar en G-SPRÅK-omkörning på en enhet — billigast
> tänkbara omgrindning i hela batchen. Vill du hellre skeppa som det står är det försvarbart
> (den figurativa läsningen är återvinningsbar och grinden kallade det taste-level), men då bör
> beslutet skrivas ned, inte bäras vidare tyst till batch17.

---

# Svarsinstruktion

Svara fritt. Exempel:

- **`godkänn alla`** — batchen går in i banken som den står, alla åtta ÄGARBLICK-punkter
  godkänns enligt rekommendation.
- **`godkänn alla utom las-b16-003`** — sex enheter in nu, en till ändringsvåg.
- **`ändra las-b16-003: Stommen för bara skelettet vidare`** — punktvis instruktion; en
  omgrindningsomgång per berörd enhet.
- **`avvisa elf-b16-003`** — enheten pensioneras och regenereras i batch17 (relevant om du
  landar på att ELF-korttexter måste orientera en lekmannaläsare i första satsen, ÄGARBLICK 5b).
- **`anta stance-policyn`** / **`anta stance-policyn med golvet 1-på-2`** — ÄGARBLICK 1.
- **`laga _ABSOLUTIZERS, hela familjen, egen körning`** — ÄGARBLICK 2.

Blandat svar går bra: en rad per enhet, plus en rad per batchövergripande punkt. Vill du att lag
16-frassökningen och den sexgrindiga mekanikkörningen ska köras **före** import, räcker det att
skriva `kör ut skulderna först`.

---

## Tillägg (orkestrator, 2026-08-28): mekanisk adjudicering körd

Stage 11:s formella maskineri är nu kört på denna batch: färsköga-läsare
(blindark, utan pipelinehistorik) → `adjudication-evidence/` per enhet,
triagerad flaggfil (`adjudication-flags.json`: granskningsfynd + levande
grindflaggor med ordagranna severiteter) → `adjudicate_fold.py` →
`reviews/adjudication.jsonl`. Utfall, härlett av regel — inte av agent:

**Samtliga sju enheter: GODKÄNN_NOTED. Kalläsarlösning 20/20 mot nycklarna.
Noll läsarblockerare; alla enheter "makes_sense", naturlighet natural (en minor_friction: las-b16-002:s omarkerade jag-inträde).**

Foldens dispositionsregel (kodad, ej improviserad): grindkällade flaggor på
en skeppad enhet är redan adjudicerade av batchpipelinen (promote släppte
enheten med flaggan i protokollet) och ytar som anteckningar; endast
icke-grindkällade majorer, läsarblockerare eller kalläsningsmissar
eskalerar till ÄGARBLICK — inga fanns. ÄGARBLICK-punkterna ovan i detta
paket kvarstår som ägarens beslutsyta; den mekaniska rekommendationen
per enhet är GODKÄNN_NOTED.

---

## ÄGARDOM (2026-08-31): KÖR UT SKULDERNA FÖRST — ingen bankimport ännu

Ägarens paketdirektiv, fört till protokollet: batch 16 får ingen blank
`godkänn alla`; en innehållsstängningsbead (**hpf-gehr**) och en separat
pipeline-härdningsbead (**hpf-y1p4**) kör ut skulderna före import. Därefter
ny ytregenerering + deterministisk vikning; står enheterna kvar på 7/7
GODKÄNN_NOTED godkänns paketet och infoldning sker.

### Dom 1 — las-b16-002 GODKÄND; stance-kompositionspolicyn ANTAGEN (ÄGARBLICK 1 + 4)

Enheten godkänns med båda burna resterna (F2-anaforen, F4-blindgolvet) som
rätt dispositionerade. **Bankpolicy antagen**, med ägarens skärpning av
villkor (a) till en redovisad siffra:

> Stance-composition skew in single-author opinion passages (no option
> asserting the position the author is arguing against) is WITHIN TOLERANCE
> and is not a repairable structural leak. Cross-question stance correlation
> is REPORTABLE at note severity but does not block, provided (a) the
> adversarial blind floor is stated explicitly **and is no better than
> 1-in-2**, and (b) rule 10 holds. G-STEM should continue to name it;
> adjudication should not treat it as an open major.

Golvet 1-på-2 är därmed uttryckligen **kvitterat** som den siffra policyn
citerar — granskarens eget ärliga värsta fall, inte benprotokollets 1-på-3.
Policyn är också förd som daterat efterhandstillägg i den senaste
BRIEF-ADDENDUM-kedjan (batch17) för nästa batchs generatorer.

### Dom 2 — Quennerby/Quennerly GODKÄNT PAR, skriftlig disposition (ÄGARBLICK 3)

**Skriftlig disposition, förd här som grindens saknade mening:** *Verity
Quennerby* (elf-b15-002, veckokolumnist, bysamhällsessä) och *Tamsin
Quennerly* (elf-b16-001, sensorikforskare, vetenskapsjournalistik) är olika
gestalter i olika roller i olika batchar; ingen elev möter båda i samma
provpass; banken skeppar redan närmare par (Löfgren/Lövgren). **Inget namn
byts.** Processregeln — att `ASSEMBLY.md`-flaggan *disposition owed* ska
tvinga fram en explicit G-REGISTER-disposition eller *not-applicable* med
skäl — antas och implementeras som källarbete i härdningsbeaden hpf-y1p4.

### Dom 3 — elf-b16-003: båda burna fynden GODKÄNDA, explicita SHIP-dispositioner (ÄGARBLICK 5)

- **(a) G-STEM WORLD_KNOWLEDGE — SHIP, bekräftad:** genvägen kräver
  specialiserad byggnadspatologi; **lekmannaversionen av samma intuition
  pekar på fel svar (A)**, vilket gör kanalen till en konstruktionsstyrka,
  inte en läcka. Redovisad i enhetens `stem_lexis_note`.
- **(b) G-REGISTER-genremajor — SHIP, accepterad vid kanten av genrespannet:**
  den korta tekniska ELF-texten accepteras som liggande *på* exemplarspannets
  kant (fk 8,7; femte lägst av 31 skeppade korttexter, inne i fördelningen);
  rösten är konsekvent brittisk fackprosa och mekanismen externt korroborerad.
  **Ingen kosmetisk glosrad läggs till** — den skulle inte adressera grindens
  faktiska invändning (den kalla in-i-branschen-öppningen).

### Dom 4 — ÄNDRA las-b16-003 (ÄGARBLICK 8g)

»Stommen bär bara skelettet.« → **»Stommen för bara skelettet vidare.«**
(grindens eget native alternative; upplöser tautologin mot enhetens egen
ordlista som tre oberoende G-SPRÅK-ben och metagranskningen fällde).
Passagen + det exakta rationale-citatet i Q2 synkroniserade;
append-forward-noter i `self_blind_solve` och `repair_log`; blind- och
distraktorark regenererade (stems-arket bär ingen passage). Omkörning av
enhetens ben + adversariell granskning + vikning + slutverifikation
redovisas i stängningssektionen nedan.

### Dom 5 — lag 16-frassökningen (ÄGARBLICK 7)

Exakt frassökning + positiv kontroll på samma endpoint (las-b16-002:s
bevisade transport) körd 2026-08-31 över samtliga ännu ointygade namn,
inklusive **Corin Pemberdine som fullständigt par** (batchens enda post som
var en slutledning i stället för en körning). Den falska
Brindlow-härkomstmeningen i elf-b16-001:s `originality_note` är rättad
append-forward till batch14-formen (falsk mening kvar ordagrant,
korrektionsblock direkt efter, repair_log-post). Resultattabell i
stängningssektionen nedan; stoppregel vid relevant kollision.

### Dom 6 — sexgrindig mekanik inkl. M-ECHO (ÄGARBLICK 8a)

`run_mech.py` med alla sex grindar (M-SCHEMA, M-BANDS, M-TELL, M-FORM,
M-PLAGIARISM, M-ECHO via `--p5-corpus-dir auto`) över samtliga sju enheters
slutliga skeppningsbyten. Krav: **42/42 eller stopp.** Resultat nedan.

### Dom 7 — bokföringsskulderna append-forward (ÄGARBLICK 8b–8f)

1. `verdicts.jsonl` dedupliceras på `candidate_id + target + executed_by +
   justification` med röstbärande post bevarad — inga distinkta röster
   förloras (8b).
2. Retroaktiv `repair_log`-rad för las-b16-001:s »vidgade« → »utvidgade«
   (8c), enligt elf-b16-002:s runda-3-prejudikat.
3. `report-final.json` byggs om ur de deduplicerade verdicts så att
   aggregatets citat matchar skeppade byten (8c).
4. **Skriftliga dispositioner för burna levande majorer** — se nedan (8d/8e).
5. Arkssynk-beviset (blind/stems/distractor mot candidates-final) omkört
   maskinellt efter reparationerna och protokollfört (8f).

### Skriftliga dispositioner — burna levande G-STEM-majorer (dom 7.4)

Redan skriftligt dispositionerade sedan tidigare: elf-b16-003 q:1 (audit N1),
las-b16-002 q:1 (stance_channel_ruling), las-b16-001 q:3 (audit F4). Härmed
förs de saknade meningarna, en per levande major:

- **elf-b16-001 q:2 — OMKLASSAD TILL MISSFYRNING (8e):** benets blindval är
  A, nyckeln är D; under pipelinens egen logik är ett blindval som landar på
  en distraktor en missfyrning, inte en läcka (samma utfall som
  elf-b16-003:s firade runda-5-reparation). Flaggan bärs som note-klass
  kalibreringsobservation, inte som öppen major.
- **elf-b16-001 q:1 — SHIP:** blindvalet är null (lutar B/D utan avgörande);
  domänkunskap smalnar men avgör inte, och lekmannaläsaren har ingen väg
  till nyckeln på form.
- **elf-b16-001 q:3 — SHIP:** formtellen (enda absoluten i B, svepande D)
  smalnar till {A, C} men blindvalet C är fel mot nyckeln — kanalen
  missfyrar snarare än läcker även här.
- **elf-b16-003 q:1 (residualsmalning 3–1) — SHIP:** riktningsfördelningen
  är en mjuk prior utan mekanism; strip-the-absolutes-omkörningen efter
  B-omskrivningen isolerar ingenting.
- **las-b16-001 q:1 — SHIP:** kalkblåsning är läroboksbyggnadspatologi för
  en domänläsare, men lekmannaformen av intuitionen ger ingen entydig
  kandidat; blindvalet C sammanföll med nyckeln i ett enskilt ben utan
  reproducerbar väg.
- **las-b16-001 q:4 — SHIP:** Hoffmannugnens värmeåtervinning är
  domänkunskap av samma klass som ovan; fyra färska kalläsningar löste
  frågan ur passagen utan genvägen.
- **las-b16-002 q:2 (residualblindgolv) — SHIP med citerad siffra:** det
  ärliga värsta fallet är **1-på-2** (A/D-paret efter formeliminering av C),
  vilket är exakt golvet den antagna bankpolicyn (dom 1) kräver redovisat;
  autentiskt prejudikat host-ver1-2019-verb1-LÄS-011 skär blint renare.
- **las-b16-003 q:2 — SHIP:** blindvalet är null (lutar D); lutningen är en
  prior ur alternativens kausala styrkegrad, ingen mekanism; fyra färska
  kalläsningar nådde D endast via passagen.
- **elf-b16-001:s två burna runda-1-poster (8d):** Brindlow-meningen är
  rättad (dom 5); vecka-före-plockning mot tiodagarsminimum står kvar som
  redovisad intern spänning i en felmodsklausul ingen fråga rör — SHIP utan
  textändring, härmed skriftligt dispositionerad.

---

## SKULDSTÄNGNINGENS UTFALL (2026-08-31): 6× GODKÄNN_NOTED + 1 ÄGARBLICK

Samtliga sju domar verkställda under bead **hpf-gehr**, med all delegerad
granskning routad genom Gas City (evidence-reviewer, report-only,
sekventiella lanes med allowlist/claim/drain-bevis per lane; körningar
`hpf-gehr-*-20260831-001` i evidensträdet). De två tidigare
claude-native-lag-16-rapporterna är bevarade med ärlig proveniens
(`hpf-gehr-law16-claude-native-20260831-001/PROVENANCE.md`) och är nu
KORROBORERANDE, inte ensam evidens.

| Dom | Utfall |
|---|---|
| 1–3 (dispositioner) | Förda; G-REGISTER-dispositionsposter utlöser alla tre *disposition owed*-markörer (härdad grind: OK 3/3) |
| 4 (stommen) + Skarpbo→Vrantebo | Kombinerad benvåg via GC: G-KEY ×2 båda **B, D** (= nycklarna, gkey_resolve 4/0); G-DISTRACTOR pass/pass (B-fallet dör på reparerade gränsen); G-SPRÅK ×3 pass, noll fynd (ny mening idiomatisk, ej tautologisk; Vrantebo trovärdigt); G-STEM PARTIALLY ×2 med val = nycklar (kalibreringsknippet) |
| 5 (lag 16) | Alla namn friade utom Skarpbo (verklig småort, Enköping) → ÄNDRA verkställd till **Vrantebo** (exakt fras 0/0 + positiv kontroll, bank/repo/korpus 0, variantsond 0×5); GC-bekräftelselanen KONFIRMERAR kollisionen ur rådata och graderar Vrantebo provisoriskt fri — kvarstående dokumenterad residual: gazetteer bortom OSM/Wikipedia (Lantmäteriet/GeoNames) ej nåbar i sessionen |
| 6 (mekanik) | **42/42 pass** — sex grindar inkl. M-ECHO (114 enheter indexerade), körd med den HÄRDADE mech (utökad absolutiserarfamilj) på slutliga skeppningsbyten |
| 7 (bokföring) | Dedup 157→150 utan röstförlust; retroaktiv loggrad (vidgade→utvidgade); `report-final.json` ombyggd ur kontraktsmergen (172 poster, 35 legacy-kopior kollapsade); skriftliga dispositioner för alla burna majorer; arkssynk-bevis (härdad grind) OK 14/14 över batch16+17 |

**Vikning (×2, bytreproducerbar): 6× GODKÄNN_NOTED + las-b16-003 ÄGARBLICK.**
Eskaleringen kommer ur den adversariella GC-lanens critical (extern evidens,
ingested med proveniens): q:2 B påstås ha en yttre-minnes-läsning jämte
nycklade D, plus major på q:1:s »grannbyn«-kvalifikator. **Motevidens i
samma våg:** båda blinda benen valde D och refuterade B aktivt; counsel-
B-fallet dog på den reparerade styckesgränsen. Ägardom krävs — mekaniken
avgör inte tvisten. Paketet går INTE till godkännande/infoldning förrän
ägaren dömt (villkoret »7/7 GODKÄNN_NOTED« är inte uppfyllt).

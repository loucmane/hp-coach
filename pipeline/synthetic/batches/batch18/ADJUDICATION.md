# Batch 18 — adjudikationspaket (2026-09-01)

**7 enheter / 20 frågor.** Kanonisk form: LÄS 4+2+2, ELF 5+5+1+1 — samma leveransform som
batch15–17. Alla sju skrevs under `BRIEF-ADDENDUM.md`: batch17:s addendum, efterhandstilläggen
av 2026-08-31 och batch18-supplementets fyra nya bindande regler — **RULE 11** (inga
korsfrågebryggor mellan alternativuppsättningar), **RULE 12** (stammen får inte medföra något
alternativ), **RULE 13** (stiltell-klustring; M-FORM:s absolutizer-familj deklarerad
fullbordad), **RULE 14** (den beprövade lag-16-transporten med envariantsprobning och
positivkontroll i samma session).

Pipelinen är färdig och ren: promote `--require-clean` **PASS 7 / HOLD 0**, vikning **7×
VERIFIED_NOTES**, metagranskning **7× CONFIRMED_NOTES med noll majors**, färska V-FINAL-ben
**G-KEY 2×20 enhälliga, 40 avgjorda, noll kills** och **G-DISTRACTOR 19 pass / 1 flagga / 0
kills**, stage-11-kalläsning **20/20 mot nycklarna** utan en enda läsarblockerare.
**Ingen bankimport har skett.** Den fullständiga faktaledgern ligger i `STATUS.md`.

---

## PAKETDOM — begäran

| enhet | titel | rekommendation | nyckelfynd (en rad) |
|---|---|---|---|
| **elf-b18-001** | Under the Flags *(ELF long, 5 frågor)* | **GODKÄNN_NOTED** | V-FINAL-flagga på q:1/C (»almost«-hedgen) plus en ny färskögasöm i Fearnbecks sand/murbruk-invändning; tre reparationsrundor, noll nyckelrörelse |
| **elf-b18-002** | Left to Soak *(cloze, 5 luckor)* | **GODKÄNN_NOTED** | Enda enheten med granskningskedja REFUTED→REFUTED→CONFIRMED_NOTES; VF-19-residualen (fyra tyst raderade lag-15-delpåståenden) bärs som noterad rest |
| **elf-b18-003** | Hair and Lime *(kort, 1 fråga)* | **GODKÄNN_NOTED** | Tre källattributionsminorer i mekanismnoten rättade i fleet-repair-4; G-STEM-major (WORLD_KNOWLEDGE, blindval = nyckeln) buren som kalibreringsevidens |
| **elf-b18-004** | Sittings to Let *(kort, 1 fråga)* | **GODKÄNN_NOTED** | STINTBURY~SAINTBURY — batchens enda post metagranskningen eskalerade till ägaren; passage, stam, alternativ och nyckel bytidentiska sedan generering |
| **las-b18-001** | Kalkugnarnas landskap *(LÄS long, 4 frågor)* | **GODKÄNN_NOTED** | G-SPRÅK 3-av-3-kill (»bränndes«) och två G-STEM-kills reparerade i runda 1–2; pedagogik-HOLD urladdad; enheten är ena halvan av lane-clone-paret |
| **las-b18-002** | Fel timmar att spara in på *(debatt, 2 frågor)* | **GODKÄNN_NOTED** | Språk-HOLD urladdad sedan fleet-repair-3c rättat en fras 3b hade förstört; två falsifierade blindgolvshärledningar bokförda som metadata |
| **las-b18-003** | Sätena i kyrkbåten *(essä, 2 frågor)* | **GODKÄNN_NOTED** | Pedagogik-HOLD urladdad via granskningens motanalys; en korsfrågeblindrutt bokförd som note; fyra svenska kollokationsminorer skeppar oreparerade |

**Din dom, i klartext.** Paketet begär ett av fyra utfall:

- **`GODKÄNN PAKETET`** — alla sju går in som **GODKÄNN_NOTED**, hela beslutslistan nedan
  godkänns enligt rekommendation, och batchen förbereds för deterministisk bankinvikning.
- **`GODKÄNN_NOTED <enhet>`** — enhetsvis godkännande med noterna bevarade; blandat svar går bra.
- **`ÄGARBLICK <enhet>`** — enheten lyfts ur den mekaniska rekommendationen och hålls för din
  egen läsning innan den kan skeppa.
- **`ÄNDRA <enhet>: <instruktion>`** — punktvis ändring; en omgrindningsomgång per berörd enhet,
  append-forward genom befintlig adjudikationspipeline.

En rad per enhet plus en rad per batchövergripande post räcker.

---

# Ägarbeslutslista — sex poster

## 1. STINTBURY ~ SAINTBURY (elf-b18-004) — behåll eller döp om

**Substans.** Enhetens `originality_note` intygar som verifierat faktum att ingen verklig plats
ligger en bokstav från den uppfunna orten **Stintbury** — och räknar upp **Saintbury** bland de
grannar den friar. Saintbury är en verklig by och civil parish i Gloucestershire, den ligger på
Levenshteinavstånd **exakt 1** (position 2, a↔t), och den har en egen sockenkyrka: samma domän
som passagen, som handlar om en sockenkyrkas bänkplaner. Rule 14:s upplysning är alltså vänd
upp och ned. Generatorns egen envariantsprobning enumererade Stinbury, Sintbury och Stantbury —
alla korrekt noll — men hoppade över just den substitution som landar på en verklig plats.

**Vad som ändå håller.** Det exakta namnblockeringstestet **passerar på alla tre ben** med
godkända positivkontroller: en.wikipedia CirrusSearch 0, Nominatim `countrycodes=gb` 0,
Nominatim världsvitt 0, ingen exakt webbbärare. Granskningen körde dessutom ett fuzzy-svep som
**inte** returnerade Saintbury — envariantskollisionen går bara att hitta genom handenumerering,
vilket är en processlärdom i sig.

**Evidens:** `audits/elf-b18-004.json` → `findings[LAW16-1]` (`escalated_to_owner: 1`, den enda i
batchen); `law16_reverification` med kontrollerna Pellew 701 / Nether Stowey / Syd Dernley.
**Precedens åt båda håll:** batch16:s *Rossmåla* skeppade på ett diakritiskt tecken från verkliga
*Rössmåla* och står i do-not-reuse-registret; batch16:s *Skarpbo*, som var en **exakt** träff,
döptes om till *Vrantebo* på ägardom.

**Kostnad.** Namnet står **en enda gång i elevriktad text** (passagen) och noll gånger i stam,
alternativ eller rationale; övriga nio förekomster ligger i `generator_meta`, till största delen
i sökloggen. Inget i uppgiftens logik hänger på namnet. Enheten skeppar under
**do-not-rename-hold** i väntan på din dom — fleet-repair-4 rörde uttryckligen inte namnet.

**Färskögans sidoanteckning, samma enhet.** Efternamnet **»Tebbenholt«** läses som
lågländskt/tyskt snarare än viktorianskt engelskt — *»the one word that felt manufactured«*.
Granskningen bekräftar generatorns mätning: avstånd 2 till verkliga Tebbenhoff/Tebbenhof,
noterat men inte förkastat. Ingen åtgärd föreslås.
*(`adjudication-evidence/elf-b18-004.json` → `reader_notes[8]`.)*

> **REKOMMENDATION: din dom krävs — GODKÄNN_NOTED (behåll) är den vi bär fram.**
> Det som blockerar under regeln som blockerar passerar; Rossmåla-precedensen tolererar
> avstånd 1 när det är upplyst. Men upplysningen finns inte — den är **inverterad** — så minsta
> åtgärd vid ett *behåll* är att rätta den falska meningen i `originality_note` så att Saintbury
> står som en känd granne på avstånd 1, inte som friad. Väljer du **ÄNDRA** i stället är
> omdöpningen billig (ett ord i passagen plus noten) och kräver ingen omgrindning av uppgiften.

## 2. VF-19-RESIDUALEN (elf-b18-002) — fyra tyst raderade lag-15-delpåståenden

**Substans.** `fleet-repair-5` loggade två ändrade fält. I samma skrivning raderades **fyra
verifierat sanna lag-15-delpåståenden** ur `clone_note (e)` utan att nämnas någonstans: *»and it
is not 'The + modifier + noun'«*, *»four paragraphs against batch17's three«*, den utskrivna
sifferregistret-kontrasten mot batch17, och *»no glossary (law 15 variation) since the passage
uses no specialist term«*. Alla fyra hade prövats sanna och friats i runda 3. Ingen falsk
uppgift uppstod av raderingen, men lag-15-argumentet krympte till att bara handla om titeln, och
`edits`-arrayen är hela protokollet: `batch18/` är otrackad i git, så någon bytediff finns inte.

**Varför den inte återställdes.** `fleet-repair-6` bokför beslutet ordagrant: originaltexten
föregår git-spårningen och existerar bara via granskningens egen uppräkning, och *»rewriting it
fresh risks installing a third false claim«*. Fältet har redan fällt **två** installerade falska
universalier — VF-01 i runda 3 och VF-14 efter fleet-repair-4, där reparationen bytte en falsk
universalie mot en falsk universalie. En tredje rekonstruktion in i just det fältet är exakt den
risken igen.

**Evidens:** `audits/elf-b18-002.json` → `findings[VF-19]` (uppräkningen av de fyra strängarna
ordagrant, plus de två ologgade sökvägarna), `audit_history` (REFUTED → REFUTED →
CONFIRMED_NOTES), och `candidates/elf-b18-002.json` → `generator_meta.repair_log[fleet-repair-6].note`.
Ingen nyckel, stam, alternativ, prompt, rationale eller passagebyte berörs.

> **REKOMMENDATION: GODKÄNN — acceptera som noterad residual, ingen rekonstruktion.**
> Granskningens uppräkning **är** det varaktiga protokollet, och den ligger i en fil som skeppar
> med batchen. Att skriva tillbaka prosa som ingen kan verifiera mot ett original, i det enda
> fält som redan producerat två falska universalier, köper bokföringsprydlighet mot en verklig
> risk. Bär i stället kravet framåt som processregel: **`edits` måste vara mängden rörda sökvägar,
> inte ett urval.**

## 3. LANE-CLONE — lantliga eldhantverk i LÄS facktext-long-lanan

**Substans.** **Fyra av de sex senaste LÄS-long-platserna** är lantliga svenska värme- och
eldhantverk: las-b14-001 (kolmilor och tjärdalar), las-b16-001 (tegelbruk), **las-b18-001
(kalkugnar)** och las-b19-001 (blästbruk). Bara las-b15-001 (garveri) och las-b17-001
(tändsticksfabrik) bryter raden — och **de två sista ligger rygg mot rygg och är båda
ugnstitlade**. `ugn*`-räkning: b16-001 5, b18-001 19, b19-001 15; varenda annan LÄS-long i banken
noll. Mot las-b18-001 upprepas lanan drag för drag: en låg sten-/lerugn i en namngiven socken, en
arbetsrytm satt av frost och ved, en namngiven forskare som inventerat ugnsresterna i landskapet,
en experimentell rekonstruktion rest intill de utgrävda platserna, rester lästa som låga
övervuxna högar med en grop, en tre-fyra-termers hantverksglosa och en koda som daterar bruket.
Familjeuteslutningslistan fångade det inte, eftersom familjesträngarna skiljer sig.

**Statusen är viktig: fyndet är registrerat, uttryckligen *inte* adjudicerat.** Grinden märkte
det **OWNER-LEVEL** och *»NOT proposed as a kill«*; granskningen skriver ut att den *avböjer* att
göra bedömningen. Trealternativsförslaget bärs vidare ordagrant:

- **(a)** SKEPPA SOM DET ÄR och bind batch20:s LÄS-long-brief att utesluta varje
  ugns-/eldnings-/förbränningshantverk och varje experimentell rekonstruktionsram.
- **(b)** SKEPPA MED SEKVENSVILLKOR — kräv att monteringssteget aldrig lägger las-b18-001 och
  las-b19-001 i samma provpass eller samma adaptiva session.
- **(c)** REGENERERA lanan på ett icke-hantverksämne, det enda alternativ som faktiskt sänker
  fyra-av-sex-koncentrationen, till priset av en hel generations- och grindcykel.

**Granskningens enda tillägg, och det är i enheternas favör:** de två enheternas
**undervisningsnyttor överlappar inte alls** — b18-001 lär ut en kemi (bränning och släckning)
och en ekonomisk organisation (ugnslaget), b19-001 en fysisk begränsning (fastfasreduktion) och
en omläsning av avfall som förutsättning. **Det som upprepas är miljön och ramen, inte vad en
elev lär sig.**

**Evidens (tvärbatch):** `batch19/verdicts/verdicts-gregister.jsonl` och `-r2.jsonl` →
las-b19-001, major; `batch19/audits/las-b19-001.json` →
`carried_items_weighed.g_register_lane_clone_major` (förslaget transkriberat ordagrant).

> **REKOMMENDATION: (a) + (b). Ingen regenerering.**
> Det är också vad både grinden och granskningen landar på. (b) är billig, verkställbar i
> monteringssteget och adresserar den skada fyndet faktiskt namnger — *»student-visible across a
> study session«* — utan att kasta bort en enhet vars innehåll är nytt. (c) betalar en full
> generations- och grindcykel för ett problem som inte sitter i någondera enheten utan i
> lanevalet, och lanevalet rättas billigare i briefen.

## 4. ABSOLUTIZER-VANAN — policyspänning, batchövergripande och buren

**Substans.** Distraktorsidans absolutiserare är fortfarande ett bärande felaktighetsgrepp i
huset. Två av runda 1:s fyra G-STEM-kills var rena absolutiserarstripp: elf-b18-001 q:3 (»never«
i ett alternativ, »not … at all« i ett annat — *»two of the four options strip on sight«*) och
las-b18-001 q:3 (kontrafaktisk överdrift »hade … brutit samman« plus superlativen »viktigaste«).
Båda uppsättningarna byggdes om i fleet-repair-2.

**På de skeppade byten är tokenskiktet rent.** Granskningarna körde `strip-the-absolutes` per
enhet mot **både** listorna: M-FORM passerar överallt, ingen nyckel är det ensamma
absolutiserarfria alternativet, och heuristiken **avgör ingen nyckel**. Där den ger utslag pekar
den mot distraktorer.

**Två saker gör det ändå till en policyfråga.** (i) Grindarna stripper fortfarande *semantiskt*
på skeppade byten, på ord som inte står på någon lista: elf-b18-003 q:1/C faller på *»the year
round, whatever the weather drove against the roof«*, las-b18-002 q:2/A på *»året om«*. Enhetens
egen `hedge_balance_note` medger innehållet och argumenterar att det är mekaniskt osynligt.
(ii) Den deklarerade kodändringen finns inte i koden: `gates/scripts/mech.py` `_ABSOLUTIZERS` bär
**25 tokens** och innehåller ingen av de tillägg batch18-supplementet förklarar bindande och
beskriver som *»semantik dokumenterad i mech.py«*.

**Evidens:** `audits/elf-b18-003.json` → `absolutizer_check_at_source`, `findings[N3]`;
`audits/elf-b18-004.json` → `absolutizer_check_at_source`, `findings[INFRA-1]` samt
sexheuristikssvepet där fem av sex heuristiker missar eller pekar fel;
`audits/las-b18-002.json` → `findings[F9]`; `audits/elf-b18-001.json` → info-fyndet mot
`hedge_balance`-premissen.

> **REKOMMENDATION: BEHÅLL greppet, MONITORERA per batch.**
> Greppet gör verklig psykometrisk nytta — en svepande distraktor lär ut en verklig
> övergeneraliseringsmiss, och rule 10 kräver uttryckligen att nyckeln ibland är det trygga
> icke-garderade påståendet. Så länge svepet resolverar noll nycklar per batch är det ett
> undervisningsverktyg, inte en läcka. Två saker bör dock stå i nästa brief: (1) kör
> `strip-the-absolutes` som en **deklarerad batchstatistik**, inte som en per-enhet-not, så en
> vana blir synlig innan den blir en tell; (2) verkställ ägardomen av 2026-08-31 i `mech.py`
> eller ta bort påståendet att den är verkställd — supplementet får inte deklarera kod som inte
> finns.

## 5. G-DISTRACTOR V-FINAL-FLAGGA — elf-b18-001 q:1 alternativ C

**Substans.** Den färska V-FINAL-domaren, som håller nyckeln, dömer C (*»bare of living root«*)
**arguable — inte defensible**. Argumentet fört på högsta styrka: passagen säger inte bara att
den djupare jorden var dålig, den säger *»The roots were somewhere else«*, ett kategoriskt
påstående om just rötter, med *»dry, airless, nearly impenetrable«* och vattningsrören som
*»no measurable difference«* staplade före. En elev som väljer C parafraserar passagens egen
mening. Det enda som fäller C är hedgeordet **»almost«** i *»there was almost nothing alive«* —
en verklig fällning, men *»a one-word kill working against a categorical summary sentence in the
same breath«*. B förblir det bättre svaret (det fyndet hon citeras på och som artikeln är byggd
kring), så uppgiften är inte trasig.

**Färskögan kom fram till samma sak oberoende**, utan pipelinehistorik: C *»sits close to the
passage's 'there was almost nothing alive' … Solvable and defensibly wrong, but it is **the
tightest call in the set**«*. Två oberoende blindben returnerade nyckeln B.

**Evidens:** `verdicts-vfinal/verdicts-gdistractor.jsonl` → elf-b18-001 q:1, `flag`, hela
`justification`; `adjudication-evidence/elf-b18-001.json` → `reader_notes[2]`;
`audits/elf-b18-001.json` → note-fyndet om q1-marginalen och minor-fyndet om flaggans bana.
**Banan är i sig en del av posten:** samma alternativ flaggades `major/ARGUABLE` i r2
(`verdicts/verdicts-gdistractor-r2.jsonl`), släpptes i r3 med **tom fyndlista** på bytidentisk
alternativtext och utan bokförd disposition (`-r3.jsonl`), och flaggades igen av den färska
V-FINAL-domaren. Tre domare, två av dem oense med den tredje.

> **REKOMMENDATION: GODKÄNN — skeppa som den står, med noten bevarad.**
> Det här är vad en diskriminerande distraktor ser ut som: den ska kosta att avfärda. Marginalen
> är smal och den är *dokumenterad* smal av två oberoende läsare som ändå landade rätt. Att bredda
> den skulle kräva att antingen hedgeordet »almost« stärks — vilket försvagar passagens egen
> vetenskapliga försiktighet — eller att C skrivs om, vilket drar en ny omgrindningsomgång på en
> enhet som redan burit tre reparationsrundor. Bokför i stället marginalen som deklarerad
> restpost, på las-b17-003 Q2/D:s precedens.

## 6. FEARNBECK-SÖMMEN sand/murbruk (elf-b18-001) — NY, funnen av färskögan

**Substans.** Fearnbecks invändning i passagen lyder att *»celled or not, the flags **must** still
be laid on a bedding course of sand«*. Botemedlet på de fem misslyckade gatorna är däremot
*»relaid on **a thin mortar bed** drawn up to Fearnbeck's own specification«* — alltså inte sand.
Läsaren löser upp det (hans »must« kan läsas som *under nuvarande praxis*), men **hans egen
föreskrift motsäger premissen i hans eget argument**. Färskögan bokför också den outforskade
följdfrågan: om en tunn murbruksbädd förnekar rötterna deras livsmiljö, säger texten aldrig
varför murbruksbäddning inte vore den billiga universallösningen — vilket skulle underminera
argumentet för de fyra gånger dyrare cellerna.

**Detta är ny evidens.** Sömmen är verifierad ordagrant på de skeppade byten och förekommer i
**ingen** av de sju metagranskningarna; den kommer från stage-11-läsaren, som läste blindark utan
pipelinehistorik. **Ingen nyckel berörs** — Q4 är ankrad i den explicita domsmeningen *»On the
five streets Fearnbeck's case is fairly won; on the twenty-five it is not«*, och sömmen är
retorisk, inte faktisk.

**Evidens:** `adjudication-evidence/elf-b18-001.json` → `reader_notes[0]` och `[1]`, ordagrant
vidarebefordrade till `reviews/adjudication.jsonl`; passagen i `candidates/elf-b18-001.json` ¶3
och ¶4.

> **REKOMMENDATION: ANTECKNING ENDAST — ingen textändring.**
> Att låta en sakkunnig fälla en föreskrift och sedan acceptera en annan lösning är hur riktiga
> tvister ser ut i tryck, och läsaren själv kallar den återvinningsbar. Enhetens
> reparationsbudget är dessutom förbrukad: den bär tre rundor på passagen, och varje ny
> prosainskjutning drar om hela citattrohetssvepet. Bokför sömmen som deklarerad restpost så att
> nästa läsare inte hittar den som ny.

---

# Bärs vidare till batch20-briefen

- **Eldhantverksuteslutning för LÄS facktext-long:** uteslut varje ugns-, eldnings- och
  förbränningshantverk *och* varje experimentell rekonstruktionsram; plus sekvensvillkoret att
  las-b18-001 och las-b19-001 aldrig får hamna i samma provpass eller adaptiva session.
- **Registerluckan i toponymlistan:** den uteslutna toponymlistan saknar batch15:s uppfunna
  kommun **»Vässlinge«**, vilket är hela skälet till att både generatorn och G-REGISTER kunde
  fria batch19:s »Vässlingen«/»Vässlingsbadet« i god tro. Registret är delat — fyll luckan där,
  inte i en enskild enhet. (`batch19/audits/las-b19-002.json` → `findings[F4]`.)
- **Minsta redigeringsavstånd 2 för uppfunna namn**, mätt mot *både* allt skeppat i banken *och*
  verkliga gazetteer-/namngrannar, med envariantsprobning enumererad för hand — fuzzy-sveps
  analysator missar just kollisionen. Lärdomarna är **Stintbury~Saintbury** (avstånd 1, verklig
  ort, samma domän) och **Margit~Marit** (avstånd 1 mot ett listat förnamn, i ett byline som
  dessutom delar efternamnsfamilj med samma skeppade par).
- **Cloze-bylinen:** kredentialkonstruktionen är pensionerad. Batch18:s G-REGISTER-disposition
  band nästa cloze att bryta konstruktionen (»bare byline or a different credential syntax«);
  batch19 verkställde den i runda 2. Håll frasramen *[Namn] + writes + on/about + ämne + for a +
  bestämning + periodika* på blocklistan så raden inte kan nå fem, och lägg till batch19:s egen
  rekommendation att utesluta ram-motivet »ett skrivet instrument som misslyckas med att styra
  beteende«.
- **TYPE-001: den citerade rösten är nu bindande.** Tre villkor binder samtidigt nästa
  murverkskorttext — (1) **citerad röst**, batch18:s halva av dispositionen, uppskjuten två
  gånger och uttryckligen inte tillåten att skjutas upp en tredje; (2) **lämna
  murbruks-/fuktdomänen**, batch18:s andra halva, hittills bara halvt hedrad; (3) **lämna hela
  det inhemska byggnadsskalet**, batch19:s skärpning efter tre murverkskorttexter av fyra.

---

## Slutrad

Batchen viks in i banken **enbart på ägarens PAKETDOM**. Fram till det ordet: ingen merge, ingen
import, ingen deploy. Det finns i dag ingen `candidates-final/` i batchen, `RETIRED.json` bär
noll batch18-poster, och `batches/batch18/` är otrackad på `p5/batch18-19` — läget är alltså
återställbart i sin helhet.

En täckningsgräns hör till domen och ska inte döljas av den: sex av sju metagranskningar
utfärdades **före** `fleet-repair-4`, den runda som verkställde deras egna fynd, och bara
elf-b18-002 fick en omgranskning på reparerade byten. Det som **läste de exakta skeppningsbyten**
är de fyra färska V-FINAL-blindbenen, `vfinal_fold.py`, `promote.py` och de sju
stage-11-kalläsarna — så varje nyckel, alternativ och passage en elev möter är oberoende löst och
bedömd på sluttexten. Det som inte upprepades är det adversariella metadataskiktet, inte
uppgiften. Detaljer i `STATUS.md`.

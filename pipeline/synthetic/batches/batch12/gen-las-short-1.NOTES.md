# gen-las-short-1 — "Toaletterna försvinner utan att någon beslutar det"

**Topic:** de offentliga toaletternas försvinnande ur staden (exklusivt tilldelat batch 12).
**Format:** LÄS short — sakprosa / debatt_opinion, 335 ord, 23 meningar, 6 stycken, 2 frågor.
**Familjer:** Q1 `detalj_ospecificerad`, Q2 `forfattarens_hallning`.

## Genre- och ämnesmotiv

Debattinlägg i planeringsfacklig ton, skrivet av en yrkesperson (planeringsarkitekt), inte av en
drabbad. Öppningsdraget är `framing-claim`: nedläggningen framställs inte som ett beslut utan som
ett förlopp — lapp, bortmonterad dörr, planteringsyta. Det ger ett register med nominaliseringar
(*Nedläggningen*, *Driftkostnaden*, *Invändningarna*) och s-passiver (*behöver inte skrivas*,
*har avvecklats*, *städas*, *låses*) utan att bli myndighetsprosa. Meningslängden varierar
medvetet: fyraordsmeningen "Den byter betalare." står bredvid trettiordssatser.

Ämnet ligger långt från batch 1–11 (närmaste grannar är bänkar/urban seating och folkbadhus — här
är objektet en driftpost och en tillgänglighetsfråga, inte stadsmöblering eller badkultur).

## Anti-tidiness

Passagen får inte gå ihop för snyggt. Tre inslag arbetar emot det:
- stycke 3 ger motståndarsidan verklig kraft (kostnad per besök, slitage) och låter dessutom
  forskaren själv underminera sitt samband ("kan inte skilja orsak från ordningsföljd");
- barnfamiljerna är ett fynd som *inte* pekar mot tesen;
- gjutjärnspissoaren i Sandviken är ren digression: en pensionerad rörmokare städar den utan
  uppdrag. Den bär ingen tes, bara konkret residue.

Texten slutar inte i en fråga eller en uppmaning, utan i en signerad byline.

## Planterad fällarkitektur

**Q1 — mål: fyndet i stycke 2** (hedgat, riktat, avgränsat: *ovissheten återkom oftare än väntat*,
*tydligast hos de äldsta och hos dem med tarmsjukdom*, *knappt att belägga för barnfamiljer*).

| alt | operation |
|---|---|
| A | `reversed_causality` — de äldres minskade rörlighet får förklara nedläggningarna; texten säger att driftkostnaden avgör |
| B | `scope_shift` — tredjedelen gäller "centrala lägen", inte hela beståndet |
| **C (nyckel)** | parafras av målmeningen med synonymskifte (*ovisshet* → *osäkerhet*) |
| D | `plausible_worldknowledge` på förvrängd detalj — barnfamiljer är just gruppen utan samband |

**Q2 — mål: stycke 4 + den uttryckliga avsägelsen i stycke 5.**

| alt | operation |
|---|---|
| **A (nyckel)** | skribentens egen invändning: utgiften upphör inte, den byter betalare |
| B | `plausible_worldknowledge` — den förväntade maximalistpositionen, uttryckligen avsagd |
| C | `detail_as_main` — skadegörelsen upphöjd över driftkostnaden, textens rangordning omkastad |
| D | `true_but_irrelevant` — rätt objekt (caféerna), fel klagomål (antal/hittbarhet i stället för köpkravet) |

## Hedge balance

Nycklarna är i båda frågorna raka, specifika påståenden — inte setets enda garderade alternativ.
Den mest absoluta formuleringen i Q2 ("varje kvarter … dygnet runt") ligger i distraktor B. En
elev som konsekvent väljer det mest nyanserade alternativet svarar fel på båda frågorna.

## Cross-question-kontroll

Q1:s nyckel är ett empiriskt fynd om vilka som uppgav toalettovisshet som skäl att inte gå ut
ensamma. Q2:s nyckel är en ekonomisk invändning om vem som betalar. Ingen följer av den andra, och
inget alternativsett nämner den andra frågans innehåll: Q1 talar aldrig om kostnadsförskjutning,
Q2 aldrig om dagboksstudien, åldersgrupperna eller tredjedelen.

## Self-blind-solve (hela arket)

Läste passagen och båda frågorna som ett sammanhängande ark och argumenterade aktivt för varje
icke-nyckel.

- **Q1 = C.** A kräver att man läser bort "det är den siffran som avgör". B kräver att man
  glömmer "i centrala lägen". D motsägs av "gick det knappt att belägga alls". Ett svar.
- **Q2 = A.** B strider mot "Jag begär ingen toalett i varje kvarter". C flyttar avgörandet från
  driftkostnaden till skadegörelsen. D klagar på fel egenskap hos caféerna. Ett svar.

Inget alternativ återger en passagemening ordagrant. Alla personer och institutioner är påhittade
(Sinikka Vaara, Institutet för stadsnära tjänster, Ola Rimfeldt); bara ortnamnen är verkliga, i
linje med korpusbruket. Ordlistan definierar *bekvämlighetsinrättning*, som faktiskt förekommer i
stycke 3.

## Mekanisk självkontroll

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM — **pass** (5/5).
335 ord, 6 stycken, medelmeningslängd 14,6; promptlängd 11 och 8 ord; optionslängder
Q1 17/15/16/13 (nyckel 16, ej längst), Q2 13/14/13/13 (nyckel 13, ej längst).

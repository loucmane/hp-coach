# gen-las-short-2 — "Linan som knöts fast och blev kvar"

**Topic:** flaggning och flaggdagar — bruket och dess förändring (exklusivt tilldelat batch 13).
**Format:** LÄS short — sakprosa / debatt_opinion, 405 ord, 28 meningar, 6 stycken +
byline/ordlista, 2 frågor.
**Familjer:** Q1 `detalj_ospecificerad`, Q2 `forfattarens_hallning`.

## Genre- och ämnesmotiv

Debattinlägg av en yrkesperson (byggnadsantikvarie) som skriver ur inventeringsarbetet, inte ur
en identitetsposition. Öppningsdraget är `framing-claim`: hela debatten anklagas för att ha
ställt fel fråga — den handlar om vilja, men det som fattas är underhåll och en tjänstebeskrivning.
Registret bär nominaliseringar (*Diskussionen*, *Nedgången*, *Uppgången*, *hissning*,
*nedprioriteringen*, *ställningstagande*) och s-passiver (*förs*, *flaggades*, *föreslås*, *bärs*, *märks*). Meningslängden varierar från femordssatser ("Det gör den inte.",
"Vad det betyder vet jag inte.") till 30-ordssatser.

Ämnet ligger långt från batch 1–12. Närmaste grannar är *gatunamn* och *offentliga klockor* —
båda om stadens skyltning respektive tidgivning; här är objektet en periodisk handling och den
driftorganisation som utför den.

## Anti-tidiness

Passagen får inte gå ihop för snyggt. Tre inslag arbetar emot det:

- Hollstensson underminerar sin egen korrelation (ansträngd ekonomi kan ha drivit fram både
  entreprenaden och nedprioriteringen);
- stycke 4 är ett fynd som skribenten uttryckligen inte kan placera ("något jag inte riktigt vet
  vad jag ska göra av" … "Vad det betyder vet jag inte") och som dessutom pekar åt fel håll för
  hennes tes om att seden håller på att upphöra;
- de 61 fastsurrade linorna är konkret residue som bär en poäng men inte en tes — de är just
  frånvaron av beslut.

Texten slutar inte i en fråga eller ett utrop, utan i en signerad byline.

## Planterad fällarkitektur

**Q1 — mål: stycke 4** (hedgat: *ökade svagt*; riktat: nybyggt ↑ / äldre bebyggelse still;
avgränsat: för litet för att väga upp bortfallet, och utan förklaring).

| alt | operation |
|---|---|
| A | `overgeneralisation` — "genomgående … oavsett hur gammal bebyggelsen var" raderar kontrasten fyndet vilar på |
| **B (nyckel)** | parafras av målmeningen: nybyggda villaområden upp, äldre bebyggelse still |
| C | `reversed_causality` som obelagd orsakskedja — levererar just den förklaring texten avstår från |
| D | kvantitetsuppgradering (`overgeneralisation`) — motsägs ordagrant av "för liten för att väga upp bortfallet" |

**Q2 — mål: stycke 5 (antagandet som inte håller) + eftergiften och avsägelsen i samma stycke.**

| alt | operation |
|---|---|
| A | `plausible_worldknowledge` — den förväntade traditionalistpositionen för en antikvarie, uttryckligen avsagd ("Mot dagarna i sig har jag ingenting") |
| B | `detail_as_main` på eftergiften — hennes medgivande om en välmotiverad dag + Hollstenssons ekonomiförbehåll hopfogade till ett uppskovsskäl hon aldrig anför |
| C | `reversed_causality` på ansvarslinjen — flyttar ansvaret till listans upprätthållare, dvs. den almanacksfixering hon angriper |
| **D (nyckel)** | hennes uttalade invändning: listan är verkningslös utan någon som har uppgiften |

## Hedge balance

Båda nycklarna är raka, specifika påståenden — inget av dem är setets mest garderade alternativ.
I Q1 är nyckeln en konkret kontrast medan **A** och **D** är de absoluta formuleringarna;
i Q2 är **B** det enda försiktiga/uppskjutande alternativet och det är fel. En elev som väljer
det mest nyanserade alternativet svarar fel på båda frågorna; en som väljer det mest tvärsäkra
svarar också fel på Q1 (A eller D). "Korrekt" och "garderat" ligger inte i linje någonstans i
enheten.

## Cross-question-kontroll

Q1:s nyckel är en empirisk uppgift om *privat* flaggning fördelad på bebyggelsens ålder. Q2:s
nyckel är en normativ invändning om *kommunal* drift och tjänstebeskrivning. Ingendera följer av
den andra: att veta att villaflaggningen ökade säger ingenting om vad skribenten anser om
flaggdagslistan, och att veta hennes invändning hjälper inte att välja mellan Q1:s fyra
fördelningspåståenden (samtliga är förenliga med en underhållstes). Q1:s alternativ nämner aldrig
listan, almanackan eller ansvarsfrågan; Q2:s alternativ nämner aldrig villaområden, bebyggelseålder
eller Hollstenssons siffror. Den enda beröringspunkten — kommunernas flaggning — är i Q1 (alt. C)
en avvisad orsaksförklaring, inte en ledtråd till Q2:s nyckel.

## Self-blind-solve (hela arket)

Läste passagen och båda frågorna som ett sammanhängande ark och argumenterade aktivt för varje
icke-nyckel.

- **Q1 = B.** A kräver att man läser bort "medan äldre bebyggelse låg still". C kräver att man
  hittar på ett samband som skribenten uttryckligen säger sig sakna. D motsägs ord för ord av
  "för liten för att väga upp bortfallet på de kommunala stängerna". Ett svar.
- **Q2 = D.** A strider mot "Mot dagarna i sig har jag ingenting". B tillskriver henne ett
  uppskovsskäl — ekonomiargumentet är Hollstenssons förbehåll, och hon vill inte vänta utan ha en
  annan åtgärd. C vänder hennes ansvarslinje: hela texten placerar ansvaret hos den som äger
  stången och betalar driften. Ett svar.

Inget alternativ återger en passagemening ordagrant. Alla personer och institutioner är påhittade
(Åsa Rundquist, Marcus Hollstensson, Institutet för lokal förvaltning); länen namnges aldrig, och
ingen fråga går att besvara med verklig sakkunskap om flaggdagsförordningen — begreppet är bara
bakgrund. Ordlistan definierar *allmän flaggdag* och *vev*, som båda förekommer i texten.

## Mekanisk självkontroll

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM — **pass** (5/5).
405 ord, 28 meningar, medelmeningslängd 14,46 (meningslängder 4–47). Promptlängd 9 och 9 ord.
Optionslängder Q1 14/17/20/15 (nyckel B = 17, ej längst), Q2 15/15/15/15 (helt jämnt set, inget
längdtell). Nyckelbokstäver B och D.

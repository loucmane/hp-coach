# gen-las-short-1 — "När tatueringen slutade kräva en förklaring"

**Topic:** tatueringarnas normalisering (exklusivt tilldelat batch 13).
**Format:** LÄS short — sakprosa / essä, 405 ord, 29 meningar, 6 stycken + byline/ordlista, 2 frågor.
**Familjer:** Q1 `enligt_texten_detalj`, Q2 `forfattarens_hallning`.

## Genre- och ämnesmotiv

Kulturessä med en skribent som argumenterar men inte agiterar — registret ligger mellan
`populärvetenskap` och `debatt_opinion` (blueprintens närmaste preset är debatt_opinion, och
öppningsdraget är `framing-claim`: den vedertagna berättelsen om normalisering framställs som
felmätt). Nominaliseringar bär prosan (*Normaliseringen*, *Nedgången*, *Jämförelsen*,
*Förlusten*, *Annonsspråk*) och s-passiverna sitter i undersökningsledet (*anses*, *sägs*,
*formulerades*, *efterfrågades*). Meningslängden varierar avsiktligt kraftigt: fyraordssatser
("Nedgången var ojämnt fördelad.", "Pärmen bevisar ingenting.", "Den ligger bara där.") står
bredvid 25-ordssatser.

Ämnet ligger långt från batch 1–12. Närmaste grannar är *signaturer* och *färgnamn* — men där
handlade det om notation respektive marknadsföringsspråk; här är objektet en kroppsburen
social markör och den tysta förhandling som omger den.

## Anti-tidiness

Passagen får inte gå ihop. Fyra inslag arbetar emot det:

- Sturk underminerar själv sitt eget material (frågan formulerades annorlunda 2004, en del av
  nedgången kan vara en formuleringseffekt);
- de yngsta väljer motiv *för att* de är svårlästa — ett fynd som pekar bort från tesen om
  likgiltighet;
- annonsgenomgången i stycke 4 dämpas i samma andetag ("Annonsspråk är trögt och följer sällan
  praxis i realtid");
- pärmen i Gävle är ren digression, uttryckligen utan bevisvärde ("Pärmen bevisar ingenting").

Texten slutar inte i en fråga eller en uppmaning, utan i en signerad byline.

## Planterad fällarkitektur

**Q1 — mål: fyndet i stycke 2** (hedgat, riktat, avgränsat: nedgång från drygt hälften till en
femtedel; *ojämnt fördelad*; kraftig för armar och ben, oförändrad för händer/hals/ansikte; och
riktningen uttalad — *blicken* har vant sig, inte bäraren).

| alt | operation |
|---|---|
| A | `reversed_causality` — bärarna påstås ha blivit mer meddelsamma, exakt den förklaring Sturk avvisar |
| B | `scope_shift` — flyttar avgränsningen från kroppsdel till ålder och lånar åldersuppgiften ur stycke 3, där den gäller motivval |
| **C (nyckel)** | parafras av målmeningarna med synonymskifte (*bett dem förklara* → *möttes av krav på att redogöra*) |
| D | `overgeneralisation` — "lika kraftigt oavsett var på kroppen" raderar avgränsningen |

**Q2 — mål: slutstyckets uttalade hållning + eftergiften i dess första två meningar.**

| alt | operation |
|---|---|
| A | `detail_as_main` med överdrift — annonsdelspåret upphöjt till "avgörande bevis", trots textens egen dämpning |
| **B (nyckel)** | den tes som spänner över lede + slutstycke: ointresset är tecknet, och innebörden går delvis förlorad |
| C | `reversed_causality` på hållningen — eftergiften vänds: hon *saknar inte* förklaringsplikten |
| D | `plausible_worldknowledge` / övergarderad icke-position — metodinvändningen upphöjd till omdömesuppskov |

## Hedge balance

Q1:s nyckel är garderad (*i huvudsak*), Q2:s nyckel är ett rakt, specifikt påstående utan
gardering. Korrelationen "korrekt = mest nyanserat" är därmed bruten: i Q2 är det **D** som är
det försiktigaste alternativet, och det är fel. En elev som konsekvent väljer det mest
nyanserade svarar rätt på Q1 och fel på Q2 — dvs. slumpnivå.

## Cross-question-kontroll

Q1:s nyckel är en empirisk fördelning (var på kroppen nedgången syntes). Q2:s nyckel är en
värderande hållning (ointresset som normaliseringens tecken, innebörden som förlust). Ingen
följer av den andra. Q1:s alternativ nämner aldrig ointresse, innebörd eller arbetsgivare;
Q2:s alternativ nämner aldrig kroppsdelar, andelar eller intervjuomgångar.

## Self-blind-solve (hela arket)

Läste passagen och båda frågorna som ett sammanhängande ark och argumenterade aktivt för varje
icke-nyckel.

- **Q1 = C.** A kräver att man läser bort den explicita riktningsangivelsen ("inte bäraren som
  har blivit mer meddelsam"). B kräver att man överför åldersuppgiften från stycke 3 till ett
  påstående texten aldrig gör. D motsägs ord för ord av "Nedgången var ojämnt fördelad". Ett svar.
- **Q2 = B.** A motsägs av "men mindre än man kunde tro". C motsägs av "Jag saknar inte
  förklaringsplikten". D motsägs av att hon faktiskt hävdar en förändring och beskriver dess
  innebörd. Ett svar.

Inget alternativ återger en passagemening ordagrant; längsta gemensamma ordföljd mellan nyckel
och passage är tre ord. Alla personer, institutioner och arkiv är påhittade (Anneli Sturk,
Institutionen för kulturanalys i Härnösand, Kroppsminnesarkivet, Ingemar Bråse, Rolf Tvede,
Marit Öjeborg); bara ortnamnen är verkliga, i linje med korpusbruket. Ordlistan definierar
*förklaringsplikt*, som förekommer i slutstycket.

## Mekanisk självkontroll

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM — **pass** (5/5).
405 ord, 29 meningar, medelmeningslängd 13,97 (meningslängder 3–40). Promptlängd 10 och 6 ord.
Optionslängder Q1 17/19/18/15 (nyckel C = 18, ej längst), Q2 18/17/17/16 (nyckel B = 17, ej
längst). Nyckelbokstäver C och B.

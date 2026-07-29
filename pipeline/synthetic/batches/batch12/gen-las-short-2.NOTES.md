# gen-las-short-2 — "Läxan är en förflyttning, inte en metod"

**Topic:** läxor i grundskolan (exklusivt tilldelat batch 12).
**Format:** LÄS short — sakprosa / debatt_opinion, 360 ord, 25 meningar, 6 stycken, 2 frågor.
**Familjer:** Q1 `enligt_texten_detalj`, Q2 `huvudbudskap_syfte`.

## Genre- och ämnesmotiv

Debattinlägg av en yrkesverksam lärare, med en definitorisk framing-claim i stycke 1: läxan är
ingen metod utan en *förflyttning* av arbetet från ett rum med lärare till ett köksbord. Hela
argumentet hänger på den omdefinitionen, vilket ger huvudbudskapsfrågan något att spänna över.
Registret blandar korta verdikter ("Det är den inte.", "Medelvärdena sade inte mycket.") med
långa subordinerade satser i stycke 3–4; nominalisering (*Diskussionen*, *Spridningen*,
*förflyttning*) och s-passiv (*söktes*, *bedöms*, *måste nötas*) finns men dominerar inte.

Ämnet gränsar inte till något i batch 1–11 (skolbibliotek och skolluncher rör institutionen
skola, inte hemarbetets fördelning).

## Anti-tidiness

- Elmerud tillåts uttryckligen underminera användbarheten av sitt eget material: han har inte mätt
  kunskapsutveckling, och en lång läxa behöver inte vara en dålig läxa.
- Läraren som i tio år lät eleverna välja är residue som inte pekar mot tesen: ungefär hälften
  stannade, och "inte de elever man hade gissat" — utan förklaring.
- Skribenten avvisar den bekvämaste allierade positionen (läxmotstånd) och lämnar en eftergift åt
  motståndaren (schemat räcker inte till), som hon uttryckligen vägrar räkna som läxans problem.

Texten avslutas inte i en fråga, utan i en signerad byline.

## Planterad fällarkitektur

**Q1 — mål: den avslutande meningen i stycke 2** (uttrycklig ämnesvis rangordning: matematik >
läsläxa > högläsning).

| alt | operation |
|---|---|
| A | `reversed_causality` — rangordningen spegelvänd; frestande eftersom högläsning intuitivt känns mest vuxenberoende |
| **B (nyckel)** | parafras av rangordningen, rakt och specifikt formulerad |
| C | `overgeneralisation` — ämnesskillnaden utsuddad till ett enhetligt mönster |
| D | `scope_shift` — "blev inte gjord" hör till hemmen utan hjälp, inte till matematiken som ämne |

**Q2 — mål: hela texten** (stycke 1:s omdefinition + stycke 2:s fynd + slutstyckets slutsats om
att en obligatorisk, bedömd uppgift mäter hemmet).

| alt | operation |
|---|---|
| A | `detail_as_main` — slutsats om lärandet, som studien uttryckligen inte har mätt |
| B | `overgeneralisation` — kritiken dras till ett avskaffandekrav som skribenten avvisar i klartext |
| C | `scope_shift` på eftergift — schemats bekymmer upphöjt till skolans största problem |
| **D (nyckel)** | tesen som spänner över alla stycken |

## Lag 11 (bäst-item)

Q2 är ett "överensstämmer bäst"-item, så ingen distraktor får vara ordagrant sann. A påstår något
om lärandet som texten säger sig inte kunna uttala sig om; B kräver ett avskaffande texten
uttryckligen avvisar; C förskjuter en eftergift till huvudsak. Alla tre fel är utpekbara med
fingret i texten.

## Hedge balance

I Q1 finns inga garderingar alls i något alternativ — valet avgörs enbart av rangordningens
riktning. I Q2 sitter den mest garderade formuleringen ("förhållandevis lite") i distraktor A och
den mest absoluta ("bör avskaffas", "systematiskt") i B, medan nyckeln är rakt formulerad. Att
välja "det mest nyanserade alternativet" ger fel svar.

## Cross-question-kontroll

Q1:s nyckel är en ämnesvis rangordning; Q2:s nyckel är textens övergripande tes om förflyttningen.
Man kan känna rangordningen utan att kunna sluta sig till tesen, och tvärtom. Inget av Q1:s
alternativ nämner hemmet, hjälpen eller ansvaret — det var ett medvetet omskrivningsbeslut, en
tidigare formulering av distraktor C ("… eftersom det handlade om hemmet") läckte mot Q2:s nyckel
och ströks. Q2:s alternativ nämner varken ämnena, tiderna eller rangordningen.

## Self-blind-solve (hela arket)

- **Q1 = B.** A är spegelvändningen. C motsägs av att texten redovisar tre olika nivåer.
  D flyttar "blev inte gjord" från hemmen till ämnet. Ett svar.
- **Q2 = D.** A kolliderar med "har inte mätt kunskapsutveckling över huvud taget". B kolliderar
  med "Jag är ingen läxmotståndare" och med försvaret för högläsning och glosor. C hänförs i
  texten uttryckligen till schemat, inte läxan. Ett svar.

Inget alternativ återger en passagemening ordagrant. Alla namn och institutioner är påhittade
(Torbjörn Elmerud, Lärarhögskolan i Vretstorp, Marit Hallgren). Ordlistan definierar *läxhjälp*,
som förekommer i stycke 3.

## Mekanisk självkontroll

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM — **pass** (5/5).
360 ord, 6 stycken, medelmeningslängd 14,4; promptlängd 11 och 6 ord; optionslängder
Q1 9/10/11/10 (nyckel 10, ej längst), Q2 13/16/13/15 (nyckel 15, ej längst).

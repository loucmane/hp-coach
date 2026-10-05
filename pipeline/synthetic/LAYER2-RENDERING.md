# Layer-2 rendering contract (antagen 2026-08-31, bead hpf-y1p4)

Bankens `rationale`-fält är **adjudikationsartefakter**, inte elevtext.
`GENERATION.md` pekar ut dem som "Layer-2 explanation source material
downstream" — och nedströms rendering till elevprosa MÅSTE därför passera
detta kontrakt. Uppmätt prevalens vid antagandet (batch16-metagranskningen):
snake_case-taxonomietiketter i 112 av 114 enheter, *hedgat*-former i 30 av
114, grindintern metakommentar ny i batch16. Den skeppade elevbutiken
`data/explanations/` bar vid mätningen ingen av dem — detta kontrakt gör
egenskapen till ett krav i stället för en slump.

## Reglerna

1. **Strippa eller översätt snake_case-etiketter.** `scope_shift`,
   `detail_as_main`, `plausible_worldknowledge` osv. är interna joinnycklar
   som grindarna räknar på. I elevtext ersätts de med svensk prosa
   ("förskjuter frågans omfång", "detalj som huvudsak") eller stryks.
2. **Ersätt *hedgat/hedgad/hedgar/hedgning*** med native svenska:
   *reserverat*, *garderat*, *med förbehåll*, *avgränsat* — efter kontext.
3. **Strippa heuristik- och grindinterna sektioner helt.** Meningar som
   refererar rundor, grindar, mech-listor eller pipelinehistorik ("the
   round-2 version of this paragraph …", "mech.py's absolutiser list …")
   får aldrig nå elevtext. Denna klass är farligast: den läser som vanlig
   prosa, inte som en etikett.

## Verkställighet

`gates/scripts/lint_learner_output.py` körs på **renderad elevtext** (t.ex.
`data/explanations/`) i importsteget och fäller på alla tre klasserna
(L2-SNAKE, L2-HEDGAT, L2-GATEREF). Linten pekas ALDRIG mot bankens interna
adjudikationsmetadata — bankens 112/114 är korrekt intern konsekvens och
ska inte skrivas om (ägardom 2026-08-31: att laga en enhet bryter
konsekvensen i 1 av 114 filer och river taxonomin grindarna joinar på).

## Härdningsrond 2026-08-31 (GC-granskningslane hpf-y1p4-hardening-review)

Linten är tvåskiktad efter den oberoende granskningen: **taxonomistammar**
(scope/shift/causal/worldknowledge/… inkl. versal-, siffer- och
trunkeringsvarianter som `scope_x`, `SCOPE_SHIFT`) fäller ALLTID;
**generiska snake_case-stiltoken** (improviserade formelvariabler som
`värde_B`, `antal_A`, `K_diff`) fäller endast med `--strict` och utgör den
bokförda stilskulden i bead hpf-gyo5 (inspektera-före-ersätt;
matbevarandekontraktet skyddar dem mot blind omskrivning). `_`-prefixade
JSON-nycklar (bokföring i fil, t.ex. `_meta.adjudication`) skannas aldrig.
Uppmätt efter härdningen: default = exakt de 2 äkta »hedgning«-fynden i
host-2017-MEK-025; `--strict` = +74 stiltoken.

## Indatafel fäller stängt (PR #370 rond 2, bead hpf-oy2w)

Linten är en grind: indata den inte kan verifiera rapporteras aldrig som
ren. En sökväg som inte finns, en katalog utan lintbar fil (`.json`/`.md`/
`.txt`, ej `_`-prefixad), en fil som inte är giltig UTF-8 och en `.json`-fil
som inte går att tolka ger var och en raden `INPUT-FAIL <sökväg>: <orsak>` —
en trasig `.json` skannas aldrig som råtext. Noll granskade filer är också
ett indatafel. Exitkoder: 0 = ren, 1 = fynd, 2 = indatafel (eventuella fynd
skrivs ut ändå).

## Etikettvokabulär (PR #370 rond 5, bead hpf-6fkm)

Skikt 1 (default) jämför token och vokabulär i **normaliserad form**: gemener,
utan diakritiska tecken och utan understreck. `WORLD_KNOWLEDGE` träffar därför
stammen `worldknowledge`, och `författarens_hållning` träffar etiketten
`forfattarens_hallning`. En token fäller när dess normaliserade form
innehåller en normaliserad vokabulärpost. All text normaliseras till NFC innan
någon regel körs (PR #370 rond 6, bead hpf-pvkp): ett `å` skrivet som `a` plus
kombinerande ring behandlas därför precis som ett förkomponerat `å`, och en
token får innehålla vilken bokstav som helst, så `idé_skifte` är en hel token.

Vokabulären är stammarna plus **varje snake_case-etikett som pipelinen
faktiskt använder** (inventering 2026-10-05):

- trap-taggar, frågetyper och genrer från taxonomiskripten
  (`las/scripts/question_taxonomy.py`, `las/scripts/genre_classify.py`,
  `elf/scripts/build_families.py`);
- grindklasser och statusar: verdiktschemats enum, grindpromptarna,
  runbooks och batchernas adjudikationsanteckningar, statusvärden i
  batchposterna samt statusliteraler i grindkoden och batch-workflowet;
- bankens egna etiketter: kandidaternas trap-, family-, genre- och
  formatfält och frågornas rationaler.

`tests/test_verdict_enum_and_label_vocabulary_round5.py` skannar samma
källor och fäller om någon etikett där inte flaggas i default-läge. En ny
etikett läggs till i vokabulären; testet undantar bara kodidentifierare som
dokumentationen nämner i versaler.

Matbevarandekontraktet gäller oförändrat. Subskriptnotation (`v_r`, `a_n`,
`K_2007`, `a_1`) och improviserade formelnamn (`värde_B`, `antal_A`,
`K_diff`) fäller aldrig i default-läge. Ingen vokabulärpost är ett ensamt
vanligt ord: `trap` skulle till exempel träffa formelnamnet `A_trap`.

Uppmätt på `data/explanations/` (27 filer, 1 331 snake_case-förekomster, 236
distinkta token): default ger samma 2 äkta *hedgning*-fynd som före ronden
och `--strict` samma 74 fynd. Ingen token flaggas nytt och ingen tappas.

## Renderad text (PR #370 rond 7, bead hpf-klv6)

Linten granskar det eleven faktiskt ser, inte bara den lagrade stavningen.
Hotmodellen, med varje stavningsvariant och hur den hanteras, finns i
`docs/worklog/hpf-klv6.md`.

- **Ordgränser.** En token avgränsas av allt som inte är en bokstav eller en
  siffra, och dess segment skiljs åt av ett eller flera understreck.
  `_WORLD_KNOWLEDGE_` (Markdown-kursiv), `__WORLD_KNOWLEDGE__` och
  `WORLD__KNOWLEDGE` är därför tokens. Samma gräns gäller orden i L2-HEDGAT
  och grindnamnen i L2-GATEREF (`_hedgat_`, `__G-STEM__`).
- **Tre renderade vyer.** Varje regel läser den skannade texten och dessutom
  tre vyer av den:
  - *Ren vy.* Osynliga tecken tas bort: allmän kategori Cf och övriga
    default-ignorable, till exempel U+200B, U+00AD, U+2060, U+FEFF,
    variantväljare och hangul-fyllnadstecken. En högerriktad överstyrning
    (RLO) vänds som den visas. Kompatibilitetstecken skrivs i NFKC-form:
    fullbreddsunderstrecket U+FF3F och de andra understrecksvarianterna blir
    `_`, och inringade och matematiska bokstäver blir vanliga bokstäver. Lösa
    kombinerande diakriter tas bort. Den skannade texten och utdragen förblir
    NFC, så elevmatematik som `x²` skrivs aldrig om.
  - *App-vy.* Samma behandling, efter att KaTeX har tolkats mellan
    MathText-avgränsarna U+E000 och U+E001 och bara där. Det är appens egen
    rendering: resten av strängen visas som den står, Markdown och HTML
    inräknade.
  - *Markup-vy.* Samma behandling, efter att Markdown, HTML och KaTeX har
    tolkats i hela texten. Markdown omfattar emfas, kod, genomstrykning,
    länkar och `\`-escape. HTML omfattar taggar, kommentarer och
    teckenreferenser som `&#95;` och `&lowbar;`. KaTeX omfattar stilkommandon
    som `\text` och `\mathrm`, grupper `{}`, `\_`, `\textunderscore`,
    färgargument och matematikavgränsarna.

  Appen visar strängvärden som ren text och sätter bara matematiken med
  KaTeX; app-vyn efterliknar den. En `.md`-fil går i stället genom en
  Markdown-renderare, och markup-vyn tar med allt som en sådan kan dölja.
  En etikett som någon renderare visar finns därför i texten eller i en vy.
- **Skikt 2 bedömer den lagrade stavningen.** `--strict` läser bara den
  skannade texten. En LaTeX-subskript som `V_{\text{gammal}}` är korrekt
  notation, inte stilskuld.
- **Fynd pekar på källtexten.** En träff i en vy rapporteras mot den skannade
  texten, och utdraget skärs ut kring de tecken som gav träffen. CLI:t skriver
  osynliga tecken som `<U+XXXX>`. Då syns var de sitter, och ett
  riktningstecken kan inte kasta om raden.
- **Medvetet lämnat:**
  - stavningar som ser annorlunda ut: bindestreck, mellanslag eller andra
    tecken som avgränsare, förväxlingsbara bokstäver från andra skript,
    synligt skräp inne i token, översättning och omskrivning;
  - blanksteg inne i KaTeX-matematik;
  - mellanrums- och fantomkommandon i KaTeX;
  - Markdown-tillägg utanför CommonMark/GFM.

Matbevarandekontraktet gäller oförändrat. Subskriptnotation och formelnamn
fäller aldrig i default-läge, inte heller när de står i Markdown-emfas, HTML
eller KaTeX.

Uppmätt på `data/explanations/` (27 filer, 169 988 strängar): default ger
samma 2 *hedgning*-fynd och `--strict` samma 74 fynd, rad för rad. 11 145
strängar får minst en vy. Vyerna innehåller 283 snake-token som inte finns i
den skannade texten. Alla är matematiska subskript (`L_1`, `x_2`), och ingen
av dem är en etikett.

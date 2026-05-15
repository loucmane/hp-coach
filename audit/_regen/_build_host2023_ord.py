"""Builder for host-2023 ORD Variant-C explanations.

Authored by Claude (Max 20x) directly — no API call. Mirrors the
host-2014 ORD pilot voice anchor: 2-3 steps, heavy distractors,
rotated openers, `technique` names a pattern.
"""
from __future__ import annotations
import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def entry(solution_path, steps, distractors, technique, pitfall=None):
    return {
        "_meta": META,
        "solution_path": solution_path,
        "steps": [
            {"n": i + 1, "title": s[0], "text": s[1], "tier": s[2]}
            for i, s in enumerate(steps)
        ],
        "framework_id": None,
        "distractors": [
            {"letter": d[0], "why_tempting": d[1], "why_wrong": d[2]}
            for d in distractors
        ],
        "technique": technique,
        "pitfall": pitfall,
    }


REGEN = {}

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-001  proper  →  E välvårdad
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-001"] = entry(
    solution_path="Proper betyder välvårdad — prydlig och i god ordning, ofta om utseende, kläder eller hem. Svaret är E.",
    steps=[
        ("Vad betyder proper?",
         "Proper beskriver något som är välvårdat och prydligt — i god yttre ordning. Du säger 'ett propert hem' om ett städat och välhållet hem, 'en proper karl' om en man som är välklädd och välfriserad. Tonen är saklig och positiv: det handlar inte om lyx eller smak, bara om att saker är rena, hela och i ordning. Det är YTTRE prydlighet som beskrivs, inte inre egenskaper.",
         "essential"),
        ("Engelsk/fransk släkting: propre, proper",
         "Proper är ett lånord som bär samma kärna i flera språk: franska propre = 'ren, egen', engelska proper = 'riktig, ordentlig'. På svenska har vi landat i den prydliga grenen — ordentlig till utseendet. Närbesläktade ord: properhet (prydligheten själv), propert ordnat (snyggt arrangerat). Tänk 'ordentlig på ytan' när du ser ordet.",
         "detail"),
        ("Välj synonymen",
         "Välvårdad (E) träffar exakt — något som är väl omhändertaget och hålls i fin ordning. Båda orden pekar på den YTTRE prydligheten utan att säga något om innehåll, status eller karaktär.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att blanda ihop proper med stolt eftersom en proper person ofta står rak och ger ett ordnat intryck.",
         "Stolt är en INRE känsla av självvärde, proper är ett YTTRE intryck av prydlighet. Du kan vara stolt och slarvig samtidigt, eller proper utan att vara det minsta stolt — steg 1 betonar att proper bara beskriver ytan."),
        ("B",
         "Många stannar vid associationen 'proper = lagom, behärskad' och hamnar i måttfull.",
         "Måttfull handlar om MÄNGD och beteende — att inte överdriva. Proper handlar om PRYDLIGHET och ordning. En måttfull människa kan vara slarvig i klädsel; en proper människa kan vara omåttlig i annat."),
        ("C",
         "Snabbsvar är ofta 'allvarlig' eftersom propra personer kan upplevas formella och tillknäppta.",
         "Allvarlig beskriver SINNESSTÄMNING eller hållning (rakt motsatsen till glad). Proper beskriver YTTRE ORDNING. En leende, skämtsam person kan vara mycket proper; en allvarlig person kan vara rufsig i håret."),
        ("D",
         "Första instinkten är ofta 'förmögen' eftersom propra människor traditionellt förknippas med medelklass och välstånd.",
         "Förmögen betyder att äga MYCKET PENGAR — en ren ekonomisk beskrivning. Proper säger inget om plånboken; en student med små marginaler kan vara väldigt proper, en miljardär kan vara påtagligt oproper."),
    ],
    technique="Lånordsstigen för proper-/propor-: när huvudordet är ett franskt/engelskt lånord på 'proper' eller 'propor' (proper, propert, proportion, propaganda), tänk på franska propre = 'egen, ren' och leta efter den 'ordentligt-i-sin-domän'-betydelsen. Triggern: 'lånord från romanska språk → kolla rotbetydelsen, inte den svenska klangen'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-002  galosch  →  E gummisko
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-002"] = entry(
    solution_path="En galosch är en gummisko — ursprungligen ett ytterskoskydd i gummi som man trär över vanliga skor i blött väder. Svaret är E.",
    steps=[
        ("Vad är en galosch?",
         "En galosch är en sko (eller ett skoskydd) av gummi som man bär utomhus i regn och slask. Bilden i ordet är de gamla låga gummigaloscherna som farfar drog över sina läderskor när det ösregnade — de skyddade lädret från väta och lera. I dagens svenska används ordet både om hela gummistövlar och om mindre överdragsskor, men alltid om något i GUMMI och alltid om FOTBEKLÄDNAD för dåligt väder.",
         "essential"),
        ("Fransk skohistoria",
         "Ordet kommer via franskan (galoche) ända från latinets gallica, en typ av sandal från Gallien. Genom århundradena har det vandrat från romersk träsandal till medeltida lädersko till 1800-talets gummiöverdrag — men alltid varit en FOT-pryl. När du ser ett ord på -osch som inte är uppenbart svenskt, gissa franskt ursprung och leta efter en konkret betydelse.",
         "detail"),
        ("Välj synonymen",
         "Gummisko (E) träffar exakt — det är materialet (gummi) plus funktionen (sko) som definierar galoschen. Inget av de andra alternativen handlar ens om fötter.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att gissa filthatt om man bara vet att galosch är ett gammaldags klädesplagg och associerar till farfars tid.",
         "En filthatt är HUVUDBONAD i ULL/FILT — galoschen är FOTBEKLÄDNAD i GUMMI. Båda kan vara gammaldags och tillhöra en herrgarderob, men de sitter i motsatta ändar av kroppen och är gjorda av olika material."),
        ("B",
         "Många stannar vid 'något smyckesaktigt och gammaldags' och hamnar på slipsnål.",
         "En slipsnål är ett SMYCKE som håller slipsen på plats — pyttelitet, hör hemma kring halsen. Galoschen är en SKO — stor, hör hemma på golvet. Domänerna är helt olika; det är bara åldern på orden som lurar."),
        ("C",
         "Snabbsvar är ofta 'högtidsdräkt' eftersom galosch klingar elegant och 1800-talsmässigt.",
         "Högtidsdräkt är en HEL FORMELL KLÄDSEL (frack, smoking) — en hel utstyrsel. Galoschen är ETT enda föremål, dessutom en VARDAGSPRYL för regnväder. Klangen kan vara fin men funktionen är prosaisk: skydda fötterna mot slask."),
        ("D",
         "Vänster-till-höger-läsning ger 'slängkappa' eftersom det också är ett ålderdomligt ytterplagg.",
         "En slängkappa är en LÖS YTTERROCK som hängs över axlarna. Galoschen är en GUMMISKO på fötterna. Båda är ytterkläder mot väder, men ovansida vs undersida av kroppen — och slängkappan är av tyg, inte gummi."),
    ],
    technique="Konkreta sakord-stigen: när huvudordet är ett gammaldags sakord (galosch, slipsnål, frack), fråga 'vilken kroppsdel?' och 'vilket material?'. Här: fötter + gummi = gummisko. Triggern: 'okänt fackord → lokalisera på kroppen + namnge materialet, så sållar du bort fel-domän-distraktorer'.",
    pitfall="Distraktorer i ORD klär ofta upp sig som 'samma era, fel kroppsdel'. Botemedlet: efter att du nämnt rätt domän (fötter), ELIMINERA aktivt alla alternativ som hamnar någon annanstans på kroppen — det skär bort 3 av 4 fällor på en sekund.",
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-003  dementera  →  B förneka
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-003"] = entry(
    solution_path="Dementera betyder att förneka — officiellt avvisa ett påstående och säga 'det stämmer inte'. Svaret är B.",
    steps=[
        ("Vad betyder dementera?",
         "Att dementera är att gå ut offentligt och säga att ett påstående är felaktigt. Typisk användning: 'företaget dementerade ryktet om uppköp', 'ministern dementerade uppgifterna i tidningen'. Ordet hör hemma i nyhets- och PR-språket och har en formell, offentlig ton — du dementerar inte vardagliga småprat, du dementerar uppgifter som spridits brett. Kärnan är ETT KLART AVVISANDE av något som påstås vara sant.",
         "essential"),
        ("Latin: de- + mens (sinne)",
         "Dementera kommer från latinets dementire = 'göra till osanning, ta sinnet ur'. Samma stam mens (sinne, förstånd) finns i mental, demens, mentalitet. Förstavelsen de- betyder här 'bort från' — att dementera är att ta påståendets 'sinne' (dvs. dess sanning) ifrån det och förklara det galet. Inte att ljuga själv, utan att FÖRKLARA något annat osant.",
         "detail"),
        ("Välj synonymen",
         "Förneka (B) träffar mitt i prick: att säga 'nej, så är det inte'. Båda orden är handlingen att avvisa ett påstående som osant — dementera är bara den lite mer offentliga, formella varianten av förneka.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att fastna i den allmänna seriösa tonen och associera dementera till sörja, som också hör hemma i officiella sammanhang.",
         "Sörja är att KÄNNA OCH UTTRYCKA SORG efter någon eller något förlorat — en emotionell handling. Dementera är att AVVISA ETT PÅSTÅENDE — en informationshandling. Helt olika domäner; det är bara den formella klangen som lurar."),
        ("C",
         "Många stannar vid 'dementera = säga något osant' och tänker direkt på att ljuga.",
         "Här är riktningen omvänd. Att ljuga är att SJÄLV påstå något falskt. Att dementera är att säga om något ANNAT (ett rykte, en uppgift) att det är falskt. En dementi kan vara sann eller lögn — men handlingen i sig är att avvisa, inte att hitta på."),
        ("D",
         "Snabbsvar är ofta 'förbjuda' eftersom myndigheter både dementerar och förbjuder saker.",
         "Förbjuda är att SÄTTA STOPP för en handling — säga 'detta får inte göras'. Dementera är att SÄGA EMOT ett påstående — säga 'detta är inte sant'. Förbudet riktar sig mot framtida göranden, dementin mot redan uttalade ord."),
        ("E",
         "Det är frestande att tolka dementera som 'störa' eftersom en dementi avbryter och rubbar nyhetsbilden.",
         "Att störa är allmänt — ATT AVBRYTA NÅGON ELLER NÅGOT i pågående aktivitet. Dementera är specifikt — ATT MOTSÄGA ett påstående. Effekten kan vara störande men handlingen är språklig och innehållslig, inte avbrytande."),
    ],
    technique="Latinska de-stigen: när huvudordet börjar med de- (dementera, deportera, demolera, dekonstruera), tänk 'bort från / motsatsen till'. Här: de- + mens (sinne/sanning) → 'ta sanningen ur'. Triggern: 'verb på de- + romansk stam → leta motsats- eller avlägsna-betydelsen'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-004  medaljens baksida  →  D nackdelen
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-004"] = entry(
    solution_path="Medaljens baksida betyder nackdelen — den negativa sidan av något som annars är bra. Svaret är D.",
    steps=[
        ("Vad betyder medaljens baksida?",
         "Medaljens baksida är ett bildligt uttryck. Bilden: en medalj har en glänsande framsida med inskription och hederstecken — och en oansenlig baksida som man sällan visar. Överfört: varje sak som glänser (ett bra jobb, en framgång, en relation) har också en mindre flatterande aspekt — det är medaljens baksida. Uttrycket används NÄSTAN ALLTID negativt: 'medaljens baksida är att…' följt av nackdelen, kostnaden, priset man får betala.",
         "essential"),
        ("Idiomstigen: bild → betydelse",
         "Det här är ett idiom — uttrycket går inte att slå upp ord för ord, du måste se HELA bilden. Medalj + baksida = den dolda nackdelen bakom det skinande. Liknande idiom: 'andra sidan av myntet' (samma bild, mynt istället för medalj), 'priset man får betala' (samma idé, ekonomisk bild). När du ser 'baksida' eller 'andra sidan' i ett uttryck, leta efter den dolda negativa aspekten.",
         "detail"),
        ("Välj synonymen",
         "Nackdelen (D) är den raka översättningen av bilden — den negativa aspekten av något i övrigt positivt. Inget annat alternativ fångar det negativa innehållet i uttrycket.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka 'baksidan' som det som ligger BAKOM och därför ger orsaken — det som producerar framsidan.",
         "Orsaken är vad som FÖRORSAKAR något (varför det blev så). Medaljens baksida är vad som DRABBAR dig som följd av att det glänsande inträffat (priset för framgången). Orsak vs konsekvens — och uttrycket pekar tydligt på konsekvensen, inte på orsaken."),
        ("B",
         "Många stannar vid 'baksida = något ovanligt, som inte visas' och landar på undantaget.",
         "Ett undantag är något som AVVIKER från regeln (ett tillfälle som inte följer mönstret). Medaljens baksida är något som ALLTID finns där (varje glans har sin skugga). Undantaget är sällsynt; baksidan är regel. Riktningen är fel."),
        ("C",
         "Snabbsvar är ofta 'motståndet' eftersom baksidan klingar som något som drar emot framsidan.",
         "Motstånd är en YTTRE KRAFT som arbetar emot dig (andra människor, omständigheter som bromsar). Medaljens baksida är en INNEBOENDE NEGATIV ASPEKT av själva framgången. Inget motstånd — bara den naturliga skuggsidan."),
        ("E",
         "Om du minns 'medalj' bara som något man får efter en prestation kan resultatet ligga nära till hands.",
         "Resultatet är OUTFALLET av en handling (vad som kommer ut, neutralt). Medaljens baksida är den NEGATIVA aspekten av ett positivt resultat. Resultatet är hela utfallet; baksidan är specifikt den oattraktiva delen av det."),
    ],
    technique="Idiomstigen: när huvudordet är ett bildligt uttryck (medaljens baksida, isberget, droppen), bygg upp HELA bilden mentalt först, leta sedan efter den abstrakta känslan bilden förmedlar. Triggern: 'fast uttryck med konkret föremål → konstruera scenen, läs av tonen, översätt'.",
    pitfall="Idiom lockar med ord-för-ord-läsningar (baksida = bakåt = orsak/motstånd). Botemedlet: medvetet IGNORERA den enskilda ord-betydelsen efter att du läst frasen som helhet — uttrycket betyder något bilden visar, inte vad orden var för sig säger.",
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-005  cerebral  →  B som gäller hjärnan
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-005"] = entry(
    solution_path="Cerebral betyder 'som gäller hjärnan' — av latinets cerebrum = hjärna. Svaret är B.",
    steps=[
        ("Vad betyder cerebral?",
         "Cerebral är ett medicinskt fackord som beskriver något som hör till hjärnan. Du möter det i sammansättningar som cerebral pares (en hjärnskada som påverkar rörelsen), cerebrala blödningar (blödningar i hjärnan), cerebrospinalvätska (vätskan kring hjärna och ryggmärg). I bildlig användning kan 'en cerebral typ' betyda en hjärnig, intellektuell person — men kärnbetydelsen är alltid kopplad till HJÄRNAN som organ.",
         "essential"),
        ("Latin: cerebrum = hjärna",
         "Cerebrum är latinets ord för hjärna; adjektivet cerebralis betyder 'hörande till hjärnan'. Samma stam dyker upp i cerebellum (lillhjärnan, 'lilla hjärnan'). Närstående medicinska adjektiv är pulmonell (av lungor), kardiell (av hjärtat), renal (av njurarna), hepatisk (av levern). När du ser ett medicinskt adjektiv på -al eller -isk, fråga 'vilken kroppsdel namnges på latin?'.",
         "detail"),
        ("Välj synonymen",
         "Som gäller hjärnan (B) träffar exakt rätt latinska betydelse av cerebrum. Alternativet är formulerat just så som ett medicinskt adjektiv definieras — 'som gäller / som rör organet X'.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att blanda ihop cerebral med 'svår eller intensiv huvudvärk' och tro att det betyder något som orsakar smärta.",
         "Cerebral säger BARA var något händer (i hjärnan), inte HUR det känns. Cerebrala processer kan vara smärtsamma (migrän) eller helt smärtfria (tankeverksamhet). Smärtan är inte i ordet — den är ett möjligt symptom, inte definitionen."),
        ("C",
         "Många stannar vid 'cerebral = sinnesnära' och associerar fel till synen, som också är en hjärnnära funktion.",
         "Synen sitter visserligen i hjärnan men har sitt eget medicinska adjektiv: okulär (av latinets oculus = öga) eller visuell. Cerebral skulle aldrig användas specifikt om synen — det är för brett. Steg 2 visar att varje organ har sitt eget adjektiv."),
        ("D",
         "Snabbsvar är ofta 'beror på kosten' om man förknippar hjärnfunktion med blodsockernivåer och näring.",
         "Det här blandar ihop EFFEKT med BETYDELSE. Kosten kan påverka hjärnan, men det betyder inte att cerebral betyder 'kostbero­ende'. Det medicinska adjektivet för kost är nutritiv eller dietär — cerebral handlar bara om PLATSEN (hjärnan), inte om orsaken."),
        ("E",
         "Det är frestande att tolka cerebral som 'omedveten / reflexmässig' om man tänker på att hjärnan styr automatiska funktioner.",
         "Reflexer (knäreflexen, blinkningen) går faktiskt mest via ryggmärgen, inte hjärnan — det heter medullär eller spinal. Cerebral är dessutom MEDVETEN-domänen i bildligt språk ('cerebral typ' = tänkande). Riktningen är motsatsen till reflex."),
    ],
    technique="Medicinska adjektiv-stigen: när huvudordet är ett medicinskt adjektiv på -al / -isk / -ell (cerebral, renal, kardiell, hepatisk), fråga 'vilket latinskt organnamn?' och sätt sedan 'som gäller X' framför. Triggern: 'medicin-klingande adjektiv → leta latinska organstammen, definiera som rör/hör till det organet'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-006  hemsökelse  →  A utbredd plåga
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-006"] = entry(
    solution_path="En hemsökelse är en utbredd plåga — en olycka eller landsplåga som drabbar många, ofta länge. Svaret är A.",
    steps=[
        ("Vad betyder hemsökelse?",
         "Hemsökelse betecknar en stor, utbredd olycka som drabbar ett folk, en plats eller en tid: pest, hungersnöd, krig, gräshoppor. Det är ett tungt ord med bibliska undertoner — 'de tio plågorna' kallas också 'Egyptens hemsökelser'. I dagens svenska används det ofta lite drastiskt eller skämtsamt ('myggorna är årets hemsökelse'), men kärnan är alltid en KOLLEKTIV PLÅGA som ÄR ÖVER en grupp människor under en längre tid.",
         "essential"),
        ("Verbet hemsöka: 'söka upp i hemmet'",
         "Hemsökelse kommer från verbet hemsöka, som ursprungligen betydde 'söka upp någon i hens hem' — en olycka, en sjukdom eller en gengångare som kommer hem till dig. Härav nutida betydelser: 'spöken hemsöker huset', 'kriget hemsökte landet'. Tänk dig något som kommer OINBJUDET och blir kvar — det är hemsökelsens kärna.",
         "detail"),
        ("Välj synonymen",
         "Utbredd plåga (A) fångar exakt: 'plåga' (lidandet) + 'utbredd' (att den drabbar många/brett). Inget annat alternativ bär den kombinationen av kollektiv skala + ihållande lidande.",
         "essential"),
    ],
    distractors=[
        ("B",
         "Det är lätt att tolka hemsökelse som ett INRE psykiskt tillstånd och hamna på rastlöshet, som också rör en oro i hemmiljön.",
         "Rastlöshet är ett INRE tillstånd hos en person (inte kunna vara still). Hemsökelse är ett YTTRE skeende som drabbar många (en plåga som kommer utifrån). Den ena är psykologisk, den andra är epidemisk."),
        ("C",
         "Många stannar vid 'hem' i hemsökelse och tänker på officiell hemvändelse eller hemförfrågan — alltså en formell begäran.",
         "Här lockar 'hem-' förstavelsen vilse. Hemsökelse har inget med begäran att göra; det är något som kommer OINBJUDET. En formell begäran är dessutom hövlig och frivillig — hemsökelsen är dess raka motsats: en oönskad invasion."),
        ("D",
         "Snabbsvar är ofta 'uppståndelse' eftersom en hemsökelse skapar tumult och uppståndelse i samhället.",
         "Det blandar ihop SAK och EFFEKT. Hemsökelsen är SJÄLVA OLYCKAN (pesten, kriget); uppståndelsen är BULLRET det orsakar (människors reaktion). Du kan ha hemsökelse utan uppståndelse (smyger sig på) och uppståndelse utan hemsökelse (firande). De är åtskilda."),
        ("E",
         "Om du minns 'söka upp någon i hemmet' kan tolkningen bli ett personligt erbjudande som någon kommer hem med.",
         "Ett personligt erbjudande är något POSITIVT som kommer riktat till dig (ett anbud, en gåva). Hemsökelse är något NEGATIVT som drabbar dig och många till. Båda kan involvera oväntade besök, men polariteten — positivt/negativt — är motsatt."),
    ],
    technique="Bibel-tunga ord-stigen: när huvudordet bär gammaltestamentlig klang (hemsökelse, vedermöda, gissel, plåga), tänk på de tio plågorna i Egypten som mall — kollektiv, ihållande, drabbande utifrån. Triggern: 'tung biblisk klang → kollektiv olycka som drabbar många över tid'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-007  tjänlig  →  C användbar
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-007"] = entry(
    solution_path="Tjänlig betyder användbar — som duger till sitt syfte, lämplig för ändamålet. Svaret är C.",
    steps=[
        ("Vad betyder tjänlig?",
         "Tjänlig beskriver något som duger för sitt syfte — som man kan ANVÄNDA i ett bestämt ändamål. 'Tjänligt vatten' är vatten som duger att dricka. 'Tjänlig väderlek' är väder som passar för det man tänkt göra. Ordet är något formellt och föråldrat men förekommer i myndighetsspråk och tekniska sammanhang. Kärnan är 'duger för ändamålet' — ingenting om kvalitet i absolut mening, bara om FUNKTION.",
         "essential"),
        ("Verbet tjäna ger riktningen",
         "Tjänlig kommer från verbet tjäna i betydelsen 'fungera för / vara till nytta för' — som i 'det här ska tjäna oss väl' eller 'rummet tjänar som kontor'. Ändelsen -lig gör adjektivet: 'som kan tjäna sitt syfte'. Samma logik i begripa → begriplig, använda → användbar. När du ser -lig på en verbstam, fråga 'duger den till sitt verb?'.",
         "detail"),
        ("Välj synonymen",
         "Användbar (C) är den raka, moderna översättningen av tjänlig: går att använda för det avsedda syftet. Båda är funktionsord — ingenting om skönhet eller kvalitet, bara om att det DUGER.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att associera tjänlig till lärorik om man tänker på 'att tjäna' i moralisk mening — något som tjänar din utveckling.",
         "Lärorik betyder att man LÄR SIG av det — kunskapen är poängen. Tjänlig betyder att det DUGER för sitt syfte — funktionen är poängen. En tråkig hammare är tjänlig utan att vara lärorik; en svår erfarenhet kan vara lärorik utan att vara tjänlig."),
        ("B",
         "Många stannar vid 'tjänlig låter klart och rakt' och associerar till begriplig.",
         "Begriplig betyder att man FÖRSTÅR det — det är hjärnans relation till informationen. Tjänlig betyder att det DUGER — det är användarens relation till föremålet. Ett tjänligt verktyg behöver inte vara begripligt (komplicerad maskin); en begriplig text behöver inte vara tjänlig."),
        ("D",
         "Snabbsvar är ofta 'tillgänglig' eftersom tjänlig och tillgänglig båda klingar formellt och positivt.",
         "Tillgänglig betyder att man KAN NÅ det (finns till hands, är öppet, är åtkomligt). Tjänlig betyder att det DUGER när man har det. Ett otillgängligt vatten kan vara tjänligt (källan finns men är låst); ett tillgängligt vatten kan vara otjänligt (förorenat)."),
        ("E",
         "Om du minns 'tjäna' i hushållssammanhang kan lättskött ligga nära till hands.",
         "Lättskött betyder att det kräver LITE UNDERHÅLL (är enkelt att ta hand om). Tjänlig betyder att det DUGER FÖR SYFTET. Ett lättskött föremål kan vara helt otjänligt (en pinne är lättskött men inte tjänlig att hamra med); ett tjänligt föremål kan vara mycket svårskött."),
    ],
    technique="Adjektiv-på-verb-stigen: när huvudordet är ett -lig-adjektiv (tjänlig, brukbar, gångbar, läsbar), hitta verbet det vilar på (tjäna, bruka, gå, läsa) och fråga 'duger det till att VERBA?'. Triggern: '-lig på verbstam → duger för verbets handling'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-008  vara avhängig av  →  C bero på
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-008"] = entry(
    solution_path="Att vara avhängig av något betyder att bero på det — utgången är inte fri, den styrs av något annat. Svaret är C.",
    steps=[
        ("Vad betyder vara avhängig av?",
         "Att vara avhängig AV något är att vara beroende av det — utan det fungerar inte saken, sker inte sakerna, faller inte beslutet. Typisk användning: 'beslutet är avhängigt finansieringen' = beslutet faller eller står med finansieringen. Det är en formell formulering i juridik- och förvaltningsspråket. Bilden i ordet: något HÄNGER PÅ något annat — släpp greppet om det andra, så ramlar det första.",
         "essential"),
        ("Bilden: hängande av något",
         "Avhängig är bokstavligen 'avhängande' — något som hänger AV (från) något annat, som en frukt hänger av en gren. Släpper grenen, faller frukten. Samma 'hänga av'-bild finns i bero på (bero hör ihop med gamla 'bära' — att bäras av), beroende av, och i engelska depend (av-hänga från). Alla bär samma fysiska bild av STÖD UNDERIFRÅN.",
         "detail"),
        ("Välj synonymen",
         "Bero på (C) träffar exakt: den moderna, vardagliga frasen för precis samma relation — utgången styrs av en bakomliggande faktor. Båda fraserna kräver dessutom konstruktionen med 'av/på' efter sig.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka 'avhängig av' som ett tåligt utstående och hamna på stå ut med.",
         "Stå ut med betyder ATT TOLERERA något ovälkommet (uthärda, härda ut). Avhängig av betyder ATT VARA BEROENDE av något (utgången styrs av det). Tolerans är en aktiv vilja; beroende är en passiv koppling. Vitt skilda relationer."),
        ("B",
         "Många stannar vid prepositionen 'av' och associerar till räknas in i — också ett 'av'-uttryck.",
         "Räknas in i betyder ATT VARA EN DEL AV en helhet (höra till en kategori). Avhängig av betyder ATT BEROR av något (styras av en faktor). Helhet-del vs orsak-verkan; helt olika logiska relationer trots den gemensamma prepositionen."),
        ("D",
         "Vänster-till-höger-läsning ger 'utsättas för' eftersom avhängig kan låta som att man är utlämnad åt något.",
         "Utsättas för betyder ATT DRABBAS av något (vara mål för en kraft som verkar på en). Avhängig av betyder ATT VARA BEROENDE av något (utgången bestäms av det). Att utsättas är att vara aktivt drabbad; att vara avhängig är att vara passivt kopplad. Drabba vs härstamma — olika riktning."),
        ("E",
         "Snabbsvar är ofta 'ha tilltro till' om man tolkar beroende som något positivt och förtroendebaserat.",
         "Ha tilltro till betyder ATT LITA PÅ (en mental, värderande relation). Avhängig av betyder ATT BERO på (en faktisk, mekanisk relation). Du kan vara avhängig av något utan att lita på det (oönskat beroende) och lita på något utan att vara avhängig (förtroende utan koppling)."),
    ],
    technique="Fasta uttryck med preposition-stigen: när huvudordet är en flerordsfras med fast preposition (vara avhängig AV, ha bäring PÅ, gå i kraft VID), läs frasen som EN ENHET och leta efter en lika fast moderns synonym med samma prepositionsmönster. Triggern: 'fast preposition i frågan → leta efter alternativ med samma preposition'.",
    pitfall="Distraktorer i flerordsuttryck plockar ofta upp PREPOSITIONEN och bygger en falsk associationskedja (av → utsättas för / räknas in i). Botemedlet: efter att du formulerat betydelsen själv, kolla att alternativet kan stå i frågans MENING ('beslutet är avhängigt av' → 'beslutet beror på' fungerar; 'beslutet räknas in i' bryter).",
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-009  klander  →  C ogillande anmärkning
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-009"] = entry(
    solution_path="Klander är en ogillande anmärkning — en officiell kritik eller tillrättavisning. Svaret är C.",
    steps=[
        ("Vad betyder klander?",
         "Klander är en formell kritik — en uttalad anmärkning att någon gjort fel eller inte hållit en standard. 'Hans arbete är förtjänt av klander' = hans arbete bör kritiseras. 'Klanderfritt' = utan något att anmärka på, fläckfritt. Ordet är formellt och har en ALLVARLIG ton — det är inte småskvaller eller surhet, det är en RIKTAD MISSNÖJESYTTRING med viss tyngd. Ofta i juridiska eller etiska sammanhang.",
         "essential"),
        ("Sambandet klander ↔ klanderfri",
         "Klander är lättast att förstå via dess negation: klanderfri = fri från klander = utan anmärkning, perfekt utförd. Om någons utförande är 'klanderfritt' finns ingenting att anmärka på. Det visar att klander är just ANMÄRKNINGEN — den negativa kommentaren. Verbet är klandra ('klandra någon för något' = anmärka på, tadla).",
         "detail"),
        ("Välj synonymen",
         "Ogillande anmärkning (C) träffar exakt: 'anmärkning' fångar att det är ett yttrande/uttalande, 'ogillande' fångar att tonen är negativ. Båda komponenterna behövs — utan ogillandet är det neutral anmärkning, utan anmärkningen är det bara känsla.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka klander som en orättvis bedömning och hamna på orimligt antagande.",
         "Ett orimligt antagande är en SLUTSATS som inte stöds av fakta (felaktig logik). Klander är en ANMÄRKNING om något redan utfört (negativ kommentar). Klander kan vara välmotiverat eller orimligt — orimligheten är inte i ordet. Du kan klandra någon med rimliga skäl; du kan dra ett orimligt antagande utan att klandra någon."),
        ("B",
         "Många stannar vid 'något negativt om någon' och tänker på falska påståenden — osann uppgift.",
         "Osann uppgift betyder en FELAKTIG SAKUPPLYSNING (något som inte stämmer faktamässigt). Klander är en NEGATIV VÄRDERING (något man ogillar). En klanderfull kommentar kan vara helt sann; en osann uppgift kan vara helt utan klander (oavsiktlig felaktighet). Sanning vs ogillande — olika dimensioner."),
        ("D",
         "Snabbsvar är ofta 'omild behandling' eftersom klander känns som något man utsätts för fysiskt-konkret.",
         "Omild behandling är HANDLING — du gör något hårt mot någon (fysiskt eller praktiskt). Klander är ORD — du säger något ogillande om någon. Du kan klandra någon utan att lyfta ett finger; du kan behandla någon omilt utan att säga ett ord. Ord vs handling."),
        ("E",
         "Vänster-till-höger-läsning ger 'olyckligt misstag' om man läser klander som något beklagligt som inträffat.",
         "Ett olyckligt misstag är ett OAVSIKTLIGT FEL någon BEGÅR. Klander är den AVSIKTLIGA REAKTION andra ger på fel. Misstaget är hos den som agerar; klandret är hos den som bedömer. Du kan klandra en handling som inte var ett misstag (medvetet felval), och ett olyckligt misstag kan undgå klander (om ingen ser det)."),
    ],
    technique="Negation-genvägen: när huvudordet har en känd negation på -fri, -lös eller o-, leta upp den och låt definitionen falla ut. Klanderfri = utan anmärkning → klander = anmärkning. Triggern: 'okänt substantiv där du känner negationen → definiera via vad negationen tar bort'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb1-ORD-010  omsorgsfull  →  A noggrann
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb1-ORD-010"] = entry(
    solution_path="Omsorgsfull betyder noggrann — utförd med omsorg, fullt av omtanke om detaljerna. Svaret är A.",
    steps=[
        ("Vad betyder omsorgsfull?",
         "Omsorgsfull beskriver en handling eller person som utför något MED OMSORG — med uppmärksamhet, omtanke och vilja att få det bra. 'En omsorgsfull förberedelse' = något man förberett noga, med tanke på allt. 'En omsorgsfull mamma' = en mamma som tar hand om sitt barn med vaksamhet och kärlek. Tonen är POSITIV och VARM — det är inte stressad noggrannhet, det är genomtänkt och engagerad ansträngning.",
         "essential"),
        ("Bygget: omsorg + -full",
         "Ordet är genomskinligt: omsorg (omtanke, vård) + -full (fylld av). Bokstavligen 'fylld av omsorg'. Samma -full-konstruktion i kärleksfull (full av kärlek), aktsam (kärnan akt + -sam), arbetsam (full av arbetsvilja). När du ser ett adjektiv på -full, översätt rakt av: 'fylld av X' där X är substantivet före.",
         "detail"),
        ("Välj synonymen",
         "Noggrann (A) träffar mitt i prick. Noggrann betyder att man fäster avseende vid varje detalj, gör saker ordentligt och utan slarv — precis vad någon med omsorg gör. Båda orden pekar på SAKEN UTFÖRS VÄL för att utföraren bryr sig.",
         "essential"),
    ],
    distractors=[
        ("B",
         "Det är lätt att gå från 'omsorgsfull = bryr sig om andra' till trevlig, eftersom människor som bryr sig oftast upplevs trevliga.",
         "Trevlig handlar om SOCIAL TON (behaglig att vara med, vänlig). Omsorgsfull handlar om UTFÖRANDETS KVALITET (noggrann och omtänksam i sak). Du kan vara omsorgsfull i din planering utan att ens träffa människor (trevlighet kräver social interaktion). Form vs sak."),
        ("C",
         "Många stannar vid 'omsorg' och associerar till oro — att vara bekymrad för något.",
         "Bekymrad är att VARA OROAD (känslan av tyngd och ängslan). Omsorgsfull är att HANDLA NOGGRANT med omtanke. Du kan vara omsorgsfull utan minsta bekymmer (lugnt och metodiskt); du kan vara bekymrad utan att göra något omsorgsfullt. Känsla vs handlingsstil."),
        ("D",
         "Snabbsvar är ofta 'tankfull' eftersom omsorg kräver tanke och eftertanke.",
         "Tankfull betyder att VARA SJUNKEN I TANKAR (eftertänksam, fundersam — ofta blickande in i sig själv). Omsorgsfull betyder att UTFÖRA NÅGOT NOGA (riktat utåt mot uppgiften eller personen). Den ena är inåtvänd reflektion, den andra är utåtriktat handlande."),
        ("E",
         "Om du minns 'omsorg = bry sig om' kan inställsam (smickrande, fjäskande) lura om man läser det som 'extra angelägen att behaga'.",
         "Inställsam är NEGATIVT laddat — det är överdriven, falskt anpasslig vilja att behaga (smicker, fjäsk). Omsorgsfull är POSITIVT laddat — uppriktig omtanke och noggrann ansträngning. Polariteten är motsatt; en inställsam person agerar för EGEN vinning, en omsorgsfull person för sakens skull."),
    ],
    technique="-full-adjektivstigen: när huvudordet är ett adjektiv på -full (omsorgsfull, kärleksfull, vördnadsfull, fyndig... egentligen alla -full), översätt bokstavligen som 'fylld av X' där X är förleden. Triggern: 'adjektiv på -full → byt till -full-formen \"full av X\" och leta synonym för X-handlingen'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-001  löpa amok  →  B få raserianfall
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-001"] = entry(
    solution_path="Att löpa amok är att få ett raserianfall — drabbas av blint, okontrollerat ursinne. Svaret är B.",
    steps=[
        ("Vad betyder löpa amok?",
         "Att löpa amok är att helt tappa kontrollen i raseri — springa omkring i blint ursinne, slå sönder saker, hota människor. 'Datorn löper amok' = datorn gör helt galna saker okontrollerat. 'Marknaden löper amok' = priserna rör sig vilt utan logik. Uttrycket är dramatiskt och beskriver alltid förlorad självkontroll på gränsen till våld eller fullständigt kaos. Det är inte 'arg' — det är BORTOM arg.",
         "essential"),
        ("Malajiska: amok = ursinnigt anfall",
         "Amok är ett av få svenska ord direkt från malajiska (mengamuk = anfalla rasande). I 1700-talets reseskildringar berättades om malajiska män som plötsligt drabbades av amok-attacker och drog yxor mot omgivningen — fenomenet fick ord på sig och vandrade in i europeiska språk. Verbet 'löpa' kommer av bilden att den drabbade SPRINGER rasande omkring. Andra exotiska låneord i samma psykologiska kategori: hara-kiri, juju, kamikaze.",
         "detail"),
        ("Välj synonymen",
         "Få raserianfall (B) träffar exakt: 'raseri' fångar det okontrollerade ursinnet, 'anfall' fångar att det är en plötslig attack som drabbar och passerar. Båda komponenterna sitter; de andra alternativen missar antingen våldsamheten eller plötsligheten.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka 'löpa amok' som 'springa fel' om man fokuserar på verbet löpa och tänker bokstavligt.",
         "Att gå vilse är att TAPPA RIKTNINGEN GEOGRAFISKT (inte hitta hem). Att löpa amok är att TAPPA SJÄLVKONTROLLEN PSYKISKT (rasa okontrollerat). Båda involverar förlust, men av helt olika slag — kartans riktning vs sinnets ordning."),
        ("C",
         "Många stannar vid 'löpa' = springa och associerar till någon som springer för att hen är försenad.",
         "Vara försenad är en KALENDERRELATION (komma efter rätt tid). Löpa amok är en SINNESTILLSTÅNDSRELATION (gå sönder mentalt och slå omkring sig). Den försenade springer mot ett mål; amok-löparen springer utan mål, drivet av blint raseri."),
        ("D",
         "Snabbsvar är ofta 'bli överlycklig' om man förknippar amok med extatiskt utbrott och spring av glädje.",
         "Här är polariteten exakt fel. Amok är NEGATIV affekt — raseri, våld, hot. Överlycka är POSITIV affekt — glädje, lättnad, jubel. Båda kan ge dramatiska kroppsliga reaktioner men på motsatta poler av känsloskalan. Steg 1 betonar våldsamheten och förlusten av kontroll — inget jubel."),
        ("E",
         "Vänster-till-höger-läsning ger 'ramla omkull' om man tänker att den som springer rasande tappar balansen och faller.",
         "Att ramla omkull är BOKSTAVLIG fysisk händelse (kroppen tappar balansen, träffar marken). Löpa amok är ett PSYKISKT tillstånd (sinnet tappar greppet). Fallet är ett möjligt resultat av amok, men inte själva betydelsen — du kan löpa amok stående hela tiden."),
    ],
    technique="Exotiska låneord-stigen: när huvudordet är ett fast uttryck med ett ord som inte ser svenskt ut (löpa amok, ge carte blanche, vara persona non grata), behandla det HELA uttrycket som ETT BEGREPP och lär dig dess användning som helhet. Triggern: 'främmande ord i fast uttryck → memorera frasen och dess typiska situation, inte ordens delar'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-002  påtaglig  →  E märkbar
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-002"] = entry(
    solution_path="Påtaglig betyder märkbar — så tydlig att man känner eller ser den klart. Svaret är E.",
    steps=[
        ("Vad betyder påtaglig?",
         "Påtaglig beskriver något som är så tydligt att man INTE kan undgå att märka det — det 'tar på' sinnena. 'En påtaglig kyla' = en kyla som verkligen känns, inte bara en aning. 'Påtagliga framsteg' = framsteg som syns och märks tydligt. Tonen är saklig: påtaglig säger inget om vad något är värt, bara att det är MÄRKBART NÄRVARANDE. Det är motsats till knappt skönjbar, antydd, knappt urskiljbar.",
         "essential"),
        ("Bygget: ta på + -lig",
         "Påtaglig kommer från 'ta på' (känna med handen, beröra) + -lig (kan-formen). Bokstavligt: 'som går att ta på'. Bilden är fysisk — kylan känns på huden, framstegen syns på resultatet. Samma mönster: gripbar (kan gripas), märkbar (kan märkas), iakttagbar (kan iakttas). Påtaglig är ÄLDRE svenska för precis samma idé: 'kan kännas tydligt'.",
         "detail"),
        ("Välj synonymen",
         "Märkbar (E) träffar mitt i prick: 'som går att märka'. Precis samma logik som påtaglig ('som går att ta på') — bara att märkbar är den modernare formuleringen. Båda betonar att fenomenet är TYDLIGT NÄRVARANDE för sinnena.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att förväxla påtaglig med bekant om man läser det som 'något man känner sedan tidigare'.",
         "Bekant betyder att man KÄNT TILL det förut (familjär, igenkänd). Påtaglig betyder att det är TYDLIGT NÄRVARANDE just nu (märkbart). En påtaglig doft kan vara helt obekant; en bekant doft kan vara så svag att den knappt är påtaglig. Igenkänning vs intensitet — olika dimensioner."),
        ("B",
         "Många stannar vid 'påtaglig låter speciell och utmärkande' och hamnar på särskild.",
         "Särskild betyder UTMÄRKANDE eller AVSEDD FÖR ETT SYFTE (utmärkt, speciell). Påtaglig betyder TYDLIGT MÄRKBAR (kan inte missas). En särskild gäst är utmärkt bland andra; en påtaglig gäst är bara mycket närvarande. Utmärkning vs märkbarhet."),
        ("C",
         "Snabbsvar är ofta 'passande' om man tolkar påtaglig som 'något som griper tag och hör hemma'.",
         "Passande betyder LÄMPLIG FÖR SAMMANHANGET (in i kontexten). Påtaglig betyder INTRYCK PÅ SINNENA (märks tydligt). En passande klädsel kan vara helt opåtaglig (smälter in); en påtaglig klädsel kan vara opassande (för iögonfallande). Lämplighet vs intensitet."),
        ("D",
         "Om du minns 'ta på' i påtaglig kan rörelse-känslan leda till hastig (något som händer snabbt).",
         "Hastig betyder SOM SKER PLÖTSLIGT/SNABBT (tidsmått). Påtaglig betyder SOM TYDLIGT MÄRKS (sinnesmått). En hastig kyla kan vara opåtaglig (svalkande pust); en påtaglig kyla kan vara helt gradvis ('det blev allt kallare hela kvällen'). Tempo vs intensitet."),
    ],
    technique="'Kan-VERBAS'-stigen: när huvudordet bär en känd verbstam + -lig/-bar (påtaglig, märkbar, gripbar, läsbar), översätt bokstavligen som 'kan + verbet i passiv'. Påtaglig = kan tas på = kan märkas tydligt. Triggern: '-lig/-bar på verbstam → utläs som passiv-möjlighet'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-003  uppsåtligen  →  A med avsikt
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-003"] = entry(
    solution_path="Uppsåtligen betyder med avsikt — gjort med vett och vilja, inte av misstag. Svaret är A.",
    steps=[
        ("Vad betyder uppsåtligen?",
         "Uppsåtligen beskriver en handling som utförts MEDVETET och AVSIKTLIGT — utövaren visste vad hen gjorde och ville att det skulle ske. Ordet hör hemma i juridiskt språk: 'gärningen begicks uppsåtligen' betyder att domstolen anser att den åtalade gjorde det MED FÖRSÄTT, inte av oaktsamhet eller olyckshändelse. I straffrätt är skillnaden helt avgörande — uppsåtliga brott straffas hårdare än oaktsamma. Det är ett TUNGT ord med precis betydelse.",
         "essential"),
        ("Substantivet uppsåt + -ligen",
         "Uppsåtligen är adverbet av substantivet uppsåt (avsikt, försats). 'Med uppsåt' = 'med avsikt'. Uppsåt självt är bildat av upp- (intensifierande) + sätta (sätta som mål) — ursprungligen 'det man satt upp som mål'. Samma logik i föresats (vad man satt fram för sig). När du ser 'uppsåt' eller 'försåt' i en text, signalerar det nästan alltid att handling kontrasteras mot olyckshändelse.",
         "detail"),
        ("Välj synonymen",
         "Med avsikt (A) träffar exakt: avsikt är det vardagliga ordet för uppsåt, och konstruktionen 'med avsikt' speglar 'med uppsåt'. Båda fångar att handlingen var medveten och VILJEMÄSSIG, inte tillfällig eller felaktig.",
         "essential"),
    ],
    distractors=[
        ("B",
         "Det är lätt att tolka uppsåt positivt och hamna på 'av välvilja' om man läser det som ädla intentioner.",
         "Av välvilja betyder UTIFRÅN GODA AVSIKTER (vill någon annan väl). Uppsåtligen betyder MEDVETET (visste vad man gjorde). En handling kan vara uppsåtlig och illvillig samtidigt — uppsåtet är neutralt om motivet. Faktiskt är ordet uppsåtligen oftast NEGATIVT i juridiska sammanhang: uppsåtligt mord, uppsåtlig skadegörelse."),
        ("C",
         "Många stannar vid att uppsåtligt har en allvarlig, formell ton och associerar till i förtroende.",
         "I förtroende betyder UNDER LÖFTE OM SEKRETESS (utan att föras vidare). Uppsåtligen betyder MEDVETET OCH AVSIKTLIGT (utan oaktsamhet). Båda är formella men handlar om helt olika saker — den ena om informationens flöde, den andra om handlingens medvetenhet."),
        ("D",
         "Snabbsvar är ofta 'på rätt sätt' om man läser uppsåt som 'sätta upp ordentligt'.",
         "På rätt sätt betyder ENLIGT KORREKT METOD (kvalitetsbedömning av utförandet). Uppsåtligen betyder MED VILJA (kvalitetsbedömning av motivet). Något kan göras uppsåtligt på fel sätt (man försökte göra det dåligt med flit) och på rätt sätt utan uppsåt (man råkade göra det perfekt). Sätt vs vilja."),
        ("E",
         "Vänster-till-höger-läsning ger 'utan tvekan' om man tolkar uppsåt som 'bestämt, beslutsamt'.",
         "Utan tvekan betyder UTAN TVEKSAMHET I HANDLINGEN (beslutsamt, säkert). Uppsåtligen betyder MED MEDVETEN AVSIKT (visste vad man gjorde). Du kan handla uppsåtligt med stor tvekan (visste vad du gjorde men tvekade länge) och tveklöst utan uppsåt (snabb instinkthandling utan plan)."),
    ],
    technique="Juridik-adverb-stigen: när huvudordet är ett juridiskt klingande adverb (uppsåtligen, oaktsamt, försumligen, tillförlitligen), leta substantivet det vilar på (uppsåt, oaktsamhet, försummelse, tillförlitlighet) och definiera vardagligt. Triggern: 'adverb på -ligen / -samt → hitta nominalformen, översätt rakt'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-004  biopsi  →  D vävnadsprov
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-004"] = entry(
    solution_path="En biopsi är ett vävnadsprov — att läkaren tar ut en bit kroppsvävnad för att kunna undersöka den. Svaret är D.",
    steps=[
        ("Vad är en biopsi?",
         "En biopsi är när läkaren tar ut en liten bit vävnad ur kroppen — från ett organ, en knöl, en hud­förändring — för att kunna granska den i mikroskop. Syftet är diagnostik: ofta vill man veta om en cellförändring är godartad eller cancer. Provet kan tas med en grov nål, en tång eller en liten skalpell. Det är ett av de vanligaste sätten att STÄLLA EN SÄKER DIAGNOS — inget annat alternativ ger samma direkta tillgång till själva vävnaden.",
         "essential"),
        ("Grekiska: bios + opsis = liv-syn",
         "Biopsi är byggt av grekiskans bios (liv, levande) + opsis (syn, betraktelse). Bokstavligen: 'titta på levande vävnad'. Samma -opsi-stam i autopsi (auto = själv: 'se själv', alltså obduktion — fast då av död vävnad). Och bios-stammen i biologi, biografi, antibiotika. När du ser bi-o + -opsi, tänk 'levande vävnad betraktad'.",
         "detail"),
        ("Välj synonymen",
         "Vävnadsprov (D) är den exakta svenska översättningen av biopsi — det medicinska handgreppet att TA UT ETT VÄVNADSPROV för undersökning. Båda orden pekar på samma ingrepp; ingen annan term i alternativen avser uttagning av vävnad.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att blanda ihop biopsi med blodgivning eftersom båda är medicinska ingrepp där läkaren tar något ur kroppen med nål.",
         "Blodgivning tar ut BLOD (en kroppsvätska som flyter) i syfte att RÄDDA ANDRA människors liv via transfusion. Biopsi tar ut VÄVNAD (en bit fast kroppsmaterial) i syfte att UNDERSÖKA PATIENTENS EGNA celler. Olika material, olika syfte — det är bara nålen som lurar."),
        ("B",
         "Många stannar vid 'något som händer i huden / på vävnaden' och associerar till ärrbildning.",
         "Ärrbildning är HUDENS LÄKNING efter skada — kroppens reaktion. Biopsi är LÄKARENS UTTAG av vävnad — en aktiv handling. Biopsin kan möjligen LÄMNA ett ärr efter sig, men ärret är konsekvensen, inte ingreppet. Resultat vs procedur."),
        ("C",
         "Snabbsvar är ofta 'röntgenbild' eftersom biopsi och röntgen båda är diagnostiska medicinska verktyg.",
         "Röntgen ger en BILD genom strålning UTAN att ta något ur kroppen (helt icke-invasiv). Biopsi tar BORT en bit vävnad ur kroppen (invasiv). Båda hjälper diagnos men på motsatta sätt — den ena fotograferar utifrån, den andra plockar ut inifrån."),
        ("E",
         "Om du minns 'kirurgiskt ingrepp' kan transplantation ligga nära till hands.",
         "Transplantation är att FLYTTA in vävnad eller organ från en kropp till en annan (man lägger till). Biopsi är att TA UT vävnad ur en kropp för analys (man tar bort en liten mängd). Riktningen är motsatt — in vs ut — och syftet är behandling vs diagnos."),
    ],
    technique="Grekisk-stam-stigen: när huvudordet är ett medicinskt fackord med synlig grekisk stam (biopsi, autopsi, endoskopi, biografi), plocka isär det i kärnstammar (bio-, auto-, endo-, -opsi, -grafi) och översätt bokstavligen. Triggern: 'medicinskt -i- eller -opsi-ord → bryt på stamfogen, översätt ord för ord'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-005  detronisera  →  B avsätta
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-005"] = entry(
    solution_path="Detronisera betyder att avsätta — att störta någon från makten, bokstavligen 'från tronen'. Svaret är B.",
    steps=[
        ("Vad betyder detronisera?",
         "Att detronisera är att avlägsna en härskare från makten — köra ner någon från tronen, formellt eller med våld. 'Karl X detroniserade Johan Kasimir 1657'. I modern användning är det också bildligt: 'iPhone detroniserade BlackBerry på smartphonemarknaden' = drev ner BlackBerry från ledarpositionen. Kärnan är ALLTID att TVINGA BORT NÅGON FRÅN EN MAKTPOSITION — inte bara utmana, inte bara förakta, utan EFFEKTIVT FÖRDRIVA.",
         "essential"),
        ("Latin: de- + thronus",
         "Detronisera är byggt av latinska de- (bort från) + thronus (tron, från grekiskans thronos). Bokstavligen 'från-trona' eller 'av-trona'. Samma de-mönster i deportera (bort-bära), demolera (bort-bygga, riva), dekonstruera (bort-bygga teori). När du ser de- + en sak-stam, leta efter 'avlägsna / ta bort från X' — det är nästan alltid svaret.",
         "detail"),
        ("Välj synonymen",
         "Avsätta (B) är den raka svenska översättningen: ta av någon från en post eller position. Båda orden förutsätter att personen HADE en maktposition och att handlingen TAR den ifrån dem mot deras vilja.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka detronisera som 'gå emot en härskare' och hamna på utmana.",
         "Att utmana är att STRIDA OM positionen (kasta ut handsken, försöka ta makten). Att detronisera är att HA LYCKATS — utmaningen är fullbordad, härskaren är ner. Utmaningen är handlingen INNAN, detroniseringen är RESULTATET av en lyckad utmaning. Försök vs fullbordan."),
        ("C",
         "Många stannar vid den negativa tonen och associerar till förakta — också riktat mot en överordnad.",
         "Att förakta är en KÄNSLA — inre nedvärdering av någon. Att detronisera är en HANDLING — yttre fördrivning från makten. Du kan förakta en kung utan att kunna göra något åt det; en kung kan detroniseras av folk som beundrar honom personligen men anser honom olämplig. Känsla vs handling."),
        ("D",
         "Snabbsvar är ofta 'avböja' om man läser de- som 'säga nej' till något.",
         "Att avböja är att TACKA NEJ till ett erbjudande (du kan tacka nej till en utnämning). Att detronisera är att TVINGA BORT någon från en redan innehavd position (du tvingar bort den som redan sitter). Den ena gäller framtida möjligheter, den andra gäller nuvarande ställning. Inkomma-läget är motsatt."),
        ("E",
         "Vänster-till-höger-läsning ger 'utvisa' om man läser det som 'visa ut härskaren'.",
         "Att utvisa är att SKICKA UT NÅGON FYSISKT från ett land eller område. Att detronisera är att TA IFRÅN NÅGON MAKTEN — personen kan stanna kvar i landet (kan rentav fortsätta som privatperson). Geografisk förflyttning vs maktposition. Steg 1 betonar att det är POSITIONEN som tas, inte personen som flyttas."),
    ],
    technique="De-stigen för bort-tagande verb: när huvudordet är de- + en sak/plats-stam (detronisera, deportera, demolera, demaskera), översätt bokstavligen som 'ta bort X / ta från X'. Här: de + tron = ta från tronen. Triggern: 'de- + plats/sak → bort-handlingen riktad mot just den platsen/saken'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-006  fruktlös  →  C som inte ger resultat
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-006"] = entry(
    solution_path="Fruktlös betyder 'som inte ger resultat' — som inte bär frukt, som är förgäves. Svaret är C.",
    steps=[
        ("Vad betyder fruktlös?",
         "Fruktlös beskriver ansträngningar eller försök som INTE LEDER NÅGONVART — som inte producerar något användbart resultat. 'Fruktlösa förhandlingar' = förhandlingar som inte lett till en överenskommelse. 'Ett fruktlöst försök att övertyga henne' = ett försök som misslyckades. Bilden är trädet som inte bär frukt — du har ansträngt dig, men ingen avkastning. Tonen är förgäves-stämd: arbetet HAR utförts, men det var till ingen nytta.",
         "essential"),
        ("Frukt som bild för utfall",
         "I svenska och många andra språk fungerar 'frukt' som metafor för UTFALLET av en ansträngning: 'arbetets frukter' = vad man får ut av sitt arbete, 'bära frukt' = ge resultat, 'fruktbar diskussion' = diskussion som ger resultat. Fruktlös är spegelvändningen: utan utfall, utan avkastning. Samma bild i engelska fruitful/fruitless och i bibelns 'av deras frukt ska ni känna dem'. När du ser 'frukt' i bildlig användning, läs det som RESULTAT.",
         "detail"),
        ("Välj synonymen",
         "Som inte ger resultat (C) är den raka översättningen: alternativet säger exakt vad fruktlös betyder — utan att producera något. Bilden 'bära frukt' (= ge resultat) är dess motsats, och 'inte ge resultat' är dess kärna.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att läsa fruktlös bokstavligt och tänka på något smalt, tunt, näringsfattigt — alltså mager.",
         "Mager är BOKSTAVLIG kroppsbeskrivning (tunn, smal, lite kött på benen). Fruktlös är BILDLIG resultatbeskrivning (ger ingen avkastning). Steg 2 förklarar att 'frukt' i fruktlös är METAFOR för utfall — det handlar inte alls om bantning eller kroppsstorlek."),
        ("B",
         "Många stannar vid 'fruktlös = saknar något inuti' och associerar till utan innehåll.",
         "Utan innehåll betyder TOMT INVÄNDIGT (inget i lådan, inget i texten). Fruktlös betyder UTAN UTFALL EFTER ANSTRÄNGNING (inget kom ut). En ansträngning är inte 'tom' i sig — den hade fullt med arbete i sig — den bara LEDDE inte till något. Innehåll vs avkastning."),
        ("D",
         "Snabbsvar är ofta 'utan anledning' om man läser fruktlös som 'utan grund'.",
         "Utan anledning betyder UTAN ORSAK / GRUND (att inleda något skäligt). Fruktlös beskriver hur en handling SLUTADE (utan resultat). Anledningen är vad som driver IGÅNG, frukten är vad som kommer UT. En motiverad ansträngning (med god anledning) kan vara fruktlös; en omotiverad ansträngning kan av en slump bli fruktbar."),
        ("E",
         "Vänster-till-höger-läsning ger 'ofullständig' om man tolkar -lös som 'utan hela slutförandet'.",
         "Ofullständig betyder ATT NÅGOT SAKNAR EN DEL (inte hel, inte avslutad). Fruktlös betyder ATT NÅGOT ÄR HELT SLUTFÖRT men UTAN UTFALL. En fruktlös förhandling är ofta KOMPLETT genomförd — alla parter har sagt sitt — men ledde ingenstans. Slutförande vs avkastning."),
    ],
    technique="Bildliga -lös-adjektiv-stigen: när huvudordet är ett -lös-adjektiv med konkret förled (fruktlös, andlös, sömnlös), fråga 'är förleden konkret eller bildlig?'. Här är frukt BILDLIG = resultat → fruktlös = utan resultat. Triggern: '-lös-adjektiv → fråga om förleden är metaforisk; om ja, översätt dess bildliga betydelse'.",
    pitfall="Ord-för-ord-läsning fastnar i den konkreta förleden ('frukt = bär'). Botemedlet: när -lös-adjektivet beskriver en HANDLING eller PROCESS (förhandling, försök, diskussion), är förleden nästan alltid BILDLIG — översätt den till abstrakt utfall, inte till konkret föremål.",
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-007  kvintessensen  →  D det väsentliga
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-007"] = entry(
    solution_path="Kvintessensen är det väsentliga — själva kärnan, det mest centrala. Svaret är D.",
    steps=[
        ("Vad betyder kvintessensen?",
         "Kvintessensen av något är dess INNERSTA KÄRNA, det allra viktigaste, summan av sakens väsen. 'Kvintessensen av hans argument är att…' = det centrala han säger är att… Ordet är något högtravande och hör hemma i analyserande text — när någon vill sammanfatta något komplext till dess MEST RENA, REDUCERADE form. Kärnan är ALLTID 'det väsentliga som blir kvar när man rensat bort allt sekundärt'.",
         "essential"),
        ("Latin: quinta essentia = femte väsendet",
         "Kvintessens kommer från medeltidsfilosofins quinta essentia ('femte väsendet'). De fyra klassiska elementen var jord, vatten, luft och eld — och alkemisterna postulerade ett FEMTE, finaste element som genomtränger allt och utgör tingens rena innersta natur. Kvintessensen blev synonymt med 'det renaste, mest destillerade'. Samma essence-stam i essentiell ('det väsentliga'), essens ('kärnsubstans', också en doftvätska just för att den är 'destillerad essens').",
         "detail"),
        ("Välj synonymen",
         "Det väsentliga (D) träffar mitt i prick: 'väsentligt' delar bokstavligen stam med 'essens' (latinska essentia, väsen) — det är det inre VÄSEN som finns kvar när man destillerat bort allt yttre. Båda orden pekar på samma rena kärna.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka kvintessens som 'det balanserade mitt-i' och hamna på medelvägen.",
         "Medelvägen är ETT KOMPROMISSALTERNATIV mellan ytterligheter (lagom, mitt emellan). Kvintessensen är DEN INNERSTA KÄRNAN av något (det väsentliga). Medelvägen är horisontellt mitt-emellan; kvintessensen är vertikalt djupast-in. Olika geometrier — sidledes vs inåt."),
        ("B",
         "Många stannar vid 'kvintessens = det som syns / är uppenbart' och hamnar på det synliga.",
         "Det synliga är vad som FINNS PÅ YTAN (märks utifrån). Kvintessensen är vad som FINNS I DJUPET (det inre väsenet, ofta dolt). Faktum är att kvintessensen ofta är just MOTSATSEN till det synliga — den syns inte på ytan, man måste destillera fram den. Yta vs djup."),
        ("C",
         "Snabbsvar är ofta 'den större delen' eftersom kvintessens klingar som en stor, vägande tyngdpunkt.",
         "Den större delen är ETT KVANTITATIVT FÖRHÅLLANDE (mer än hälften av massan). Kvintessensen är ETT KVALITATIVT FÖRHÅLLANDE (det mest VIKTIGA, inte det mest VOLYMINÖSA). Kvintessensen kan rymmas i en mening; den 'större delen' är 51%. Storlek vs betydelse."),
        ("E",
         "Om du minns 'essens = ren extrakt' kan avbildningen ligga nära till hands om man tolkar kvintessens som 'en koncentrerad återgivning'.",
         "Avbildning är en YTTRE REPRESENTATION av något (en bild, en kopia). Kvintessensen är det INRE VÄSEN av något (det som BILDEN försöker fånga). En bra avbildning visar kvintessensen, men avbildningen är inte själva kvintessensen — den är dess yttre form. Form vs innehåll."),
    ],
    technique="Latinska essens-stigen: när huvudordet bär stammen ess- / essent- (essens, essentiell, kvintessens), tänk på latinets esse ('att vara') — det handlar alltid om något ords INRE VÄSEN, det vid-vad-något-är. Triggern: 'ess-stam → fråga vad ordets KÄRNVÄSEN är, inte dess yttre uttryck'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-008  enveten  →  C envis
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-008"] = entry(
    solution_path="Enveten betyder envis — ihärdig, som inte ger upp trots motstånd. Svaret är C.",
    steps=[
        ("Vad betyder enveten?",
         "Enveten beskriver någon som HÅLLER FAST vid något — en ståndpunkt, en uppgift, en strävan — utan att backa, oavsett motgångar. 'En enveten kämpe' = en kämpe som inte ger upp. 'Han bearbetade problemet envetet i flera år' = utan att tröttna eller överge. Det är ett POSITIVT laddat ord (till skillnad från envis som ofta är negativt). Tonen är beundrande: ihärdigheten är dygd, inte dygdens motsats.",
         "essential"),
        ("Stammen vet- = veta / hålla fast",
         "Enveten är gammalsvenska och bygger på envis-familjen. Förleden 'en-' förstärker (jämför enträgen, envetet enskild). Stammen 'vet' har här mer av 'hålla fast / vara fast' än modernt 'veta'. Närbesläktade ord: enträgen (ihärdigt vädjande), envis (ihärdigt vidhållande). När du ser ord på en- + stam, signaleras ofta INTENSIVT, KONCENTRERAT av just den stammens egenskap.",
         "detail"),
        ("Välj synonymen",
         "Envis (C) träffar exakt: båda orden bär kärnan 'håller fast utan att ge upp'. Skillnaden är bara att enveten brukar ha en lite mer beundrande klang (positiv ihärdighet) medan envis kan vara både positivt och negativt — men i synonymtest räknas BETYDELSEKÄRNAN, och den är gemensam.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka enveten som 'precis, hängiven detaljen' och hamna på exakt.",
         "Exakt är PRECISIONSKVALITÉ — saker stämmer på decimalen, ingenting fel. Enveten är ihärdighetskvalité — man håller på trots motstånd. En enveten person kan vara slarvig (kämpar vidare med fel medel); en exakt person kan ge upp lätt (är precis men inte ihärdig). Precision vs uthållighet."),
        ("B",
         "Många stannar vid 'enveten = veteran, någon med mycket erfarenhet' och hamnar på erfaren.",
         "Erfaren betyder HAR LÄRT MYCKET över tid (kunskap byggd på praktik). Enveten betyder HÅLLER FAST i nu (ihärdighet, viljestyrka). En enveten nybörjare kan vara helt oerfaren (envis och okunnig); en erfaren expert kan vara lättgivande (mycket kunskap, lite uthållighet). Klangen 'vet-' lurar — det är inte 'veta', det är 'hålla fast'."),
        ("D",
         "Snabbsvar är ofta 'egoistisk' om man läser en- som 'för egen del' och vet- som 'vill ha sitt'.",
         "Egoistisk betyder TÄNKER PÅ SIG SJÄLV FÖRST (motivinriktning). Enveten betyder HÅLLER FAST VID NÅGOT (uthållighetskvalité). Du kan vara enveten i osjälviska saker (envetet kämpa för andras rätt) och egoistisk utan att vara enveten (snabba egennyttiga val). Olika dimensioner — motiv vs uthållighet."),
        ("E",
         "Om du tolkar 'envis' som 'bara åt ett håll' kan enkelriktad ligga nära.",
         "Enkelriktad är BOKSTAVLIG eller TEKNISK term (trafik åt ett håll, kommunikation åt ett håll). Enveten är PERSONEGENSKAP (ihärdighet). En enveten person rör sig i många riktningar samtidigt så länge målet inte överges; en enkelriktad gata är fysiskt begränsad åt ett håll. Tekniskt vs personligt — olika språkfält."),
    ],
    technique="En-förstärkare-stigen: när huvudordet börjar på en- + adjektiv-stam (enveten, enträgen, ensam, enfaldig), läs en- som intensifierande ('djupt, helt, koncentrerat') och definiera stammen. Triggern: 'en- + stam → leta efter intensiv version av stammens egenskap'.",
    pitfall=None,
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-009  ombesörja  →  E ordna
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-009"] = entry(
    solution_path="Ombesörja betyder att ordna — se till att något blir gjort, ta hand om saken praktiskt. Svaret är E.",
    steps=[
        ("Vad betyder ombesörja?",
         "Att ombesörja något är att ta ansvar för att det BLIR UTFÖRT — fixa, ordna, se till att det rullar. 'Vi ombesörjer transporten' = vi tar hand om transporten åt dig. 'Ombesörj att rummet städas' = se till att rummet blir städat. Ordet är formellt och hör hemma i myndighets- och företagsspråk — annonser, kontrakt, brev. Kärnan är att TA ETT PRAKTISKT ANSVAR för att en uppgift fullbordas, ofta på någon annans uppdrag.",
         "essential"),
        ("Bygget: om- + besörja",
         "Verbet besörja betyder 'sköta, ta hand om', och om- är ett förstärkande prefix (jämför ombesätta, omorganisera). Tillsammans: 'sköta om' — ta hand om det hela. Besörja självt går tillbaka på sörja (här inte i betydelsen 'känna sorg' utan i den äldre 'bekymra sig om, tänka på'). Samma sörja-stam i 'sörja för någons uppehälle' = ordna att någon har vad de behöver. När du ser sörja- i den meningen, läs det som 'praktisk omsorg'.",
         "detail"),
        ("Välj synonymen",
         "Ordna (E) träffar exakt: ta hand om något så att det blir gjort. Båda orden betonar PRAKTISKT ANSVARSTAGANDE för att en uppgift fullbordas — utan att specificera exakt hur det görs, bara att det blir gjort.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att tolka ombesörja som 'tänka över i efterhand' och hamna på ångra.",
         "Att ångra är att I EFTERHAND ÖNSKA något annat (känsla riktad bakåt mot fattat beslut). Att ombesörja är att I FÖRVÄG ELLER NU SE TILL att något blir gjort (handling riktad framåt mot uppgift). Ångerns blick är bakåt, ombesörjandets är framåt. Steg 2 visar att sörja här inte är 'känna sorg' utan 'ordna med'."),
        ("B",
         "Många stannar vid 'om- = göra om eller godkänna' och hamnar på tillåta.",
         "Att tillåta är att GE TILLSTÅND till något (säga ja till andras handlande). Att ombesörja är att UTFÖRA / SE TILL ATT NÅGOT BLIR UTFÖRT (själv ta hand om uppgiften). Tillåtaren står vid sidan och nickar; ombesörjaren är inne i arbetet. Position vid sidan vs i mitten."),
        ("C",
         "Snabbsvar är ofta 'tvivla' om man läser 'besörja' som någon form av oroad fundering.",
         "Tvivel är INRE OSÄKERHET (tro att något kanske inte är så). Ombesörja är YTTRE HANDLING (göra något så att det blir gjort). Faktiskt är de nästan motsatser — den som ombesörjer en sak HAR upphört att tveka, beslutet är fattat, nu utförs det."),
        ("D",
         "Vänster-till-höger-läsning ger 'upprepa' om man tolkar om- som 'göra om en gång till'.",
         "Att upprepa är att GÖRA OM samma sak en gång till (repetera handlingen). Att ombesörja är att GÖRA NÅGOT EN GÅNG SÅ ATT DET BLIR KLART (ordna en uppgift). Upprepningen handlar om frekvens; ombesörjandet handlar om utförande. Förleden om- är här FÖRSTÄRKANDE, inte upprepande."),
    ],
    technique="Förstärkande om-stigen: när huvudordet börjar med om- + verb (ombesörja, omhulda, omfatta, omforma), läs om- som FÖRSTÄRKANDE INKLUDERANDE (inte upprepande), och definiera verbet kraftfullt. Triggern: 'om- + verb → fråga om om- är upprepande (gör-om) eller förstärkande (göra-helt); välj sammanhang'.",
    pitfall="Förleden om- är tvetydig på svenska: den kan vara upprepande (omläsa = läsa igen) ELLER förstärkande/inkluderande (omhulda, ombesörja, omfatta). Botemedlet: kolla om verbet utan om- redan finns med en självklar betydelse — om ja och betydelsen liknar, är om- förstärkande. 'Besörja' = sköta om; 'ombesörja' = sköta om noga.",
)

# ────────────────────────────────────────────────────────────────────
# host-2023-verb2-ORD-010  ingivelse  →  B plötslig impuls
# ────────────────────────────────────────────────────────────────────
REGEN["host-2023-verb2-ORD-010"] = entry(
    solution_path="En ingivelse är en plötslig impuls — en spontan ingång eller intuition som dyker upp i tanken. Svaret är B.",
    steps=[
        ("Vad betyder ingivelse?",
         "En ingivelse är en plötslig idé eller känsla som BARA KOMMER — du svänger åt vänster på en ingivelse, ringer en gammal vän på en ingivelse, byter karriär på en ingivelse. Det är något som dyker upp INIFRÅN UTAN ATT DU LETAT EFTER DET — ofta beskrivet nästan som om det 'kom utifrån' (en gudomlig ingivelse, en konstnärs ingivelse). Kärnan är ALLTID kombinationen plötslig + spontan + handlingsledande.",
         "essential"),
        ("Verbet ingiva: 'ge in i någon'",
         "Ingivelse kommer från verbet ingiva ('giva in', alltså ge något åt någon inombords). Bilden: något GES IN i ditt sinne — du tog inte själv emot det aktivt, det placerades där. Samma -giva-stam i utgiva (ge ut), efterge (ge efter), framgiva (ange, uppvisa). När du ser -givelse, leta efter en handling där något GES åt mottagaren. Här är mottagaren ditt eget sinne, givaren är okänd.",
         "detail"),
        ("Välj synonymen",
         "Plötslig impuls (B) träffar exakt: 'impuls' är det moderna ordet för en spontan handlingsdrift, 'plötslig' fångar det oväntade. Båda komponenterna behövs — en planerad idé är ingen ingivelse, en plötslig sorg är ingen ingivelse. Den spontana HANDLINGSDRIFTEN är kärnan.",
         "essential"),
    ],
    distractors=[
        ("A",
         "Det är lätt att läsa 'in-givelse' som 'något som GES till en' och hamna på oväntad gåva.",
         "En oväntad gåva är en YTTRE materiell företeelse (någon räcker dig något). En ingivelse är en INRE mental företeelse (en tanke uppstår i dig). Båda är 'givna' i någon mening, men gåvan kommer FRÅN NÅGON ANNAN i fysisk form; ingivelsen verkar komma FRÅN INGENSTANS i tankeform. Yttre vs inre, materiell vs mental."),
        ("C",
         "Många stannar vid 'något lätt och plötsligt' och hamnar på tillfällig lättnad.",
         "Tillfällig lättnad är ETT KÄNSLOMÄSSIGT TILLSTÅND som kommer och går (smärtan släpper för en stund). En ingivelse är EN IDÉ ELLER IMPULS som driver dig till handling. Båda är korta i tid, men lättnad är PASSIV känsla, ingivelse är AKTIV handlingsdrift. Mottagande vs föresats."),
        ("D",
         "Snabbsvar är ofta 'snabb förändring' om man tänker att en ingivelse leder till plötsliga beslut.",
         "En snabb förändring är ETT YTTRE SKEENDE (situationen förändras hastigt). En ingivelse är ETT INRE SKEENDE (en idé föds plötsligt). Ingivelsen kan ORSAKA en snabb förändring (du ändrar färdväg på en ingivelse), men ingivelsen är inte själva förändringen — den är dess inre källa. Källa vs konsekvens."),
        ("E",
         "Om du minns 'ingivelse låter formellt och positivt' kan positivt besked ligga nära till hands.",
         "Ett positivt besked är ETT MEDDELANDE NÅGON FÖRMEDLAR (yttre information som anländer). En ingivelse är EN INRE IMPULS SOM SPONTANT UPPSTÅR (eget sinnes produkt). Beskedet kommer utifrån via språk; ingivelsen uppstår inifrån utan ord. Yttre meddelande vs inre uppslag."),
    ],
    technique="-elsestam-stigen: när huvudordet är ett substantiv på -else (ingivelse, förlåtelse, lättelse, anvisning), leta verbet det vilar på (ingiva, förlåta, lätta, anvisa) och översätt verbets HANDLING till ett substantiv. Triggern: '-else-suffix → hitta moderverbet, definiera dess handling och frys den i substantiv form'.",
    pitfall=None,
)


# ── Write ─────────────────────────────────────────────────────────
out = Path(__file__).parent / "host-2023-ord.json"
out.write_text(json.dumps(REGEN, indent=2, ensure_ascii=False, sort_keys=True))
print(f"Wrote {out} with {len(REGEN)} entries")

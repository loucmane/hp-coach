"""Build var-2014 verb2 MEK regen JSON (Variant C, ultra-granular)."""
from __future__ import annotations
import json
from pathlib import Path

META = {
    "generated_at": "2026-05-14",
    "model": "claude-opus-4-7",
    "recipe": "variant-c-ultra-granular",
}

EXPL: dict[str, dict] = {}

EXPL["var-2014-verb2-MEK-021"] = {
    "_meta": META,
    "solution_path": (
        "Studien följer föräldraidentifikation och yrkesval och kopplar dem till "
        "yttre politiska förändringar — alltså SAMBANDS-koppling, inte refererat "
        "eller reformerat. Verbet är \"relaterats\". Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Ett exempel på sådan forskning är en svensk studie där unga "
                "kvinnors och mäns föräldraidentifikation och yrkesval följts "
                "över flera decennier och bland annat ____ till politiska "
                "förändringar i omvärlden. Luckan ska beteckna VAD STUDIEN GÖR: "
                "kopplar samman individens utveckling MED yttre politiska "
                "förändringar."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Två krav: (1) verbet ska konstrueras med \"TILL\" (verbet "
                "____ till X), (2) det ska betyda \"satts i samband med, "
                "kopplats till\". Studier RELATERAR ofta sina fynd till "
                "yttre faktorer — det är vetenskaplig standardterm för "
                "\"jämför med, kopplar till\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder alternativen?",
            "text": (
                "\"Resignerats\" = givit upp, accepterat passivt — verbet "
                "konstrueras inte med \"till\" och betyder fel. \"Refererats\" "
                "= omnämnts, hänvisats till (men då är studien refererad till "
                "AV något annat, inte tvärtom). \"Relaterats\" = satts i "
                "samband med, kopplats till — fast vetenskaplig fras "
                "(\"relateras till X\"). \"Reformerats\" = ändrats om i grunden "
                "— fel betydelse, ett yrkesval reformeras inte till en "
                "politisk förändring."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"resignerats\": fel betydelse — har inget med samband att "
                "göra. B \"refererats till\": möjlig fras, men semantiskt fel: "
                "att referera till = nämna, citera — inte att sätta i "
                "orsakssamband. C \"relaterats till\": exakt rätt — "
                "vetenskaplig term för att koppla utfall till yttre faktor. D "
                "\"reformerats till\": grammatiskt skevt och fel betydelse "
                "— att reformera är att ÄNDRA, inte att JÄMFÖRA."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Slutsats",
            "text": (
                "Endast \"relaterats\" passar både konstruktionen \"till X\" och "
                "betydelsen \"satts i orsakssamband med\". Svaret är C."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"resignerats\" som något stillsamt "
                "vetenskapligt — ordet låter latinskt och formellt."
            ),
            "why_wrong": (
                "Resignera betyder att GE UPP (steg 3) — det är ett "
                "psykologiskt tillstånd, inte ett relationsverb. Och man "
                "resignerar INTE \"till\" något — fel konstruktion."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"refererats\" eftersom forskning OFTA "
                "refereras till — det är ett välbekant forskningsverb."
            ),
            "why_wrong": (
                "Att referera till = att omnämna eller citera, INTE att "
                "ställa i orsakssamband (steg 4). Studien KOPPLAR samman "
                "föräldraidentifikation med politik — den citerar inte "
                "politiken."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"reformerats\" eftersom prefixet RE- "
                "låter passande för vetenskapliga termer."
            ),
            "why_wrong": (
                "Reformera = ändra om — yrkesval REFORMERAS inte till "
                "politiska förändringar, det är meningslöst (steg 4). Fel "
                "betydelsekategori."
            ),
        },
    ],
    "technique": (
        "Kollokationsregeln: \"relateras till X\" är en fast vetenskaplig "
        "fras = \"sätts i samband med X\". Andra re-verb (refereras, "
        "reformeras, resigneras) har egna konstruktioner och betydelser. "
        "Triggern: ord med RE-prefix är inte utbytbara — kolla "
        "konstruktionen (till/för/om) och betydelsen separat."
    ),
    "pitfall": (
        "Re-verbens ytlika likhet (relatera, referera, reformera, "
        "resignera) lurar. Botemedlet: testa varje verb i den FAKTISKA "
        "konstruktionen (\"X ____ till Y\") och med den FAKTISKA "
        "betydelsen — bara relatera passar både formellt och semantiskt."
    ),
}

EXPL["var-2014-verb2-MEK-022"] = {
    "_meta": META,
    "solution_path": (
        "Hon kommer försenad och jetlaggad MEN \"artig\" och professionell; "
        "rummet är så ____ som på stolarna tomt — alltså \"när\" som i "
        "\"nära nog tomt\". Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Till presskonferensen kommer hon försenad och jetlaggad, MEN "
                "____ och professionell. När vi sedan träffas i ett så ____ som "
                "på stolarna tomt, vitmålat rum, säger hon generat att hon inte "
                "vet om hon varit i Sverige förut. Två luckor: ett adjektiv om "
                "hennes uppträdande, och ett adverb som kvalificerar hur tomt "
                "rummet är."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "\"Försenad och jetlaggad, MEN ____ och professionell.\" "
                "Konjunktionen MEN signalerar KONTRAST mot trötthet och förvirring "
                "— hon är trots det SAMLAD och artig. Adjektivet ska beteckna "
                "ett SOCIALT OK BETEENDE: skärpt, seriös, artig är möjliga; "
                "stel är fel (en stel person passar inte med \"professionell\" "
                "som komplement, snarare som synonym till stelhet)."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"I ett så ____ som på stolarna tomt rum\" — konstruktionen "
                "är \"så ADVERB som\". Vi behöver ett ord som modifierar "
                "TOMHETEN. \"Så när som på X\" = \"nära nog X / nästan X / på "
                "X när\" är en fast svensk fras: \"så när som på stolarna "
                "tomt\" = nästan helt tomt med undantag för stolarna. "
                "Adverbet är \"när\"."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder de fasta fraserna?",
            "text": (
                "\"Så när som på X\" är ett idiomatiskt uttryck = \"med "
                "undantag för X, i övrigt\". Exempel: \"alla utom Anna kom — "
                "rummet var fullt, så när som på en stol.\" I MEK-meningen: "
                "rummet är tomt SÅ NÄR SOM PÅ stolarna — alltså i princip "
                "helt tomt, med stolarna som enda undantag."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Vad betyder alternativen?",
            "text": (
                "\"Skärpt – där\": skärpt = mentalt klar; \"där\" som adverb "
                "fungerar inte i \"så där som på\" (skulle behöva \"så där "
                "att\"). \"Seriös – gott\": seriös passar, men \"så gott som\" "
                "är fast fras = \"nästan helt\", men \"så gott som på stolarna "
                "tomt\" är inte idiomatiskt — vi har inte den vanliga "
                "konstruktionen. \"Artig – när\": artig kontrasterar med "
                "jetlaggad-tröttheten; \"så när som på\" är den klassiska "
                "frasen för \"med undantag för\". \"Stel – ovanligt\": stel "
                "är inte komplement till professionell utan synonym."
            ),
            "tier": "detail",
        },
        {
            "n": 6,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"skärpt – där\": \"så där som\" är inte en idiomatisk fras "
                "för \"med undantag för\". B \"seriös – gott\": \"så gott som\" "
                "ska följas av en mängd (\"så gott som tomt\"), inte av "
                "\"som på\". C \"artig – när\": artig kontrasterar perfekt med "
                "jetlaggad, och \"så när som på X\" är exakt det idiom "
                "meningen kräver. D \"stel – ovanligt\": stel passar inte "
                "med MEN-kontrasten (stelhet är inget motstycke till "
                "trötthet), och \"så ovanligt som på stolarna\" är inte ett "
                "idiom."
            ),
            "tier": "essential",
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "Endast C löser bägge: artig som kontrast mot jetlaggad-"
                "tröttheten, och \"så när som på\" som idiom för \"med "
                "undantag för\". Svaret är C."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"skärpt\" som passande kontrast mot "
                "jetlag — en skärpt person är klar i tanken trots trötthet."
            ),
            "why_wrong": (
                "Skärpt fungerar för lucka 1, men \"så där som på\" är inte "
                "ett svenskt idiom (steg 6). \"Så där som\" används bara i "
                "konstruktioner som \"så där som du brukar\" — inte med "
                "objekt."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"seriös – gott\" — \"så gott som\" är ju "
                "ett bekant uttryck för \"nästan\"."
            ),
            "why_wrong": (
                "\"Så gott som\" följs av en MÄNGD eller TILLSTÅND (\"så gott "
                "som klart\", \"så gott som tomt\") — inte av \"som på X\" "
                "(steg 5). Den fasta frasen för \"med undantag för X\" är "
                "\"så när som på X\"."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Första instinkten kan vara \"stel\" som något jetlag gör med "
                "kroppen."
            ),
            "why_wrong": (
                "MEN-kontrasten kräver att lucka 1 är något POSITIVT som "
                "trots tröttheten består — stelhet är inte positivt, det är "
                "snarare en effekt av tröttheten (steg 2). Och \"så ovanligt "
                "som\" är ingen idiomatisk fras."
            ),
        },
    ],
    "technique": (
        "Idiom-strategi: \"så när som på X\" är en LÅST svensk fras = "
        "\"med undantag för X\". MEK testar dessa fasta uttryck — du "
        "måste kunna deras EXAKTA form, inte gissa på \"känsla\". "
        "Triggern: när konstruktionen är \"så ADVERB som på X\", letar du "
        "efter idiomet."
    ),
    "pitfall": (
        "Idiom som \"så när som på\" och \"så gott som\" är inte "
        "utbytbara, även om båda betyder \"nästan\". Botemedlet: plugga "
        "idiomens precisa konstruktioner — \"så gott som\" + adjektiv vs "
        "\"så när som på\" + substantiv."
    ),
}

EXPL["var-2014-verb2-MEK-023"] = {
    "_meta": META,
    "solution_path": (
        "Konstruktionen är \"JU fler X, DESTO större Y\" — alltså \"ju\". Det "
        "som riskerar gå snett är \"faktorer\" (missförstånd, statskupper, "
        "terrorism) och bristen är på \"omdöme\". Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Det är känt att ____ fler länder som skaffar sig "
                "massförstörelsevapen, desto större är risken att något går "
                "snett. Det finns flera tänkbara ____ som förr eller senare "
                "riskerar att göra sig påminda — missförstånd, statskupper, "
                "terrorism — och brist på ____. Tre luckor i samma resonemang."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "\"____ fler länder ... desto större är risken\". Detta är den "
                "fasta svenska konstruktionen \"ju ... desto ...\" — \"ju fler "
                "länder, desto större risk\". Lucka 1 är låst: \"JU\". "
                "Alternativ B (\"desto\") spräcker grammatiken eftersom desto "
                "redan finns i meningen som andra ledet."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Tänkbara ____ som ... riskerar att göra sig påminda, såsom "
                "missförstånd, statskupper, terrorism\". Listan består av "
                "ORSAKER/RISKER. Vi söker ordet för \"sådant som kan utlösa "
                "katastrof\". \"Faktorer\" passar (faktor = bidragande orsak). "
                "\"Möjligheter\" är fel laddning (för positiv), \"problem\" "
                "är möjligt men för vagt, \"scenarier\" är beskrivningar av "
                "hela händelseförlopp, inte enstaka orsaker."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Hitta begränsningen i lucka 3",
            "text": (
                "\"Brist på ____\" — vad fattas när massförstörelsevapen "
                "sprids och missförstånd kan ge katastrof? OMDÖMET — den "
                "förmåga att fatta kloka beslut som hindrar att man trycker på "
                "knappen i panik. \"Resurser\" är fel (vapenmakter har inte "
                "brist på resurser), \"förnuft\" är möjligt men \"omdöme\" "
                "är mer specifikt för politiska beslut, \"kunskap\" är fel "
                "(de har snarare för MYCKET kunskap om vapnen)."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Vad betyder alternativens ord?",
            "text": (
                "\"Ju – faktorer – omdöme\": ju låser konstruktionen; faktorer "
                "= bidragande orsaker; omdöme = klok bedömningsförmåga. "
                "\"Desto – möjligheter – resurser\": desto bryter grammatiken; "
                "möjligheter har positiv laddning; resurser passar inte med "
                "vapenmaktsexempel. \"När – problem – förnuft\": \"när fler "
                "länder, desto större risk\" är ogrammatisk; problem är "
                "vagt; förnuft är möjligt men mindre passande. \"Ifall – "
                "scenarier – kunskap\": \"ifall fler ... desto\" är "
                "ogrammatisk; scenarier är hela händelseförlopp; kunskap är "
                "fel (problemet är inte okunskap)."
            ),
            "tier": "detail",
        },
        {
            "n": 6,
            "title": "Matcha mot alternativen",
            "text": (
                "A: alla tre leden passar — ju (för konstruktionen), faktorer "
                "(för listan av risker), omdöme (för det som brister). B: "
                "\"desto fler ... desto större\" är dubbelt desto, "
                "grammatiskt fel. C: \"när fler ... desto\" är inte heller "
                "den korrekta korrelativa konstruktionen. D: \"ifall fler "
                "... desto\" är ogrammatisk på samma sätt."
            ),
            "tier": "essential",
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "Endast A klarar grammatiken (ju ... desto), betydelsen (faktorer "
                "som risker), och resonemanget (omdöme som det som fattas). "
                "Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att läsa \"desto fler\" som passande start eftersom "
                "DESTO finns med i den andra halvan av meningen."
            ),
            "why_wrong": (
                "\"Ju ... desto\" är den fasta korrelativa konstruktionen — "
                "DESTO kan inte stå i båda leden (steg 2). Två desto är "
                "grammatiskt fel; ju ... desto är låst."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"när fler länder skaffar sig vapen, desto "
                "större risk\" — det LÅTER nästan rätt."
            ),
            "why_wrong": (
                "\"När\" är temporalt eller villkorligt — det kan inte stå "
                "korrelativt med \"desto\" (steg 6). Den enda svenska "
                "konstruktionen som tar \"desto\" som efterled är \"ju ... "
                "desto\"."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"ifall\" eftersom det signalerar villkor — "
                "och vapenspridning ÄR ett villkor för katastrof."
            ),
            "why_wrong": (
                "\"Ifall\" är konditional/villkorlig, inte korrelativ — den "
                "binder inte med \"desto\" (steg 6). Grammatiken kräver "
                "\"ju\"."
            ),
        },
    ],
    "technique": (
        "Idiom-strategi för korrelativa par: \"ju ... desto ...\" är en "
        "LÅST svensk konstruktion — desto kräver alltid ju som "
        "förkonjuktion. Triggern: när andra ledet är \"desto + komparativ\", "
        "är förstedet ALLTID \"ju + komparativ\"."
    ),
    "pitfall": (
        "Eleverna känner till \"ju ... desto\" men lockas av närliggande "
        "konjunktioner (när, om, ifall) som har egna konstruktioner. "
        "Botemedlet: när du ser \"desto\" i meningen, sök efter \"ju\" — "
        "annars är konstruktionen trasig."
    ),
}

EXPL["var-2014-verb2-MEK-024"] = {
    "_meta": META,
    "solution_path": (
        "Elvaåringen försökte väcka moralisk och RELIGIÖS uppväckelse i ett "
        "sekulariserat grannskap — verbet är att \"ÄGNA en tanke åt\" "
        "påskens budskap. Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Elvaåringen försökte åstadkomma moralisk och ____ uppväckelse "
                "i sitt förslappade och SEKULARISERADE grannskap. Påsken "
                "närmade sig och hen upprördes över att ingen verkade ____ "
                "påskens egentliga budskap en tanke. Två luckor: ett adjektiv "
                "till \"uppväckelse\" och ett verb i konstruktionen \"____ en "
                "tanke åt X\" (eller liknande)."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "\"Sekulariserade\" grannskap = ett samhälle som tappat sin "
                "religiositet. Eleven vill åstadkomma motsatsen — alltså "
                "RELIGIÖS uppväckelse. \"Profan\" = motsatsen till religiös, "
                "vilket gör hela meningen självupphävande. \"Andlig\" är "
                "möjligt men bredare; \"politisk\" är fel ämne (texten handlar "
                "om påsken, inte politik). \"Religiös\" är det exakta valet."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Verkade ____ påskens egentliga budskap en tanke\". "
                "Konstruktionen är \"ägna någon/något en tanke\" — fast "
                "svensk fras = \"tänka på, lägga en tanke vid\". \"Skänka en "
                "tanke åt\" är också möjlig men följs sällan av \"en tanke\" "
                "direkt utan av \"någon en tanke\". \"Delge\" och \"hedra\" "
                "passar inte konstruktionen \"____ X en tanke\"."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens verb?",
            "text": (
                "\"Ägna en tanke åt X\" = lägga en tanke vid X, ägna lite "
                "uppmärksamhet åt. \"Skänka en tanke åt X\" = ge en tanke åt "
                "X (synonym men mindre vanlig). \"Delge X en tanke\" = berätta "
                "för X om en tanke man har — kräver mottagare som objekt, "
                "passar inte \"påskens budskap\". \"Hedra X med en tanke\" = "
                "visa respekt — fel riktning, eleven vill att grannskapet ska "
                "REFLEKTERA, inte hylla."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"religiös – ägna\": religiös passar mot sekulariserat; "
                "\"ägna en tanke\" är klassisk idiom. B \"profan – skänka\": "
                "profan motsäger sekulariserat (sekulariserat ÄR profant — "
                "fel riktning); skänka är möjligt men sliter. C \"andlig – "
                "delge\": andlig är möjligt, men \"delge en tanke\" kräver en "
                "mottagare (man delger NÅGON något), här saknas mottagaren. "
                "D \"politisk – hedra\": politisk är fel ämne (texten handlar "
                "om påsken); \"hedra med en tanke\" är fel betydelse."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast A passar både logiken (religiös som motpol till "
                "sekulariserat) och idiomet (\"ägna en tanke åt\"). Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att läsa \"profan\" som ett bildat ord och tänka "
                "att det betyder \"djupgående\" på något plan."
            ),
            "why_wrong": (
                "Profan = världslig, ICKE-religiös (steg 2) — RAKA MOTSATSEN "
                "till vad eleven vill åstadkomma i ett redan sekulariserat "
                "grannskap. Om grannskapet är profant kan inte ELEVEN vilja "
                "GE DEM mer profanitet."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"andlig – delge\" eftersom andlig låter "
                "religiös och delge låter bildat."
            ),
            "why_wrong": (
                "\"Delge\" kräver en MOTTAGARE som objekt (delge NÅGON "
                "något) — i meningen finns ingen sådan, bara \"påskens "
                "budskap\" som tankens TEMA (steg 5). Idiomet är \"ägna X en "
                "tanke\", inte \"delge X en tanke\"."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"politisk\" eftersom moral och politik "
                "ofta paras ihop."
            ),
            "why_wrong": (
                "Texten handlar EXPLICIT om påskens egentliga budskap — alltså "
                "om religion, inte politik (steg 5). \"Hedra med en tanke\" "
                "är dessutom fel: eleven vill att folk SKA REFLEKTERA, inte "
                "att de SKA HEDRA."
            ),
        },
    ],
    "technique": (
        "Idiom-strategi + kollokationsregeln: \"ägna någon/något en "
        "tanke\" är fast svensk fras = \"tänka på, lägga en tanke vid\". "
        "Andra verb (skänka, delge, hedra) har egna konstruktioner. "
        "Triggern: när \"____ X en tanke\" finns i meningen, är verbet "
        "ÄGNA i 9 fall av 10."
    ),
    "pitfall": (
        "Adjektiv som \"profan\" verkar bildade men har EN motsatt "
        "betydelse till \"religiös\". Botemedlet: när du inte säkert vet "
        "ordets exakta betydelse, testa det mot textens explicita "
        "signaler — här \"sekulariserade\" som låser fast vad eleven "
        "VILL motverka."
    ),
}

EXPL["var-2014-verb2-MEK-025"] = {
    "_meta": META,
    "solution_path": (
        "Gould avvisar tanken att utvecklingen MÅSTE ta en bestämd väg och nå "
        "ett bestämt mål — det är raka definitionen av DETERMINISM. Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Stephen Jay Goulds resonemang mynnar i ett kraftfullt "
                "avvisande av all ____, av alla påståenden om att utvecklingen "
                "och historien BARA KAN TA EN VÄG och FINNA ETT MÅL. Luckan "
                "ska beteckna den filosofiska position som Gould avvisar — "
                "alltså idén att förloppet är förutbestämt."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Definitionen står klart i texten: \"utvecklingen kan bara ta "
                "en väg och finna ett mål\". Det är exakt vad determinism "
                "betyder — läran att alla händelser är FÖRUTBESTÄMDA och inte "
                "kan ske annorlunda. Vi söker ordet för \"allt är "
                "förutbestämt\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder \"determinism\"?",
            "text": (
                "Determinism = den filosofiska läran att allt som händer är "
                "förutbestämt av tidigare orsaker — det finns INGEN slump och "
                "ingen alternativ utveckling. \"Bara en väg, ett mål\" är "
                "exakt determinismens kärna. Gould var en darwinist som "
                "betonade kontingens (slumpens roll) i evolutionen — så han "
                "avvisade just determinism."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Vad betyder de andra alternativen?",
            "text": (
                "\"Nihilism\" = läran att inget har mening eller värde (handlar "
                "om VÄRDEN, inte om utvecklingens VÄG). \"Idealism\" = läran att "
                "verkligheten är andlig/idémässig snarare än materiell (fel "
                "ämne — inte om förutbestämdhet). \"Elitism\" = övertygelsen "
                "att en elit ska styra (samhällslära, inte vetenskapsfilosofi)."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"determinism\": exakt definition av \"bara en väg, ett "
                "mål\". B \"nihilism\": fel område — handlar om värdens "
                "frånvaro, inte om förutbestämdhet. C \"idealism\": fel ämne "
                "— handlar om andens primat över materien, inte om "
                "utvecklingens väg. D \"elitism\": fel område — handlar om "
                "samhällsstruktur, inte om historiens förutbestämdhet."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast determinism är läran om förutbestämda förlopp — "
                "exakt det Gould avvisar. Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att höra \"nihilism\" som något Gould skulle "
                "avvisa — nihilism har en negativ klang och låter filosofiskt."
            ),
            "why_wrong": (
                "Nihilism handlar om VÄRDENS frånvaro (inget är meningsfullt) "
                "— inte om utvecklingens VÄG (steg 4). Texten är explicit: "
                "\"bara en väg, ett mål\" är determinism, inte nihilism."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många hör \"idealism\" som filosofisk strömning och tänker att "
                "det handlar om ideal/mål."
            ),
            "why_wrong": (
                "Idealism är ontologisk lära — om vad VERKLIGHETEN består av "
                "(ande vs materia), inte om hur den utvecklas (steg 4). Fel "
                "ämnesområde."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Första instinkten kan vara \"elitism\" eftersom Gould var "
                "populärvetenskaplig och kunde avvisa elitens dominans."
            ),
            "why_wrong": (
                "Elitism är samhällspolitisk position — om vem som ska styra "
                "(steg 4). Texten handlar om EVOLUTIONENS väg, inte om "
                "samhällets organisering."
            ),
        },
    ],
    "technique": (
        "Fackord-precision för filosofiska -ismer: varje -ism är en EXAKT "
        "lära om EN SPECIFIK fråga. Determinism = förutbestämdhet, "
        "nihilism = värdelöshet, idealism = andens primat, elitism = "
        "elitstyre. Triggern: läs definitionen som meningen ger (\"bara "
        "en väg, ett mål\") och matcha mot rätt -isms KÄRNDEFINITION."
    ),
    "pitfall": (
        "-ismer är inte synonymer — de har EGNA precisa filosofiska "
        "betydelser. Botemedlet: lär dig kärndefinitionen för var och en "
        "av de vanliga -ismerna; HP testar dem rakt av."
    ),
}

EXPL["var-2014-verb2-MEK-026"] = {
    "_meta": META,
    "solution_path": (
        "En statschef STÖRTADES av militären; demokratin är fortfarande SKÖR; "
        "oligarkierna i regionen är KOLONIALA arv. Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Statskuppen i juni 2009 var viktig eftersom det var första "
                "gången på många år som en statschef ____ av militär i "
                "Latinamerika. Demokratin har förankrats det senaste "
                "decenniet, men kuppen blottlade hur ____ denna utveckling är "
                "och att det finns kvar en spänning mellan "
                "demokratiförespråkare och representanter för gamla tiders "
                "____ oligarkier. Tre luckor i en politisk historik."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "\"En statschef ____ av militär\" i en STATSKUPP. Statskupp = "
                "militär avsätter regering. Verbet ska betyda \"avsattes med "
                "våld\" — alltså STÖRTADES. \"Tillsattes\" är raka motsatsen "
                "(att utse), \"undanröjdes\" är möjligt men för diffust "
                "(undanröja = ta bort, kan vara död), \"erkändes\" är fel "
                "riktning (erkänna = legitimera, inte avsätta)."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Hur ____ denna utveckling är\" — kuppen BLOTTLADE en "
                "svaghet i den demokratiska förankringen. Vi söker ordet för "
                "\"bräcklig, lätt att rubba\". \"Skör\" passar perfekt; "
                "\"långsam\", \"stark\" och \"viktig\" pekar fel håll."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Hitta begränsningen i lucka 3",
            "text": (
                "\"Representanter för gamla tiders ____ oligarkier\". "
                "Latinamerikas \"gamla tider\" är spansk/portugisisk "
                "kolonialtid — alltså KOLONIALA oligarkier. \"Pluralistiska\" "
                "är raka motsatsen (mångfaldiga), \"matriarkala\" är "
                "historiskt fel (Latinamerikas eliter var patriarkala), "
                "\"parlamentariska\" är fel (oligarkier är inte "
                "parlamentariska)."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Vad betyder alternativens ord?",
            "text": (
                "\"Störtades – skör – koloniala\": störtades = avsattes med "
                "våld; skör = bräcklig; koloniala = från kolonialtiden. "
                "\"Tillsattes – långsam – pluralistiska\": tillsattes = "
                "utsågs (motsats); långsam beskriver fart, inte styrka; "
                "pluralistiska = mångfaldiga (motsats till oligarki). "
                "\"Undanröjdes – stark – matriarkala\": undanröja = "
                "eliminera; stark motsäger kuppens varningssignal; matriarkala "
                "= kvinnodominerade (historiskt fel). \"Erkändes – viktig – "
                "parlamentariska\": erkänna = legitimera (motsats); viktig "
                "är vag; parlamentariska motsäger oligarki."
            ),
            "tier": "detail",
        },
        {
            "n": 6,
            "title": "Matcha mot alternativen",
            "text": (
                "A: alla tre passar — störtades (kupp), skör (kuppen visar "
                "svaghet), koloniala (historiskt arv). B: tillsattes är fel "
                "riktning (kupp = avsätta, inte utse), och pluralistiska är "
                "motsats till oligarki. C: undanröjdes är möjligt men "
                "STARK motsäger kuppens varningssignal; matriarkala är "
                "historiskt fel. D: erkändes är fel (en statschef "
                "ERKÄNDES av militär = legitim, men kuppen är ju motsatsen); "
                "parlamentariska motsäger oligarki."
            ),
            "tier": "essential",
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "Endast A passar hela resonemanget: kupp = störtades, kuppen "
                "blottlade skörhet, oligarkierna är koloniala arv. Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att läsa \"tillsattes\" som passande för "
                "militärens roll — militärer KAN ju tillsätta regimer."
            ),
            "why_wrong": (
                "Texten beskriver en STATSKUPP, alltså att ETT REGIM "
                "avsätts (steg 2). Tillsätta är raka motsatsen — en kupp är "
                "att STÖRTA en statschef, inte att utse en. Och "
                "pluralistiska motsäger oligarki (steg 4)."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"undanröjdes\" som synonym till störtades — "
                "båda har att göra med att eliminera."
            ),
            "why_wrong": (
                "Undanröjas kan betyda mord, vilket är starkare än kupp "
                "(steg 5). Och \"stark\" motsäger meningens logik: KUPPEN "
                "BLOTTLADE något, alltså visade SVAGHET — inte styrka (steg "
                "3). Stark fäller hela paret."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Första instinkten är att \"erkändes\" passar in i ett "
                "politiskt resonemang om legitimitet."
            ),
            "why_wrong": (
                "En statschef som ERKÄNDES av militär är legitim — det är "
                "INGEN STATSKUPP (steg 5). Och parlamentariska oligarkier är "
                "en motsägelse: oligarki = fåtalsvälde, parlamentariskt = "
                "folkvalt."
            ),
        },
    ],
    "technique": (
        "Trelucksregeln + historisk-politisk fackvokabulär: när "
        "meningen handlar om Latinamerikas demokrati, känner du till "
        "(1) statskupp = störta, (2) demokrati i regionen är fortfarande "
        "skör, (3) oligarkierna har kolonialt arv. Triggern: kolla att "
        "alla tre orden samspelar i samma historiska resonemang."
    ),
    "pitfall": (
        "Synonymer för \"störta\" (tillsätta, undanröja, erkänna) "
        "verkar utbytbara men har olika RIKTNING och INTENSITET. "
        "Botemedlet: kolla att verbet pekar åt SAMMA håll som "
        "händelsen — kupp = avsätta, inte utse eller erkänna."
    ),
}

EXPL["var-2014-verb2-MEK-027"] = {
    "_meta": META,
    "solution_path": (
        "Bourdieus teori löper PARALLELLT med EMPIRISKA undersökningar — teorin "
        "och de empiriska studierna går jämsides genom boken. Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Bourdieus inträngande teoretiska diskussioner löper genom "
                "hela boken ____ med de ____ undersökningarna. Två luckor: ett "
                "adverb som beskriver HUR teorin och undersökningarna förhåller "
                "sig till varandra, och ett adjektiv som karakteriserar "
                "undersökningarna."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Konstruktionen är \"löper genom boken ____ med de "
                "undersökningarna\". Adverbet ska beskriva hur två trådar "
                "(teori + studier) FÄRDAS GENOM TEXTEN. Naturligast: "
                "PARALLELLT (jämsides), eller VÄXELVIS (omväxlande), eller "
                "TILLSAMMANS (gemensamt). KONTRASTERANDE är fel — det säger "
                "att de står emot varandra, men en bok som flätar teori med "
                "empiri brukar inte ställa dem emot varandra."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "Bourdieu är sociolog. Det andra benet av hans verk vid sidan "
                "av teorin är fältarbete och statistisk analys — alltså "
                "EMPIRISKA undersökningar. Empirisk = grundad i observation "
                "och data. \"Implicita\" betyder underförstådda, vilket är "
                "fel motpol till teori. \"Primära\" och \"disponibla\" är "
                "för vaga."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens ord?",
            "text": (
                "\"Växelvis – implicita\": växelvis = omväxlande (möjligt); "
                "implicita = underförstådda (fel — Bourdieu HAR explicita "
                "studier). \"Kontrasterande – primära\": kontrasterande = "
                "ställda emot varandra (för stark); primära = grundläggande "
                "(för vagt). \"Tillsammans – disponibla\": tillsammans är "
                "möjligt; disponibla = tillgängliga (fel betydelse för "
                "vetenskapliga studier). \"Parallellt – empiriska\": "
                "parallellt = jämsides; empiriska = data-baserade — exakt "
                "rätt motpol till \"teoretiska\"."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"växelvis – implicita\": implicita motsäger Bourdieus "
                "explicita empiri. B \"kontrasterande – primära\": "
                "kontrasterande implicerar motsättning, vilket är fel för en "
                "bok som integrerar; primära är för vagt. C \"tillsammans – "
                "disponibla\": disponibla är fel betydelse — vetenskapliga "
                "studier är inte \"disponibla\" i ordets svenska betydelse. "
                "D \"parallellt – empiriska\": exakt rätt par — teori "
                "parallellt med data."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast D bygger den korrekta kontrasten: TEORETISKA "
                "diskussioner parallellt med EMPIRISKA undersökningar — "
                "vetenskapens två klassiska ben. Svaret är D."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"växelvis\" som passande för en bok "
                "som varvar teori och praktik."
            ),
            "why_wrong": (
                "Implicita motsäger Bourdieus arbete: hans empiri (Distinction, "
                "La Misère du monde) är extremt EXPLICIT — siffror, intervjuer, "
                "fältnoter (steg 4). \"Implicita undersökningar\" är dessutom "
                "ett halvt självmotsägande begrepp."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"kontrasterande\" som passande för "
                "akademisk text — teorin och empirin kan ju ställas i "
                "kontrast."
            ),
            "why_wrong": (
                "Kontrasterande betyder STÄLLDA EMOT varandra — det "
                "implicerar konflikt mellan teori och empiri (steg 5). I "
                "Bourdieus arbete LÖPER de jämsides och stödjer varandra, "
                "inte mot varandra."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Första instinkten är ofta \"tillsammans\" — teori och "
                "empiri går ju \"tillsammans\" i en bok."
            ),
            "why_wrong": (
                "\"Disponibla undersökningar\" är fel betydelse — disponibel "
                "= tillgänglig, möjlig att använda (steg 4). I "
                "vetenskapssammanhang behöver vi adjektivet \"empiriska\" "
                "(data-baserade), inte \"disponibla\"."
            ),
        },
    ],
    "technique": (
        "Tvålucksregeln + fackord-precision: i akademisk text är "
        "\"TEORETISK vs EMPIRISK\" det klassiska paret — empirin är data, "
        "teorin är begreppen. När den ena luckan redan är teoretisk, "
        "letar du efter \"empirisk\" som självklar motpol. Triggern: "
        "samordning av två slags forskning i samma mening."
    ),
    "pitfall": (
        "Adverben för \"jämsides\" (parallellt, växelvis, tillsammans) "
        "verkar utbytbara, men adjektivet i lucka 2 låser fast valet. "
        "Botemedlet: börja med adjektivet i lucka 2 — det är ofta "
        "starkare diskriminator än adverbet i lucka 1."
    ),
}

EXPL["var-2014-verb2-MEK-028"] = {
    "_meta": META,
    "solution_path": (
        "Fjällväxter fortplantar sig genom groddknoppar, utlöpare och "
        "sidoskott — det är VEGETATIV förökning (utan frö). Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Många av våra fjällväxter löser detta problem genom att "
                "fortplanta sig ____, genom groddknoppar, utlöpare eller "
                "sidoskott. Luckan ska beskriva HUR de fortplantar sig — "
                "och listan efter kommatecknet (groddknoppar, utlöpare, "
                "sidoskott) ÄR exemplifieringen."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Groddknoppar, utlöpare och sidoskott är alla "
                "FORTPLANTNINGSSÄTT UTAN FRÖ. Det är vegetativ förökning — "
                "växten kopierar sig själv från vegetativa delar, inte från "
                "frön. Vi söker fackordet i botanik för \"icke-sexuell "
                "fortplantning via växtdelar\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder \"vegetativ\" fortplantning?",
            "text": (
                "Vegetativ förökning = växten producerar nya individer från "
                "icke-könsorgansceller — alltså från blad, stam eller rot. "
                "Exempel: utlöpare (jordgubbsplantor som skickar ut runners), "
                "groddknoppar (små plantor på bladkanten), sidoskott "
                "(småplantor från basen). Alternativet är generativ "
                "förökning, alltså via frön efter pollinering."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Vad betyder de andra alternativen?",
            "text": (
                "\"Geologiskt\" = som har med jordens uppbyggnad att göra "
                "(fel domän — växter fortplantar sig inte geologiskt). "
                "\"Homogent\" = likformigt (säger inget om "
                "fortplantningssätt). \"Sporadiskt\" = då och då, oregelbundet "
                "(säger om FREKVENS, inte om SÄTT). \"Vegetativt\" = via "
                "växtdelar utan frön — exakt det groddknoppar och utlöpare "
                "är."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"geologiskt\": fel domän — geologi handlar om jordens "
                "berg och lager. B \"homogent\": fel betydelsenivå — säger "
                "att alla är lika, inte hur de förökar sig. C \"sporadiskt\": "
                "fel betydelsenivå — beskriver hur OFTA, inte hur. D "
                "\"vegetativt\": exakt fackord för fortplantning via "
                "växtdelar."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast \"vegetativt\" är det botaniska fackordet som "
                "exemplet (groddknoppar, utlöpare, sidoskott) beskriver. "
                "Svaret är D."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"geologiskt\" som passande i en "
                "naturkontext — fjäll och berg och geologi hör ihop."
            ),
            "why_wrong": (
                "Geologi handlar om JORDLAGER och BERG, inte växters "
                "fortplantning (steg 4). Växter fortplantar sig inte "
                "geologiskt — det är fel ämnesfält."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många kopplar \"homogent\" till växter som ser likadana ut — "
                "kloning är homogen."
            ),
            "why_wrong": (
                "Homogent säger HUR LIKA resultaten är, inte HUR de skapas "
                "(steg 4). Vegetativ förökning RESULTERAR i homogena "
                "individer, men adverbet i meningen ska beskriva SÄTTET, "
                "inte resultatet."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Första instinkten kan vara \"sporadiskt\" eftersom "
                "fjällväxter trivs i karg miljö där förökning är "
                "oregelbunden."
            ),
            "why_wrong": (
                "Sporadiskt = OFTA eller SÄLLAN — det är ett "
                "frekvensadverb, inte ett SÄTTSADVERB (steg 5). Listan efter "
                "kommatecknet (groddknoppar, utlöpare) beskriver METOD, inte "
                "frekvens — alltså ska luckan vara metoden."
            ),
        },
    ],
    "technique": (
        "Fackord-precision i biologi: groddknoppar + utlöpare + "
        "sidoskott = vegetativ förökning. Den motsatta termen är "
        "GENERATIV förökning (via frön). Triggern: när texten räknar upp "
        "exempel direkt efter luckan, är luckan FACKORDET som "
        "exempelraden ILLUSTRERAR."
    ),
    "pitfall": (
        "Adverb som -giskt, -gent, -diskt har liknande ljud men "
        "vitt skilda betydelsedomäner. Botemedlet: vid biologi-fackord, "
        "lär dig de klassiska paren (vegetativ/generativ, "
        "auto trof/heterotrof) — HP testar dem direkt."
    ),
}

EXPL["var-2014-verb2-MEK-029"] = {
    "_meta": META,
    "solution_path": (
        "Vindelälvdalen behöver NYTÄNKANDE för näringslivets utveckling, vilket "
        "skapar ÖKAT BEFOLKNINGSUNDERLAG eftersom folk stannar och inflyttning "
        "ökar. Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Utbudet av högre utbildning och övriga kompetensinsatser "
                "behöver stimuleras i Vindelälvdalen för att skapa stärkta "
                "förutsättningar, ____ och innovationer för det småskaliga "
                "näringslivets utveckling och i utbudet av samhällsservice. "
                "Detta ger förutsättningar för ____ på så sätt att invånare "
                "STANNAR kvar eller folk utifrån FLYTTAR IN. Två luckor om "
                "regionalpolitik."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Lucka 1 står mellan \"stärkta förutsättningar\" och "
                "\"innovationer\" — det är en uppräkning av vad utbildning "
                "skapar för småskaligt näringsliv. \"Innovationer\" är ett av "
                "leden. Vi söker ett tredje ord på samma nivå: "
                "\"nytänkande\" är synonym till innovationer (komplement i "
                "trippelraden); \"sysselsättning\" är fel kategori (det är "
                "ett RESULTAT, inte en förutsättning); \"kunskap\" är möjligt "
                "men dubbelaktigt mot \"utbildning\"; \"utbyggnad\" är fel "
                "ämne (utbildning bygger inte ut sig själv)."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "Lucka 2 beskrivs efteråt: \"ortens invånare väljer att inte "
                "flytta därifrån eller människor utifrån ser möjligheter att "
                "BOSÄTTA SIG i området\". Det är BEFOLKNINGEN som ökar. Vi "
                "söker fras för \"fler boende, både kvarboende och "
                "inflyttning\". \"Ökat befolkningsunderlag\" är exakt detta. "
                "\"Minskad arbetslöshet\" är möjligt men texten talar om "
                "BOSÄTTNING, inte arbete. \"Ökat medborgarinflytande\" är fel "
                "(politisk delaktighet, inte folkmängd). \"Minskad "
                "utlokalisering\" är fel (handlar om företag, inte folk)."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens ord?",
            "text": (
                "\"Sysselsättning – minskad arbetslöshet\": sysselsättning är "
                "ett resultat av utbildning, inte en förutsättning; minskad "
                "arbetslöshet handlar om jobb, inte om folkmängd. "
                "\"Kunskap – ökat medborgarinflytande\": kunskap är dubbelt mot "
                "utbildning; medborgarinflytande är politiskt. \"Utbyggnad – "
                "minskad utlokalisering\": utbyggnad är vagt; utlokalisering "
                "handlar om företagsflytt. \"Nytänkande – ökat "
                "befolkningsunderlag\": nytänkande passar mellan "
                "förutsättningar och innovationer; befolkningsunderlag = hur "
                "många människor det finns i området."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A: sysselsättning är fel kategori (resultat snarare än "
                "förutsättning), och arbetslöshet är fel fokus (texten "
                "handlar om bosättning). B: kunskap är dubbelaktigt mot "
                "utbildningsraden; medborgarinflytande är politiskt och "
                "missar bosättningsdraget. C: utbyggnad är vagt; "
                "utlokalisering handlar om företag, inte folk. D: nytänkande "
                "passar i trippelraden (förutsättningar – nytänkande – "
                "innovationer); befolkningsunderlag är exakt vad "
                "kvarboende + inflyttning skapar."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast D klarar båda leden: nytänkande som mellanled mellan "
                "förutsättningar och innovationer, befolkningsunderlag som "
                "summan av kvarboende och inflyttning. Svaret är D."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"sysselsättning – minskad arbetslöshet\" "
                "som passande för en regionalpolitisk text om utbildning "
                "och jobb."
            ),
            "why_wrong": (
                "Lucka 2 fäller A: texten talar om BOSÄTTNING (kvarboende "
                "och inflyttning), inte om jobb (steg 3). Arbetslöshet och "
                "befolkningsunderlag är olika storheter."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"kunskap – ökat medborgarinflytande\" "
                "eftersom utbildning + medborgaranda är ett standardpar."
            ),
            "why_wrong": (
                "Kunskap är dubbelt mot \"utbildning\" som redan finns i "
                "meningen (steg 4). Och medborgarinflytande missar målet — "
                "texten talar om bosättning, inte om politisk delaktighet."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Snabbsvar är ofta \"utbyggnad – minskad utlokalisering\" — "
                "det låter regionalpolitiskt och seriöst."
            ),
            "why_wrong": (
                "Utbyggnad är otydligt mellan \"förutsättningar\" och "
                "\"innovationer\" (steg 5). Och utlokalisering handlar om "
                "FÖRETAGSFLYTT, inte om FOLKMÄNGD — fel ämne för lucka 2."
            ),
        },
    ],
    "technique": (
        "Trelucksregeln + tematisk koherens: alla tre leden ska samspela "
        "i SAMMA resonemang. Här: utbildning → näringsliv → befolkning. "
        "Det avgörande är att lucka 2 (befolkningsunderlag) matchar "
        "textens egen förklaring (kvarboende + inflyttning). Triggern: "
        "läs förklaringen EFTER luckan — den definierar svaret."
    ),
    "pitfall": (
        "Regionalpolitiska ord (sysselsättning, kunskap, utbyggnad, "
        "nytänkande) verkar utbytbara, men de kvalificeras av vad "
        "luckan ska FÖRBINDA. Botemedlet: kolla att lucka 1 passar "
        "uppräkningen den står i, och att lucka 2 passar förklaringen "
        "som följer."
    ),
}

EXPL["var-2014-verb2-MEK-030"] = {
    "_meta": META,
    "solution_path": (
        "Motionsgrupper för PERSONER SOM HAFT HJÄRTINFARKT är "
        "rehabiliteringsgrupper — alltså konvalescenter (personer som "
        "återhämtar sig efter sjukdom). Svaret är B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Det är precis detta fenomen som ligger bakom alla "
                "motionsgrupper som under senare år bildats för ____ som haft "
                "hjärtinfarkt. Luckan ska beteckna PERSONER SOM HAFT EN "
                "HJÄRTINFARKT och nu motionerar för att komma tillbaka."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Tre signaler: (1) det är personer som HAFT hjärtinfarkt — "
                "alltså patienter EFTER en akut sjukdom; (2) de motionerar i "
                "grupp — alltså rehabilitering; (3) ordet är medicinskt "
                "fackspråk. Vi söker termen för \"person under återhämtning "
                "efter sjukdom\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder \"konvalescenter\"?",
            "text": (
                "Konvalescent = person som är på bättringsvägen efter sjukdom "
                "eller operation — alltså i rehabiliteringsfasen. "
                "Konvalescens = tillfrisknandetid. Det är ett klassiskt "
                "medicinskt ord på -ent (jämför pacient, patient, "
                "respondent). Hjärtinfarktrehabiliterade ÄR per definition "
                "konvalescenter."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Vad betyder de andra alternativen?",
            "text": (
                "\"Respondenter\" = personer som svarar (i enkät, "
                "undersökning) — fel kategori, inte medicinsk. "
                "\"Anförvanter\" = släktingar, anhöriga — fel kategori, "
                "texten talar om PATIENTERNA själva, inte deras familjer. "
                "\"Simulanter\" = personer som låtsas vara sjuka — RAKA "
                "MOTSATSEN: simulanter har inte haft hjärtinfarkt, de "
                "låtsas."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"respondenter\": fel kategori — enkätsvarare, inte "
                "rehabpatienter. B \"konvalescenter\": exakt rätt — personer "
                "i återhämtning efter sjukdom. C \"anförvanter\": fel "
                "kategori — släkt, inte patient. D \"simulanter\": fel "
                "riktning — låtsas-sjuka, inte verkligt drabbade."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast \"konvalescenter\" passar både domänen (medicin) och "
                "tillståndet (rehabilitering efter sjukdom). Svaret är B."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"respondenter\" som tekniskt och "
                "passande för en grupp människor."
            ),
            "why_wrong": (
                "Respondent = enkätsvarare, deltagare i forskningsstudie "
                "(steg 4). Hjärtinfarktrehab är ingen enkätstudie — det är "
                "behandling efter sjukdom. Fel domän."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"anförvanter\" som passande för en "
                "stödgrupp — anhöriga samlas också i grupper."
            ),
            "why_wrong": (
                "Anförvanter = släktingar, anhöriga (steg 4). Texten talar om "
                "\"____ som haft hjärtinfarkt\" — det är PATIENTERNA SJÄLVA "
                "som motionerar, inte deras familjer."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"simulanter\" eftersom -ent-ändelsen "
                "låter medicinsk och teknisk."
            ),
            "why_wrong": (
                "Simulant = någon som FALSKELIGEN PÅSTÅR sig vara sjuk för "
                "att slippa något (steg 4). Texten säger \"som HAFT "
                "hjärtinfarkt\" — alltså verkligt drabbade, inte falska "
                "patienter. Raka motsatsen."
            ),
        },
    ],
    "technique": (
        "Fackord-precision för medicinska -ent-ord: konvalescent "
        "(återhämtande), patient (under vård), respondent (svarande i "
        "enkät), simulant (falsk sjukling), anförvant (släkting). "
        "Triggern: när texten signalerar \"efter sjukdom + motion + "
        "grupp\", är ordet konvalescent."
    ),
    "pitfall": (
        "-ent/-ant-ändelser på substantiv lurar att verka utbytbara — "
        "de hör ofta till samma morfologiska familj men har olika "
        "betydelser. Botemedlet: plugga deras EXAKTA betydelser; ge "
        "varje ord en konkret bild (konvalescent = någon i pyjamas på "
        "promenad, simulant = någon med termometer i kaffekoppen)."
    ),
}

if __name__ == "__main__":
    out_path = Path("audit/_regen/var-2014-mek.json")
    existing = json.loads(out_path.read_text()) if out_path.exists() and out_path.read_text().strip() else {}
    existing.update(EXPL)
    out_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False, sort_keys=True))
    print(f"wrote {len(EXPL)} entries; total now {len(existing)}")

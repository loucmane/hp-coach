"""Build var-2014 MEK regen JSON (Variant C, ultra-granular)."""
from __future__ import annotations
import json
from pathlib import Path

META = {
    "generated_at": "2026-05-14",
    "model": "claude-opus-4-7",
    "recipe": "variant-c-ultra-granular",
}

# ── verb1 — questions 21..30 ───────────────────────────────────────────────
EXPL: dict[str, dict] = {}

EXPL["var-2014-verb1-MEK-021"] = {
    "_meta": META,
    "solution_path": (
        "Vinylen och digital försäljning pekar åt motsatt håll — vinyl är fysiskt och "
        "analogt, fildelning och digital försäljning är digitalt. Vinyltrenden är "
        "alltså \"en motreaktion på\" digitaltrenden. Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Uppsvinget för vinylskivan sammanfaller med en kraftig ökning av "
                "fildelning och digital musikförsäljning — alltså digitalisering. "
                "Sedan: \"kanske är vinyltrenden delvis ____ den digitala trenden\". "
                "Luckan ska benämna VILKEN RELATION vinylen har till den digitala "
                "trenden."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Vinyl är en MOTSATS till digitalt — fysiska skivor i stället för "
                "filer. När en samtida fysisk trend förstärks samtidigt som det "
                "digitala ökar, är vinylen naturligast en REAKTION TILLBAKA, inte en "
                "del av samma rörelse. Det fattas ett ord som beskriver \"motrörelse "
                "som kulturellt svar\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder alternativen?",
            "text": (
                "\"En stegring av\" = en ökning/intensifiering — vinyl är inte mer "
                "digitalt, så fel relation. \"Ett bevis på\" = ett tecken som styrker "
                "— vinyl bevisar inte digitalisering, den går emot. \"En anledning "
                "till\" = en orsak — vinyl orsakar inte digital försäljning. \"En "
                "motreaktion på\" = en rörelse som uppstår SOM SVAR mot något — "
                "exakt det vi behöver."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"en stegring av\": vinyl är inte digital, det är raka motsatsen. "
                "B \"ett bevis på\": vinyl belägger inte digitaliseringen, den "
                "motarbetar den. C \"en anledning till\": vinyl kommer EFTER "
                "digitaliseringen och som svar — kausaliteten är omvänd. D \"en "
                "motreaktion på\": vinyl uppstår som kulturellt motsvar till "
                "digitalt — passar både tidsföljd och betydelse."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Slutsats",
            "text": (
                "Endast D fångar den faktiska relationen: vinyl är en kulturell "
                "motrörelse mot digitalisering. Svaret är D — \"en motreaktion på\"."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"stegring\" som ren ökning och tänka att "
                "vinyl är en del av samma uppåttrend som digital försäljning."
            ),
            "why_wrong": (
                "Steg 2 visar problemet: vinyl är fysisk, digital är digital — de "
                "är olika kategorier, inte mer av samma sak. En stegring kräver "
                "samma riktning, vilket inte finns här."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid att vinyltrenden ser ut som \"ett bevis på\" att "
                "musikbranschen lever — ordet bevis bär generellt positiv klang."
            ),
            "why_wrong": (
                "Ett bevis på den digitala trenden vore ologiskt — vinyl belägger "
                "inte digitalisering. Steg 4 låser fast riktningen: vinyl går EMOT, "
                "inte med, det digitala."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Snabbsvar är ofta \"anledning till\" eftersom hjärnan letar efter "
                "ett orsakssamband mellan två samtidiga trender."
            ),
            "why_wrong": (
                "Kausaliteten är vänd: vinylen är inte orsaken till digitaliseringen "
                "— digitaliseringen kom först, vinyl är svaret. Steg 4 visar att "
                "tidsordningen utesluter C."
            ),
        },
    ],
    "technique": (
        "Kollokationsregeln för \"motreaktion på X\": när två samtidiga trender "
        "tillhör motsatta kategorier (fysiskt vs digitalt, gammalt vs nytt) och "
        "den ena uppstår SOM SVAR på den andra, är \"motreaktion på\" den exakta "
        "termen. Triggern: två trender som ser ut att stiga samtidigt men "
        "tillhör olika domäner."
    ),
    "pitfall": (
        "MEK-frågor med samtida trender lockar till att läsa båda som \"del av "
        "samma våg\". Botemedlet: identifiera om alternativen pekar åt SAMMA "
        "håll (med) eller MOT (emot) — då blir kausalriktningen tydlig."
    ),
}

EXPL["var-2014-verb1-MEK-022"] = {
    "_meta": META,
    "solution_path": (
        "Analfabeter kan per definition inte LÄSA — alltså \"saknar\" de en "
        "skriftlig berättartradition, vilket gör att de istället bär en \"muntlig\" "
        "tradition. Svaret är B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Meningen säger: stora delar av världens befolkning är analfabeter "
                "och ____ en skriftlig berättartradition. Romankonsten är ung "
                "jämfört med det ____ berättandet och musiken. Två luckor som ska "
                "samspela: vad gör analfabeter med en skriftlig tradition, och "
                "vilken sorts berättande är romanens motpol?"
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Analfabet betyder \"någon som inte kan läsa eller skriva\". Den "
                "som inte kan läsa kan per definition INTE delta i en SKRIFTLIG "
                "tradition. Lucka 1 måste alltså vara ett verb som betyder \"inte "
                "ha tillgång till\" — \"saknar\" är det neutrala valet."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "Romankonsten är skriftlig prosa. Motpolen som anges som äldre och "
                "förebild är just det icke-skriftliga — alltså det MUNTLIGA "
                "berättandet (sagor, folksånger, episk diktning som överförs i "
                "tal). Lucka 2 ska beteckna \"överfört i tal, inte skrift\"."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens verb och adjektiv?",
            "text": (
                "\"Avvarar – traderade\": avvara = klara sig utan (något man har); "
                "traderad = överlämnad/förmedlad genom traditionen. \"Saknar – "
                "muntliga\": saknar = inte ha; muntliga = framförda i tal. "
                "\"Förmedlar – traditionella\": förmedlar = vidarebefordrar; "
                "traditionella = som hör till traditionen. \"Behöver – uråldriga\": "
                "behöver = är beroende av; uråldriga = mycket gamla."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A: en analfabet \"avvarar\" inte en skriftlig tradition — man kan "
                "bara avvara något man har tillgång till. B: \"saknar – muntliga\" "
                "passar båda leden — analfabeter saknar skriftlig tradition, och "
                "muntliga är skriftliges motpol. C: en analfabet förmedlar inte en "
                "skriftlig tradition. D: en analfabet \"behöver\" inte en "
                "skriftlig tradition — analfabetism är inte ett behov av läsande."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast B klarar båda luckorna: \"saknar\" för analfabeters "
                "förhållande till skrift, \"muntliga\" som motpol till romanens "
                "skriftlighet. Svaret är B."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "\"Avvarar\" låter litterärt och ett bildat ord — och \"traderad "
                "berättartradition\" har en korrekt klang av folkminne."
            ),
            "why_wrong": (
                "Steg 2 låser fast logiken: man kan bara avvara något man har — "
                "analfabeter HAR inte skriftlig tradition, de saknar den. \"Avvara\" "
                "förutsätter besittning, vilket motsäger analfabetism."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Första instinkten är att \"förmedlar – traditionella\" är "
                "harmlöst — båda orden låter välbekanta i ett kulturhistoriskt "
                "sammanhang."
            ),
            "why_wrong": (
                "En analfabet kan inte FÖRMEDLA en SKRIFTLIG tradition — det är "
                "en logisk omöjlighet (steg 5). Och \"traditionella\" är för "
                "vagt — det specificerar inte kontrasten muntligt vs skriftligt."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Det är frestande att läsa \"uråldriga\" som passande för "
                "muntlig folkdiktning — sagor är ju gamla."
            ),
            "why_wrong": (
                "Lucka 1 fäller D: en analfabet \"behöver\" inte en skriftlig "
                "tradition — det förutsätter att hen läser. Ålder är inte det "
                "begrepp som kontrasterar mot \"skriftlig\" i steg 3 — det "
                "saknade ordet är \"muntlig\"."
            ),
        },
    ],
    "technique": (
        "Tvålucksregeln: båda orden måste passa oberoende. Hitta först vad "
        "första luckan kräver semantiskt (här: ett verb som passar med "
        "analfabetism + skriftlig tradition), sedan vad andra luckan kräver "
        "(här: motsatsen till \"skriftlig\"), och eliminera par som spricker "
        "på minst ett led."
    ),
    "pitfall": (
        "Verb som \"avvara\" och \"behöva\" förutsätter en relation man "
        "redan har till objektet. Botemedlet: testa varje verb mot subjektets "
        "VERKLIGA tillstånd — kan en analfabet rimligen \"avvara\", \"behöva\" "
        "eller \"förmedla\" något skriftligt?"
    ),
}

EXPL["var-2014-verb1-MEK-023"] = {
    "_meta": META,
    "solution_path": (
        "En komplex fråga är \"flerdimensionell\" — den kan inte \"reduceras\" till "
        "en motsättning mellan undervisningsformer; det är lärarens och elevens "
        "\"engagemang\" som är avgörande. Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Tre luckor: en alltför komplex och ____ fråga, för att kunna ____ "
                "till en enkel motsättning mellan katederundervisning och "
                "elevcentrerad undervisning; det är lärarens och elevens ____ i "
                "lärprocessen som är avgörande. Alla tre orden ska samspela mot "
                "samma poäng: att undervisning är MER än en metodval."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Adjektivet samordnas med \"komplex\" — det ska FÖRSTÄRKA "
                "komplexiteten. Något flerdimensionellt eller sammansatt går alltså "
                "bra; \"elementär\" är raka motsatsen och åker ut. Lucka 1 ska "
                "betyda \"har många dimensioner/aspekter\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Alltför komplex för att ____ till\" — luckan ska betyda "
                "\"kokas ned till\", \"förenklas så att den bara handlar om\". "
                "Verbet ska beskriva att man krymper en mångfasetterad fråga till "
                "en tvådelad fråga (kateder vs elevcentrerad)."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Hitta begränsningen i lucka 3",
            "text": (
                "Sista ledet säger att både lärarens och elevens ____ är avgörande "
                "för framgångsrik undervisning. Vad är det som lärare OCH elev "
                "tillsammans bidrar med i lärprocessen? Inte tillvaron, inte "
                "kunskaperna ensamma — utan något INRE och AKTIVT. \"Engagemang\" "
                "passar bäst: viljan och investeringen i lärandet."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Vad betyder alternativens verb?",
            "text": (
                "\"Reduceras\" = krympa, koka ned till färre delar — passar steg "
                "3. \"Förändras\" = ändras (för vagt; säger inget om förenkling). "
                "\"Förminskas\" = göras mindre (om storlek/betydelse, inte om "
                "förenkling till färre kategorier). \"Hänföras\" = härledas till, "
                "tillskrivas — fel grammatik mot \"alltför komplex för att\"."
            ),
            "tier": "detail",
        },
        {
            "n": 6,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"flerdimensionell – reduceras – engagemang\": alla tre leden "
                "passar exakt. B \"sammansatt – förändras – deltagande\": "
                "förändras säger inget om förenkling, fel verb. C \"elementär\" "
                "motsäger \"alltför komplex\" direkt. D \"komplicerad – hänföras "
                "– kunskaper\": hänföras är fel verb för förenkling, och "
                "\"kunskaper\" är fel: elevens kunskaper är RESULTATET, inte vad "
                "hen bidrar med från början."
            ),
            "tier": "essential",
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "Endast A klarar alla tre luckorna: flerdimensionell (komplex + "
                "extra dimension), reduceras (kokas ned till två kategorier), "
                "engagemang (lärarens och elevens inre investering). Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att läsa \"sammansatt\" som synonym till komplex och "
                "\"deltagande\" som det som lärare och elev bidrar med."
            ),
            "why_wrong": (
                "Lucka 2 spräcker B: \"förändras till\" säger inte att frågan "
                "FÖRENKLAS — den ändras bara. Steg 5 visar att vi behöver ett "
                "verb som betyder \"krympa till färre kategorier\", och det är "
                "reduceras, inte förändras."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"förminskas\" som synonym till reduceras — "
                "och \"tillvaro\" har en filosofisk klang som passar in i "
                "akademisk text."
            ),
            "why_wrong": (
                "Lucka 1 fäller direkt: \"elementär\" betyder \"enkel, "
                "grundläggande\" — raka motsatsen till komplex (steg 2). Ingen "
                "fråga kan vara både \"alltför komplex\" och \"elementär\"."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"komplicerad – hänföras – kunskaper\" — alla "
                "tre orden låter tunga och akademiska, och kunskap är ju vad "
                "undervisning handlar om."
            ),
            "why_wrong": (
                "Två fel på en gång (steg 6): \"hänföras till\" betyder "
                "\"tillskrivas/härledas till\", inte \"förenklas till\" — fel "
                "verb för bryggan. Och \"kunskaper\" är vad eleven SKA "
                "TILLÄGNA SIG, inte vad hen bidrar med i lärprocessen — "
                "lärprocessen kräver engagemang INNAN kunskap finns."
            ),
        },
    ],
    "technique": (
        "Trelucksregeln: läs HELA meningen två gånger, identifiera "
        "begränsningen för varje lucka separat, eliminera ett alternativ "
        "så fort EN lucka spricker. Här fäller adjektivet \"elementär\" "
        "alternativ C direkt — du behöver inte ens läsa de andra leden."
    ),
    "pitfall": (
        "I trelucksfrågor lockas du att rättfärdiga ett alternativ där två "
        "av tre ord passar. Botemedlet: ett enda fel ord diskvalificerar "
        "hela paret — kräv 3 av 3, aldrig 2 av 3."
    ),
}

EXPL["var-2014-verb1-MEK-024"] = {
    "_meta": META,
    "solution_path": (
        "Såbädden förbereds genom att man jämnar ut OCH ____ plöjd mark med harv. "
        "Att harva = att porösa upp jorden, alltså \"luckring\". Svaret är B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Meningen beskriver hur en SÅBÄDD (det jordlager där frö ska sås) "
                "bereds: genom utjämning OCH ____ av plöjd mark, med harv som "
                "redskap, eller genom fräsning till lämpligt sådjup. Luckan ska "
                "beteckna en JORDBEARBETNING man gör SAMTIDIGT med utjämning, med "
                "en HARV, INNAN sådd."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Tre starka ledtrådar: (1) jämställs med utjämning — alltså en "
                "fysisk markbearbetning, (2) görs med en harv (ett verktyg som "
                "drar genom jorden), (3) sker FÖRE sådden. Vi söker ordet för "
                "\"göra jorden lös och porös\" — fackterm i jordbruk."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder alternativen?",
            "text": (
                "\"Gödsling\" = tillförsel av näringsämnen, inte fysisk bearbetning "
                "med harv. \"Luckring\" = att göra jorden porös, lös, lucker — "
                "exakt vad en harv gör. \"Odling\" = hela processen att framställa "
                "växter, inte en delmoment före sådd. \"Röjning\" = avlägsna sly, "
                "stenar, ogräs — sker INNAN plöjning, inte EFTER."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"gödsling\": gör man inte med harv, och tillsätter näring "
                "snarare än bearbetar jordens struktur. B \"luckring\": exakt "
                "fackord för att göra jorden lös och porös med harv — passar "
                "perfekt. C \"odling\": för brett begrepp — odling är hela "
                "processen, inte en del av såbäddsförberedelsen. D \"röjning\": "
                "sker före plöjning, inte efter — tidsföljden går fel."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Slutsats",
            "text": (
                "Endast \"luckring\" passar både redskapet (harv) och fasen "
                "(efter plöjning, före sådd). Svaret är B."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att associera jordbruksförberedelse med gödsling — "
                "båda hör till sådd-rutinen."
            ),
            "why_wrong": (
                "Gödsling tillför näring, det är ingen FYSISK bearbetning som "
                "görs med harv (steg 4). Meningen specificerar redskapet — vi "
                "behöver det moment som EN HARV utför."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många hör \"odling\" som ett brett jordbrukord och tänker att "
                "det rymmer såbäddsförberedelse."
            ),
            "why_wrong": (
                "Odling är hela processen att framställa grödor, från sådd till "
                "skörd — inte en jämställd handling med utjämning (steg 4). "
                "Meningens fokus är ett specifikt FÖRBEREDELSEMOMENT, inte hela "
                "produktionscykeln."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Första instinkten kan vara att röjning passar — det låter "
                "fysiskt och hör till markbearbetning."
            ),
            "why_wrong": (
                "Röjning sker FÖRE plöjning (man röjer sly och stenar innan man "
                "vänder jorden). Meningen säger \"av PLÖJD mark\" — alltså efter "
                "plöjning. Tidsordningen fäller D."
            ),
        },
    ],
    "technique": (
        "Fackord-precision: när meningen anger ett SPECIFIKT redskap (harv) "
        "eller en specifik fas (efter plöjning, före sådd), måste luckan "
        "vara fackordet för just den handlingen. Triggern: konkreta verktyg "
        "eller tidsmarkörer i meningen — leta i samma fackdomän."
    ),
    "pitfall": (
        "Generella jordbruksord (gödsling, odling, röjning) lockar för att "
        "de hör till samma område som luckring. Botemedlet: kolla att ordet "
        "passar den EXAKTA FASEN och det EXAKTA REDSKAPET — inte bara "
        "domänen."
    ),
}

EXPL["var-2014-verb1-MEK-025"] = {
    "_meta": META,
    "solution_path": (
        "Barnet sa något ROLIGT som tystade samtalet — alltså \"dråpligt\" — och "
        "detta gav hen \"tillträde till\" de vuxnas samtal. Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Barnet bröt in i samtal genom att säga något kul. En gång "
                "oavsiktligt sade hen något ____ som fick samtalet att tystna. Och "
                "skämt gav hen ____ de vuxnas konversation. Två luckor som ska "
                "passa: ett adjektiv för det roliga uttalandet, en prepositionsfras "
                "för vad skämten gav hen."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Det första ordet ska vara synonym till \"oavsiktligt roligt\" — "
                "något som fick samtalet att tystna av munterhet eller överraskning. "
                "Hela poängen är att barnet sa något kul. Lucka 1 ska betyda "
                "\"komiskt på ett oavsiktligt sätt\" eller \"slagkraftigt roligt\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Skämt gav mig ____ de vuxnas konversation\" — vad GAV skämten? "
                "Inte förtroende (det får man av allvar), inte inblick (det är "
                "passivt observerande), inte övertag (för fientligt). Skämten gav "
                "ett SOCIALT INSTEG — möjlighet att delta. Vi söker ordet för "
                "\"rätt att delta\"."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens ord?",
            "text": (
                "\"Spontant – förtroende för\": spontant = oplanerat; förtroende = "
                "tillit. \"Ironiskt – inblick i\": ironiskt = sägande motsatsen i "
                "humoristisk syfte; inblick = passiv förståelse utifrån. "
                "\"Dråpligt – tillträde till\": dråpligt = roligt på ett "
                "oavsiktligt eller utstickande sätt; tillträde = rätt att gå in/"
                "delta. \"Lakoniskt – övertag över\": lakoniskt = kortfattat och "
                "torrt; övertag = maktposition."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"spontant – förtroende för\": spontant säger inget om "
                "MUNTERHETEN som tystade samtalet, och förtroende är fel: skämt "
                "ger sällan tillit. B \"ironiskt – inblick i\": ironi passar "
                "ibland, men det är knappast OAVSIKTLIGT (ironi är medveten); "
                "inblick är passivt, inte deltagande. C \"dråpligt – tillträde "
                "till\": dråpligt fångar exakt det oavsiktligt komiska, och "
                "tillträde fångar det sociala instegspasset. D \"lakoniskt – "
                "övertag över\": lakoniskt är torrt, inte roligt; övertag är för "
                "aggressivt för ett barn som vill DELTA, inte dominera."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast C passar båda leden: dråpligt för det oavsiktligt roliga, "
                "tillträde för den sociala inbjudan in i samtalet. Svaret är C."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "\"Spontant\" passar bra med \"oavsiktligt\" — och förtroende "
                "låter som en fin sak att vinna från vuxna."
            ),
            "why_wrong": (
                "Spontant beskriver tidpunkten, inte humorn (steg 5) — det "
                "räcker inte för att förklara varför samtalet TYSTNADE. Och "
                "förtroende byggs av allvar och tillit, inte av skämt."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många tolkar \"ironiskt\" som en form av kvickhet — och inblick "
                "låter som en bra sak ett barn kan få i vuxenvärld."
            ),
            "why_wrong": (
                "Ironi är MEDVETET, men meningen säger \"oavsiktligt\" (steg 2). "
                "Och inblick är passiv förståelse — texten beskriver aktiv "
                "INTRÄDE i samtalet, inte observation utifrån."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Det är frestande att läsa \"lakoniskt\" som kvickhet — "
                "kortfattade kommentarer kan vara roliga."
            ),
            "why_wrong": (
                "Lakoniskt betyder torrt och kortfattat, inte roligt — och ett "
                "barn söker INSTEG, inte ÖVERTAG (steg 5). Övertag förutsätter "
                "redan deltagande i samtalet — det är fel del av resan."
            ),
        },
    ],
    "technique": (
        "Tvålucksregeln med precisionsord: \"dråpligt\" är ett HP-klassiskt "
        "ord (oavsiktligt komiskt, slagkraftigt roligt). Tillträde-till är "
        "en fast kollokation för socialt INSTEG. När båda halvorna kräver "
        "exakta ord, plugga ordens precisa nyanser snarare än att gissa "
        "på \"känsla\"."
    ),
    "pitfall": (
        "Ord som \"spontant\" och \"ironiskt\" verkar synonyma med \"roligt\" "
        "men beskriver SÄTT, inte effekt. Botemedlet: testa varje alternativ "
        "mot textens explicita signaler — här \"oavsiktligt\" och \"fick "
        "samtalet att tystna\"."
    ),
}

# ── verb1 — questions 26..30 ───────────────────────────────────────────────

EXPL["var-2014-verb1-MEK-026"] = {
    "_meta": META,
    "solution_path": (
        "Begränsad bioråvara måste \"användas\" på bästa sätt; etanol är inte "
        "\"långsiktigt\" hållbart eftersom det kan öka \"utsläppen\" av "
        "växthusgaser. Svaret är B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Tre luckor i ett miljöresonemang: bioråvara är begränsad — den "
                "måste ____ på bästa sätt; etanol av spannmål är inte ____ "
                "hållbart, eftersom nya studier visar att bränslet ibland ökar "
                "____. Vi behöver tre ord som tillsammans bygger ett resonemang "
                "om HÅLLBAR RESURSANVÄNDNING."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Bioråvara är begränsad. Vad gör man med en BEGRÄNSAD råvara på "
                "\"bästa möjliga sätt\"? Inte framställas (den finns ju redan), "
                "inte återvinnas (bioråvara är ej föremål man recyklar i den här "
                "kontexten). Verbet ska betyda \"nyttjas/utnyttjas\" — alltså "
                "\"användas\" eller \"förädlas\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "Adverbet beskriver vilket SLAG av hållbarhet etanol INTE har. "
                "Texten talar om långsiktiga effekter på växthusgaser — alltså "
                "\"långsiktigt hållbart\". \"Biologiskt\", \"ekonomiskt\", "
                "\"miljömässigt\" är specifika sluttningar; långsiktigt är det "
                "övergripande tidsperspektivet som passar resonemanget om framtida "
                "växthusgaser."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Hitta begränsningen i lucka 3",
            "text": (
                "Sista ledet: bränslet ger inte minskningar av växthusgaser utan "
                "kan till och med ÖKA ____. Vad ökar man av växthusgaser? "
                "UTSLÄPPEN. Förbrukningen är fel riktning (förbrukning av "
                "bioråvara, inte av växthusgaser), effekten är vagt, uttaget är "
                "om hur mycket man tar ut, inte vad som släpps ut."
            ),
            "tier": "essential",
        },
        {
            "n": 5,
            "title": "Vad betyder alternativens verb och adverb?",
            "text": (
                "\"Framställas – biologiskt – förbrukningen\": framställas = "
                "produceras (men bioråvaran finns redan); biologiskt hållbart är "
                "för vagt; förbrukning av växthusgaser låter konstigt. "
                "\"Användas – långsiktigt – utsläppen\": användas passar för "
                "bästa nyttjande; långsiktigt hållbart är standardfras; utsläpp "
                "av växthusgaser är exakt rätt. \"Förädlas – ekonomiskt – "
                "effekten\": förädlas avgränsar för smalt (alla bioråvaror "
                "förädlas inte); ekonomiskt sliter mot resonemanget som handlar "
                "om klimat. \"Återvinnas – miljömässigt – uttaget\": bioråvara "
                "återvinns inte i strikt mening; uttaget pekar fel håll."
            ),
            "tier": "detail",
        },
        {
            "n": 6,
            "title": "Matcha mot alternativen",
            "text": (
                "A: framställas är fel verb (bioråvaran är källan, inte slut"
                "produkten); förbrukningen av växthusgaser låter ogrammatiskt. "
                "B: alla tre leden passar — användas / långsiktigt / utsläppen. "
                "C: förädlas avgränsar för smalt, och ekonomiskt sliter mot "
                "klimatresonemanget. D: återvinnas passar inte för en levande "
                "bioråvara, och uttaget av växthusgaser är fel riktning."
            ),
            "tier": "essential",
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "Endast B håller hela kedjan: bioråvara används bäst, etanol är "
                "inte långsiktigt hållbar, utsläppen kan öka. Svaret är B."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"framställas\" som hållbarhetstema — "
                "produktion ÄR ju en del av resursresonemanget."
            ),
            "why_wrong": (
                "Bioråvara FRAMSTÄLLS inte i texten — den är källmaterialet, det "
                "är BRÄNSLET (etanol) som framställs. Och \"förbrukningen\" av "
                "växthusgaser är ologiskt — växthusgaser släpps UT, inte "
                "förbrukas (steg 4)."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"förädlas – ekonomiskt – effekten\" eftersom "
                "alla tre orden låter sofistikerade och produktionsekonomiska."
            ),
            "why_wrong": (
                "\"Ekonomiskt hållbart\" pekar fel håll — textens kritik gäller "
                "KLIMATEFFEKTEN, inte ekonomi (steg 3). Och \"effekten\" är så "
                "vagt att det förlorar bettet jämfört med \"utsläppen\"."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"återvinnas – miljömässigt – uttaget\" "
                "eftersom alla tre låter miljövänliga och relevanta."
            ),
            "why_wrong": (
                "Bioråvara från spannmål återvinns inte — den växer, skördas "
                "och förbrukas (steg 5). Och \"uttaget\" är vad man TAR från "
                "skogen/jorden, inte vad bränslet SLÄPPER UT — fel riktning på "
                "luckan."
            ),
        },
    ],
    "technique": (
        "Trelucksregeln + idiom-strategi: läs hela resonemanget och leta "
        "fasta uttryck som \"långsiktigt hållbart\" och \"utsläpp av "
        "växthusgaser\". Dessa kollokationer låser fast två av tre luckor "
        "direkt; det tredje följer av elimination."
    ),
    "pitfall": (
        "Miljödebatten har många synonymerade adverb (biologiskt, "
        "ekonomiskt, miljömässigt, långsiktigt) som inte är utbytbara. "
        "Botemedlet: matcha adverbet mot vilken SORTS hållbarhet texten "
        "faktiskt diskuterar — här klimat över tid, alltså långsiktigt."
    ),
}

EXPL["var-2014-verb1-MEK-027"] = {
    "_meta": META,
    "solution_path": (
        "Det är ÅKOMMAN (sjukdomstillståndet) som liknar astma; men de kemiskt "
        "intoleranta REAGERAR inte med ökad histaminfrisättning. Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Kemisk intolerans innebär kraftiga symptom av vardagliga lukter. "
                "____ liknar astma och allergi, men de kemiskt intoleranta ____ "
                "inte med ökad histaminfrisättning. Två luckor: ett substantiv "
                "som är subjekt för \"liknar astma och allergi\", och ett verb "
                "för vad de intoleranta INTE GÖR med histamin."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "Vad är det som \"liknar astma och allergi\"? Det är hela "
                "tillståndet — sjukdomsbilden — inte enbart diagnosen (etiketten), "
                "förloppet (tidsutvecklingen) eller symptomen (deluttryck). "
                "Astma och allergi är ÅKOMMOR/sjukdomstillstånd; kemisk "
                "intolerans är därför också en ÅKOMMA. Vi söker det substantiv "
                "som benämner SJÄLVA SJUKDOMSTILLSTÅNDET."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"De kemiskt intoleranta ____ inte med ökad histaminfrisättning\". "
                "Konstruktionen är \"reagera MED något\" — kroppen reagerar med "
                "en mekanism. Allergiker reagerar med histamin; kemiskt "
                "intoleranta gör det INTE. Verbet ska vara \"reagera\". "
                "\"Utsöndras\" är fel grammatik (saker utsöndras, människor "
                "utsöndrar inte sig själva), \"hotas\" är fel betydelse, "
                "\"insjuknar\" passar inte med \"med histaminfrisättning\"."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativens substantiv?",
            "text": (
                "\"Diagnosen\" = den medicinska benämningen/etiketten på "
                "tillståndet (inte själva sjukdomen som sådan). \"Förloppet\" = "
                "hur sjukdomen utvecklas över tid. \"Symptomen\" = de enskilda "
                "tecknen/uttrycken. \"Åkomman\" = själva sjukdomstillståndet, "
                "den helhet man har — passar precis som \"astma\" och \"allergi\" "
                "som båda är åkommor."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"Diagnosen – utsöndras\": diagnoser liknar inte sjukdomar i "
                "sig (en diagnos är en etikett, inte ett tillstånd); och "
                "\"utsöndras\" har fel grammatik här. B \"Förloppet – hotas\": "
                "förloppet liknar inte astma (förloppet är HUR sjukdomen rör "
                "sig, inte vilken sjukdom det är); \"hotas\" är fel verb. C "
                "\"Symptomen – insjuknar\": symptom liknar inte hela sjukdomar; "
                "insjukna betyder \"bli sjuk\" och passar inte med \"med "
                "histaminfrisättning\". D \"Åkomman – reagerar\": åkomman är "
                "rätt nivå (sjukdom liknar sjukdom), och reagerar med "
                "histaminfrisättning är exakt rätt konstruktion."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast D passar båda leden: åkomman som benämning på "
                "sjukdomstillståndet, reagerar för den uteblivna "
                "histaminreaktionen. Svaret är D."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"Diagnosen\" som en självklar "
                "medicinterm i en sjukvårdsmening."
            ),
            "why_wrong": (
                "En diagnos är ETIKETTEN man får, inte SJÄLVA tillståndet — "
                "diagnosen kan inte \"likna astma\" (steg 5). Och \"utsöndras\" "
                "saknar agent — människor som subjekt utsöndras inte."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"Förloppet\" eftersom det låter "
                "sjukdomsteoretiskt och medicinskt välbekant."
            ),
            "why_wrong": (
                "Förloppet beskriver hur en sjukdom rör sig över tid — inte "
                "vilken sjukdom det är (steg 5). Och \"hotas inte med ökad "
                "histaminfrisättning\" är språkligt fel: man hotas inte med en "
                "kroppslig mekanism."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Första instinkten är ofta \"Symptomen\" — texten började just "
                "med att tala om kraftiga symptom."
            ),
            "why_wrong": (
                "Symptom är ENSKILDA tecken; det är inte symptom som liknar "
                "astma utan hela tillståndet. Och \"insjuknar med "
                "histaminfrisättning\" är grammatiskt skevt — man insjuknar "
                "AV något, inte MED en mekanism (steg 3)."
            ),
        },
    ],
    "technique": (
        "Fackord-precision + kollokationsregeln: i medicintext är "
        "\"åkomma\" det breda ordet för sjukdomstillstånd; \"diagnos\" är "
        "etiketten; \"symptom\" är delarna; \"förlopp\" är tidsförloppet. "
        "Och \"reagera MED\" är den fasta konstruktionen för kroppsliga "
        "mekanismer. Triggern: när luckan ska benämna en HEL sjukdom, "
        "tänk åkomma."
    ),
    "pitfall": (
        "Medicinska ord som \"diagnos\", \"symptom\", \"förlopp\" är inte "
        "synonymer till sjukdom — de är delar/aspekter. Botemedlet: testa "
        "luckans subjekt mot \"liknar astma och allergi\" — bara HELA "
        "sjukdomstillstånd kan likna andra sjukdomstillstånd."
    ),
}

EXPL["var-2014-verb1-MEK-028"] = {
    "_meta": META,
    "solution_path": (
        "Mässfall = när gudstjänsten ställs in eftersom prästen inte kommer — och "
        "här KOM ju prästen, så det skulle INTE bli mässfall denna gång. Svaret "
        "är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Prästen står ÄNTLIGEN i predikstolen. Församlingen lyfter "
                "huvudena. \"Det skulle inte bli ____ denna söndagen såsom den "
                "förra och många söndagar förut\". Underförstått: tidigare har "
                "något negativt hänt på söndagarna — som INTE händer denna "
                "söndag eftersom prästen är på plats. Luckan ska beteckna det "
                "som har plågat tidigare gudstjänster: prästens uteblivande."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Två signaler: (1) ordet ska sluta på -fall (kontrasterar mot "
                "knäfall, skyfall, syndafall, mässfall); (2) ordet ska betyda "
                "\"misslyckad gudstjänst på grund av prästens frånvaro\". Det "
                "är ett fackord från svensk kyrkohistoria."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder \"mässfall\"?",
            "text": (
                "Mässfall = en gudstjänst som ställs in/uteblir, klassiskt "
                "eftersom prästen inte dyker upp. Ordet är sammansatt av "
                "\"mässa\" (gudstjänst) + \"fall\" (något som bortfaller). Det "
                "är ett gammalt kyrkligt fackord — exakt sådana ord HP MEK "
                "testar."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Vad betyder de andra alternativen?",
            "text": (
                "\"Knäfall\" = att falla på knä, en religiös gest av "
                "underkastelse (fel riktning — gudstjänsten håller, det är inget "
                "knäfall som väntar). \"Skyfall\" = ett kraftigt regn (fel "
                "domän — ingen väderkontext i meningen). \"Syndafall\" = "
                "Adams och Evas fall i Eden, metaforiskt en moralisk kollaps "
                "(fel betydelse — texten handlar inte om moral utan om "
                "gudstjänstens utebli vande)."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"knäfall\": fel betydelse — en religiös gest, inte en "
                "utebliven gudstjänst. B \"skyfall\": fel domän — väder, inte "
                "kyrka. C \"mässfall\": exakt rätt — gudstjänst som ställs in, "
                "vilket INTE händer denna söndag eftersom prästen är på plats. "
                "D \"syndafall\": fel betydelse — moralisk kollaps, inte en "
                "praktisk utebliven mässa."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast \"mässfall\" matchar både ordstammen (mässa + fall) och "
                "den underförstådda historien (prästen brukar utebli — men inte "
                "denna gång). Svaret är C."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"knäfall\" som passande i en kyrkomiljö "
                "— knäfall hör till gudstjänst."
            ),
            "why_wrong": (
                "Ett knäfall är en HANDLING man utför, inte något som UTEBLIR. "
                "Texten kontrasterar mot tidigare söndagar där NÅGOT NEGATIVT "
                "hände — knäfall är inget negativt (steg 4)."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många kopplar \"skyfall\" till bibliska bilder av "
                "syndaflod-katastrofer."
            ),
            "why_wrong": (
                "Skyfall är ett VÄDERFENOMEN. Inget i texten handlar om regn "
                "eller väder (steg 4). Domänmissmatch fäller B."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"syndafall\" eftersom det är det mest "
                "kyrkliga ordet på listan."
            ),
            "why_wrong": (
                "Syndafall avser Adams och Evas fall — en moralisk/religiös "
                "händelse, inte en utebliven gudstjänst (steg 4). Texten "
                "handlar om PRAKTISKT misslyckande, inte om synd."
            ),
        },
    ],
    "technique": (
        "Fackord-precision: när alla fyra alternativ har samma ändelse "
        "(-fall), måste du veta DEN EXAKTA FÖRLED-betydelsen för var och "
        "ett. Triggern: när ordstammen är gemensam, plugga skillnaderna "
        "mellan förleden (knä-, sky-, mäss-, synda-) — det är där "
        "betydelsen ligger."
    ),
    "pitfall": (
        "Sammansatta ord med samma efterled lurar att verka utbytbara. "
        "Botemedlet: testa varje sammansättning som EN ENHET mot textens "
        "innehåll — \"mässfall\" är inte \"fall i mässan\" utan "
        "\"inställd mässa\"."
    ),
}

EXPL["var-2014-verb1-MEK-029"] = {
    "_meta": META,
    "solution_path": (
        "Sjukgymnastik var statligt SANKTIONERAD (officiellt godkänd) och hade "
        "stor RÄCKVIDD — den användes mot allt från tuberkulos till gonorré. "
        "Svaret är D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Sjukgymnasterna hade hög status, jämförbar med läkarnas. På "
                "1800-talet var sjukgymnastik en statligt ____ vetenskap, ett "
                "\"läkemedel\" med stor ____: såväl tuberkulos som gonorré "
                "angreps med sjukgymnastik. Två luckor: ett particip om "
                "STATENS förhållande till vetenskapen, och ett substantiv om "
                "BREDDEN av vad sjukgymnastiken behandlade."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen i lucka 1",
            "text": (
                "\"Statligt ____\" — något staten gjorde med vetenskapen. "
                "Sjukgymnasterna hade HÖG STATUS, så staten måste ha givit "
                "OFFICIELLT STÖD. Vi söker \"officiellt godkänd\" — alltså "
                "\"sanktionerad\" eller \"verifierad\". \"Censurerad\" är "
                "raka motsatsen, \"oberoende\" säger nej till statligt "
                "förhållande över huvud taget."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Hitta begränsningen i lucka 2",
            "text": (
                "\"Stor ____\": tuberkulos OCH gonorré angreps med sjukgymnastik "
                "— alltså många olika sjukdomar. Vi söker ordet för \"hur "
                "långt ett \"läkemedels\" tillämpningsområde sträcker sig\". "
                "Räckvidd är det bästa: hur brett man kan TRÄFFA. Verkan är "
                "fel (verkan = hur stark effekten är, inte hur brett); "
                "utbredning är fel (utbredning = hur spritt det är "
                "geografiskt); frihet är fel kategori."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vad betyder alternativen?",
            "text": (
                "\"Censurerad – verkan\": censurerad = förbjuden/granskad, raka "
                "motsatsen till HÖG STATUS; verkan = effektstyrka. "
                "\"Verifierad – utbredning\": verifierad = bekräftad/kontrollerad "
                "(ligger nära men är mer om sanningsprövning än statligt "
                "stöd); utbredning = hur spritt geografiskt. \"Oberoende – "
                "frihet\": oberoende = INTE styrd av staten (motsäger "
                "\"statligt\"); frihet = rätt att handla, inte tillämpningsbredd. "
                "\"Sanktionerad – räckvidd\": sanktionerad = officiellt godkänd "
                "av staten; räckvidd = bredd, hur långt det når."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A: censurerad motsäger \"hög status\" direkt — staten hade "
                "censurerat vetenskapen, vilket är raka motsatsen. B: "
                "verifierad är möjligt men passar mindre väl med \"statligt\" "
                "som signal — sanktion är det rätt politiska ordet; och "
                "\"utbredning\" handlar om geografisk spridning, inte om "
                "vilka sjukdomar man kan bota. C: \"oberoende\" säger att "
                "sjukgymnastik INTE var statligt påverkad, men adverbet "
                "\"statligt\" kräver tvärtom statlig RELATION. D: båda leden "
                "passar — staten sanktionerade (godkände) vetenskapen, vars "
                "räckvidd (tillämpningsbredd) var stor."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast D passar båda leden: sanktionerad för det statliga "
                "godkännandet, räckvidd för den breda tillämpningen. Svaret är D."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är lätt att läsa \"censurerad\" som en stark statlig åtgärd "
                "och tänka att det visar statens engagemang."
            ),
            "why_wrong": (
                "Censur = INSKRÄNKNING/förbud, motsatsen till godkännande. "
                "Texten säger att sjukgymnaster hade HÖG STATUS (steg 2) — "
                "en censurerad vetenskap är inte högstatus."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid \"verifierad\" som tecken på vetenskaplig "
                "kontroll — och utbredning låter generellt positivt."
            ),
            "why_wrong": (
                "Verifiering är OM SANNING, inte om statligt stöd — fel "
                "betydelsenivå för \"statligt\" (steg 5). Och utbredning "
                "beskriver geografisk spridning, inte hur många slags "
                "sjukdomar man kan behandla — fel sorts \"stor\"."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Första instinkten kan vara \"oberoende\" som tecken på akademisk "
                "frihet och hög status."
            ),
            "why_wrong": (
                "Oberoende motsäger ordet \"statligt\" direkt — om vetenskapen "
                "var statligt OBEROENDE finns ingen statlig relation att "
                "kvalificera (steg 5). Grammatiskt sliter alternativet mot "
                "meningens egen logik."
            ),
        },
    ],
    "technique": (
        "Idiom-strategi: \"statligt sanktionerad\" är en fast kollokation "
        "i svenska, ungefär = \"officiellt godkänd av staten\". \"Stor "
        "räckvidd\" är också idiomatiskt för \"brett "
        "tillämpningsområde\". Triggern: när luckan kvalificeras av "
        "\"statligt\", letar du efter ord som beskriver statens AKTIVA "
        "förhållande (sanktion, censur, kontroll)."
    ),
    "pitfall": (
        "\"Verifierad\" och \"sanktionerad\" ligger nära men har olika "
        "fokus: verifierad gäller SANNING, sanktionerad gäller "
        "GODKÄNNANDE. Botemedlet: när \"statligt\" eller \"officiellt\" "
        "står framför, väljer du sanktionerad — det är det politiska "
        "ordet för auktoritetsgodkännande."
    ),
}

EXPL["var-2014-verb1-MEK-030"] = {
    "_meta": META,
    "solution_path": (
        "Författarens skildring av havet AVSLÖJAR en litterär talang — verbet "
        "\"röjer\" betyder här \"låter framträda/avslöjar\". Svaret är A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå meningen",
            "text": (
                "Stycken om äventyr på land är monotona och pojkbokslika, MEN "
                "skildringen av naturen och särskilt havet ____ en litterär "
                "talang. Kontrasten är: land är trist, hav är talangfullt. "
                "Luckan ska beteckna vad havsskildringen GÖR med talangen — "
                "den måste betyda \"visar\" eller \"avslöjar\"."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Hitta begränsningen",
            "text": (
                "Verbet styrs av två krav: (1) det ska säga att TALANGEN BLIR "
                "SYNLIG genom havsskildringen, (2) det ska passa en litterär "
                "recension. Inte \"anar\" (det är passivt — recensenten anar), "
                "inte \"hyllar\" (det är att aktivt prisa något annat), inte "
                "\"formar\" (det är att skapa, inte avslöja). Vi behöver "
                "verbet \"röjer\" — i den litterära betydelsen \"låter framträda\"."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Vad betyder \"röjer\" i den här kontexten?",
            "text": (
                "\"Röja\" har två svenska huvudbetydelser: (1) konkret rensning "
                "(röja sly, röja undan); (2) metaforiskt \"avslöja, låta "
                "framträda\" — som i \"hennes ansikte röjde inget\" eller "
                "\"texten röjer en stor begåvning\". Den andra betydelsen är "
                "den litterära — exakt vad meningen kräver."
            ),
            "tier": "detail",
        },
        {
            "n": 4,
            "title": "Vad betyder de andra alternativen?",
            "text": (
                "\"Anar\" = misstänker svagt, gissar (är passivt och "
                "subjektivt — havet kan inte ana något). \"Hyllar\" = "
                "lovordar, prisar (havsskildringen kan inte HYLLA en talang — "
                "det skulle göra talangen till någon annans). \"Formar\" = "
                "ger gestalt åt, skulpterar (havsskildringen skapar inte "
                "talangen — talangen finns redan hos författaren och bara "
                "syns i texten)."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Matcha mot alternativen",
            "text": (
                "A \"röjer\": havsskildringen avslöjar/visar talangen — exakt "
                "passande för en recension. B \"anar\": felaktigt subjekt — "
                "skildringen kan inte ana, det är recensenten som anar. C "
                "\"hyllar\": fel logik — talangen är FÖRFATTARENS, inte något "
                "skildringen ska hylla. D \"formar\": skildringen skapar inte "
                "talangen, talangen redan finns och bara visar sig."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Slutsats",
            "text": (
                "Endast \"röjer\" har den exakta betydelsen \"låter "
                "framträda/avslöjar\" som passar litterär kritik. Svaret är A."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "Det är lätt att läsa \"anar\" som \"man ser en antydan av "
                "talang\" — det LJUDER litterärt."
            ),
            "why_wrong": (
                "\"Anar\" är vad LÄSAREN gör — havsskildringen själv kan inte "
                "ana (steg 4). Fel subjekt: texten är aktiv (\"röjer\"), inte "
                "passivt anande."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Många stannar vid \"hyllar\" som tecken på beröm — och en "
                "vacker havsbeskrivning KÄNNS som en hyllning."
            ),
            "why_wrong": (
                "Att HYLLA en talang gör man om någon ANNANS talang — men det "
                "är författarens EGEN talang som visar sig (steg 5). "
                "Havsskildringen kan inte hylla författarens egen förmåga."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snabbsvar är ofta \"formar\" eftersom skrivande ÄR att forma "
                "språk."
            ),
            "why_wrong": (
                "Formar betyder att SKAPA eller GE GESTALT åt något — men "
                "talangen finns redan, den skapas inte av skildringen (steg "
                "4). Det är talangen som visar sig, inte talangen som föds."
            ),
        },
    ],
    "technique": (
        "Självdefinitionsregeln för verb med två betydelser: \"röja\" har "
        "både konkret (rensa) och metaforisk (avslöja) betydelse. I "
        "litterära sammanhang dominerar den metaforiska. Triggern: när "
        "subjektet är en TEXT eller ett UTTRYCK och objektet är en "
        "EGENSKAP, är \"röja\" det idiomatiska valet."
    ),
    "pitfall": (
        "Recensionsspråk lockar med ord som \"hyllar\" och \"formar\" — "
        "men de förutsätter en relation som inte stämmer (hyllar någons "
        "annans förmåga; formar något nytt). Botemedlet: identifiera vem "
        "TALANGEN tillhör och välj ett verb som passar det förhållandet."
    ),
}

if __name__ == "__main__":
    out_path = Path("audit/_regen/var-2014-mek.json")
    existing = json.loads(out_path.read_text()) if out_path.exists() and out_path.read_text().strip() else {}
    existing.update(EXPL)
    out_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False, sort_keys=True))
    print(f"wrote {len(EXPL)} entries; total now {len(existing)}")

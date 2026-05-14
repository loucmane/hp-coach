"""Author Layer-2 MEK explanations for var-2023 via Variant C recipe.

Hand-authored Swedish prose; no API calls. Each entry mirrors the
host-2014 MEK pilot voice with 4-6 steps, named strategies, and
step-number cross-references in why_wrong.

Strategies in use (names locked from prompt):
  - Tvålucksregeln (both-gaps-must-pass; multi-blank MEK)
  - Laddningstest (polarity / charge match)
  - Självdefinitionsregeln (sentence supplies its own definition)
  - Idiom-strategi (fixed phrases / collocations)
  - Kollokationsregeln (which word habitually pairs with which)
  - Fackord-precision (technical word with narrow technical meaning)
  - Egennamnregel (proper noun anchors choice)
"""
from __future__ import annotations

import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def E(steps, solution_path, distractors, technique, pitfall=None):
    """Helper: stamps _meta + framework_id and orders fields predictably."""
    return {
        "_meta": META,
        "distractors": distractors,
        "framework_id": None,
        "pitfall": pitfall,
        "solution_path": solution_path,
        "steps": [
            {"n": i + 1, "title": t, "text": tx, "tier": tier}
            for i, (t, tx, tier) in enumerate(steps)
        ],
        "technique": technique,
    }


REGEN: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-021  | answer: C  (utlåtande)
# "...vill myndigheterna vanligen ha ett intyg, eller snarare ett ___ ,
#  av den veterinär..."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-021"] = E(
    solution_path=(
        "Konstruktionen \"intyg, eller snarare ett ___\" säger att luckan "
        "ska vara ett LIKNANDE men något mer kvalificerat dokument från en "
        "veterinär. Ett utlåtande är just en yrkesmässig bedömning i "
        "skriftlig form. Svaret är C."
    ),
    steps=[
        ("Förstå meningen",
         "Myndigheterna vill ha ett intyg \"eller snarare\" något — alltså "
         "ett dokument som ligger nära ett intyg men är ett snäpp mer "
         "kvalificerat. Veterinären har varit i kontakt med djuren och ska "
         "formulera något skriftligt som duger som underlag i domstol.",
         "essential"),
        ("Hitta begränsningen",
         "\"Eller snarare\" signalerar uppgradering: samma kategori (skriftligt "
         "från en sakkunnig) men mer innehållsrikt än ett intyg. Lucka-ordet "
         "ska beteckna en formell bedömning eller utredning från en "
         "yrkesperson, inte en allmän handling.",
         "essential"),
        ("Vad betyder alternativen?",
         "Utlämnande = handlingen att lämna ut något (t.ex. dokument enligt "
         "offentlighetsprincipen). Utförande = sättet något görs på, "
         "verkställande av en uppgift. Utlåtande = en sakkunnigs skriftliga "
         "bedömning i ett ärende. Utnämnande = att tillsätta någon på en "
         "post.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"utlämnande\": en handling, inte ett dokument med "
         "yrkesbedömning. B \"utförande\": beskriver HUR något görs, inte "
         "ett skriftligt underlag. C \"utlåtande\": exakt rätt — den "
         "kvalificerade sakkunnigversion ett intyg uppgraderas till. "
         "D \"utnämnande\": handlar om att tillsätta en post och har inget "
         "med dokumentation att göra.",
         "essential"),
        ("Slutsats",
         "Endast \"utlåtande\" beskriver ett skriftligt sakkunnigdokument "
         "som är ett snäpp mer kvalificerat än ett intyg. Svaret är C.",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att läsa \"utlämnande\" som något myndigheter gör med dokument — låter byråkratiskt och rätt.",
         "why_wrong": "Steg 3 låser fast skillnaden: utlämnande är HANDLINGEN att lämna ut, inte själva dokumentet. Meningen vill ha ett dokument från veterinären, inte en hantering."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"utförande\" känns aktivt och professionellt — veterinären utför ju arbete.",
         "why_wrong": "Steg 2 visar begränsningen: ordet ska beteckna ett DOKUMENT, inte ett sätt att göra något. Utförande beskriver hur en uppgift verkställs, inte en skriftlig bedömning."},
        {"letter": "D",
         "why_tempting": "Första instinkten är att \"utnämnande\" har samma prefix och bara kasta sig på närmaste ut-ord.",
         "why_wrong": "Utnämnande handlar om att tillsätta någon på en post (en general utnämns). Steg 4 visar att domstolar inte vill ha tillsättningar — de vill ha sakkunnigbedömningar."},
    ],
    technique=(
        "Fackord-precision: när domänen är juridisk/myndighetsspråk har "
        "alla ut-ord (utlåtande/utlämnande/utförande/utnämnande) skarpa "
        "tekniska betydelser. Triggern: identifiera om luckan vill ha ett "
        "DOKUMENT, en HANDLING, ett SÄTT eller en TILLSÄTTNING — bara ett "
        "av orden brukar matcha kategorin."
    ),
    pitfall=(
        "Ord med samma prefix och liknande klang lockar att man väljer på "
        "ljudet. Botemedlet: kategorisera vad luckan grammatiskt och "
        "betydelsemässigt KRÄVER (dokument? handling?) innan du jämför "
        "kandidaterna."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-022  | answer: B  (trubbigt – avfärda)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-022"] = E(
    solution_path=(
        "Lucka 1 beskriver \"fake news\" som ett oprecist analysbegrepp, "
        "lucka 2 vad man gör med åsikter man ogillar. Båda luckorna har "
        "negativ laddning: ett \"trubbigt\" begrepp duger för att "
        "\"avfärda\" allt man inte gillar. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Medieforskare är ENSE om något kritiskt med \"fake news\". Lucka 1 "
         "är ett adjektiv som beskriver begreppet, lucka 2 är ett verb för "
         "vad ordet ANVÄNDS till — och kontexten \"alla sorters åsikter man "
         "själv ogillar\" säger att verbet ska vara dismissivt.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Forskare är ense om begreppet — vad är det forskare i regel är "
         "ense om kring slagord som plockas upp av politiker? Att de är "
         "vaga, oprecisa, otympliga. Lucka-ordet ska beteckna ANALYTISK "
         "OSKÄRPA, inte träffsäkerhet.",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Man använder \"fake news\" för att hantera åsikter man ogillar. "
         "Verbet ska beteckna NEGATIV behandling — viftande, stämpling, "
         "förkastande. Inte att lyfta fram, undersöka eller bekräfta.",
         "essential"),
        ("Vad betyder alternativen?",
         "Avigt = bakvänt, fel sätt. Trubbigt = bildligt: oprecist, "
         "otympligt (en trubbig analysmodell saknar skärpa). Markant = "
         "tydligt, framträdande. Träffsäkert = precis, prickar mitt i. "
         "Framhäva = lyfta fram. Avfärda = vifta bort, förkasta. "
         "Rannsaka = noggrant pröva. Bekräfta = visa att något stämmer.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"avigt – framhäva\": framhäva är POSITIVT laddat — motsäger "
         "\"åsikter man ogillar\". B \"trubbigt – avfärda\": trubbigt = "
         "oprecist + avfärda = vifta bort. Båda leden negativa, båda passar "
         "kritiken. C \"markant – rannsaka\": markant betyder framträdande "
         "(neutralt/positivt), och rannsaka är att undersöka noggrant — fel "
         "ton i båda. D \"träffsäkert – bekräfta\": rakt motsatt — träffsäkert "
         "är positivt, bekräfta likaså.",
         "essential"),
        ("Slutsats",
         "Endast B har konsekvent kritisk laddning i båda luckorna och "
         "beskriver hur ett oprecist begrepp används för att vifta bort "
         "åsikter. Svaret är B — \"trubbigt – avfärda\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att läsa \"avigt\" som något kritiskt och då tro att paret räcker.",
         "why_wrong": "Steg 5 visar problemet: lucka 2 \"framhäva\" är positivt laddat. Man framhäver inte åsikter man ogillar — man förkastar dem."},
        {"letter": "C",
         "why_tempting": "Första instinkten är att \"markant\" känns starkt och kritiskt — fake news ÄR ju ett markant fenomen.",
         "why_wrong": "Markant beskriver bara att något är synligt, inte att det är felaktigt. Och rannsaka är att granska noggrant — steg 3 sa att verbet skulle vifta BORT, inte undersöka."},
        {"letter": "D",
         "why_tempting": "Om du minns regeln som \"välj det positiva paret om allt annat är osäkert\" lockar D.",
         "why_wrong": "Båda leden går rakt emot meningens kritik. Forskare är ense om att begreppet är PROBLEMATISKT — träffsäkert + bekräfta gör det till en hyllning, vilket motsäger steg 2 och 3."},
    ],
    technique=(
        "Laddningstest: när satsen redan har laddade ord (\"ogillar\", "
        "\"överens om\" som kritik) måste BÅDA luckornas ord ha samma "
        "polaritet. Triggern: hitta ett ankare-ord som ger riktning, sortera "
        "alternativen efter laddning, och behåll bara paret där båda lederna "
        "går åt samma håll."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-023  | answer: B  (placebo – kvacksalveri – skörbjugg)
# Tre luckor: hur uppfattas vitaminer som harmlös X / som riskabelt Y;
# bristsjukdom Z, pellagra och beriberi.
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-023"] = E(
    solution_path=(
        "Tre luckor med medicinsk precision: lucka 1 är harmlös "
        "skenbehandling, lucka 2 är riskabel medicinsk lurendrejeri, "
        "lucka 3 är en KLASSISK vitaminbristsjukdom i sällskap med pellagra "
        "och beriberi. Endast skörbjugg är en vitaminbristsjukdom. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Läkare ser vitaminbehandling som något harmlöst i ena änden, "
         "riskabelt i andra änden. Tre luckor: lucka 1 är vad de uppfattar "
         "som harmlöst (men oseriöst), lucka 2 vad de uppfattar som farligt "
         "(och oseriöst), och lucka 3 är en konkret bristsjukdom som "
         "räknas upp med pellagra och beriberi.",
         "essential"),
        ("Lucka 3 är låst — använd den först",
         "Pellagra (B3-brist) och beriberi (B1-brist) är båda VITAMIN­"
         "bristsjukdomar. Lucka 3 måste vara en tredje vitaminbristsjukdom. "
         "Malaria är en parasitsjukdom, kolera en bakterieinfektion, skolios "
         "en ryggradskrökning. Endast SKÖRBJUGG (C-vitaminbrist) hör hemma i "
         "den listan.",
         "essential"),
        ("Lucka 1 — harmlös vad?",
         "Läkare tycker att vitaminbehandling är harmlös \"sken\"-medicin. "
         "Lucka-ordet ska beteckna något som har EFFEKT bara via tron, inte "
         "via verkligt verksamt ämne. Placebo = neutralt preparat utan "
         "verksam substans. Terapi = vilken behandling som helst (för brett). "
         "Homeopati = en specifik alternativmedicinsk metod (för smalt). "
         "Healing = handpåläggning (för smalt och magiskt).",
         "essential"),
        ("Lucka 2 — riskabel vad?",
         "Lucka 2 är negativ och starkare — riskabel oseriös behandling. "
         "Kvacksalveri = ovetenskaplig kvacksjälvad medicinsk verksamhet, "
         "ofta med ekonomiskt motiv och hälsorisk. Falskspel = fusk i spel. "
         "Lurendrejeri = bedrägeri i allmänhet (för brett, inte "
         "läkardomänen). Experimenterande = att prova sig fram (inte "
         "specifikt riskabelt).",
         "essential"),
        ("Matcha mot alternativen",
         "A \"terapi – falskspel – malaria\": terapi är för brett, "
         "falskspel hör inte hemma i medicin, malaria är ingen vitamin­"
         "bristsjukdom. B \"placebo – kvacksalveri – skörbjugg\": placebo "
         "= harmlös skenbehandling, kvacksalveri = riskabel oseriös vård, "
         "skörbjugg = C-vitaminbrist. Alla tre passar exakt. C "
         "\"homeopati – lurendrejeri – kolera\": homeopati är för smalt, "
         "kolera är bakterieinfektion. D \"healing – experimenterande – "
         "skolios\": healing är ockult, experimenterande inte riskabelt "
         "per definition, skolios saknar koppling till vitaminbrist.",
         "essential"),
        ("Slutsats",
         "Endast B har medicinsk koherens i alla tre luckor — och lucka 3 "
         "var den hårda låsningen. Svaret är B — \"placebo – kvacksalveri – "
         "skörbjugg\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Första instinkten är att \"terapi\" låter medicinskt och allmänt rätt.",
         "why_wrong": "Steg 2 låser fast lucka 3: malaria är en parasitsjukdom, inte vitaminbrist. Det räcker för att kassera hela paret oavsett hur lucka 1 låter."},
        {"letter": "C",
         "why_tempting": "Det är frestande att välja \"homeopati\" — alternativmedicin handlar ju ofta om vitaminer.",
         "why_wrong": "Kolera är en bakterieinfektion, inte en bristsjukdom (steg 2). Och homeopati är en specifik metod, inte den allmänna kategorin \"skenbehandling\" som lucka 1 vill ha."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta D när två luckor låter sannolika — och \"experimenterande\" kan låta riskabelt.",
         "why_wrong": "Skolios är en ryggradskrökning utan koppling till vitaminer (steg 2). Tre luckor måste ALLA passa — en miss räcker för att kassera."},
    ],
    technique=(
        "Fackord-precision i medicinsk MEK: hitta den HÅRDAST låsta luckan "
        "först. Här ger lucka 3 i sällskap med pellagra+beriberi bara EN "
        "möjlig kandidat (skörbjugg). Triggern: när en lucka står i en lista "
        "med två andra kända termer, behandla det som ett fackområdes­"
        "krav och eliminera direkt — resten faller på plats."
    ),
    pitfall=(
        "I tre-luckors MEK ger man sig ofta i kast med lucka 1 först, för "
        "den kommer först i meningen. Botemedlet: börja med den lucka som "
        "har EXTERNA låsningar (egennamn, fackord i lista), inte med den "
        "som råkar stå först."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-024  | answer: D  (drastiskt)
# "Lite ___ skulle man kunna säga att alla våra föreställningar om
#  mathållning är hjärnspöken."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-024"] = E(
    solution_path=(
        "\"Lite ___ skulle man kunna säga\" är en hedge: talaren signalerar "
        "att det följande är en TILLSPETSAD formulering. Adverbet måste "
        "modifiera \"säga\" i riktning mot överdrift. Drastiskt = "
        "tillspetsat, drastiskt formulerat. Svaret är D."
    ),
    steps=[
        ("Förstå meningen",
         "Tellström säger något starkt: \"alla våra föreställningar om "
         "mathållning är hjärnspöken\" (alltså inbillningar). Och han "
         "ramar in det med \"lite ___ skulle man kunna säga\" — en "
         "reservation att formuleringen är överdriven men poängen är "
         "verklig.",
         "essential"),
        ("Hitta begränsungen",
         "Hedge-formuleringen \"lite ___ skulle man kunna säga\" är ett "
         "fast mönster i svenska där adverbet beskriver formuleringens "
         "STIL: tillspetsat, hårt, överdrivet. Lucka-ordet ska kunna stå "
         "i frasen \"lite X uttryckt\" eller \"lite X formulerat\" och "
         "betyda ungefär \"överdrivet\".",
         "essential"),
        ("Vad betyder alternativen?",
         "Diskret = försiktigt, taktfullt, dämpat. Kopiöst = i stora "
         "mängder (kopiösa mängder mat). Formellt = enligt formerna, "
         "officiellt. Drastiskt = drastiskt formulerat, tillspetsat, "
         "hårt uttryckt (ofta i frasen \"lite drastiskt sagt\").",
         "detail"),
        ("Matcha mot alternativen",
         "A \"lite diskret\": diskret är försiktigt — \"alla våra "
         "föreställningar är hjärnspöken\" är raka motsatsen till "
         "försiktigt. B \"lite kopiöst\": handlar om kvantitet, inte "
         "formuleringsstil. C \"lite formellt\": formellt handlar om "
         "officiell stil, inte tillspetsning. D \"lite drastiskt\": "
         "exakt det idiomatiska uttrycket — \"lite drastiskt sagt\" "
         "förvarnar om en tillspetsad formulering.",
         "essential"),
        ("Slutsats",
         "Frasen \"lite drastiskt skulle man kunna säga\" är ett "
         "etablerat sätt att hedga en hård formulering. Svaret är D — "
         "\"drastiskt\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"lite diskret\" känns lagom och försiktigt — som det \"lite\" i meningen antyder.",
         "why_wrong": "Steg 2 låser fast riktningen: efter hedge-frasen följer en TILLSPETSNING (\"hjärnspöken\"). Diskret är raka motsatsen — försiktigt och dämpat."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"kopiöst\" passar i en mat-kontext — texten handlar ju om mathållning.",
         "why_wrong": "Kopiöst handlar om mängd, inte om hur något sägs. Steg 3 visar att adverbet ska modifiera SÄGANDET — \"säga kopiöst\" är inte svenska."},
        {"letter": "C",
         "why_tempting": "Det är frestande att läsa \"formellt\" som något akademiskt — Tellström är ju forskare.",
         "why_wrong": "Formellt handlar om officiella former, inte om tillspetsning. \"Lite formellt sagt\" skulle förvarna om byråkratiskt språk, inte om en överdrift (steg 4)."},
    ],
    technique=(
        "Idiom-strategi: vissa hedge-fraser i svenska har låsta partner­"
        "ord. \"Lite ___ sagt/uttryckt\" tar nästan alltid \"drastiskt\", "
        "\"populärt\", \"förenklat\" eller liknande markeringar av "
        "tillspetsning. Triggern: när du ser \"lite ___\" som ramar in ett "
        "starkt påstående, leta efter ordet som signalerar OVERDRIFT, inte "
        "försiktighet."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-025  | answer: D  (komponent – tillgodoräkna)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-025"] = E(
    solution_path=(
        "Lucka 1 beskriver en DEL av det livslånga lärandet, lucka 2 vad "
        "människor får göra med sin kompetens. \"Reell kompetens\" är ett "
        "etablerat begrepp som man kan TILLGODORÄKNA sig (få den räknad "
        "som studiepoäng). Svaret är D."
    ),
    steps=[
        ("Förstå meningen",
         "Idén: man ska inte behöva låna pengar för att läsa det man "
         "redan kan. Lösningen är att en DEL (lucka 1) av det livslånga "
         "lärandet handlar om att människor får GÖRA något (lucka 2) med "
         "sin redan existerande kompetens så att studietiden kortas.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Lucka 1 är ett substantiv som beskriver vad något ÄR i ett "
         "system — \"en viktig ___ i det livslånga lärandet\". Det ska "
         "beteckna en byggsten/beståndsdel i konceptet. Funktion, uppgift "
         "och komponent kan alla passa abstrakt; insikt är fel kategori.",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Verbet ska beskriva vad man GÖR med sin reella kompetens för "
         "att kunna förkorta studietiden. Kontexten \"därmed kan förkorta "
         "studietiden\" säger att verbet ska låsa upp att den redan "
         "befintliga kompetensen RÄKNAS som studieresultat — det är ett "
         "tekniskt begrepp.",
         "essential"),
        ("Vad betyder alternativen?",
         "Friskriva sig = befria sig från ansvar eller skyldighet. "
         "Medföra = ha till följd, dra med sig. Underordna sig = "
         "underkasta sig något. Tillgodoräkna sig = få något räknat som "
         "merit/poäng (etablerat högskoleterminologiskt verb: \"jag "
         "tillgodoräknar mig kursen från utlandsstudierna\").",
         "detail"),
        ("Matcha mot alternativen",
         "A \"funktion – friskriva\": friskriva sig från kompetens "
         "betyder INTE att räkna den som merit; det betyder att slippa "
         "ansvar. Fel riktning. B \"uppgift – medföra\": man \"medför\" "
         "inte kompetens — verbet handlar om att DRA MED sig en "
         "konsekvens, inte att få något räknat. C \"insikt – underordna\": "
         "insikt är fel kategori i lucka 1 (insikt är vetande, inte "
         "byggsten i ett system). Underordna sig är dessutom helt fel "
         "riktning. D \"komponent – tillgodoräkna\": komponent = "
         "byggsten i lärandesystemet, tillgodoräkna sig = etablerat verb "
         "för att få befintlig kompetens räknad som poäng. Båda exakt rätt.",
         "essential"),
        ("Slutsats",
         "\"Tillgodoräkna sig reell kompetens\" är direkt från det "
         "högskolepolitiska språket — exakt det meningen syftar på. "
         "Svaret är D — \"komponent – tillgodoräkna\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"funktion\" känns lagom abstrakt och rätt i lucka 1.",
         "why_wrong": "Steg 5 fäller paret på lucka 2: friskriva sig från kompetens betyder att avsäga sig den, inte att få den räknad. Det går rakt emot syftet (kortare studietid)."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"uppgift\" är ett vanligt politikord — det är ju en uppgift för samhället.",
         "why_wrong": "Lucka 2 spräcker paret: \"medföra kompetens\" är inte svenska i den här betydelsen. Steg 3 sa att verbet skulle låsa upp att kompetensen RÄKNAS — medföra betyder \"ha till följd\"."},
        {"letter": "C",
         "why_tempting": "Snabbsvar är ofta \"insikt\" när texten talar om lärande — det LJUDER pedagogiskt.",
         "why_wrong": "Insikt är inte en byggsten i ett system, det är ett vetande (steg 2). Och underordna sig sin kompetens är fel verb — det betyder att underkasta sig den."},
    ],
    technique=(
        "Fackord-precision: när texten rör utbildningspolitik, "
        "rättssystem eller annan domän med specifika fackuttryck — leta "
        "efter det ETABLERADE termordet, inte det generella synonymen. "
        "\"Tillgodoräkna sig\" är ett tekniskt verb från högskoleväsendet; "
        "triggern: när luckan står bredvid ett konkret område (kurser, "
        "poäng, kompetens), pröva domänens egna ord först."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-026  | answer: A  (länsa)
# Bevattningsteknik riskerar att ___ grundvattentillgångar.
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-026"] = E(
    solution_path=(
        "Verbet ska betyda att TÖMMA en vattenresurs genom uttag. Länsa "
        "betyder just att tömma vatten ur (länspumpa en båt, länsa en "
        "brunn). Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Bevattningstekniken tar ut grundvatten i stora mängder, och "
         "risken är att grundvattnet TAR SLUT om inget görs. Verbet i "
         "luckan ska beteckna att man TÖMMER vattenmagasinet.",
         "essential"),
        ("Hitta begränsningen",
         "Subjektet är \"bevattningstekniken\", objektet är \"våra "
         "grundvattentillgångar\". Verbet måste handla om VATTEN-uttag "
         "som leder till uttömning. Inte att stjäla, inte att söka "
         "efter, inte att rensa upp.",
         "essential"),
        ("Vad betyder alternativen?",
         "Länsa = tömma något på vatten (länsa en båt, länsa en sjö). "
         "Norpa = snatta, stjäla i smyg (slang/informellt). Dragga = "
         "söka i vatten med en drag (efter en kropp eller ett föremål). "
         "Muddra = rensa bottenslam ur en hamn/kanal för att öka djupet.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"länsa\": exakt rätt verb för att tömma en vattenresurs. "
         "B \"norpa\": stöld-slang, fel register och fel betydelse — "
         "bevattning är inte snatteri. C \"dragga\": handlar om att SÖKA "
         "i vatten, inte att tömma. D \"muddra\": handlar om att rensa "
         "bottenslam, inte om att tömma på vatten — muddring lämnar vattnet "
         "kvar.",
         "essential"),
        ("Slutsats",
         "\"Länsa\" är det enda verbet som specifikt betyder att tömma "
         "på vatten. Svaret är A — \"länsa\".",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är lätt att läsa \"norpa\" som något illegitimt — bevattningsindustrin tar ju olovligt vatten.",
         "why_wrong": "Steg 3 låser fast registret: norpa är slang för smattnings­stöld av småsaker. Att norpa en grundvattentillgång är inte svenska."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"dragga\" har vattenkoppling och låter aktivt.",
         "why_wrong": "Dragga betyder söka i vatten med en drag — typiskt efter ett föremål eller en drunknad. Steg 2 sa att verbet skulle TÖMMA, inte söka."},
        {"letter": "D",
         "why_tempting": "Första instinkten är att \"muddra\" passar industriellt vattenarbete.",
         "why_wrong": "Muddring rensar slam och ökar djupet — den TAR INTE BORT VATTNET. Steg 4 visar att luckan vill ha tömning av tillgången, inte rengöring av en kanal."},
    ],
    technique=(
        "Fackord-precision i vattendomänen: länsa / dragga / muddra ser "
        "alla ut som \"vattenord\" men har olika roller. Länsa = tömma "
        "vatten; dragga = söka i vatten; muddra = rensa slam under "
        "vatten. Triggern: om luckan handlar om vattnets MÄNGD ska det "
        "vara länsa, inte de andra."
    ),
    pitfall=(
        "När flera alternativ är ovanliga ord från samma domän lockar "
        "varje av dem för att det LÅTER specialiserat. Botemedlet: skriv "
        "ner vad varje verb gör med vattnet (tar bort? söker i? rensar?) "
        "och kontrollera mot meningens objekt."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-027  | answer: A  (ovillkorligen – gestaltningen)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-027"] = E(
    solution_path=(
        "Lucka 1 är ett adverb om att Birgit Nilsson ALLTID måste nämnas; "
        "lucka 2 är vad Nina Stemme bygger på teknisk grund — det "
        "konstnärliga UTTRYCKET i sång och rollporträtt. Ovillkorligen "
        "(utan undantag) + gestaltningen (rolltolkningen). Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Nina Stemme jämförs med Birgit Nilsson, och en parentes säger "
         "att Nilsson \"___ måste nämnas så fort en svensk sopran visar "
         "framfötterna\". Sedan: Stemmes konstnärliga ___ vilar på en "
         "gedigen teknisk grund. Lucka 1 är ett adverb som styrker "
         "obligatoriet, lucka 2 ett substantiv för det konstnärliga som "
         "byggs.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Frasen \"___ måste nämnas så fort\" har en låst betydelse: helt "
         "och hållet, utan undantag. Lucka-ordet ska förstärka MÅSTET, "
         "inte beteckna säkerhet, fysiskt grepp eller verbalt formulerande.",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Vad bygger en operasångerska på sin tekniska grund? Inte "
         "stilistik (det är litteraturkritikens ord), inte inramning "
         "(det är scenografi/yttre), inte sinnebild (sinnebild = symbol/"
         "förebild — fel ord). Operans konstnärliga gren är "
         "GESTALTNINGEN: hur sångerskan tolkar och förkroppsligar rollen.",
         "essential"),
        ("Vad betyder alternativen?",
         "Ovillkorligen = utan undantag, ovillkorligt. Säkerligen = "
         "förmodligen, troligen. Handgripligen = handfast, konkret (med "
         "händerna). Uttryckligen = explicit, i klartext. Gestaltning = "
         "konstnärlig tolkning/rollporträtt. Stilistik = läran om stil i "
         "språk/text. Inramning = den yttre omgivningen kring något. "
         "Sinnebild = symbol, fullkomlig representation.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"ovillkorligen – gestaltningen\": ovillkorligen = utan "
         "undantag (passar \"så fort\"-fraseringen); gestaltning = "
         "operans konstnärliga tolkning. Båda landar. B \"säkerligen – "
         "stilistiken\": säkerligen betyder \"förmodligen\" — för svagt "
         "för obligatoriet \"måste\". Och stilistik hör hemma i "
         "litteraturanalys, inte operasång. C \"handgripligen – "
         "inramningen\": handgripligen betyder med händerna/konkret — "
         "fel adverb för verbalt nämnande. D \"uttryckligen – sinnebilden\": "
         "uttryckligen handlar om hur man säger något (explicit), inte om "
         "att det MÅSTE sägas. Sinnebild = symbol, inte konstnärlig "
         "tolkning.",
         "essential"),
        ("Slutsats",
         "Endast A låser BÅDA luckorna: ovillkorlig nämningsregel + "
         "rolltolkning byggd på teknik. Svaret är A — \"ovillkorligen – "
         "gestaltningen\".",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är frestande att läsa \"säkerligen\" som synonym till \"ovillkorligen\" — båda låter självsäkra.",
         "why_wrong": "Säkerligen betyder \"förmodligen/troligen\" (ganska säkert) — inte \"utan undantag\". Steg 2 sa att luckan skulle förstärka MÅSTET; säkerligen försvagar det."},
        {"letter": "C",
         "why_tempting": "Vänster-till-höger-läsning ger känslan att \"handgripligen\" är ett kraftfullt adverb.",
         "why_wrong": "Handgripligen betyder med händerna eller mycket konkret. Steg 4 visar att det inte passar verbet \"nämnas\" — man nämner inte handgripligen."},
        {"letter": "D",
         "why_tempting": "Många stannar vid att \"uttryckligen\" känns precist och formellt rätt.",
         "why_wrong": "Uttryckligen handlar om HUR något sägs (explicit), inte om att det måste sägas. Steg 3 visar dessutom att sinnebild är fel — det betyder symbol, inte rolltolkning."},
    ],
    technique=(
        "Tvålucksregeln med ankare i fackdomän: hitta den lucka som har "
        "EN domänspecifik bästkandidat och låsa den först. Gestaltning är "
        "opera-fackspråk; det räcker för att se att A är paret. Triggern: "
        "när en lucka rör konst/musik/scenkonst, leta efter ordet som "
        "BÄST hör hemma i den världen — inte det som låter mest formellt."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-028  | answer: A  (folkfester – besinning – dragning till)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-028"] = E(
    solution_path=(
        "Konflikten är mellan prästerskapets allvar och allmogens fest. "
        "Lucka 1 är vad striden gäller (folkfester), lucka 2 är vad "
        "präster predikar (besinning), lucka 3 är allmogens attityd till "
        "fylleri (dragning till). Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Tre luckor i en motsatskonstruktion: prästerskapet förordar "
         "X, allmogen förordar motsatsen. Lucka 1 är striden­s ARENA "
         "(årstidsväxlingarnas ___). Lucka 2 är vad prästerna predikar "
         "(allvar och ___). Lucka 3 är allmogens FÖRHÅLLANDE till "
         "\"fylleri och spektakel\".",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Striden gäller vad årstidsväxlingarna ska VARA. Eftersom "
         "lucka 3 säger att allmogen vill ha \"fylleri och spektakel\" och "
         "prästerna allvar, måste arenan vara något som kan FYLLAS med "
         "antingen fest eller andakt. Folkfester, ritualer, ceremonier "
         "och högtider är alla möjliga kandidater — vilken passar "
         "specifikt det folkliga firandet?",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Prästerna predikar \"allvar och ___\". Lucka-ordet ska vara "
         "synonymt med allvar/självkontroll, kompletera det i samma "
         "register. Besinning = lugn eftertanke, självbehärskning. "
         "Gudsfruktan = fruktan inför Gud. Onykterhet = motsatsen "
         "(fel ord!). Bibelcitat = citat ur Bibeln (för konkret).",
         "essential"),
        ("Hitta begränsningen i lucka 3",
         "Allmogen ställs MOT prästerna. De vill ha fylleri och "
         "spektakel — så lucka 3 ska beskriva ATTRAKTION mot dessa. "
         "Dragning till = lockas av. Undvikande av = går runt (raka "
         "motsatsen!). Förkärlek för = gillar särskilt. Motstånd mot = "
         "motsätter sig (raka motsatsen!).",
         "essential"),
        ("Matcha mot alternativen",
         "A \"folkfester – besinning – dragning till\": striden om "
         "folkfester (rätt arena för fest), prästerna predikar allvar + "
         "besinning, allmogen DRAS till fylleri. Alla tre matchar. "
         "B \"ritualer – gudsfruktan – undvikande av\": ritualer är "
         "smalt religiöst, undvikande av motsäger meningen — allmogen "
         "vill ju ha fyller. C \"ceremonier – onykterhet – förkärlek "
         "för\": ONYKTERHET är vad allmogen står för, inte vad prästerna "
         "predikar — motsägelse! D \"högtider – bibelcitat – motstånd "
         "mot\": motstånd mot fylleri är prästernas position, inte "
         "allmogens. Hela kontrasten kollapsar.",
         "essential"),
        ("Slutsats",
         "A är det enda alternativ där prästerna och allmogen står på "
         "rätt sida av samtliga tre luckor. Svaret är A — \"folkfester – "
         "besinning – dragning till\".",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är lätt att \"gudsfruktan\" känns kyrkligt rätt — präster predikar ju om Gud.",
         "why_wrong": "Lucka 3 spräcker paret: \"undvikande av fylleri\" är prästernas linje, inte allmogens. Steg 4 låste fast att lucka 3 ska beskriva ATTRAKTION."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"ceremonier\" känns lagom religiöst och historiskt rätt för 1500-talets kyrka.",
         "why_wrong": "Steg 3 visar fellet: onykterhet är vad allmogen står för, inte vad prästerna predikar i samma andetag som ALLVAR. Hela motsatskonstruktionen krockar."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"högtider\" eftersom årstidsväxlingar associeras med högtider — och bibelcitat är prästspråk.",
         "why_wrong": "Lucka 3 sätter allmogen i MOTSTÅND mot fylleri — men meningen säger ju att allmogen ÄLSKAR fylleri. Steg 4 låser fast riktningen: dragning, inte motstånd."},
    ],
    technique=(
        "Laddningstest med polerna givna: när texten har en uttalad "
        "konflikt (\"krockade med\") måste två luckor på OLIKA sidor ha "
        "MOTSATTA laddningar, och en tredje måste matcha sin sidas linje. "
        "Triggern: rita upp polerna (här: präster ↔ allmoge) och pricka "
        "in varje lucka på rätt sida innan du jämför."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-029  | answer: B  (blidka)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-029"] = E(
    solution_path=(
        "Hollande drog tillbaka kritiserade förslag för att LUGNA arga "
        "demonstranter. Verbet ska betyda att stilla någons vrede genom "
        "eftergifter. Blidka = blidka någon, mildra någons vrede genom "
        "att ge efter. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Hundratusentals ungdomar demonstrerar. För att STILLA dem drar "
         "presidenten tillbaka förslag. Verbet i luckan ska beskriva vad "
         "Hollande försöker göra med demonstranterna: lugna ner deras "
         "vrede genom att ge efter.",
         "essential"),
        ("Hitta begränsningen",
         "Objektet är DEMONSTRANTERNA — människor som är arga. Verbet "
         "ska beteckna att göra någons VREDE mildare, ofta genom "
         "eftergifter. Inte att kompromissa generellt (jämka), inte att "
         "göra något i sig mindre intensivt (mildra), inte att "
         "uppmuntra (sporra).",
         "essential"),
        ("Vad betyder alternativen?",
         "Jämka = kompromissa, mötas på halva vägen (\"jämka samman två "
         "förslag\"). Blidka = lugna någons vrede, mildra någons "
         "missnöje genom att ge efter (\"blidka gudarna\", \"blidka en "
         "arg kund\"). Mildra = göra något mindre intensivt (\"mildra "
         "smärtan\", \"mildra kritiken\") — INTE personer. Sporra = "
         "egga, uppmuntra (motsatsen!).",
         "detail"),
        ("Matcha mot alternativen",
         "A \"jämka\": man jämkar förslag/intressen, inte människor. "
         "Hollande jämkade förslagen, men det är inte vad han gjorde med "
         "DEMONSTRANTERNA. B \"blidka\": exakt rätt — verbet tar en "
         "person/grupp som objekt och betyder att lugna deras vrede. "
         "C \"mildra\": man mildrar abstrakta saker (smärta, kritik), "
         "inte människor som agenter. \"Mildra demonstranterna\" är inte "
         "idiomatisk svenska. D \"sporra\": rakt motsatt — sporra "
         "betyder att egga på och elda upp.",
         "essential"),
        ("Slutsats",
         "Endast \"blidka\" är verbet vars idiomatiska konstruktion tar "
         "en arg grupp som objekt och beskriver att lugna deras vrede "
         "genom eftergifter. Svaret är B — \"blidka\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att tänka \"jämka\" när det handlar om kompromisser — Hollande gör ju eftergifter.",
         "why_wrong": "Steg 3 visar att jämka tar abstrakta objekt: man jämkar FÖRSLAG, inte demonstranter. Verbet handlar om att mötas, inte om att lugna någons vrede."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"mildra\" känns lagom och stämmer med eftergifterna.",
         "why_wrong": "Mildra tar abstrakta objekt (mildra straffet, mildra smärtan). Steg 4 låser fast att man inte \"mildrar demonstranter\" — det är inte idiomatisk svenska."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"sporra\" om man bara läser första halvan av meningen — Hollande agerar ju mot demonstranterna.",
         "why_wrong": "Sporra betyder egga PÅ. Steg 2 låste fast att verbet ska minska vreden, inte öka aktiviteten. Och meningen säger att det INTE räckte — alltså försökte han stilla, inte elda upp."},
    ],
    technique=(
        "Kollokationsregeln: vilket OBJEKT tar verbet vanligen? Blidka "
        "tar arga personer/gudar; jämka tar förslag/intressen; mildra tar "
        "smärta/straff/kritik. Triggern: när luckan har ett tydligt "
        "personligt objekt (här: demonstranterna), välj verbet som "
        "idiomatiskt tar PERSONER som objekt."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb1-MEK-030  | answer: A  (sinnrikt – intervaller)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb1-MEK-030"] = E(
    solution_path=(
        "Nabatéerna byggde ett SMART vattensystem, eftersom regnet "
        "kommer med oregelbundna TIDSAVSTÅND. Sinnrikt = "
        "uppfinningsrikt smart; intervaller = tidsavstånd mellan "
        "händelser. Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Nabatéerna i Petra hade ett vattensystem som fångade upp "
         "regnvatten. Lucka 1 är ett adjektiv om systemet, lucka 2 ett "
         "substantiv om hur regnet KOMMER med oregelbundna ___. "
         "Tidsförhållande i lucka 2 är låst av \"oregelbundna\" + "
         "\"faller\".",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Regn FALLER med oregelbundna ___. Vad är det som är "
         "oregelbundet i regnfall? TIDSAVSTÅNDEN mellan regnen. "
         "Intervaller = tidsmellanrum. Perioder = tidssträckor (lite "
         "oprecist här, oftare längre stunder). Kvantiteter = mängder "
         "(fel kategori — handlar om mängd, inte tid). Mönster = "
         "regelbundna upprepningar (motsatsen till oregelbundet!).",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Systemet \"gjorde att de kunde samla in det regnvatten\". "
         "Lucka 1 ska beskriva ett vattensystem som klarar UTMANINGEN att "
         "regnet kommer oregelbundet — alltså ett SMART, "
         "uppfinningsrikt system. Sinnrikt, formidabelt, utstakat och "
         "avancerat är alla potentiella positiva ord.",
         "essential"),
        ("Vad betyder alternativen?",
         "Sinnrikt = uppfinningsrikt, smart konstruerat (positivt om "
         "kreativ design). Formidabelt = imponerande stort/mäktigt "
         "(fokus på storlek, inte smarthet). Utstakat = utlagt enligt "
         "plan, utritat. Avancerat = tekniskt utvecklat. Intervaller = "
         "tidsmellanrum. Perioder = tidsperioder. Kvantiteter = "
         "mängder. Mönster = återkommande form.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"sinnrikt – intervaller\": sinnrikt = smart designat, "
         "intervaller = oregelbundna tidsmellanrum. Båda passar exakt. "
         "B \"formidabelt – perioder\": formidabelt fokuserar på storlek/"
         "imponerande, inte på smart design för att hantera "
         "oregelbundenhet. Perioder är möjligt men trubbigare än "
         "intervaller. C \"utstakat – kvantiteter\": kvantiteter handlar "
         "om MÄNGD, inte om TIDSAVSTÅND. Och utstakat handlar om plan, "
         "inte smarthet. D \"avancerat – mönster\": MÖNSTER är "
         "regelbunden upprepning — motsäger direkt \"oregelbundna\".",
         "essential"),
        ("Slutsats",
         "Lucka 2 är hårdast låst: \"oregelbundna intervaller\" är den "
         "exakta kollokationen. Sinnrikt fångar dessutom precis det "
         "smartheten i att kunna fånga oregelbundet regn. Svaret är A — "
         "\"sinnrikt – intervaller\".",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är lätt att \"formidabelt\" känns starkt och imponerande — Petras vattensystem ÄR imponerande.",
         "why_wrong": "Formidabelt handlar om STORLEK/imponerande omfång, inte om SMART design för att hantera oregelbundenhet. Steg 3 låste fast att lucka 1 ska beskriva systemets smarthet."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"kvantiteter\" känns mätbart och tekniskt rätt.",
         "why_wrong": "Steg 2 visar problemet: kvantiteter handlar om MÄNGD vatten, inte om TIDSAVSTÅND. Och kontexten \"med oregelbundna ___ faller\" syftar på när regnet kommer, inte hur mycket."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"avancerat\" eftersom det känns modernt och smart.",
         "why_wrong": "Lucka 2 spräcker D direkt: \"oregelbundna mönster\" är en självmotsägelse — mönster är per definition regelbundna. Steg 5 fångar det."},
    ],
    technique=(
        "Kollokationsregeln: \"oregelbundna intervaller\" är en fast "
        "fras i svenska om TIDSMELLANRUM mellan händelser. Triggern: när "
        "luckan står efter en kvalifierare som specificerar TID "
        "(oregelbundna, jämna, regelbundna), välj ordet vars idiomatiska "
        "partner är just det adjektivet."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-021  | answer: D  (flora – tillgänglig)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-021"] = E(
    solution_path=(
        "Lucka 1 beskriver mängden av mikroorganismer som finns "
        "naturligt; lucka 2 var de finns naturligt. Flora är det "
        "etablerade ordet för en samling av mikroorganismer (\"tarmflora\", "
        "\"bakterieflora\"); tillgänglig = som finns att tillgå. Svaret är D."
    ),
    steps=[
        ("Förstå meningen",
         "Forntida människor använde mikroorganismer som FANNS SPONTANT. "
         "Lucka 1 är ett substantiv för \"mängden/uppsättningen av "
         "mikroorganismer\", lucka 2 är ett adjektiv om var/hur de "
         "finns: \"som spontant fanns ___\".",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Lucka 1 ska beteckna en NATURLIG samling av mikroorganismer "
         "som finns på/i en plats. Uppsjö = stor mängd (men neutralt om "
         "vad). Odling = något människor aktivt odlar (motsäger "
         "\"spontant\"!). Kaskad = forsande flöde. Flora = den "
         "biologiska samlingen av organismer i en miljö — exakt rätt "
         "fackord för mikroorganismsamhällen.",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Mikroorganismerna fanns \"spontant ___\" — alltså naturligt på "
         "plats. Adjektivet ska betyda \"finns att använda\" eller "
         "\"på plats\". Aktuell = som är relevant just nu (fel — det "
         "handlar inte om aktualitet utan om tillgänglighet). "
         "Befintlig = som existerar (möjligt men trögt). Upptänklig = "
         "som man kan tänka sig (för abstrakt). Tillgänglig = som finns "
         "att tillgå.",
         "essential"),
        ("Vad betyder alternativen?",
         "Uppsjö – aktuell: stor mängd / aktuell. Odling – befintlig: "
         "odling / existerande (men odling motsäger \"spontant\"). "
         "Kaskad – upptänklig: forsande flöde / tänkbar. Flora – "
         "tillgänglig: biologisk samling / som finns att tillgå.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"uppsjö – aktuell\": uppsjö är kvantitet, inte typ av "
         "samling; aktuell handlar om tid, inte om tillgänglighet. "
         "B \"odling – befintlig\": ODLING motsäger \"spontant fanns\" "
         "— odling kräver aktiv mänsklig handling. C \"kaskad – "
         "upptänklig\": kaskad är fel kategori (forsande flöde, inte "
         "biologisk samling); upptänklig är för abstrakt. D \"flora – "
         "tillgänglig\": flora = etablerat ord för mikroorganism­"
         "samhälle, tillgänglig = som finns att använda. Båda exakt.",
         "essential"),
        ("Slutsats",
         "\"Flora\" är fackordet för en spontan mikroorganism­"
         "uppsättning, och \"tillgänglig\" beskriver att den var där att "
         "ta. Svaret är D — \"flora – tillgänglig\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"uppsjö\" känns rätt eftersom mängden mikroorganismer är stor.",
         "why_wrong": "Uppsjö är ett kvantitetsord (\"en uppsjö av problem\") — det säger inte att samlingen är biologisk. Och \"aktuell\" handlar om tid, inte om att finnas på plats (steg 3)."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"odling\" passar microbiologiska processer — surkål är ju odlat.",
         "why_wrong": "Steg 2 fäller paret direkt: meningen säger SPONTANT FANNS. Odling kräver att människor aktivt odlar — exakt motsatt riktning."},
        {"letter": "C",
         "why_tempting": "Första instinkten kan vara att \"kaskad\" låter dynamiskt och biologiskt.",
         "why_wrong": "Kaskad är ett vattenord för forsande flöde — fel bild för en stationär samling av mikrober (steg 4). Och upptänklig handlar om tänkbarhet, inte om verklig närvaro."},
    ],
    technique=(
        "Fackord-precision i biologi: när texten rör mikrobiologi finns "
        "ETT etablerat ord (flora) för organismsamhället i en miljö. "
        "Triggern: hör efter om luckan rör en domän med eget fackvokabulär "
        "— då vinner fackordet över de allmänna kvantitetsorden."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-022  | answer: A  (förenligt)
# "...om det är ___ med en god och säker vård."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-022"] = E(
    solution_path=(
        "Frasen \"___ med en god och säker vård\" kräver ett adjektiv "
        "som tar prepositionen \"med\" och betyder att två saker går "
        "ihop. Förenligt med = som går att kombinera med, som inte "
        "strider emot. Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Vårdpersonal följer lag och får överlåta arbete OM det går "
         "ihop med god vård. Luckan står i frasen \"___ med en god och "
         "säker vård\" och ska betyda \"i samklang med\" / \"som inte "
         "strider emot\".",
         "essential"),
        ("Hitta begränsningen",
         "Adjektivet styr prepositionen MED. Det ska betyda att "
         "överlåtelsen är KOMPATIBEL med god och säker vård. Inte att "
         "den är gångbar (möjlig generellt), inte att den införlivats "
         "(integrerats), inte att den är hanterbar (möjlig att hantera) "
         "— utan att den HARMONIERAR.",
         "essential"),
        ("Vad betyder alternativen?",
         "Förenligt med = som går att förena med, som inte strider "
         "emot (juridiskt/formellt). Gångbart = som fungerar i praktiken, "
         "som duger. Införlivat = inkorporerat, gjord till en del av. "
         "Hanterbart = som går att hantera/sköta.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"förenligt\": förenligt MED är den exakta juridiska "
         "kollokationen för \"strider inte mot\" — \"förenligt med "
         "lagen\", \"förenligt med god sed\". B \"gångbart\": gångbart "
         "tar inte prepositionen MED idiomatiskt (\"gångbart i\", "
         "\"gångbart bland\"). C \"införlivat\": införlivat med betyder "
         "\"gjord till en del av\" — fel betydelse; överlåtelsen INGÅR "
         "inte i vården, den ska bara inte stå i strid med den. "
         "D \"hanterbart\": hanterbart MED är inte idiomatiskt; "
         "hanterbart står ensamt eller med \"för\" (hanterbart för "
         "sköterskan).",
         "essential"),
        ("Slutsats",
         "\"Förenligt med\" är den fasta juridiska konstruktionen för "
         "att två handlingar inte ska kollidera. Svaret är A — "
         "\"förenligt\".",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är lätt att \"gångbart\" känns lagom och praktiskt — vården ska ju fungera.",
         "why_wrong": "Steg 4 visar problemet: gångbart kollokerar inte med \"med\" i den här betydelsen. Och betydelsen är \"praktiskt fungerande\", inte \"i samklang med\"."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"införlivat\" låter formellt och juridiskt.",
         "why_wrong": "Införlivat med betyder \"gjort till en del av\" (Sverige införlivades med Norge). Steg 4 visar att överlåtelsen inte ska INGÅ i vården utan inte STRIDA mot den."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"hanterbart\" — det LJUDER praktiskt och rätt för en arbetssituation.",
         "why_wrong": "Hanterbart MED är inte en svensk konstruktion. Hanterbart står ensamt eller med \"för\" — steg 4 låser fast att luckan måste kunna ta MED."},
    ],
    technique=(
        "Kollokationsregeln med preposition som ankare: när luckan följs "
        "av en specifik preposition (här MED) duger bara adjektiv som "
        "idiomatiskt tar just den prepositionen. Triggern: om du "
        "tvekar mellan synonymer, testa konstruktionen \"X med ...\" och "
        "kasta de som inte hörs naturliga."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-023  | answer: D  (uppträda – framhöll – slutsatser)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-023"] = E(
    solution_path=(
        "Sokrates VÄGRADE framstå som allkunnig, BETONADE att han "
        "saknade kunskap och IFRÅGASATTE sina egna SLUTSATSER. Tre "
        "luckor med klassiska Sokrates-verb. Uppträda som = framstå "
        "som; framhöll = betonade. Svaret är D."
    ),
    steps=[
        ("Förstå meningen",
         "Tre luckor om Sokrates filosofiska metod: lucka 1 är vad han "
         "VÄGRADE göra (framstå som allkunnig), lucka 2 är vad han "
         "OFTA gjorde (betonade sin egen okunnighet), lucka 3 är vad "
         "han ifrågasatte hos sig själv.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Sokrates vägrade ___ \"som allkunnig eller lärare\". Konstruktionen "
         "är \"___ som X\" där X är en roll. Biträda = bistå (tar inte "
         "\"som\"). Tillträda = ta i besittning (en post). Framträda "
         "= visa sig offentligt (möjligt). Uppträda som = framstå "
         "som, agera i rollen av (\"uppträda som expert\").",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Han \"___ ofta att han saknade kunskap\". Verbet styr att-sats "
         "och ska betyda BETONA / UNDERSTRYKA. Påstod = hävdade (möjligt "
         "men neutralt). Fruktade = var rädd för (helt fel betydelse). "
         "Insåg = kom till insikt om (passar inte med OFTA — man inser "
         "engångar). Framhöll = betonade gång på gång (passar perfekt "
         "med OFTA).",
         "essential"),
        ("Hitta begränsningen i lucka 3",
         "Han \"ifrågasatte ständigt sina egna ___\". Vad ifrågasätter "
         "en filosof hos sig själv? Inte tillgångar (det är förmögenhet/"
         "resurser). Inte fördomar (visserligen ifrågasätter man "
         "fördomar — men Sokrates kände sig inte fördomsfull, han "
         "ifrågasatte sina SLUTSATSER). Inte baktankar (fel betydelse: "
         "dolda motiv). Slutsatser = de resultat man kommer fram till.",
         "essential"),
        ("Matcha mot alternativen",
         "A \"biträda – påstod – tillgångar\": biträda tar inte \"som\"; "
         "tillgångar är fel kategori för en filosof. B \"tillträda – "
         "fruktade – fördomar\": tillträda som lärare betyder \"ta över "
         "rollen\"; fruktade är helt fel betydelse (han fruktade inte, "
         "han BETONADE okunnigheten). C \"framträda – insåg – "
         "baktankar\": framträda kan funka i lucka 1; insåg passar inte "
         "med OFTA (insikt sker en gång); baktankar = dolda motiv, fel. "
         "D \"uppträda – framhöll – slutsatser\": uppträda som = "
         "framstå som; framhöll ofta = betonade gång på gång; sina egna "
         "slutsatser = de resonemangs­resultat han kom fram till. Alla "
         "tre passar.",
         "essential"),
        ("Slutsats",
         "Endast D låser alla tre luckorna i rätt filosofisk dom: "
         "uppträda som / framhöll / slutsatser. Svaret är D.",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"påstod\" känns neutralt och rätt för någon som ofta säger något.",
         "why_wrong": "Lucka 1 fäller paret: biträda betyder bistå/assistera och tar inte konstruktionen \"som allkunnig\". Steg 2 låser fast att lucka 1 kräver ett verb som idiomatiskt tar SOM + roll."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"tillträda som lärare\" är ett vanligt uttryck — man tillträder en tjänst.",
         "why_wrong": "Tillträda betyder \"ta över\" en post. Sokrates vägrade INTE att tillträda en lärartjänst — han vägrade att FRAMSTÅ som lärare. Och lucka 2 (fruktade) är direkt fel betydelse (steg 3)."},
        {"letter": "C",
         "why_tempting": "Det är frestande att \"framträda\" känns lagom — Sokrates framträdde ju i Aten.",
         "why_wrong": "Lucka 2 fäller paret: \"insåg ofta\" är inte idiomatisk svenska — insikter är engångshändelser. Steg 3 sa att verbet skulle betyda BETONA, vilket framhöll gör och insåg inte."},
    ],
    technique=(
        "Tvålucksregeln med tidsadverb som ankare: i lucka 2 ger ordet "
        "OFTA en stark låsning. Verbet måste kunna upprepas — insåg och "
        "fruktade passar inte; framhöll och påstod gör det. Triggern: "
        "leta efter tidsadverb (ofta, sällan, alltid) som diskriminerar "
        "engångshändelser från upprepade handlingar."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-024  | answer: C  (tilliten – korrelerar)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-024"] = E(
    solution_path=(
        "Studier visar att FÖRTROENDE mellan medborgare HÄNGER IHOP med "
        "förtroende för politiker. Tilliten är förtroende; korrelerar = "
        "samvarierar. Svaret är C."
    ),
    steps=[
        ("Förstå meningen",
         "Forskningsspråk: studier visar att två saker hör ihop. Lucka 1 "
         "är vad medborgare HAR till varandra; lucka 2 är hur det "
         "förhåller sig till förtroendet för politiker. Lucka 2 ska "
         "vara ett statistiskt-relationsverb.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Lucka 1 står mellan \"medborgare\" — \"___ mellan medborgare\". "
         "Vänskapen är möjligt men för smalt (alla medborgare är inte "
         "vänner). Misstron är negativt — men kontexten är neutralt "
         "deskriptiv. Tilliten är det fackmässiga sociologiska begreppet "
         "för \"social tillit\" mellan medborgare. Sambanden är "
         "grammatiskt udda — det är ju samband man undersöker, inte "
         "\"samband mellan medborgare\".",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Studier som visar att två saker HÄNGER IHOP använder verbet "
         "KORRELERAR (samvarierar statistiskt). Koordinerar = samordnar "
         "(handling, inte relation). Kompletterar = fyller ut, är "
         "komplement till. Korrelerar = samvarierar statistiskt. "
         "Kontrasterar = står i kontrast mot (motsatsen).",
         "essential"),
        ("Matcha mot alternativen",
         "A \"vänskapen – koordinerar\": vänskap är för smalt (inte "
         "alla medborgare är vänner), och koordinerar är ett "
         "handlingsverb, inte ett relationsverb. B \"misstron – "
         "kompletterar\": misstro mellan medborgare KOMPLETTERAR "
         "förtroende för politiker — det betyder att de tillsammans "
         "FYLLER UT en helhet, men det säger inget om samvariation. "
         "Och misstro är negativt laddat utan kontextstöd. C \"tilliten "
         "– korrelerar\": tilliten är det sociologiska fackbegreppet, "
         "korrelerar är det statistiska verbet — exakt rätt par för "
         "forskningsspråk. D \"sambanden – kontrasterar\": \"sambanden "
         "mellan medborgare\" är grammatiskt udda, och kontrasterar är "
         "motsatsen (de står i kontrast mot).",
         "essential"),
        ("Slutsats",
         "I forskningsspråk är paret \"social tillit korrelerar med "
         "institutionell tillit\" en återkommande klassiker. Svaret är "
         "C — \"tilliten – korrelerar\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"vänskapen\" känns mjukt och rätt för \"mellan medborgare\".",
         "why_wrong": "Steg 2 fäller det: alla medborgare är inte vänner, sociologi pratar om TILLIT, inte vänskap. Och koordinerar är ett handlingsverb (man koordinerar möten), inte ett samvariationsverb (steg 3)."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"misstron kompletterar förtroendet\" låter logiskt — motsatsen kompletterar.",
         "why_wrong": "Kompletterar betyder \"fyller ut till en helhet\" (steg 3) — det säger inte att två storheter SAMVARIERAR. Studier visar samvariation, inte komplementaritet."},
        {"letter": "D",
         "why_tempting": "Första instinkten kan vara att \"sambanden\" passar i forskningsspråk — man undersöker samband.",
         "why_wrong": "Lucka 1 spräcker paret: \"sambanden mellan medborgare\" är grammatiskt udda (vilka samband?). Och kontrasterar betyder STÅ I KONTRAST — motsatsen till att hänga ihop (steg 4)."},
    ],
    technique=(
        "Fackord-precision i forskningsspråk: studier som visar att "
        "saker HÄNGER IHOP använder verbet KORRELERAR. Triggern: när "
        "meningen börjar med \"studier visar / forskning visar\" och "
        "lucka 2 är ett verb för relationen mellan två variabler, välj "
        "korrelerar framför handlingsverben (koordinerar, kompletterar)."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-025  | answer: B  (härrör)
# "Ordet ___ från myten om..."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-025"] = E(
    solution_path=(
        "Etymologisk konstruktion: \"Ordet ___ från myten om...\" — "
        "verbet ska betyda \"har sitt ursprung i\". Härrör från = "
        "stammar från, har sitt ursprung i. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Texten förklarar att ordet NARCISSISM kommer från myten om "
         "Narkissos. Verbet ska beteckna ORDETS URSPRUNG — alltså att "
         "ett begrepp har sin källa någonstans. Konstruktionen är \"___ "
         "från\".",
         "essential"),
        ("Hitta begränsningen",
         "Verbet ska betyda \"har sitt ursprung i\" och styra "
         "prepositionen FRÅN. Erhålls (= får man) — fel; ord får man "
         "inte. Härrör (= stammar) — exakt rätt etymologi-verb. "
         "Betingas (= förorsakas) — kausalt, inte etymologiskt. "
         "Uppstiger (= stiger upp) — fysisk rörelse, inte etymologi.",
         "essential"),
        ("Vad betyder alternativen?",
         "Erhålls = mottas, ges (passivt: man erhåller ett pris). "
         "Härrör = härstammar, har sitt ursprung (\"namnet härrör från "
         "1500-talet\"). Betingas = är beroende av, orsakas av "
         "(\"effekten betingas av temperaturen\"). Uppstiger = stiger "
         "uppåt fysiskt (\"röken uppstiger\").",
         "detail"),
        ("Matcha mot alternativen",
         "A \"erhålls\": man erhåller priser eller besked, inte ords "
         "ursprung. Ordet erhålls FRÅN myten är inte idiomatiskt. "
         "B \"härrör\": exakt det etymologiska verbet — \"härrör från\" "
         "är fast kollokation för ords ursprung. C \"betingas\": kausalt "
         "samband — ordets EXISTENS betingas inte av myten; ordets "
         "URSPRUNG hittas i myten. Fel betydelse. D \"uppstiger\": "
         "fysisk uppåtrörelse — ord stiger inte upp ur myter.",
         "essential"),
        ("Slutsats",
         "\"Härrör från\" är den fasta frasen för etymologiskt ursprung. "
         "Svaret är B — \"härrör\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"erhålls\" känns formellt och passivt rätt — \"ordet erhålls från grekiskan\".",
         "why_wrong": "Erhållas tar mottagare som subjekt: man erhåller pris/besked. Steg 2 visar att ord inte ERHÅLLAS från myter — de HÄRSTAMMAR från dem."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"betingas\" känns akademiskt rätt — psykoanalytisk text kan locka tekniska ord.",
         "why_wrong": "Betingas är kausalt: \"effekten betingas AV temperaturen\". Steg 3 visar att betingelse handlar om beroende, inte om ursprung — \"betingas FRÅN\" är inte ens grammatiskt rätt."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"uppstiger\" om man läser metaforiskt — ord stiger upp ur mytologin.",
         "why_wrong": "Uppstiger är fysisk uppåtrörelse (rök, ångor). Steg 4 visar att verbet inte används om ords etymologi — det är ett rörelseverb, inte ett ursprungsverb."},
    ],
    technique=(
        "Idiom-strategi i etymologi: när texten förklarar var ett ORD "
        "kommer ifrån, är \"härrör från\" den fasta kollokationen. "
        "Triggern: om luckan är ett verb i en mening som förklarar ords "
        "URSPRUNG och styr prepositionen FRÅN, välj härrör utan att tveka."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-026  | answer: A  (oväntad – marginella)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-026"] = E(
    solution_path=(
        "Pointen är OFÖRUTSÄGBARHET: forskningsresultat kan få ___ "
        "användning, och de viktigaste är ofta de som idag ter sig ___. "
        "Båda luckorna måste landa i \"överraskning\" — oväntad "
        "användning kan komma från resultat som ter sig marginella. "
        "Svaret är A."
    ),
    steps=[
        ("Förstå meningen",
         "Två meningar som ramar in samma poäng: forskning är oförut­"
         "sägbar. Lucka 1 är ett adjektiv om hur ANVÄNDNINGEN blir; "
         "lucka 2 är ett adjektiv om hur de viktiga resultaten TER SIG "
         "I DAG. Logiken: viktiga framtida resultat ser idag "
         "OBETYDLIGA / oviktiga ut.",
         "essential"),
        ("Hitta begränsningen i båda luckor",
         "Lucka 1 ska beteckna att användningen är ÖVERRASKANDE / "
         "oförutsedd (eftersom \"vi kan inte i förväg veta\"). Lucka 2 "
         "ska beteckna att resultaten i dag TER SIG OVIKTIGA (eftersom "
         "de blir betydelsefulla I FRAMTIDEN). Båda luckor är "
         "oförutsägbarhets-ord, sett från olika tidsperspektiv.",
         "essential"),
        ("Vad betyder alternativen?",
         "Oväntad = inte förväntad. Allmän = generell, utbredd. "
         "Begränsad = inskränkt, smal. Experimentell = på försöksstadiet. "
         "Marginella = obetydliga, perifera. Fruktbara = produktiva, "
         "som ger god avkastning. Vilseledande = som leder fel. "
         "Förutseende = förutseende, klarsynt.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"oväntad – marginella\": användningen blir OVÄNTAD, "
         "resultaten ser idag MARGINELLA ut — exakt logiken \"det vi inte "
         "tror på idag blir viktigt imorgon\". B \"allmän – fruktbara\": "
         "FRUKTBARA är positivt — resultat som ser fruktbara ut idag ÄR "
         "redan lovande, inget överraskningselement. Motsäger poängen. "
         "C \"begränsad – vilseledande\": vilseledande är aktivt fel — "
         "resultaten leder inte fel, de bara verkar små. D "
         "\"experimentell – förutseende\": resultat ser inte FÖRUTSEENDE "
         "ut — det är ett adjektiv för PERSONER, inte forskningsresultat.",
         "essential"),
        ("Slutsats",
         "Endast A landar oförutsägbarhetspoängen i båda luckor: "
         "oväntad användning + marginella i dag. Svaret är A.",
         "essential"),
    ],
    distractors=[
        {"letter": "B",
         "why_tempting": "Det är lätt att \"fruktbara\" känns positivt och rätt för viktiga resultat.",
         "why_wrong": "Steg 4 visar problemet: om resultaten redan TER SIG fruktbara, så är det inte överraskande att de blir viktiga — hela poängen försvinner. Meningen ramar in OFÖRUTSÄGBARHET, inte uppenbarhet."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"vilseledande\" känns starkt och bilderikt.",
         "why_wrong": "Vilseledande betyder att aktivt LEDA FEL — det är värre än bara obetydligt. Resultaten i meningen är inte felaktiga, de ser bara små ut. Och \"begränsad användning\" är inte överraskande (steg 2 ville oväntad)."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"experimentell\" eftersom texten handlar om forskning.",
         "why_wrong": "Steg 4 fäller paret: FÖRUTSEENDE används om personer (\"en förutseende ledare\"), inte om forskningsresultat. Och experimentell användning är inte vad meningen vill — den vill OVÄNTAD."},
    ],
    technique=(
        "Tvålucksregeln med tematiskt ankare: när meningens HUVUDIDÉ är "
        "tydligt (här: oförutsägbarhet i forskningens nytta), måste BÅDA "
        "luckorna stötta temat. Triggern: skriv ner meningens tema i ett "
        "ord och kasta alternativ där minst en lucka motarbetar temat."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-027  | answer: C  (anor)
# "Arkivet grundades 1618 men har ___ från slutet av 1200-talet."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-027"] = E(
    solution_path=(
        "Riksarkivets formella grundande är 1618, men dess HISTORIA "
        "går längre tillbaka. Frasen \"har anor från\" är den fasta "
        "kollokationen för institutioners historiska ursprung. Svaret "
        "är C."
    ),
    steps=[
        ("Förstå meningen",
         "Riksarkivet är formellt från 1618 men har en historisk koppling "
         "bakåt till 1200-talet. Luckan står i frasen \"har ___ från "
         "slutet av 1200-talet\" och ska beteckna det HISTORISKA "
         "URSPRUNGET före själva grundandet.",
         "essential"),
        ("Hitta begränsningen",
         "Konstruktionen är \"har ___ från [tidsperiod]\". Substantivet "
         "ska kunna stå i den frasen och betyda \"historiska rötter\". "
         "Det är en LÅST kollokation i svenska: \"har anor från\".",
         "essential"),
        ("Vad betyder alternativen?",
         "Arv = vad någon lämnar efter sig (man får arv, men säger inte "
         "\"har arv från 1200-talet\"). Börd = social härkomst, ofta "
         "om personers familj (\"av god börd\"). Anor = historiska "
         "rötter, förfäders linje (\"anor från medeltiden\"). Påbrå = "
         "släktdrag, ärvda egenskaper (\"hon har konstnärspåbrå\").",
         "detail"),
        ("Matcha mot alternativen",
         "A \"arv\": arv är vad någon LÄMNAR EFTER SIG (kulturarv, "
         "ekonomiskt arv). Institutioner \"har\" inte arv från en tid. "
         "B \"börd\": börd används om PERSONERS familjehärkomst (\"av "
         "ädel börd\"), inte om institutioner. C \"anor\": exakt rätt — "
         "\"har anor från [tidsperiod]\" är den fasta frasen för "
         "institutioner/familjer/städer med historisk djuprot. D "
         "\"påbrå\": påbrå är ärvda EGENSKAPER hos personer (\"konstnärs­"
         "påbrå\"), inte institutionell historia.",
         "essential"),
        ("Slutsats",
         "\"Har anor från\" är den enda kollokationen som passar både "
         "subjekt (institution) och konstruktion (har ___ från + tid). "
         "Svaret är C — \"anor\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"arv\" känns historiskt och rätt — kulturarv är ju välbekant.",
         "why_wrong": "Steg 4 visar att arv är vad man LÄMNAR EFTER SIG eller får. Riksarkivet HAR inte ett arv från 1200-talet på det sätt frasen kräver — det har anor (steg 3)."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"börd\" känns historiskt — av god börd.",
         "why_wrong": "Börd handlar om PERSONERS familjeursprung (\"av låg/hög börd\"), inte om institutioner. Steg 4 fäller paret: en myndighet har ingen börd."},
        {"letter": "D",
         "why_tempting": "Första instinkten är att \"påbrå\" låter genealogiskt och rätt.",
         "why_wrong": "Påbrå är ärvda egenskaper hos personer (\"musikalisk påbrå\"). Steg 4 låser fast att institutioner inte har påbrå — påbrå biologi/familj, anor = historisk djuprot."},
    ],
    technique=(
        "Idiom-strategi: \"har anor från\" är den fasta frasen för "
        "institutioners/städers/familjers HISTORISKA rötter, oberoende av "
        "när de formellt grundades. Triggern: när texten kontrasterar "
        "ett FORMELLT grundande med ett ÄLDRE ursprung, är anor det "
        "ordet svenskan har avsatt för exakt den klyftan."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-028  | answer: B  (illusion – adekvat – åsidosätts)
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-028"] = E(
    solution_path=(
        "Lucka 1 är en NORMATIV FELBILD av människan (\"som om alla "
        "kunde...\"); lucka 2 beskriver hur den fiktiva människan "
        "reagerar (snabbt och TRÄFFANDE); lucka 3 är vad som händer med "
        "tillgänglighetsperspektivet (det FÖRBISES). Illusion – adekvat "
        "– åsidosätts. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Samhällsplanering bygger på en FELBILD av människor (\"som om "
         "vi alla kunde\"). Lucka 1 är ett substantiv för felbilden, "
         "lucka 2 ett adverb om hur människor REAGERAR i felbilden, "
         "lucka 3 ett verb för vad som händer med "
         "tillgänglighetsperspektivet.",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Konstruktionen \"en ___ om oss människor — som om vi alla "
         "kunde\" säger att lucka-ordet är en FELAKTIG NORMATIV "
         "FÖRESTÄLLNING. Fiktion = uppdiktad berättelse (möjligt). "
         "Illusion = villfarelse, falsk föreställning (passar). "
         "Definition = bestämning av betydelsen (för neutralt). "
         "Kategorisering = indelning (för neutralt).",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Den fiktiva människan reagerar \"snabbt och ___\". Lucka-ordet "
         "är ett adverb om kvaliteten på reaktionen. Initierat = väl "
         "insatt. Adekvat = lämpligt, träffande. Kompetent = "
         "skickligt. Propert = ordentligt, sirligt. Adekvat är det som "
         "specifikt betyder \"träffande/passande\" — exakt vad en "
         "idealiserad människa skulle göra.",
         "essential"),
        ("Hitta begränsningen i lucka 3",
         "Vi ser dagligen exempel på hur tillgänglighetsperspektivet "
         "___ i svensk samhällsutveckling. Eftersom samhällsplaneringen "
         "bygger på en felaktig människobild MISSAS tillgänglighet. "
         "Lucka-ordet ska beteckna att perspektivet IGNORERAS / "
         "FÖRBISES. Tillämpas = används (motsatsen). Åsidosätts = "
         "förbises, sätts åt sidan. Hörsammas = lyssnas till "
         "(motsatsen). Försummas = ej tas hand om (möjligt).",
         "essential"),
        ("Matcha mot alternativen",
         "A \"fiktion – initierat – tillämpas\": tillämpas betyder ATT "
         "perspektivet ANVÄNDS — motsäger \"nästan dagligen ser vi "
         "exempel på hur...\" (kontexten är negativ). Hela paret "
         "kollapsar i lucka 3. B \"illusion – adekvat – åsidosätts\": "
         "illusion = falsk föreställning, adekvat = passande, åsidosätts "
         "= förbises. Alla tre passar logiken. C \"definition – "
         "kompetent – hörsammas\": definition är för neutralt (en "
         "definition är inte fel per definition); hörsammas är motsatsen "
         "till vad meningen vill. D \"kategorisering – propert – "
         "försummas\": kategorisering är inte fel, bara en indelning; "
         "propert (ordentligt) är ett konstigt adverb för "
         "stadsplanerings-människan.",
         "essential"),
        ("Slutsats",
         "B är det enda alternativ där alla tre luckor stöttar samma "
         "tema: planering på en VILLFARELSE som leder till att "
         "tillgänglighet IGNORERAS. Svaret är B — \"illusion – adekvat "
         "– åsidosätts\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"fiktion\" känns rätt — det är ju en fiktiv människobild.",
         "why_wrong": "Lucka 3 fäller paret: TILLÄMPAS betyder att perspektivet ANVÄNDS — direkt motsatt till vad \"exempel på\" och kontextens kritik förmedlar (steg 4)."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"definition\" känns neutralt och tekniskt — samhällsplanering bygger på definitioner.",
         "why_wrong": "Definition är värdeneutralt, men meningens \"som om vi alla kunde\" signalerar VILLFARELSE — inte bara en beteckning. Och hörsammas (lucka 3) är motsatsen till vad meningen kritiserar."},
        {"letter": "D",
         "why_tempting": "Första instinkten kan vara att \"kategorisering\" är ett politiskt-aktuellt ord och passar.",
         "why_wrong": "Steg 4 fäller paret på lucka 2: \"reagera propert\" är inte idiomatiskt — propert används om utseende/skick, inte om reaktionsförmåga."},
    ],
    technique=(
        "Tematiskt ankare i kritiska texter: när texten signalerar "
        "KRITIK (\"som om vi alla kunde\"), måste alla tre luckor stötta "
        "kritikens linje. Triggern: hitta meningens \"misstänkliggörande\" "
        "ord och kasta alternativ där minst en lucka neutraliserar "
        "kritiken."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-029  | answer: D  (förlängningen – rättesnöre)
# "i ___ hela befolkningen, ... med serien som ___ ."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-029"] = E(
    solution_path=(
        "Lucka 1 är frasen för \"och i utökad mening även\" — i "
        "förlängningen. Lucka 2 är vad serien Spara och Slösa fungerade "
        "som: en MORALISK NORM att rätta sig efter — ett rättesnöre. "
        "Svaret är D."
    ),
    steps=[
        ("Förstå meningen",
         "Barnen skulle lära sig hålla ordning på pengarna, och i "
         "förlängningen även befolkningen i stort. Serien Spara och "
         "Slösa fungerade som en GUIDE för hur man skulle bete sig. "
         "Lucka 1 är prepositionsfrasen för utvidgning, lucka 2 är "
         "substantivet för \"normgivare/mall\".",
         "essential"),
        ("Hitta begränsningen i lucka 1",
         "Konstruktionen är \"i ___ hela befolkningen\". I synnerhet = "
         "särskilt (men barnen är ju INTE en del av hela befolkningen "
         "i den meningen). I realiteten = i verkligheten (för neutralt). "
         "I extremfallet = ytterst (för starkt). I förlängningen = i "
         "utvidgad mening, om man tänker längre (exakt rätt).",
         "essential"),
        ("Hitta begränsningen i lucka 2",
         "Serien fungerade som en ___. Vad är en serie som ska lära "
         "folk att hålla ordning på pengarna? En MORALISK GUIDE, en "
         "MALL för riktigt beteende. Draghjälp = hjälp på vägen "
         "(för svagt). Tumregel = grov regel (men en serie är inte en "
         "tumregel). Förebild = mönster att efterlikna (möjligt, men "
         "förebild används mer om personer). Rättesnöre = norm/regel "
         "att rätta sig efter (exakt fackord för moraliska guider).",
         "essential"),
        ("Vad betyder alternativen?",
         "I synnerhet = särskilt. I realiteten = i verkligheten. I "
         "extremfallet = ytterst. I förlängningen = som naturlig "
         "utvidgning. Draghjälp = stöd som hjälper en vidare. Tumregel = "
         "grov praktisk regel. Förebild = mönsterbild. Rättesnöre = "
         "norm/regel man ska följa.",
         "detail"),
        ("Matcha mot alternativen",
         "A \"synnerhet – draghjälp\": \"i synnerhet hela befolkningen\" "
         "blir konstigt — i synnerhet betyder \"särskilt\", men det "
         "konstrasterar barnen mot befolkningen, inte utvidgar. B "
         "\"realiteten – tumregel\": i realiteten är för värderingsfritt "
         "och tumregel är för anspråkslöst för en hel tidningsserie. "
         "C \"extremfallet – förebild\": extremfallet är för starkt — "
         "befolkningen är inte ett extremfall i förhållande till "
         "barnen. D \"förlängningen – rättesnöre\": i förlängningen = "
         "som utvidgning + rättesnöre = norm att rätta sig efter. Båda "
         "exakt rätt.",
         "essential"),
        ("Slutsats",
         "\"I förlängningen\" är den fasta frasen för utvidgad räckvidd, "
         "och \"rättesnöre\" är fackordet för en moralisk norm. Svaret "
         "är D — \"förlängningen – rättesnöre\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"i synnerhet\" känns välkänt och rätt för en betoning.",
         "why_wrong": "Steg 5 visar problemet: \"i synnerhet\" betyder SÄRSKILT (singling out), men meningen UTVIDGAR från barnen till befolkningen — det är inkluderande, inte särskiljande."},
        {"letter": "B",
         "why_tempting": "Många stannar vid att \"i realiteten\" är ett vanligt frasformat.",
         "why_wrong": "I realiteten är värderingsfritt — det säger inget om utvidgning. Och en TIDNINGSSERIE är inte en TUMREGEL (steg 3): en tumregel är en grov praktisk regel, inte ett moraliskt rättesnöre."},
        {"letter": "C",
         "why_tempting": "Snabbsvar är ofta \"extremfallet\" eftersom det låter dramatiskt och 1920-talskris-aktigt.",
         "why_wrong": "Befolkningen är inte ett extremfall av barnen — det är inte rätt logisk relation. Steg 2 visade att lucka 1 ska UTVIDGA, inte radikalisera."},
    ],
    technique=(
        "Idiom-strategi: \"i förlängningen\" är den fasta svenska frasen "
        "för \"som naturlig utvidgning av\". Triggern: när meningen "
        "först nämner en SMALARE grupp/sak och sedan en BREDARE, leta "
        "efter prepositionsfrasen som signalerar GLIDANDE OUTREACH — i "
        "förlängningen, i utvidgad mening."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# var-2023-verb2-MEK-030  | answer: B  (skräder)
# "Mukwege ___ inte orden när han skildrar..."
# ─────────────────────────────────────────────────────────────────────
REGEN["var-2023-verb2-MEK-030"] = E(
    solution_path=(
        "Idiom: \"inte skräda orden\" = säga rakt ut, utan att mildra. "
        "Mukwege talar OFÖRBLOMMERAT om motståndet. Svaret är B."
    ),
    steps=[
        ("Förstå meningen",
         "Mukwege beskriver motstånd han mött och gör det utan att "
         "lägga fingrarna emellan — alltså rakt på sak. Luckan står i "
         "ett idiomatiskt uttryck om SPRÅKVAL: man säger inte saker "
         "förskönade.",
         "essential"),
        ("Hitta begränsningen",
         "Frasen \"___ inte orden\" är en fast svensk idiom. Verbet i "
         "frasen ska betyda att VÄLJA SINA ORD VARSAMT / MILDRA. Att "
         "INTE göra det är att tala rakt ut. Endast ett verb passar i "
         "idiomets fasta form: skräda.",
         "essential"),
        ("Vad betyder alternativen?",
         "Skarvar = överdriver, ljuger lite (\"skarva i historien\"). "
         "Skräder = väljer noga, sparar på (\"skräda orden\" = mildra). "
         "Skingrar = sprider, jagar bort (\"skingra molnen\"). Skonar "
         "= besparar någon något (\"skona honom från detaljerna\").",
         "detail"),
        ("Matcha mot alternativen",
         "A \"skarvar inte orden\": inte ett svenskt idiom — skarva "
         "betyder överdriva, men \"skarvar orden\" är inte en fast fras. "
         "B \"skräder inte orden\": exakt det etablerade idiomet — "
         "skräda orden = välja sina ord försiktigt; INTE skräda = "
         "tala rakt ut. C \"skingrar inte orden\": skingra används om "
         "molnen eller folkmassor, inte om ord. D \"skonar inte orden\": "
         "skona används om personer (man skonar någon från något), "
         "inte om ord som föremål.",
         "essential"),
        ("Slutsats",
         "\"Inte skräda orden\" är den fasta svenska idiomatiska "
         "frasen för rakt tal. Svaret är B — \"skräder\".",
         "essential"),
    ],
    distractors=[
        {"letter": "A",
         "why_tempting": "Det är lätt att \"skarvar\" känns lagom och betyder \"överdriver\" — han överdriver inte.",
         "why_wrong": "Skarva betyder att överdriva eller fylla ut med påhitt, men \"skarvar orden\" är inte ett svenskt uttryck. Steg 2 låser fast att verbet måste passa i den FASTA frasen."},
        {"letter": "C",
         "why_tempting": "Många stannar vid att \"skingra\" har sk-ljudet och ser ut som ett potentiellt idiom.",
         "why_wrong": "Skingra betyder sprida/jaga bort (steg 3): man skingrar molnen eller folkmassor, inte ord. Frasen \"skingrar inte orden\" är inte svenska."},
        {"letter": "D",
         "why_tempting": "Snabbsvar är ofta \"skonar\" eftersom skona låter empatiskt och Mukwege är empatisk.",
         "why_wrong": "Skona används om PERSONER (\"jag skonar dig från detaljerna\"), inte om ord. Steg 4 visar att skonar tar levande objekt, inte ord."},
    ],
    technique=(
        "Idiom-strategi i mest renodlad form: \"skräda orden\" är en "
        "låst svensk fras där bara EN verbform passar. Triggern: när "
        "meningen ramar in en RAK eller MILD språkstil, kolla om uttrycket "
        "är ett känt idiom — då är svaret det enda verb som passar i "
        "den specifika frasen."
    ),
)


# ─────────────────────────────────────────────────────────────────────
# Write the staging file
# ─────────────────────────────────────────────────────────────────────
OUT = Path("audit/_regen/var-2023-mek.json")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(REGEN, indent=2, sort_keys=True, ensure_ascii=False))
print(f"wrote {OUT} with {len(REGEN)} MEK entries")

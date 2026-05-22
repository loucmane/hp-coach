#!/usr/bin/env python3
"""Build output_retry_03.json incrementally, one entry at a time."""
import json
import os
from pathlib import Path

OUT = Path("/home/loucmane/dev/hpfetcher/audit/_xyz_recovery/output_retry_03.json")

# U+E000 / U+E001 math delimiters
M_OPEN = ""
M_CLOSE = ""

def m(latex: str) -> str:
    """Wrap LaTeX in PUA math markers."""
    return f"{M_OPEN}{latex}{M_CLOSE}"

META = {
    "model": "claude-opus-4-7-via-max-subscription",
    "generated_at": "2026-05-22",
    "recipe": "variant-c-regen-wave-pdf-recovery",
}

def save(data):
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))

# Load any existing partial output, otherwise empty
if OUT.exists():
    output = json.loads(OUT.read_text())
else:
    output = {}


# ---------------------------------------------------------------------------
# Entry 1: host-2013-kvant2-XYZ-011
# Workstream 144 (figure-aware re-author) — corpus prompt was garbled but
# parsing_status was "complete" with options matching. The prompt fragments
# render the equation: x/5 - x/10 + x/15 - x/20 = 1 - 1/2 + 1/3 - 1/4
# Answer D = 5.
# We still patch the prompt to a clean form (the corpus version was unreadable).
# ---------------------------------------------------------------------------
qid = "host-2013-kvant2-XYZ-011"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vad är x om {m(r'\frac{x}{5} - \frac{x}{10} + \frac{x}{15} - \frac{x}{20} = 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4}')}?",
        "options": [
            {"letter": "A", "text": "-5"},
            {"letter": "B", "text": "-1/5"},
            {"letter": "C", "text": "1/5"},
            {"letter": "D", "text": "5"},
        ],
        "answer": "D",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Bryt ut x ur vänstra ledet. Båda leden får då samma teckenstruktur ({m(r'+\,-\,+\,-')}) — kvoten mellan dem är x:s värde.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Ekvationen {m(r'\frac{x}{5} - \frac{x}{10} + \frac{x}{15} - \frac{x}{20} = 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4}')} har x i varje term i vänstra ledet. Höger led är ett rent talvärde. Strategin: isolera x genom att bryta ut.",
             "tier": "essential"},
            {"n": 2, "title": "Strukturen i båda leden",
             "text": f"Lägg märke till att nämnarna {m(r'5,\,10,\,15,\,20')} i VL är fyra gånger nämnarna {m(r'1,\,2,\,3,\,4')} i HL — och tecknen {m(r'+\,-\,+\,-')} är identiska. Det är ingen slump; ekvationen är konstruerad så.",
             "tier": "detail"},
            {"n": 3, "title": "Vad betyder utbrytning?",
             "text": f"Distributiva lagen baklänges: om varje term har samma faktor x, så är {m(r'\tfrac{x}{5} - \tfrac{x}{10} + \tfrac{x}{15} - \tfrac{x}{20} = x\bigl(\tfrac{1}{5} - \tfrac{1}{10} + \tfrac{1}{15} - \tfrac{1}{20}\bigr)')}. Faktorn x flyttas utanför parentesen.",
             "tier": "detail"},
            {"n": 4, "title": "Bryt ut x",
             "text": f"VL blir alltså {m(r'x\bigl(\tfrac{1}{5} - \tfrac{1}{10} + \tfrac{1}{15} - \tfrac{1}{20}\bigr) = 1 - \tfrac{1}{2} + \tfrac{1}{3} - \tfrac{1}{4}')}.",
             "tier": "essential"},
            {"n": 5, "title": "Gemensam nämnare i HL",
             "text": f"Bråkaddition kräver gemensam nämnare. För {m(r'1,\,2,\,3,\,4')} är MGN = 12. Skriv om: {m(r'1 = \tfrac{12}{12},\ \tfrac{1}{2}=\tfrac{6}{12},\ \tfrac{1}{3}=\tfrac{4}{12},\ \tfrac{1}{4}=\tfrac{3}{12}')}.",
             "tier": "detail"},
            {"n": 6, "title": "Räkna HL",
             "text": f"{m(r'\tfrac{12}{12} - \tfrac{6}{12} + \tfrac{4}{12} - \tfrac{3}{12} = \tfrac{12 - 6 + 4 - 3}{12} = \tfrac{7}{12}')}.",
             "tier": "essential"},
            {"n": 7, "title": "Gemensam nämnare i VL-parentesen",
             "text": f"För {m(r'5,\,10,\,15,\,20')} är MGN = 60. Skriv om: {m(r'\tfrac{1}{5}=\tfrac{12}{60},\ \tfrac{1}{10}=\tfrac{6}{60},\ \tfrac{1}{15}=\tfrac{4}{60},\ \tfrac{1}{20}=\tfrac{3}{60}')}.",
             "tier": "detail"},
            {"n": 8, "title": "Räkna VL-parentesen",
             "text": f"{m(r'\tfrac{12}{60} - \tfrac{6}{60} + \tfrac{4}{60} - \tfrac{3}{60} = \tfrac{7}{60}')}. Samma täljare 7 — det är poängen med uppgiften.",
             "tier": "essential"},
            {"n": 9, "title": "Sätt in i ekvationen",
             "text": f"{m(r'x\cdot\tfrac{7}{60} = \tfrac{7}{12}')}.",
             "tier": "essential"},
            {"n": 10, "title": "Lös ut x",
             "text": f"Multiplicera båda led med {m(r'\tfrac{60}{7}')}: {m(r'x = \tfrac{7}{12}\cdot\tfrac{60}{7} = \tfrac{60}{12} = 5')}.",
             "tier": "essential"},
            {"n": 11, "title": "Verifiera",
             "text": f"Sätt in {m(r'x=5')} i VL: {m(r'\tfrac{5}{5} - \tfrac{5}{10} + \tfrac{5}{15} - \tfrac{5}{20} = 1 - \tfrac{1}{2} + \tfrac{1}{3} - \tfrac{1}{4}')} — identiskt med HL. Stämmer.",
             "tier": "essential"},
            {"n": 12, "title": "Slutsats",
             "text": "Svar D: x = 5. Insikten i en mening: när varje VL-nämnare är en konstant faktor större än motsvarande HL-nämnare avslöjar utbrytning direkt den konstanten.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Det är lätt att blanda ihop tecken och tro att skillnaden mellan leden ger ett negativt x. ", "why_wrong": "Steg 10 visar att kvoten 60/12 är positiv — det finns inget tecken som vänder under räkningen."},
            {"letter": "B", "why_tempting": "Många stannar vid att läsa av nämnaren i HL (12) och täljaren i VL-parentesen (7) och försöker bilda ett ”invers-värde” som -1/5.", "why_wrong": "Steg 8–9 visar att x = (7/12)/(7/60), inte (7/60)/(7/12); inversen är felställd."},
            {"letter": "C", "why_tempting": "Om man råkar dividera VL-parentesen med HL istället för tvärtom hamnar man på 1/5.", "why_wrong": "Steg 10 cementerar riktningen: x = HL / (faktorn framför x i VL), alltså (7/12) / (7/60) = 5."},
        ],
        "technique": "Mönster-utbrytning: när vänster led är en summa av termer som alla innehåller x, faktorisera x först — sedan reduceras hela ekvationen till x · K = HL, där K är en talkonstant.",
        "pitfall": "Botemedlet mot att räkna fyra separata bråkledamöter: notera att vänster- och högerled har samma teckenmönster och en konstant nämnarfaktor — då räcker det att räkna ut ETT bråkuttryck.",
        "framework_id": "XYZ-TRAP-016",
        "pregrade_tactic": {
            "handle": "Utbrytningsblicken",
            "move": "När varje term i ett led har samma okända faktor — bryt ut den först och hantera resten som ett rent talsamband.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 2: host-2014-kvant2-XYZ-009
# Workstream 144 (figure-aware): triangle ABC, right angle at B, perpendicular
# from a point on AB up to a point on AC. The angle at that meeting point on
# the AC side toward C is 130 deg. x is the angle at C inside triangle ABC.
# z is the exterior angle at A (between base extended left and AC going up).
# Answer: x + z = 50 + 140 = 190 deg. Answer D.
# Corpus options had garbled text in D ("190° x^{4}..."); we patch options.
# ---------------------------------------------------------------------------
qid = "host-2014-kvant2-XYZ-009"
output[qid] = {
    "corpus_patch": {
        "prompt": "ABC är en triangel med rät vinkel vid B. Från en punkt på sidan AB är en vinkelrät linje dragen rakt upp till sidan AC; vid mötespunkten på AC är vinkeln 130° (mätt åt C-hållet). x är vinkeln vid C inuti triangeln, z är yttervinkeln vid A mellan basförlängningen (åt vänster om A) och AC. Vad är x + z?",
        "options": [
            {"letter": "A", "text": "130°"},
            {"letter": "B", "text": "140°"},
            {"letter": "C", "text": "180°"},
            {"letter": "D", "text": "190°"},
        ],
        "answer": "D",
        "has_figure": True,
    },
    "explanation": {
        "solution_path": "Den inre vinkeln vid mötespunkten är 180° − 130° = 50°; den lilla triangeln (rätvinklig) ger att lutningen för AC mot horisontalen är 40°. Det fastställer x = 50° och z = 180° − 40° = 140°, så x + z = 190°.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": "Den stora triangeln ABC är rätvinklig vid B. Inne i den finns en vinkelrät linje från sidan AB upp till sidan AC; vid mötespunkten är en vinkel märkt 130° (mätt åt C). Vinkeln x är vid C, vinkeln z är vid A på utsidan (mot vänster, längs basen förlängd).",
             "tier": "essential"},
            {"n": 2, "title": "Vad innebär ”yttervinkel z”?",
             "text": "På bilden ligger z mellan baslinjen som fortsätter åt vänster och linjen AC som går upp åt höger. Det är alltså supplementet till den inre vinkeln BAC: z = 180° − (vinkel BAC). En rak linje ger 180°.",
             "tier": "detail"},
            {"n": 3, "title": "Vad 130° säger",
             "text": f"Mötespunkten M på AC delar AC i två riktningar. Den markerade 130°-vinkeln ligger mellan strecket MB (lodrätt nedåt) och MC (uppåt-höger). Den vinkel på MOTSATT sida av samma rätlinje är dess supplement: 180° − 130° = 50°. Den 50°-vinkeln ligger inne i den lilla triangeln (mellan MB och MA).",
             "tier": "essential"},
            {"n": 4, "title": "Den lilla rätvinkliga triangeln",
             "text": "Den lilla triangeln har: rät vinkel vid foten på AB (90°), 50° vid M, och resterande vinkel vid A. Vinkelsumman i en triangel är 180°.",
             "tier": "detail"},
            {"n": 5, "title": "Räkna vinkeln vid A",
             "text": "180° − 90° − 50° = 40°. Det är samma vinkel som BAC i den stora triangeln, eftersom A är gemensam och de två trianglarna delar sidan AC vid A.",
             "tier": "essential"},
            {"n": 6, "title": "Räkna x i stora triangeln",
             "text": "Stora triangeln ABC är rätvinklig vid B. Vinkelsumma: 90° + (vinkel A) + (vinkel C) = 180°, alltså vinkel C = 180° − 90° − 40° = 50°. Det är x.",
             "tier": "essential"},
            {"n": 7, "title": "Räkna z (yttervinkeln vid A)",
             "text": "Från steg 2: z = 180° − (vinkel A) = 180° − 40° = 140°.",
             "tier": "essential"},
            {"n": 8, "title": "Summan x + z",
             "text": "x + z = 50° + 140° = 190°.",
             "tier": "essential"},
            {"n": 9, "title": "Snabbcheck via yttervinkelsatsen",
             "text": "Yttervinkeln vid A är lika med summan av de två motstående inre vinklarna: vinkel B + vinkel C = 90° + 50° = 140°. Stämmer med vårt z.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera",
             "text": "Värdena 40° + 50° + 90° = 180° i stora triangeln; 90° + 50° + 40° = 180° i lilla triangeln; 130° + 50° = 180° vid M. Alla tre stämmer.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar D: x + z = 190°. Insikten i en mening: en yttervinkel sluker alltid summan av de två icke-angränsande inre vinklarna — vid en rätvinklig triangel blir det 90° plus den motstående spetsiga.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Första instinkten är att läsa den enda numeriska vinkeln (130°) och svara den rakt av.", "why_wrong": "Steg 3 visar att 130° är vinkeln vid M — inte x + z."},
            {"letter": "B", "why_tempting": "Många stannar vid att räkna ut yttervinkeln z = 140° och glömmer att lägga till x.", "why_wrong": "Steg 8 visar att x och z båda ska bidra; ensam ger z 140°, men x = 50° måste med."},
            {"letter": "C", "why_tempting": "Det är frestande att tro att x och z är supplement (på samma linje) och därför summerar till 180°.", "why_wrong": "Steg 7 visar att z = 180° − ∠A medan x = ∠C; deras summa är 180° − ∠A + ∠C, inte 180°."},
        ],
        "technique": "Yttervinkelsatsen: en yttervinkel vid ett hörn = summan av de två icke-angränsande inre vinklarna. Använd den både för att bekräfta z och för att slippa räkna via supplement.",
        "pitfall": "Botemedlet mot att blanda 130° med x eller z: lokalisera 130° geometriskt först (vid M, inte vid hörnen A/B/C) — då försvinner frestelsen att kopiera siffran rakt av.",
        "framework_id": "XYZ-TRAP-038",
        "pregrade_tactic": {
            "handle": "Yttervinkelvägen",
            "move": "När en uppgift blandar en inre vinkel och en yttervinkel — använd att yttervinkel = summan av de två motstående inre, så slipper du räkna supplement separat.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 3: host-2017-kvant2-XYZ-008
# Workstream 147 (recovery + author): corpus empty.
# Reconstruct: Vad blir (x1/y1) / (x2/y2) om x1=2x2 och y1=2y2?
# Options: A x1/y1   B x2^2/y2^2   C 1   D 2
# Answer: C = 1.
# ---------------------------------------------------------------------------
qid = "host-2017-kvant2-XYZ-008"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vad blir {m(r'\dfrac{x_{1}/y_{1}}{x_{2}/y_{2}}')} om {m(r'x_{1}=2x_{2}')} och {m(r'y_{1}=2y_{2}')}?",
        "options": [
            {"letter": "A", "text": m(r"\dfrac{x_{1}}{y_{1}}")},
            {"letter": "B", "text": m(r"\dfrac{x_{2}^{2}}{y_{2}^{2}}")},
            {"letter": "C", "text": "1"},
            {"letter": "D", "text": "2"},
        ],
        "answer": "C",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Skriv om dubbelbråket som en multiplikation: {m(r'(x_{1}/y_{1})\cdot(y_{2}/x_{2})')}. Substituera {m(r'x_{1}=2x_{2}')}, {m(r'y_{1}=2y_{2}')}, och 2:orna stryker — kvar blir {m(r'(x_{2}/y_{2})\cdot(y_{2}/x_{2})=1')}.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Uttrycket är ett bråk där täljaren själv är ett bråk och nämnaren själv är ett bråk: {m(r'\dfrac{x_{1}/y_{1}}{x_{2}/y_{2}}')}. Indexen 1 och 2 är bara namn på olika tal; villkoren säger att {m(r'x_{1}')} är dubbelt så stor som {m(r'x_{2}')} och {m(r'y_{1}')} är dubbelt så stor som {m(r'y_{2}')}.",
             "tier": "essential"},
            {"n": 2, "title": "Vad är ”division med ett bråk”?",
             "text": f"Att dividera med ett bråk är samma sak som att multiplicera med dess invers: {m(r'\dfrac{a/b}{c/d} = \dfrac{a}{b}\cdot\dfrac{d}{c}')}. Detta är samma regel som att {m(r'\dfrac{1}{1/2}=2')}.",
             "tier": "detail"},
            {"n": 3, "title": "Vänd nedre bråket",
             "text": f"Tillämpa regeln: {m(r'\dfrac{x_{1}/y_{1}}{x_{2}/y_{2}} = \dfrac{x_{1}}{y_{1}}\cdot\dfrac{y_{2}}{x_{2}}')}.",
             "tier": "essential"},
            {"n": 4, "title": "Slå ihop till ett bråk",
             "text": f"Multiplikation av bråk: täljare gånger täljare, nämnare gånger nämnare. {m(r'\dfrac{x_{1}}{y_{1}}\cdot\dfrac{y_{2}}{x_{2}} = \dfrac{x_{1}\,y_{2}}{y_{1}\,x_{2}}')}.",
             "tier": "essential"},
            {"n": 5, "title": "Substituera villkoren",
             "text": f"Sätt in {m(r'x_{1}=2x_{2}')} och {m(r'y_{1}=2y_{2}')}: {m(r'\dfrac{x_{1}\,y_{2}}{y_{1}\,x_{2}} = \dfrac{(2x_{2})\,y_{2}}{(2y_{2})\,x_{2}}')}.",
             "tier": "essential"},
            {"n": 6, "title": "Stryk 2:orna",
             "text": f"En faktor 2 finns i både täljare och nämnare. Stryk: {m(r'\dfrac{2\,x_{2}\,y_{2}}{2\,y_{2}\,x_{2}} = \dfrac{x_{2}\,y_{2}}{y_{2}\,x_{2}}')}.",
             "tier": "essential"},
            {"n": 7, "title": "Stryk x₂ och y₂",
             "text": f"Samma faktorer i täljare och nämnare. {m(r'\dfrac{x_{2}\,y_{2}}{y_{2}\,x_{2}} = 1')} (för {m(r'x_{2},y_{2}\neq 0')}, vilket är underförstått eftersom de står i nämnare).",
             "tier": "essential"},
            {"n": 8, "title": "Tolkning utan substitution",
             "text": f"Det går också att se direkt: täljaren {m(r'x_{1}/y_{1}')} och nämnaren {m(r'x_{2}/y_{2}')} har samma värde — båda är ”någonting / något lika dubbelt” — eftersom 2:orna i {m(r'x_{1}/y_{1}=2x_{2}/(2y_{2})')} kortar bort. Kvoten av två lika tal är 1.",
             "tier": "detail"},
            {"n": 9, "title": "Sanity-check med konkreta tal",
             "text": f"Ta {m(r'x_{2}=3,\,y_{2}=4')}. Då {m(r'x_{1}=6,\,y_{1}=8')}. Täljare: {m(r'6/8=3/4')}. Nämnare: {m(r'3/4')}. Kvot: {m(r'(3/4)/(3/4)=1')}.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera mot alternativen",
             "text": f"Värdet 1 finns endast i alternativ C. Alternativ A skulle kräva att nämnaren bara var 1; alternativ B skulle kräva att 2:orna kvadrerats; D skulle kräva att det inte fanns någon kortning.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar C: 1. Insikten i en mening: när täljare och nämnare är skalade med samma faktor stryker faktorn — dubbelbråket reducerar till 1.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": f"Det är lätt att stanna efter steg 4 och avsluta med {m(r'\dfrac{x_{1}\,y_{2}}{y_{1}\,x_{2}}')} omtolkat som {m(r'x_{1}/y_{1}')}.", "why_wrong": "Steg 5–7 visar att substitutionen krymper allt till 1; man har inte använt villkoren om man stannar vid A."},
            {"letter": "B", "why_tempting": f"Många stannar vid att se {m(r'x_{1}=2x_{2}')} och kvadrerar villkoret — det ger ett kvadratiskt uttryck i {m(r'x_{2}')} och {m(r'y_{2}')}.", "why_wrong": "Steg 6 visar att det bara finns ETT extra 2-par att stryka, inte två — inga kvadrater uppstår."},
            {"letter": "D", "why_tempting": f"Snabbsvar är ofta ”dubbelt” när villkoret innehåller en 2:a — man tror att 2:an överlever.", "why_wrong": "Steg 6 visar att samma 2:a finns i både täljare och nämnare; den stryker och försvinner."},
        ],
        "technique": "Dubbelbråk-receptet: vänd det undre bråket och multiplicera. När båda bråken är skalade med samma faktor — t.ex. 2 — stryker den direkt.",
        "pitfall": "Botemedlet mot att tro att 2:an blir kvar: behåll faktorn 2 explicit som ”·2” genom hela räkningen tills du ser den i både täljare och nämnare — då är strykningen otvetydig.",
        "framework_id": "XYZ-TRAP-017",
        "pregrade_tactic": {
            "handle": "Dubbelbråksvändet",
            "move": "När du ser en kvot där täljaren själv är ett bråk — vänd nämnar-bråket först, multiplicera, och leta efter gemensamma faktorer att stryka.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 4: host-ver2-2019-kvant2-XYZ-005
# Workstream 144 (figure-aware): corpus prompt is "Vilket värde har x om
# 7^{3} = 49?" which is wrong. The PNG shows 7^(7 + x/3) = 49.
# Answer: 7 + x/3 = 2 -> x = -15. Answer A.
# Patch the prompt.
# ---------------------------------------------------------------------------
qid = "host-ver2-2019-kvant2-XYZ-005"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vilket värde har x om {m(r'7^{\,7 + x/3} = 49')}?",
        "options": [
            {"letter": "A", "text": "-15"},
            {"letter": "B", "text": "-7"},
            {"letter": "C", "text": "7"},
            {"letter": "D", "text": "15"},
        ],
        "answer": "A",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Skriv om 49 som potens av 7: {m(r'49 = 7^{2}')}. Då måste exponenterna vara lika: {m(r'7 + x/3 = 2')}. Lös: {m(r'x/3 = -5')}, alltså {m(r'x = -15')}.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Ekvationen {m(r'7^{\,7 + x/3} = 49')} har en variabel exponent. Strategin för sådana ekvationer: gör båda leden till potenser av SAMMA bas, sedan kan exponenterna jämställas.",
             "tier": "essential"},
            {"n": 2, "title": "Vilken är basen?",
             "text": "Vänstra ledet har bas 7. Höger led, 49, måste skrivas som en potens av 7 för att exponenterna ska kunna jämföras.",
             "tier": "detail"},
            {"n": 3, "title": "Skriv 49 som potens av 7",
             "text": f"{m(r'7\cdot 7 = 49')}, alltså {m(r'49 = 7^{2}')}. Detta är en av de viktigaste talen att kunna utantill: {m(r'7^{2}=49')}.",
             "tier": "essential"},
            {"n": 4, "title": "Sätt in i ekvationen",
             "text": f"{m(r'7^{\,7 + x/3} = 7^{2}')}.",
             "tier": "essential"},
            {"n": 5, "title": "Lika baser ⇒ lika exponenter",
             "text": f"Exponentialfunktionen {m(r'b^{u}')} är injektiv för {m(r'b>0,\,b\neq 1')} (varje y-värde har bara ett x-värde). Alltså: om {m(r'7^{A}=7^{B}')} så är {m(r'A=B')}.",
             "tier": "detail"},
            {"n": 6, "title": "Sätt upp exponentekvationen",
             "text": f"{m(r'7 + \dfrac{x}{3} = 2')}.",
             "tier": "essential"},
            {"n": 7, "title": "Subtrahera 7 i båda led",
             "text": f"{m(r'\dfrac{x}{3} = 2 - 7 = -5')}.",
             "tier": "essential"},
            {"n": 8, "title": "Multiplicera båda led med 3",
             "text": f"{m(r'x = -5 \cdot 3 = -15')}.",
             "tier": "essential"},
            {"n": 9, "title": "Verifiera",
             "text": f"Sätt in {m(r'x=-15')}: exponenten blir {m(r'7 + (-15)/3 = 7 - 5 = 2')}, och {m(r'7^{2}=49')}. Stämmer.",
             "tier": "essential"},
            {"n": 10, "title": "Slutsats",
             "text": "Svar A: x = -15. Insikten i en mening: exponentialekvationer löses genom att hitta en gemensam bas; därefter blir exponenterna en vanlig linjär ekvation.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "B", "why_tempting": "Om man fastnar för att 7 finns i båda leden och ”någon 7:a försvinner”, lockas man till -7.", "why_wrong": "Steg 6 visar att vi inte tar bort siffran 7 utan subtraherar — och dessutom delar med 3 — vilket ger -15, inte -7."},
            {"letter": "C", "why_tempting": "Snabbsvar är ofta att läsa av basen själv (7) som svar.", "why_wrong": "Steg 8 visar att x = -15; basen 7 är inte lika med exponenten eller variabeln."},
            {"letter": "D", "why_tempting": "Om man missar att x/3 = -5 ger x = -15 och istället tar +15, byts tecknet bara.", "why_wrong": "Steg 7 visar att x/3 är NEGATIVT (-5); steg 8 bevarar tecknet vid multiplikation med positiva 3."},
        ],
        "technique": "Gemensam bas: vid exponentialekvation, skriv om båda leden som potenser av samma bas och jämställ exponenterna. För 7^?=49 är basen 7 och 49 = 7².",
        "pitfall": "Botemedlet mot att gissa heltal: skriv ALLTID om talsidan som en potens av basen innan du försöker matcha exponenten — annars frestas du till siffermatchning som inte är giltig.",
        "framework_id": "XYZ-TRAP-027",
        "pregrade_tactic": {
            "handle": "Bas-matchningen",
            "move": "När båda sidor kan skrivas med samma bas — gör det först, sedan jämställ exponenterna och lös som en linjär ekvation.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 5: var-2013-kvant2-XYZ-010
# Workstream 147 (recovery): corpus empty.
# Reconstruct from PNG: question 10 is the stacked-fractions:
#   ( (4/8)·(1/2)·(3/4) ) / ( (8/2)·(1/2) )
# Options: A 3/32, B 3/16, C 3/8, D 3/2. Answer A.
# ---------------------------------------------------------------------------
qid = "var-2013-kvant2-XYZ-010"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vad blir {m(r'\dfrac{\,\tfrac{4}{8}\cdot\tfrac{1}{2}\cdot\tfrac{3}{4}\,}{\,\tfrac{8}{2}\cdot\tfrac{1}{2}\,}')}?",
        "options": [
            {"letter": "A", "text": "3/32"},
            {"letter": "B", "text": "3/16"},
            {"letter": "C", "text": "3/8"},
            {"letter": "D", "text": "3/2"},
        ],
        "answer": "A",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Räkna täljaren och nämnaren var för sig: täljaren blir {m(r'3/16')}, nämnaren blir 2. Dubbelbråket {m(r'(3/16)/2 = 3/32')}.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Det är ett dubbelbråk: täljaren är en produkt av tre bråk, nämnaren är en produkt av två bråk. Strategin: räkna täljare och nämnare för sig, sedan dividera.",
             "tier": "essential"},
            {"n": 2, "title": "Förenkla 4/8 och 8/2",
             "text": f"{m(r'\dfrac{4}{8} = \dfrac{1}{2}')} (kortat med 4). {m(r'\dfrac{8}{2} = 4')} (delning).",
             "tier": "detail"},
            {"n": 3, "title": "Räkna täljaren",
             "text": f"{m(r'\dfrac{4}{8}\cdot\dfrac{1}{2}\cdot\dfrac{3}{4} = \dfrac{1}{2}\cdot\dfrac{1}{2}\cdot\dfrac{3}{4}')}.",
             "tier": "essential"},
            {"n": 4, "title": "Multiplicera bråken",
             "text": f"Multiplikationsregeln: täljare × täljare, nämnare × nämnare. {m(r'\dfrac{1}{2}\cdot\dfrac{1}{2}\cdot\dfrac{3}{4} = \dfrac{1\cdot 1\cdot 3}{2\cdot 2\cdot 4} = \dfrac{3}{16}')}.",
             "tier": "essential"},
            {"n": 5, "title": "Räkna nämnaren",
             "text": f"{m(r'\dfrac{8}{2}\cdot\dfrac{1}{2} = 4\cdot\dfrac{1}{2} = 2')}.",
             "tier": "essential"},
            {"n": 6, "title": "Sätt ihop dubbelbråket",
             "text": f"Uttrycket blir {m(r'\dfrac{3/16}{2}')}.",
             "tier": "essential"},
            {"n": 7, "title": "Division med ett tal är multiplikation med dess invers",
             "text": f"{m(r'\dfrac{a}{n} = a\cdot\dfrac{1}{n}')}. Alltså {m(r'\dfrac{3/16}{2} = \dfrac{3}{16}\cdot\dfrac{1}{2}')}.",
             "tier": "detail"},
            {"n": 8, "title": "Räkna ut",
             "text": f"{m(r'\dfrac{3}{16}\cdot\dfrac{1}{2} = \dfrac{3}{32}')}.",
             "tier": "essential"},
            {"n": 9, "title": "Verifiera med decimaler",
             "text": f"Täljaren: {m(r'0{,}5\cdot 0{,}5\cdot 0{,}75 = 0{,}1875')}. Nämnaren: 2. Kvot: {m(r'0{,}09375')}. Och {m(r'3/32 = 0{,}09375')}. Stämmer.",
             "tier": "detail"},
            {"n": 10, "title": "Slutsats",
             "text": "Svar A: 3/32. Insikten i en mening: dubbelbråk reduceras säkert genom att räkna ut täljaren och nämnaren var för sig först, sedan dividera.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "B", "why_tempting": "Om man stannar efter steg 4 (täljaren = 3/16) och glömmer att dela med nämnaren, hamnar man på B.", "why_wrong": "Steg 6–8 visar att dubbelbråket fortfarande har en nämnare 2 att dela med; svaret måste bli mindre än 3/16."},
            {"letter": "C", "why_tempting": "Det är lätt att felaktigt slå ihop 1/2 · 3/4 = 3/8 och slänga bort resten.", "why_wrong": "Steg 3 visar att täljaren har TRE bråk — den första 1/2:an får inte hoppa över."},
            {"letter": "D", "why_tempting": "Om man råkar invertera kvoten (delar nämnaren med täljaren) får man 32/3 ≈ 10,6, vilket ingen ser. Men ”3/2” är frestande som ett snabbt mellansteg.", "why_wrong": "Steg 8 visar att svaret är 3/32 — 16 gånger mindre än 3/2."},
        ],
        "technique": "Dubbelbråk-strategi: räkna täljare och nämnare för sig, sedan invertera nämnaren och multiplicera. Förenkla varje delkomponent (t.ex. 4/8 = 1/2) innan multiplikation.",
        "pitfall": "Botemedlet mot att tappa nämnaren i dubbelbråk: rita ett tydligt horisontellt streck mellan täljarens och nämnarens räkneresultat innan du dividerar — då kan ingen del slinka undan.",
        "framework_id": "XYZ-TRAP-017",
        "pregrade_tactic": {
            "handle": "Dubbelbråksuppdelningen",
            "move": "I dubbelbråk — räkna täljare och nämnare var för sig först, sen dividera. Förenkla varje del innan multiplikation.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 6: var-2017-kvant1-XYZ-003
# Workstream 144 (figure-aware): parallelogram-ish figure.
# L1 (top), L2 (bottom), distance 8 m apart. On L1: B and D with BD = 6 m.
# A is on L2 below-left of B, C on L2 below B, E on L2 below D.
# AB and CD are parallel (both slant from L2 up to L1, same direction).
# Path A->B->C->D->E.
# Right angles at C and E (the verticals BC and DE).
# BC vertical = 8, DE vertical = 8.
# Since AB and CD parallel and same vertical distance, AB = CD; AC = BD = 6.
# AB hypotenuse of triangle with legs 6 and 8 => 10. CD = 10.
# Total = 10 + 8 + 10 + 8 = 36 m. Answer C.
# ---------------------------------------------------------------------------
qid = "var-2017-kvant1-XYZ-003"
output[qid] = {
    "explanation": {
        "solution_path": "Bilden består av två kongruenta rätvinkliga trianglar med kateter 6 och 8 och hypotenusa 10 (Pythagoras). Sträckorna A→B, B→C, C→D, D→E är 10 + 8 + 10 + 8 = 36 m.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": "Två parallella linjer L₁ (övre) och L₂ (nedre) ligger 8 m från varandra. På L₁: B (vänster) och D (höger), avstånd BD = 6 m. På L₂: A (under och till vänster om B), C (rakt under B), E (rakt under D). Rät vinkel vid C och vid E markerar att BC och DE är vinkelräta mot L₂. Sträckorna AB och CD är parallella.",
             "tier": "essential"},
            {"n": 2, "title": "Lokalisera de fyra delsträckorna",
             "text": "Vägen A→B går snett uppåt-höger; B→C går rakt nedåt; C→D går snett uppåt-höger (parallell med AB); D→E går rakt nedåt.",
             "tier": "detail"},
            {"n": 3, "title": "BC och DE är vertikala 8-metersträckor",
             "text": "Eftersom L₁ och L₂ är parallella och avståndet mellan dem är 8 m, och BC samt DE är vinkelräta mot L₂ (rätvinkelmarkeringar): BC = 8 m och DE = 8 m.",
             "tier": "essential"},
            {"n": 4, "title": "AC = BD = 6 m via parallellogram-egenskapen",
             "text": "Eftersom AB och CD är parallella OCH ligger mellan samma två parallella linjer (samma vertikala avstånd 8 m), är de lika långa. Med AB ∥ CD och BC ∥ DE blir fyrhörningen BCDA en parallellogram-rektangelhybrid där motstående sidor är lika: AC = BD = 6 m.",
             "tier": "detail"},
            {"n": 5, "title": "AB som hypotenusa",
             "text": "Triangeln A-B-C är rätvinklig vid C med kateter AC = 6 och BC = 8 och hypotenusa AB.",
             "tier": "essential"},
            {"n": 6, "title": "Pythagoras-satsen",
             "text": f"I en rätvinklig triangel gäller {m(r'a^{2}+b^{2}=c^{2}')} där c är hypotenusan (sidan mittemot 90°-vinkeln). Sätt in {m(r'a=6,\,b=8')}.",
             "tier": "detail"},
            {"n": 7, "title": "Räkna AB",
             "text": f"{m(r'6^{2}+8^{2}=36+64=100')}, så {m(r'AB=\sqrt{100}=10')} m.",
             "tier": "essential"},
            {"n": 8, "title": "CD = AB = 10 m",
             "text": "Eftersom CD är parallell med AB och ligger mellan samma två parallella linjer med samma horisontella förskjutning (CE = BD = 6 m, igen parallellogram-egenskap): CD är också hypotenusa i en rätvinklig triangel med kateter 6 och 8.",
             "tier": "essential"},
            {"n": 9, "title": "Summera",
             "text": "Total sträcka = AB + BC + CD + DE = 10 + 8 + 10 + 8 = 36 m.",
             "tier": "essential"},
            {"n": 10, "title": "Verifiera med pythagoreisk trippel",
             "text": "(6, 8, 10) är en känd pythagoreisk trippel — dubbla av (3, 4, 5). Det bekräftar att 10 är rätt hypotenusa.",
             "tier": "detail"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar C: 36 m. Insikten i en mening: när en figur har två parallella sneda sidor mellan två parallella linjer är de lika långa — räkna hypotenusan EN gång och dubblera.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Om man räknar bara 6 + 8 + 10 = 24 (glömmer en av de fyra delsträckorna) hamnar man på A.", "why_wrong": "Steg 9 listar fyra termer: AB, BC, CD, DE — A motsvarar att en saknas."},
            {"letter": "B", "why_tempting": "Om man räknar 8 + 8 + 16 = 32 (kollapsar AB och CD till en kombinerad sträcka på 16 men glömmer Pythagoras), hamnar man på B.", "why_wrong": "Steg 7 visar att varje sned sträcka är 10 (inte 8), så två sneda + två vertikala = 36, inte 32."},
            {"letter": "D", "why_tempting": "Snabbsvar är ofta 6 + 8 + 6 + 8 + 6 + 8 = 36 + tillägg — t.ex. att dubbla hypotenusan till 20 ger 40.", "why_wrong": "Steg 8 visar att CD är samma hypotenusa som AB, inte dubbelt så lång. 36 är slutsumman, inte 40."},
        ],
        "technique": "Parallell-mellan-parallella-receptet: när två sneda sidor är parallella och ligger mellan två parallella linjer, är de lika långa. Räkna hypotenusan med Pythagoras en gång och multiplicera med antalet sneda sidor.",
        "pitfall": "Botemedlet mot att glömma en delsträcka: lista hörnpunkterna i ordning (A, B, C, D, E) och räkna en sträcka per övergång — då blir det alltid 4 delsträckor när du går genom 5 punkter.",
        "framework_id": "XYZ-TRAP-040",
        "pregrade_tactic": {
            "handle": "Pythagoras-trippeln",
            "move": "Se efter (3,4,5) och dubbletter som (6,8,10) — då kan du skriva hypotenusan direkt utan att räkna kvadratrot.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 7: var-2022-2-kvant1-XYZ-002
# Workstream 147 (recovery): corpus empty.
# Reconstruct from PNG: Linjen y=kx+m är inritad. Vad är riktningskoefficienten k?
# Options: A -1/3, B 1/3, C 3, D 1. Answer B.
# Figure-aware as well (the y-intercept and a second visible point need to be read).
# From the figure: line crosses y-axis at about y = -1, and passes through (1, 0)...
# Actually no — at x=1 the y is ALSO around -2/3. Let me re-read: passes near
# x-axis crossing close to x = 3 with y = 0. So slope ≈ (0 - (-1))/(3 - 0) = 1/3.
# ---------------------------------------------------------------------------
qid = "var-2022-2-kvant1-XYZ-002"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Linjen {m(r'y=kx+m')} är inritad i koordinatsystemet. Vad är riktningskoefficienten k för linjen?",
        "options": [
            {"letter": "A", "text": "-1/3"},
            {"letter": "B", "text": "1/3"},
            {"letter": "C", "text": "3"},
            {"letter": "D", "text": "1"},
        ],
        "answer": "B",
        "has_figure": True,
    },
    "explanation": {
        "solution_path": "Läs av två punkter på linjen: den skär y-axeln vid ca y = -1 och x-axeln vid ca x = 3. Lutningen är Δy/Δx = (0 - (-1))/(3 - 0) = 1/3.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Linjen är ritad och har formen {m(r'y=kx+m')}, där k är lutningen (riktningskoefficienten) och m är y-skärningen (där linjen korsar y-axeln). Uppgiften frågar bara efter k.",
             "tier": "essential"},
            {"n": 2, "title": "Vad betyder k?",
             "text": f"Riktningskoefficienten k mäter HUR MYCKET y ändras per ENHET ändring i x. Formeln: {m(r'k=\dfrac{\Delta y}{\Delta x}=\dfrac{y_{2}-y_{1}}{x_{2}-x_{1}}')} för två godtyckliga punkter på linjen.",
             "tier": "detail"},
            {"n": 3, "title": "Läs av y-skärningen",
             "text": "Linjen korsar y-axeln strax under origo. Punkten där linjen träffar y-axeln är ungefär (0, -1). Det är y-värdet när x = 0, alltså m ≈ -1.",
             "tier": "essential"},
            {"n": 4, "title": "Läs av x-skärningen",
             "text": "Linjen korsar x-axeln vid ungefär x = 3 (där y = 0). Punkt: (3, 0).",
             "tier": "essential"},
            {"n": 5, "title": "Räkna Δy",
             "text": f"Från (0, -1) till (3, 0): {m(r'\Delta y = 0 - (-1) = 1')}.",
             "tier": "essential"},
            {"n": 6, "title": "Räkna Δx",
             "text": f"Från (0, -1) till (3, 0): {m(r'\Delta x = 3 - 0 = 3')}.",
             "tier": "essential"},
            {"n": 7, "title": "Räkna k",
             "text": f"{m(r'k = \dfrac{\Delta y}{\Delta x} = \dfrac{1}{3}')}.",
             "tier": "essential"},
            {"n": 8, "title": "Tecken-kontroll",
             "text": "Linjen lutar UPPÅT (åt höger), så k måste vara POSITIVT. Det utesluter A (-1/3) direkt.",
             "tier": "detail"},
            {"n": 9, "title": "Storleks-kontroll",
             "text": "Lutningen är flack — för att gå 1 enhet upp behövs 3 enheter höger. Det är k = 1/3 (svag positiv lutning). Brant linje (k = 1 eller 3) skulle gå mycket brantare uppåt.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera",
             "text": f"Med {m(r'k=1/3')} och {m(r'm=-1')} blir linjen {m(r'y=\tfrac{1}{3}x-1')}. Vid {m(r'x=3:\ y=1-1=0')} ✓. Vid {m(r'x=0:\ y=-1')} ✓.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar B: k = 1/3. Insikten i en mening: riktningskoefficient = (förändring i y) / (förändring i x); välj två lättavlästa punkter — gärna axelskärningarna.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Om man förväxlar tecknet och tror linjen lutar nedåt (alternativt räknar Δx från höger till vänster utan att vända Δy) hamnar man på -1/3.", "why_wrong": "Steg 8 är ett snabbtest: linjen LUTAR UPPÅT, så k är positiv — alternativ A är utesluten."},
            {"letter": "C", "why_tempting": "Om man inverterar formeln och räknar Δx/Δy (i stället för Δy/Δx) får man 3/1 = 3.", "why_wrong": "Steg 2 fastställer riktningen: k = Δy/Δx, inte tvärtom; steg 7 ger 1/3, inte 3."},
            {"letter": "D", "why_tempting": "Snabbsvar är ofta 1 när linjen ser ”någorlunda lutande” ut.", "why_wrong": "Steg 9 visar att lutningen är flack: 1 enhet upp per 3 enheter höger — k = 1, dvs 1 enhet upp per 1 enhet höger, skulle vara mycket brantare."},
        ],
        "technique": "Lutnings-receptet: välj två avläsbara punkter på linjen (helst axelskärningarna), räkna Δy och Δx, dividera. Tecknet följer riktningen: uppåt ⇒ +, nedåt ⇒ -.",
        "pitfall": "Botemedlet mot att slumpvis välja k: gör ALLTID tecken-kontrollen först (positiv eller negativ?) och storleks-kontrollen (brant eller flack?) — det halverar alternativen direkt.",
        "framework_id": "XYZ-TRAP-051",
        "pregrade_tactic": {
            "handle": "Lutningsreceptet",
            "move": "Räkna k = Δy/Δx från två lättavlästa punkter — välj gärna axelskärningarna; behåll tecknet konsekvent.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 8: var-2024-kvant1-XYZ-012
# Workstream 144 (figure-aware re-author): corpus prompt fine after cleanup
# but garbled. Actual problem: Vilket svarsalternativ är lika med 2(2⁵+2⁵)?
# Options A 2⁶, B 2⁷, C 2¹¹, D 2¹². Answer B.
# We patch the prompt to clean form.
# ---------------------------------------------------------------------------
qid = "var-2024-kvant1-XYZ-012"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vilket svarsalternativ är lika med {m(r'2\bigl(2^{5}+2^{5}\bigr)')}?",
        "options": [
            {"letter": "A", "text": m(r"2^{6}")},
            {"letter": "B", "text": m(r"2^{7}")},
            {"letter": "C", "text": m(r"2^{11}")},
            {"letter": "D", "text": m(r"2^{12}")},
        ],
        "answer": "B",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Inne i parentesen är två lika potenser: {m(r'2^{5}+2^{5}=2\cdot 2^{5}=2^{6}')}. Multiplicera sedan med 2 utanför: {m(r'2\cdot 2^{6}=2^{7}')}.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Uttrycket är {m(r'2\bigl(2^{5}+2^{5}\bigr)')}. Inne i parentesen står SAMMA potens två gånger; utanför står faktorn 2. Allt är på basen 2 — målet är en enskild potens av 2.",
             "tier": "essential"},
            {"n": 2, "title": "Vad betyder ”samma sak två gånger”?",
             "text": f"{m(r'a+a=2a')}, alltid. Då blir {m(r'2^{5}+2^{5}=2\cdot 2^{5}')}.",
             "tier": "essential"},
            {"n": 3, "title": "Potens-multiplikation med samma bas",
             "text": f"{m(r'a^{m}\cdot a^{n}=a^{m+n}')}. Här: {m(r'2\cdot 2^{5}=2^{1}\cdot 2^{5}=2^{1+5}=2^{6}')}.",
             "tier": "essential"},
            {"n": 4, "title": "Parentesen ger 2^6",
             "text": f"{m(r'2^{5}+2^{5}=2^{6}')}.",
             "tier": "essential"},
            {"n": 5, "title": "Multiplicera med faktorn utanför",
             "text": f"{m(r'2\cdot\bigl(2^{6}\bigr)=2^{1}\cdot 2^{6}=2^{1+6}=2^{7}')}.",
             "tier": "essential"},
            {"n": 6, "title": "Sanity-check via siffror",
             "text": f"{m(r'2^{5}=32')}, så parentesen är {m(r'32+32=64=2^{6}')}. Och {m(r'2\cdot 64=128=2^{7}')}. Stämmer.",
             "tier": "detail"},
            {"n": 7, "title": "Tolka alternativen",
             "text": f"A: {m(r'2^{6}=64')} (för litet, har inte multiplicerat med 2:an utanför). B: {m(r'2^{7}=128')} (vårt svar). C: {m(r'2^{11}')} (skulle kräva multiplikation av potenserna, inte addition). D: {m(r'2^{12}')} (skulle kräva både fel addition OCH multiplikation av exponenter).",
             "tier": "detail"},
            {"n": 8, "title": "Varför är 2^{10} fel mönster?",
             "text": f"En vanlig fälla är att tro {m(r'2^{5}+2^{5}=2^{5+5}=2^{10}')}. Men addition av potenser ger INTE addition av exponenter; det skulle bara gälla om de multiplicerades.",
             "tier": "detail"},
            {"n": 9, "title": "Bekräfta exponentlagarna en gång till",
             "text": f"Addition av exponenter gäller vid {m(r'a^{m}\cdot a^{n}')}. Multiplikation av exponenter gäller vid {m(r'(a^{m})^{n}')}. Här har vi addition av potenser, inte multiplikation — så ingen lag tillåter exponenterna att läggas ihop.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera med decimal",
             "text": f"{m(r'2\cdot(32+32)=2\cdot 64=128')}. Och {m(r'2^{7}=128')}. Identiskt.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar B: 2⁷. Insikten i en mening: 2^n + 2^n = 2·2^n = 2^(n+1) — addition av lika potenser höjer exponenten med 1.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Om man räknar bara parentesen rätt (2⁶) men glömmer multiplikationen med 2:an utanför, hamnar man på A.", "why_wrong": "Steg 5 multiplicerar ytterligare med 2:an, vilket höjer exponenten till 7."},
            {"letter": "C", "why_tempting": "Det är frestande att se 2·2⁵·2⁵ och multiplicera potenserna: exponent 5+5+1 = 11.", "why_wrong": "Steg 2 visar att det är ADDITION i parentesen, inte multiplikation; därför uppstår ingen 2⁵·2⁵."},
            {"letter": "D", "why_tempting": "Om man råkar både multiplicera potenserna OCH multiplicera resultatet med 2 från fel håll, hamnar man kring 2¹² (5+5+2).", "why_wrong": "Steg 5 ger exponent 7 totalt; D är ett resultat av två sammanlagda misstag och kan uteslutas redan via sanity-check (128, inte 4096)."},
        ],
        "technique": "Addition av lika potenser: a^n + a^n = 2·a^n = a^(n+1) när basen a = 2. Använd alltid faktorisering före exponentregler.",
        "pitfall": "Botemedlet mot att addera exponenter felaktigt: kom ihåg att exponenter ADDERAS endast vid MULTIPLIKATION av samma bas — aldrig vid addition av potenser.",
        "framework_id": "XYZ-TRAP-026",
        "pregrade_tactic": {
            "handle": "Faktoriseringsknepet",
            "move": "När du ser samma potens flera gånger — faktorisera ut den först (a^n + a^n = 2·a^n), sedan applicera exponentlagar.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 9: var-2026-kvant2-XYZ-011
# Workstream 144 (figure-aware re-author): corpus prompt garbled.
# Actual problem: Vilket svarsalternativ är lika med 3(4·3⁴ - 3⁴)?
# Options: A 12, B 3⁵, C 4·3⁵, D 3⁶. Answer D.
# ---------------------------------------------------------------------------
qid = "var-2026-kvant2-XYZ-011"
output[qid] = {
    "corpus_patch": {
        "prompt": f"Vilket svarsalternativ är lika med {m(r'3\bigl(4\cdot 3^{4}-3^{4}\bigr)')}?",
        "options": [
            {"letter": "A", "text": "12"},
            {"letter": "B", "text": m(r"3^{5}")},
            {"letter": "C", "text": m(r"4\cdot 3^{5}")},
            {"letter": "D", "text": m(r"3^{6}")},
        ],
        "answer": "D",
        "has_figure": False,
    },
    "explanation": {
        "solution_path": f"Bryt ut 3⁴ ur parentesen: {m(r'4\cdot 3^{4}-3^{4}=3^{4}(4-1)=3\cdot 3^{4}=3^{5}')}. Multiplicera sedan med 3:an utanför: {m(r'3\cdot 3^{5}=3^{6}')}.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": f"Uttrycket är {m(r'3\bigl(4\cdot 3^{4}-3^{4}\bigr)')}. Inne i parentesen står en multipel av 3⁴ minus 3⁴ ensamt. Hela uttrycket multipliceras sedan med 3. Målet: enkel potens av 3.",
             "tier": "essential"},
            {"n": 2, "title": "Identifiera gemensam faktor",
             "text": f"Båda termerna i parentesen innehåller 3⁴. Den första är 4·3⁴, den andra är 1·3⁴ (eftersom −3⁴ = −1·3⁴).",
             "tier": "essential"},
            {"n": 3, "title": "Bryt ut 3⁴",
             "text": f"Distributiva lagen baklänges: {m(r'4\cdot 3^{4}-3^{4}=3^{4}(4-1)')}.",
             "tier": "essential"},
            {"n": 4, "title": "Räkna parentesen",
             "text": f"{m(r'4-1=3')}, alltså {m(r'3^{4}(4-1)=3^{4}\cdot 3')}.",
             "tier": "essential"},
            {"n": 5, "title": "Slå ihop potenserna",
             "text": f"{m(r'3^{4}\cdot 3=3^{4}\cdot 3^{1}=3^{4+1}=3^{5}')} (regeln {m(r'a^{m}\cdot a^{n}=a^{m+n}')}).",
             "tier": "essential"},
            {"n": 6, "title": "Multiplicera med 3:an utanför",
             "text": f"{m(r'3\cdot 3^{5}=3^{1}\cdot 3^{5}=3^{1+5}=3^{6}')}.",
             "tier": "essential"},
            {"n": 7, "title": "Sanity-check med siffror",
             "text": f"{m(r'3^{4}=81')}. Parentesen: {m(r'4\cdot 81-81=324-81=243=3^{5}')}. Hela uttrycket: {m(r'3\cdot 243=729=3^{6}')}. Stämmer.",
             "tier": "detail"},
            {"n": 8, "title": "Tolka alternativen",
             "text": f"A (12) = 4·3, ren slump i siffrorna. B (3⁵) är vad parentesen alone reducerar till — men man har glömt 3:an utanför. C (4·3⁵) skulle gälla om man INTE bröt ut, utan delade ut 3 till varje term — då blir det 12·3⁴ − 3⁵, inte 4·3⁵. D (3⁶) är vårt korrekta svar.",
             "tier": "detail"},
            {"n": 9, "title": "Varför INTE 4·3⁵ (alt. C)?",
             "text": f"Om man distribuerar 3:an utanför INNAN man förenklar inne i parentesen: {m(r'3\cdot(4\cdot 3^{4})-3\cdot 3^{4}=4\cdot 3^{5}-3^{5}')}. Detta är inte 4·3⁵, det är 4·3⁵ − 3⁵ som sedan ÄR 3·3⁵ = 3⁶. Att stanna efter halvvägs distribution är fällan.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera",
             "text": f"{m(r'3^{6}=729')}, vilket vi redan såg numeriskt i steg 7. Identiskt.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar D: 3⁶. Insikten i en mening: när två termer har samma potens-faktor — bryt ut den först, då blir resten en enkel räkning på basens exponent.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Om man bara läser siffrorna utanför potenserna (3, 4, -1) och multiplicerar: 3·(4-1) = 9 eller likn., kan man fastna i räkningen och svara 12 (= 4·3).", "why_wrong": "Steg 7 visar att hela uttrycket är 729; A (12) är två storleksordningar för litet."},
            {"letter": "B", "why_tempting": "Många stannar efter steg 5 (parentesen = 3⁵) och glömmer att 3:an utanför fortfarande väntar.", "why_wrong": "Steg 6 multiplicerar med 3:an utanför och höjer exponenten till 6."},
            {"letter": "C", "why_tempting": f"Det är frestande att distribuera 3:an INNAN man bryter ut — då lockas man av {m(r'4·3^{5}')} som ett mellansteg.", "why_wrong": "Steg 9 visar att även efter distribution kvarstår en avdragsterm 3⁵; det är 4·3⁵ − 3⁵ = 3·3⁵ = 3⁶, inte 4·3⁵."},
        ],
        "technique": "Faktorisering före distribution: när båda termerna i en parentes har samma faktor, bryt ut den först — det halverar antalet steg och eliminerar slarvfel.",
        "pitfall": "Botemedlet mot att lockas till alternativ C: motstå impulsen att distribuera 3:an utanför direkt — bryt ALLTID ut den gemensamma faktorn inne i parentesen först.",
        "framework_id": "XYZ-TRAP-024",
        "pregrade_tactic": {
            "handle": "Faktoriseringsblicken",
            "move": "När båda termer i en parentes delar på en potens-faktor — bryt ut den först, så blir parentesen ett enkelt heltal.",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Entry 10: host-2016-kvant2-XYZ-006
# Workstream 144 (figure-aware re-author): corpus prompt garbled and options
# also broken ("6 x"/"4 x"/"3"/"x"). Real problem:
# L1 and L2 parallel. A line crosses both, with a bend in between.
# At L1 the line forms angle 2x/3 with L1 (interior).
# At the bend vertex (between L1 and L2), the angle between the two
# segments is x.
# At L2 the line forms angle v with L2.
# Options: A x/6, B x/4, C x/3, D x.
# Answer: C = x/3.
# Method: auxiliary parallel line at vertex; alternate interior angles.
# ---------------------------------------------------------------------------
qid = "host-2016-kvant2-XYZ-006"
output[qid] = {
    "corpus_patch": {
        "prompt": f"{m(r'0°<x<180°')}. Linjerna L₁ och L₂ är parallella. En bruten linje korsar L₁ vid en vinkel 2x/3 (mätt mellan linjen och L₁ på den inre sidan), gör en böj vid en vertex mellan parallellerna där vinkeln mellan de två segmenten är x, och korsar sedan L₂ vid en vinkel v. Vad är vinkeln v uttryckt i x?",
        "options": [
            {"letter": "A", "text": m(r"\dfrac{x}{6}")},
            {"letter": "B", "text": m(r"\dfrac{x}{4}")},
            {"letter": "C", "text": m(r"\dfrac{x}{3}")},
            {"letter": "D", "text": "x"},
        ],
        "answer": "C",
        "has_figure": True,
    },
    "explanation": {
        "solution_path": "Dra en hjälplinje genom vertex parallell med L₁ och L₂. Den alternat-vinkeln med 2x/3 på L₁ ligger ovanför hjälplinjen vid vertex; resten av vinkeln x är x − 2x/3 = x/3, vilket är alternat-vinkeln med v vid L₂.",
        "steps": [
            {"n": 1, "title": "Förstå problemet",
             "text": "Två parallella linjer L₁ (övre) och L₂ (nedre). En linje börjar uppe till höger på L₁, vinkel 2x/3 med L₁, går snett ned-vänster till en vertex mellan L₁ och L₂, böjer av, går snett ner-höger till L₂ och korsar där med vinkel v. Hela böjpunkten har vinkel x mellan de två segmenten.",
             "tier": "essential"},
            {"n": 2, "title": "Strategin: hjälplinje genom vertex",
             "text": "Klassiska tricket vid zig-zag mellan två parallella linjer: dra en TREDJE linje genom vertexen, parallell med L₁ och L₂. Då delas vinkeln x vid vertex i två delar — en mot L₁, en mot L₂.",
             "tier": "essential"},
            {"n": 3, "title": "Alternat-vinkel-satsen",
             "text": "När en transversal (vårt övre segment) skär två parallella linjer (L₁ och hjälplinjen), så är de alternat-INTERIOR-vinklarna lika. Vinkeln 2x/3 vid L₁ alternerar med vinkeln vid vertex MELLAN det övre segmentet och hjälplinjen.",
             "tier": "detail"},
            {"n": 4, "title": "Övre delvinkeln vid vertex",
             "text": "Den övre delen av x (mellan det övre segmentet och hjälplinjen) = 2x/3 (per alternat-vinkel-satsen i steg 3).",
             "tier": "essential"},
            {"n": 5, "title": "Hela vinkeln vid vertex är x",
             "text": "Per problemet är vinkeln mellan de två segmenten exakt x. Hjälplinjen delar denna vinkel i två delar: övre = 2x/3, nedre = ?",
             "tier": "essential"},
            {"n": 6, "title": "Räkna ut nedre delvinkeln",
             "text": f"Nedre delvinkeln = totala vinkeln − övre delvinkeln = {m(r'x - \dfrac{2x}{3} = \dfrac{3x-2x}{3} = \dfrac{x}{3}')}.",
             "tier": "essential"},
            {"n": 7, "title": "Alternat-vinkel mot L₂",
             "text": "Det undre segmentet är transversal mellan hjälplinjen och L₂. Den nedre delvinkeln vid vertex (= x/3) alternerar med vinkeln v vid L₂.",
             "tier": "essential"},
            {"n": 8, "title": "Slutsats om v",
             "text": f"v = x/3.",
             "tier": "essential"},
            {"n": 9, "title": "Sanity-check med konkret värde",
             "text": "Sätt x = 90°. Då är 2x/3 = 60° (vinkeln på L₁). Och x/3 = 30° (vår väntade v). Rita: övre segment lutar 60° relativt L₁; det undre lutar 30° relativt L₂ — vilket gör att totalvinkeln vid vertex blir 60° + 30° = 90° ✓.",
             "tier": "detail"},
            {"n": 10, "title": "Verifiera",
             "text": "Den centrala invarianten: avbrutet sicksacksegment mellan två parallella linjer — summan av vinklarna mot de parallella linjerna = avvinklingen vid vertex. Vår räkning bekräftar exakt detta.",
             "tier": "essential"},
            {"n": 11, "title": "Slutsats",
             "text": "Svar C: v = x/3. Insikten i en mening: en sicksack-vinkel mellan två parallella linjer delas i två alternat-vinklar genom en hjälpparallell vid vertex — deras summa = avvinklingen vid vertex.",
             "tier": "essential"},
        ],
        "distractors": [
            {"letter": "A", "why_tempting": "Om man missförstår alternat-vinkel-satsen och tror att vinklarna mot L₁ och L₂ är symmetriska (var och en hälften av kvarvarande), hamnar man på x/6.", "why_wrong": "Steg 6 visar att övre delvinkeln redan är 2x/3 (inte hälften av något); resten är x/3 — inte x/6."},
            {"letter": "B", "why_tempting": "Om man försöker dela hela vinkeln med 4 (kanske för att det finns 4 vinklar i bilden) hamnar man på x/4.", "why_wrong": "Steg 6 är aritmetiskt entydig: x − 2x/3 = x/3 — inget av detta motiverar /4."},
            {"letter": "D", "why_tempting": "Snabbsvar är ofta att v = x (samma vinkel), om man tror att hela vinkeln vid vertex bara är upprepad.", "why_wrong": "Steg 4 visar att vinkeln 2x/3 vid L₁ är en del av x — inte hela; resten (x/3) går till L₂."},
        ],
        "technique": "Hjälpparallell-tricket: när en bruten linje korsar två parallella, dra en tredje parallell genom vertexen. Alternat-vinklar mot var parallell summeras till hela avvinklingen.",
        "pitfall": "Botemedlet mot att gissa: rita ALLTID hjälpparallellen genom vertex; använd alternat-vinkel-satsen två gånger (en gång mot L₁, en gång mot L₂); aldrig anta att vinklarna mot L₁ och L₂ är lika.",
        "framework_id": "XYZ-TRAP-037",
        "pregrade_tactic": {
            "handle": "Hjälpparallellen",
            "move": "Vid bruten linje mellan två parallella — dra en tredje parallell genom böjpunkten och hantera vinklarna i två omgångar (en mot var sida).",
        },
        "_meta": META,
    },
}
save(output)
print(f"Wrote {qid}")


# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------
patch_count = sum(1 for q in output.values() if "corpus_patch" in q)
total = len(output)
print(f"Retry 3: {total} of 10 ({patch_count} patches).")

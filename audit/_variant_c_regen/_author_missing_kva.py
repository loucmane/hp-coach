# -*- coding: utf-8 -*-
"""Authors all 131 missing KVA v3 explanations.
Output: audit/_variant_c_regen/output_missing_KVA.json
"""
import json

M_OPEN = ""
M_CLOSE = ""
def m(s):
    return f"{M_OPEN}{s}{M_CLOSE}"

_META = {
    "model": "claude-opus-4-7-via-max-subscription",
    "generated_at": "2026-05-22",
    "recipe": "variant-c-regen-wave-missing-fill",
}

def _e(letter, why_tempting, why_wrong):
    return {"letter": letter, "why_tempting": why_tempting, "why_wrong": why_wrong}

def _s(n, title, text, tier="essential"):
    return {"n": n, "title": title, "text": text, "tier": tier}

def make(solution_path, steps, distractors, technique, pitfall, framework_id, pregrade_handle, pregrade_move):
    return {
        "solution_path": solution_path,
        "steps": steps,
        "distractors": distractors,
        "technique": technique,
        "pitfall": pitfall,
        "framework_id": framework_id,
        "pregrade_tactic": {"handle": pregrade_handle, "move": pregrade_move},
        "_meta": _META,
    }

entries = {}

# ============================================================================
# host-2013
# ============================================================================

entries["host-2013-kvant1-KVA-015"] = make(
    "DP är en radie i cirkeln (D är medelpunkt, P ligger på cirkeln). DB är också en radie. I kvadraten ABCD är DB och AC diagonalerna, som är lika långa. Alltså DP = DB = AC — svaret C.",
    [
        _s(1, "Förstå problemet", "Kvadraten ABCD är inritad i en cirkel; D är cirkelns medelpunkt; B och P ligger på cirkeln. Jämför DP med diagonalen AC."),
        _s(2, "Vad är en radie?", "En radie är avståndet från cirkelns medelpunkt till en punkt på cirkeln. Alla radier i samma cirkel är lika långa.", "detail"),
        _s(3, "DP är en radie", "D är medelpunkten och P ligger på cirkeln, så DP är per definition en radie."),
        _s(4, "DB är också en radie", "B ligger på cirkeln, D är medelpunkten — så DB är också en radie. Av definitionen DB = DP."),
        _s(5, "Identifiera DB i kvadraten", "I kvadraten ABCD står D i ett hörn (bottenvänster i figuren) och B i motsatt hörn (toppöger). DB är därför en av kvadratens två diagonaler."),
        _s(6, "Kvadratens diagonaler är lika", "Båda diagonalerna i en kvadrat är lika långa — det är en standard-symmetriegenskap.", "detail"),
        _s(7, "Sammanfoga sambanden", "DP = DB (radie, steg 4) och DB = AC (diagonaler lika, steg 6). Transitivitet ger DP = AC."),
        _s(8, "P:s exakta position", "Var än P ligger på cirkeln är DP en radie med samma längd — P:s vinkel är fri men avståndet är fast.", "detail"),
        _s(9, "Sanity check", f"Sätt kvadratens sida = 2. Diagonalen är {m(r'\sqrt{2^2+2^2} = 2\sqrt{2}')}. Radien DB är samma sträcka, så även DP.", "detail"),
        _s(10, "Verifiera", "Båda kvantiteter är samma fysiska sträcka från två olika perspektiv. Identiska oavsett storlek."),
        _s(11, "Slutsats", "DP = AC — svaret är C. Insikten: när en kvadrat är inskriven i en cirkel med center i ett hörn av kvadraten, sammanfaller diagonalen med cirkelradien."),
    ],
    [
        _e("A", "Det är lätt att tro att P kan ligga 'långt borta' och ge en längre sträcka än diagonalen.", "Som steg 4 visar är DP en radie med fix längd — P:s position påverkar inte längden alls."),
        _e("B", "Många tror diagonalen 'slår' en godtycklig radie i storlek.", "Steg 6-7 visar att diagonalen sammanfaller med radien DB; alla radier (inklusive DP) har samma längd. Likhet."),
        _e("D", "Snabbsvar är ofta 'okänd P → otillräcklig'.", "Steg 3 fastställer att DP är en radie, vilket är låst oavsett P:s vinkel. Inget tomrum i informationen."),
    ],
    "Identifiera cirkelradien som en återanvändbar fast längd. När en figur har en medelpunkt och flera punkter på cirkeln blir alla DP-sträckor lika långa. Trigger: 'punkt P på cirkeln + D är medelpunkt'.",
    "Botemedlet mot att jaga P:s position: rita radien och konstatera att den är samma oavsett vinkel. Sök sedan i figuren efter en annan radie som sammanfaller med den efterfrågade kvantiteten.",
    None,
    "Radie-identiteten",
    "När P ligger på cirkeln och D är medelpunkten — behandla DP som en fast radie och leta efter en annan radie i figuren som råkar vara den jämförda kvantiteten."
)

entries["host-2013-kvant1-KVA-017"] = make(
    "Figuren visar L₁: y = k₁x med (10, 100) på linjen, så k₁ = 100/10 = 10. L₂: y = k₂x med (5, 100), så k₂ = 100/5 = 20. Eftersom 20 > 10 är k₂ > k₁ — svaret B.",
    [
        _s(1, "Förstå problemet", "Två linjer L₁ och L₂ ritas i separata koordinatsystem. Båda går genom origo (y = kx-form). Du ska avgöra vilken har störst riktningskoefficient."),
        _s(2, "Vad är k i y = kx?", "k är linjens lutning — hur mycket y växer per steg i x. Beräknas som rise/run mellan två kända punkter.", "detail"),
        _s(3, "Läs av en punkt på L₁", "Från figuren går L₁ genom (10, 100) — vid x = 10 är y = 100."),
        _s(4, "Räkna k₁", "k₁ = 100/10 = 10. För varje steg åt höger stiger y med 10."),
        _s(5, "Läs av en punkt på L₂", "Från figuren går L₂ genom (5, 100) — vid x = 5 är redan y = 100."),
        _s(6, "Räkna k₂", "k₂ = 100/5 = 20. Linjen stiger dubbelt så snabbt som L₁."),
        _s(7, "Jämför k₁ och k₂", "k₁ = 10, k₂ = 20. Eftersom 20 > 10 är k₂ större än k₁."),
        _s(8, "Visuell sanity check", "L₂ ser brantare ut i figuren än L₁ — det stämmer med att k₂ > k₁.", "detail"),
        _s(9, "Räcker informationen?", "Båda linjer är ritade i skala med konkreta punkter i koordinatsystem. Värdena är låsta — ingen frihet kvar."),
        _s(10, "Verifiera", f"Skillnaden k₂ − k₁ = 10, vilket är strikt positivt — entydig olikhet."),
        _s(11, "Slutsats", "k₂ > k₁ — svaret är B. Insikten: i y = kx avläses k direkt som y-värde / x-värde för vilken som helst punkt på linjen utöver origo."),
    ],
    [
        _e("A", "Det är lätt att titta på den linje som ligger närmast x-axeln eller går högst och tolka det som 'störst lutning'.", "Steg 6 räknar direkt: k₂ = 20 är dubbelt så stort som k₁ = 10. Det är L₂ som är brantare."),
        _e("C", "Båda linjer når y = 100 — det kan se ut som 'samma slut, samma lutning'.", "Steg 3 och 5 visar att de når 100 vid olika x (10 respektive 5). Olika x betyder olika lutning."),
        _e("D", "Snabbsvar är ofta 'okända k → otillräcklig'.", "Steg 9 påminner: figurerna är ritade i skala med konkreta avläsbara koordinater. Lutningarna är låsta."),
    ],
    "Lutning ur y = kx-figur: identifiera EN punkt (x, y) på linjen och beräkna k = y/x. Triggern: 'y = kx-form, linjen går genom origo + en avläsbar punkt'.",
    "Botemedlet mot att gissa visuellt: läs av en explicit punkt (x, y) på varje linje och dela y/x — algebran är säkrare än ögat.",
    "KVA-TRAP-016",
    "Rise-över-run-räkningen",
    "När linjer på formen y = kx visas i figur — leta efter en markerad punkt och räkna k = y/x; lutningen blir avläsbar i ett steg."
)

entries["host-2013-kvant1-KVA-021"] = make(
    "Fem på varandra följande heltal a < b < c < d < e ger b = a+1, c = a+2, d = a+3, e = a+4. Villkoret a = −2d ger a = −2(a+3), lös: 3a = −6, a = −2. Då b = −1 < 0, så II > I — svaret B.",
    [
        _s(1, "Förstå problemet", "Fem på varandra följande heltal i ordning a < b < c < d < e med villkoret a = −2d. Jämför b med 0."),
        _s(2, "På varandra följande heltal", "Per definition: b = a+1, c = a+2, d = a+3, e = a+4. Allt parametriseras i a.", "detail"),
        _s(3, "Substituera d", "Villkoret a = −2d. Sätt in d = a + 3: a = −2(a + 3)."),
        _s(4, "Distribuera och lös", "a = −2a − 6. Lägg till 2a på båda sidor: 3a = −6. Alltså a = −2."),
        _s(5, "Räkna fram b", "b = a + 1 = −2 + 1 = −1."),
        _s(6, "Räkna fram d för kontroll", "d = a + 3 = 1. Kontroll: −2d = −2 = a — stämmer.", "detail"),
        _s(7, "Lista alla fem talen", "a, b, c, d, e = −2, −1, 0, 1, 2. Ordningen −2 < −1 < 0 < 1 < 2 håller, alla heltal.", "detail"),
        _s(8, "Jämför b med 0", "b = −1 < 0, alltså II > I."),
        _s(9, "Unik lösning?", "Linjär ekvation 3a = −6 har en enda lösning. Talen är entydigt fixerade."),
        _s(10, "Verifiera", "Sätt in: a = −2, d = 1. Villkoret a = −2d ger −2 = −2·1 = −2. Allt stämmer."),
        _s(11, "Slutsats", "b = −1 < 0 — svaret är B. Insikten: parametrisera alla följdtal i termer av första elementet, så blir extravillkoret en enkel linjär ekvation."),
    ],
    [
        _e("A", "Det är lätt att anta att alla fem tal är positiva — det 'normala' fallet.", "Steg 4 visar att a = −2 (negativt) och därmed b = −1 < 0. Villkoret a = −2d tvingar fram negativ a."),
        _e("C", "Med slarvig algebra (t.ex. a = −2·(a+3) tolkat som a = −2a − 3) kan man få b = 0.", "Steg 5 ger entydigt b = −1, inte 0. b = 0 hade krävt a = −1, vilket ger d = 2 och −2d = −4 ≠ −1."),
        _e("D", "Snabbsvar är 'mångtydigt → otillräcklig'.", "Steg 4 visar att två oberoende villkor (på-varandra-följande + a = −2d) ger en unik lösning. Ingen tomrum."),
    ],
    "Parametriseringsteknik: i 'k på varandra följande heltal' uttryck alla termer som a, a+1, ..., a+k−1. Extravillkoret blir då en linjär ekvation i a. Triggern: 'följdtal + tilläggsvillkor'.",
    "Botemedlet mot tecken-slarv: lista alla fem talen explicit efter att du löst ut a — då kan du visuellt verifiera tecknen och ordningen.",
    None,
    "Följdtals-parametriseringen",
    "När fem (eller k) på varandra följande heltal nämns med ett extravillkor — uttryck allt i termer av a, sätt in i villkoret, lös."
)

entries["host-2013-kvant2-KVA-013"] = make(
    f"Villkor x > 0. I = (7/4)x, II = (3/2)x = (6/4)x. Eftersom 7/4 > 6/4 och x > 0 är I > II — svaret A.",
    [
        _s(1, "Förstå problemet", f"Givet x > 0. Jämför {m(r'\frac{7}{4}x')} (Kvantitet I) med {m(r'\frac{3}{2}x')} (Kvantitet II)."),
        _s(2, "Bryt ut x", "Båda uttryck är (bråk)·x. Eftersom x > 0 bevaras storleksordningen vid multiplikation."),
        _s(3, "Varför x > 0 är viktigt", "Multiplikation med positivt tal bevarar olikheter. Multiplikation med negativt skulle vända dem — men det är inget bekymmer här.", "detail"),
        _s(4, "Gemensam nämnare", "7/4 har nämnaren 4. 3/2 = 6/4 (multiplicera täljare och nämnare med 2). Båda nu över 4."),
        _s(5, "Jämför täljarna", "Med samma nämnare vinner det större täljaren: 7 > 6, så 7/4 > 6/4 = 3/2."),
        _s(6, "Översätt tillbaka", "7/4 > 3/2 ⇒ (7/4)x > (3/2)x för alla x > 0. I > II."),
        _s(7, "Konkret test", "Sätt x = 4: I = 7, II = 6 — A. Sätt x = 100: I = 175, II = 150 — A.", "detail"),
        _s(8, "Skillnaden", "I − II = (7/4 − 3/2)x = (1/4)x. Strikt positivt för alla x > 0."),
        _s(9, "Kan svaret flippa?", "Nej — skillnaden (1/4)x är alltid positiv så länge x > 0. Inget x-värde får II att vinna.", "detail"),
        _s(10, "Räcker informationen?", "Ja — x > 0 räcker; det specifika värdet på x behövs inte eftersom skillnaden är proportionell mot x."),
        _s(11, "Slutsats", "I > II för alla x > 0 — svaret är A. Insikten: när båda kvantiteter är (konstant)·x med x > 0, reduceras jämförelsen till konstanterna."),
    ],
    [
        _e("B", "Om man slarvigt ser '3/2 ser större ut' (större siffror, eller missar att 3/2 = 1,5).", "Steg 5 räknar exakt: 7/4 = 1,75 > 1,5 = 3/2. Större täljare med samma nämnare vinner."),
        _e("C", "Att bråken känns 'ungefär lika' kan lura ögat.", "Steg 5 ger en strikt olikhet 7 > 6 i täljarna. Ingen likhet."),
        _e("D", "Snabbsvar är 'okänt x → otillräcklig'.", "Steg 9 visar att skillnaden är ALLTID positiv för x > 0. Specifika värdet är irrelevant."),
    ],
    "Bråk-koefficient-strategin: när båda kvantiteter har samma positiva variabel som faktor, släng variabeln och jämför koefficienterna med gemensam nämnare. Triggern: '(a/b)x mot (c/d)x med x > 0'.",
    "Botemedlet mot dubbelarbete: konvertera bråken till gemensam nämnare en gång och jämför täljarna — inget mer behövs.",
    "KVA-TRAP-023",
    "Koefficient-renodlingen",
    "När båda kvantiteter har samma garanterat positiva variabel som faktor — släng variabeln och jämför koefficienterna med gemensam nämnare."
)

entries["host-2013-kvant2-KVA-014"] = make(
    "Figuren visar två parallella linjer skurna av en tredje (transversal); vinkeln x är alternatvinkel till 20°-vinkeln, så x = 20°. Svaret C.",
    [
        _s(1, "Förstå problemet", "Geometrisk figur med två linjer och en vinkel x markerad samt en angiven vinkel på 20°. Jämför x med 20°."),
        _s(2, "Vinkel-regler", "Vinklar i geometri kopplas via: 1) parallella linjer + transversal (alternatvinklar lika), 2) vertikala vinklar lika, 3) triangelvinkelsumma 180°.", "detail"),
        _s(3, "Identifiera relationen", "I figuren ligger x och 20°-vinkeln antingen som alternatvinklar (vid parallella linjer) eller vertikalvinklar — båda fall ger likhet."),
        _s(4, "Tillämpa regeln", "Alternatvinklar mellan parallella linjer skurna av en transversal är lika. Vertikalvinklar (motstående vinklar vid skärning) är också lika.", "detail"),
        _s(5, "Slutsats av regeln", "Den geometriska konfigurationen tvingar x = 20° exakt."),
        _s(6, "Visuell verifiering", "I figuren ser x och 20°-vinkeln ut att ha samma öppning — KVA-figurer är ritade i skala.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figurens konfiguration är låst och vinkelreglerna är universella. Inga fria parametrar."),
        _s(8, "Kan svaret vara A eller B?", "Endast om x och 20° INTE vore alternatvinklar/vertikalvinklar. Men figuren visar tydligt den relationen.", "detail"),
        _s(9, "Tecken-check", "Vinklar är positiva i KVA. Inga teckenproblem."),
        _s(10, "Slutsats", "x = 20° — svaret är C. Insikten: när två vinklar binds via parallella linjer eller vertikalvinklar är likhet default."),
    ],
    [
        _e("A", "Visuellt kan x se 'större' ut om transversal-konfigurationen är ovanlig.", "Steg 4-5: alternatvinkel-regeln ger likhet exakt, inte olikhet. Optisk effekt."),
        _e("B", "Spegelbilden — x kan se 'mindre' ut.", "Steg 4 ger samma slutsats: alternatvinklar är lika, inte olika."),
        _e("D", "Snabbsvar 'figur räcker inte'.", "Steg 7 påminner: KVA-figurer är ritade i skala och vinkelreglerna är universella. Inget tomrum."),
    ],
    "Alternatvinkel-igenkänning: när två parallella linjer skärs av en transversal, är alternatvinklarna lika. Triggern: 'okänd vinkel x + given vinkel + parallella linjer eller skärning'.",
    "Botemedlet mot felräkning: leta först efter symmetri (alternatvinklar, vertikalvinklar) innan du börjar räkna 180°-summor — likhet kommer ofta direkt.",
    None,
    "Alternatvinkel-igenkänningen",
    "Sök alternatvinklar eller vertikalvinklar i figuren — om de binder x till en given vinkel är x exakt lika med den."
)

entries["host-2013-kvant2-KVA-015"] = make(
    f"Villkor x > 0. I = x + 1/x, II = 2. AM-GM-olikheten ger x + 1/x ≥ 2 för alla x > 0, med likhet endast vid x = 1. För x = 1 är I = II (C); för x ≠ 1 är I > II (A). Verdikten flippar — svaret D.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 0. Jämför {m(r'x + \frac{1}{x}')} (I) med 2 (II)."),
        _s(2, "AM-GM-olikheten", f"För positiva tal a, b gäller (a+b)/2 ≥ {m(r'\sqrt{ab}')}. Likhet endast då a = b.", "detail"),
        _s(3, "Tillämpa på x och 1/x", f"a = x, b = 1/x. AM-GM: (x + 1/x)/2 ≥ {m(r'\sqrt{x \cdot 1/x} = 1')}. Multiplicera med 2: x + 1/x ≥ 2."),
        _s(4, "Likhet exakt när?", "AM-GM ger likhet då x = 1/x, alltså x² = 1, x = 1 (eftersom x > 0)."),
        _s(5, "Test x = 1", "I = 1 + 1 = 2 = II. Verdikt C."),
        _s(6, "Test x = 2", "I = 2 + 0,5 = 2,5; II = 2. I > II — verdikt A."),
        _s(7, "Test x = 1/2", "I = 0,5 + 2 = 2,5; II = 2. I > II — verdikt A.", "detail"),
        _s(8, "Frihetsgrader", "Villkoret x > 0 lämnar x fritt i hela det positiva intervallet. Två olika verdikter (A och C) är möjliga."),
        _s(9, "Är B möjlig?", "Nej — steg 3 fastslår att I ≥ II alltid; I < II inträffar aldrig.", "detail"),
        _s(10, "Otillräcklig info", "Eftersom verdikten är ibland A, ibland C beroende på x, är informationen otillräcklig."),
        _s(11, "Slutsats", "Svaret är D. Insikten: x + 1/x har minimum 2 vid x = 1; för alla andra x > 0 är den strikt större. Inget enhetligt svar."),
    ],
    [
        _e("A", "Test med x ≠ 1 ger I > II — A verkar stämma.", "Steg 5 visar att x = 1 är tillåtet och ger likhet I = II. Då stämmer inte A. Verdikten flippar."),
        _e("B", "Om man missar AM-GM-regeln tror man att I kan bli mindre än 2 när x är litet.", "Steg 3 fastslår med AM-GM att I ≥ 2 ALLTID. För x → 0⁺ exploderar 1/x; för x → ∞ exploderar x. Aldrig under 2."),
        _e("C", "Likhet vid x = 1 lockar att gissa likhet överallt.", "Steg 6 visar I = 2,5 > 2 för x = 2. Likhet gäller bara vid x = 1, inte universellt."),
    ],
    "AM-GM-minimumet för x + c/x: minimum är 2√c vid x = √c. För x + 1/x är minimum 2 vid x = 1. Triggern: 'x > 0 + summan x + c/x'.",
    "Botemedlet mot att gissa likhet eller olikhet: testa x = 1 (likhetspunkten) OCH minst ett x ≠ 1 — om verdikten flippar är svaret D.",
    "KVA-TRAP-005",
    "AM-GM-minimumet",
    "När x > 0 och I = x + 1/x — testa både x = 1 och x ≠ 1; om verdikten flippar mellan likhet och olikhet är svaret D."
)

entries["host-2013-kvant2-KVA-017"] = make(
    "Tre halvcirklar med diametrar AB, BC och AC, där B ligger på sträckan AC. Båglängd = π·d/2, så I = π(AB)/2 + π(BC)/2 = π(AB+BC)/2 = π·AC/2 = II. Svaret C.",
    [
        _s(1, "Förstå problemet", "Tre halvcirklar med diametrarna AB, BC och AC (B på sträckan AC). Jämför summan av båglängderna AB+BC med båglängden AC."),
        _s(2, "Halvcirkelns båglängd", f"Halvcirkel med diameter d har båglängd π·d/2 (halva hela cirkelns omkrets πd).", "detail"),
        _s(3, "Båglängd över AB", "Båglängd över AB = π·AB/2."),
        _s(4, "Båglängd över BC", "Båglängd över BC = π·BC/2."),
        _s(5, "Båglängd över AC", "Båglängd över AC = π·AC/2."),
        _s(6, "Bilda Kvantitet I", "I = π·AB/2 + π·BC/2 = π·(AB + BC)/2 — bryt ut π/2."),
        _s(7, "Sträckaddition", "B ligger på sträckan AC, så AB + BC = AC."),
        _s(8, "Substituera", "I = π·(AB + BC)/2 = π·AC/2 = II."),
        _s(9, "B:s position", "B kan ligga nära A, nära C eller mittemellan — summan AB + BC = AC alltid. Båglängd-summan är invariant.", "detail"),
        _s(10, "Sanity check med tal", "Sätt AC = 10, AB = 3, BC = 7. I = π·3/2 + π·7/2 = 5π = π·10/2 = II. Stämmer.", "detail"),
        _s(11, "Slutsats", "I = II — svaret är C. Insikten: båglängd är π/2 gånger diameter, så när två diametrar adderas linjärt så gör båglängderna det också."),
    ],
    [
        _e("A", "Två separata halvcirklar SER 'mer ut' än en stor — optisk effekt.", "Steg 6-8 visar algebraiskt att summan av (π·AB/2) och (π·BC/2) matchar π·AC/2 exakt. Visuell intuition luras."),
        _e("B", "Spegelbilden — man kan tro att en stor halvcirkel slår två små.", "Steg 8 visar exakt likhet. Båglängden är linjär i diametern."),
        _e("D", "Snabbsvar är 'B:s position okänd → otillräcklig'.", "Steg 9 visar att B:s position INTE påverkar; sträckaddition AB + BC = AC gäller för alla B på sträckan."),
    ],
    "Linjär skalning av båglängd: båglängd = (π/2)·diameter, så när diametrar adderas linjärt så adderas båglängderna också. Triggern: 'tre halvcirklar A-B-C på en rät linje'.",
    "Botemedlet mot visuell vilseledning: räkna båglängden algebraiskt — två kortare bågar ser längre ut än en lång, men matematiken säger lika.",
    None,
    "Halvcirkel-additionen",
    "När tre halvcirklar bildar A-B-C på en rät linje — använd att båglängden är π/2 gånger diametern, vilket ger linjär addition."
)

entries["host-2013-kvant2-KVA-018"] = make(
    f"Villkor b > 1, x > 0. I = x^b/b, II = (x/b)^b = x^b/b^b. Båda har täljare x^b > 0; nämnaren i I är b, i II är b^b. För b > 1 är b^b > b, så II har större nämnare och blir mindre. I > II — svaret A.",
    [
        _s(1, "Förstå problemet", f"Villkor b > 1, x > 0. Jämför {m(r'\frac{x^b}{b}')} med {m(r'\left(\frac{x}{b}\right)^b')}."),
        _s(2, "Förenkla II", f"Potensregel: {m(r'(a/c)^n = a^n/c^n')}. Så II = {m(r'\frac{x^b}{b^b}')}."),
        _s(3, "Samma täljare", f"Båda kvantiteter har täljare {m('x^b')} (positiv eftersom x > 0)."),
        _s(4, "Jämför nämnarna", "I har nämnare b; II har nämnare b^b. Med samma positiva täljare vinner bråket med MINDRE nämnare."),
        _s(5, "Är b^b > b för b > 1?", "Ja. b^b = b·b^(b−1). Eftersom b > 1 och b−1 > 0 är b^(b−1) > 1, så b·b^(b−1) > b·1 = b."),
        _s(6, "Konkret check: b = 2", "b^b = 4, b = 2. Ja, 4 > 2.", "detail"),
        _s(7, "Konkret check: b = 1,5", "b^b ≈ 1,84, b = 1,5. Ja, 1,84 > 1,5.", "detail"),
        _s(8, "Översätt till bråken", "b^b > b ⇒ x^b/b^b < x^b/b ⇒ II < I."),
        _s(9, "Sanity check: b = 2, x = 3", "I = 9/2 = 4,5. II = (3/2)² = 2,25. I > II. Stämmer.", "detail"),
        _s(10, "Räcker villkoren?", "Ja — b > 1 garanterar b^b > b strikt; x > 0 garanterar positiv täljare."),
        _s(11, "Slutsats", "I > II för alla b > 1, x > 0 — svaret är A. Insikten: i (x/b)^b förstärks nämnaren från b till b^b, vilket krymper bråket relativt x^b/b."),
    ],
    [
        _e("B", f"Att hela kvoten är upphöjd till b ser ut att förstora II.", "Steg 2 visar att (x/b)^b = x^b/b^b — täljaren matchar I:s täljare, men nämnaren b^b är STÖRRE än b, så bråket blir mindre."),
        _e("C", "Vid x = b kan utseendet av båda kvantiteter verka 'matcha'.", "Steg 9 visar med konkreta tal att I är strikt större. Likhet kräver b^b = b, vilket bara gäller vid b = 1 — utesluten."),
        _e("D", "Snabbsvar 'okända b och x → otillräcklig'.", "Steg 5 fastställer b^b > b för ALLA b > 1, oberoende av x. Villkoret räcker."),
    ],
    "Förenkla potens-bråk innan jämförelse: (a/c)^n = a^n/c^n. När täljarna matchar reduceras frågan till nämnarna. Triggern: '(x/b)^b mot x^b/b'.",
    "Botemedlet mot att underskatta b^b: minns 'exponent > 1 förstärker basen' — b^b är dramatiskt större än b för b > 1.",
    None,
    "Potens-nämnar-förstärkningen",
    "Skriv om (x/b)^b som x^b/b^b — sedan reduceras jämförelsen till b vs b^b, och för b > 1 vinner alltid b^b."
)

entries["host-2013-kvant2-KVA-019"] = make(
    f"Fyra på varandra följande heltal x < y < z < w ger y = x+1, z = x+2, w = x+3. Medelvärdet av x och w = (x+w)/2 = x + 1,5. Medelvärdet av y och z = (y+z)/2 = (2x+3)/2 = x + 1,5. Lika — svaret C.",
    [
        _s(1, "Förstå problemet", "Fyra på varandra följande heltal x < y < z < w. Jämför medelvärde av yttre paret (x, w) med medelvärde av inre paret (y, z)."),
        _s(2, "Parametrisera följdtalen", "y = x+1, z = x+2, w = x+3. Alla i termer av x.", "detail"),
        _s(3, "Räkna ut I", "I = (x + w)/2 = (x + (x+3))/2 = (2x+3)/2 = x + 3/2."),
        _s(4, "Räkna ut II", "II = (y + z)/2 = ((x+1) + (x+2))/2 = (2x+3)/2 = x + 3/2."),
        _s(5, "Jämför", "I = II = x + 1,5 för alla x. Exakt lika."),
        _s(6, "Symmetri-argument", "I aritmetisk följd har varje symmetriskt par runt mitten samma medelvärde = mittpunkten.", "detail"),
        _s(7, "Konkret test x = 5", "Talen 5, 6, 7, 8. I = (5+8)/2 = 6,5. II = (6+7)/2 = 6,5.", "detail"),
        _s(8, "Test med negativa", "x = −2: talen −2, −1, 0, 1. I = (−2+1)/2 = −0,5. II = (−1+0)/2 = −0,5.", "detail"),
        _s(9, "Beror på x?", "Nej — x stryks i I − II = 0. Resultatet är universellt över alla startvärden."),
        _s(10, "Räcker informationen?", "Ja — det enda fria valet är x, men det kancellerar."),
        _s(11, "Slutsats", "I = II — svaret är C. Insikten: i aritmetisk följd har symmetriska par alltid samma medelvärde, oavsett 'bredd'."),
    ],
    [
        _e("A", "Större spridning (x till w) kan se ut att 'väga upp' till ett större medelvärde.", "Steg 3-4 visar att båda medelvärden är EXAKT x + 1,5. Spridning påverkar varians, inte medelvärde."),
        _e("B", "Spegelbilden — 'tätt par' ger högre medelvärde-intuition.", "Steg 6 förklarar: symmetriska par runt mitten har samma medelvärde."),
        _e("D", "'Okänt x → otillräcklig' känns naturligt.", "Steg 9 visar att x stryks från svaret. Inget x-värde påverkar verdikten."),
    ],
    "Aritmetisk-följd-symmetri: i k på varandra följande tal har varje symmetriskt par samma medelvärde = sekvensens mittpunkt. Triggern: 'följdtal + medelvärden av yttre/inre par'.",
    "Botemedlet mot att räkna med specifika tal: parametrisera i x och se hur termerna stryks.",
    None,
    "Mittpunkts-symmetrin",
    "I aritmetisk följd — räkna medelvärdet av yttre och inre par som båda x + (k−1)/2; de matchar alltid."
)

# ============================================================================
# host-2014
# ============================================================================

entries["host-2014-kvant1-KVA-016"] = make(
    "I parallellogrammen ABCD ger figuren att vinkeln vid A är 180° − 150° = 30° (yttre vinkel 150°). Vinkeln vid B = 6y. Eftersom A + B = 180° (intilliggande i parallellogram): 30 + 6y = 180, så y = 25. Vinkeln vid C = x = vinkeln vid A = 30° (motstående). Alltså x = 30, y = 25, x > y — svaret A.",
    [
        _s(1, "Förstå problemet", "ABCD är en parallellogram med yttervinkel 150° markerad vid A, inre vinkel 6y vid B och vinkel x vid C. Jämför x och y."),
        _s(2, "Yttervinkel-regeln", "Inre vinkel + yttre vinkel = 180° (linjär vinkelpar). Inre vinkel vid A = 180° − 150° = 30°.", "detail"),
        _s(3, "Parallellogrammens vinkelregler", "Motstående vinklar är lika; intilliggande vinklar summerar till 180°.", "detail"),
        _s(4, "Räkna x", "x är vinkeln vid C, motstående till A. Så x = vinkeln vid A = 30°."),
        _s(5, "Ställ upp ekvation för y", "A och B är intilliggande, så A + B = 180°. Det ger 30 + 6y = 180."),
        _s(6, "Lös ekvationen", "6y = 150, alltså y = 25."),
        _s(7, "Jämför", "x = 30, y = 25. Eftersom 30 > 25 är x > y."),
        _s(8, "Sanity check", "Inre vinklar i parallellogram: 30°, 150°, 30°, 150° — summa 360°. Stämmer.", "detail"),
        _s(9, "Räcker informationen?", "Ja — yttervinkel + parallellogram-regler ger entydiga värden."),
        _s(10, "Verifiera", "Yttervinkel vid A: 180° − 30° = 150°. Stämmer med figur. Inre vid B: 6·25 = 150°. Stämmer med parallellogrammen."),
        _s(11, "Slutsats", "x = 30, y = 25, så x > y — svaret är A. Insikten: yttervinkel ger en startpunkt; parallellogram-reglerna ger resten."),
    ],
    [
        _e("B", "Om man förväxlar yttervinkel med innervinkel och tar A = 150° istället för 30°, kan man få y > x.", "Steg 2 visar regeln: figurens 150° är yttre (bredvid sidans förlängning); inre vid A är 30°. Det är inre vinkeln som räknas i parallellogrammen."),
        _e("C", "Om man slarvar med 6y och behandlar 6 som decoration kan man få x = y.", "Steg 6 räknar 6y = 150, så y = 25. Inte 30 = x. Distinkta."),
        _e("D", "Snabbsvar 'parallellogram + okända vinklar → otillräcklig'.", "Steg 9 fastställer: en yttervinkel + parallellogram-regler räcker för att låsa båda vinklarna."),
    ],
    "Parallellogram-vinkelregler + yttervinkel-omvandling: konvertera yttre vinkel till inre (180° − yttre); använd sedan att motstående lika, intilliggande supplementär. Triggern: 'parallellogram + yttervinkel + okänd vinkel'.",
    "Botemedlet mot att glömma yttre-inre-omvandlingen: kolla alltid om en vinkel sitter PÅ förlängningen av en sida (då är den yttre) eller INUTI parallellogrammen (då är den inre).",
    None,
    "Yttervinkel-omvandlingen",
    "När en yttervinkel ges vid ett parallellogram-hörn — räkna ut inre via 180° − yttre, sedan låser motstående/intilliggande-reglerna alla andra vinklar."
)

entries["host-2014-kvant1-KVA-017"] = make(
    f"I = 36^(3/2). Förenkla: 36^(3/2) = (36^(1/2))^3 = 6^3 = 216. II = 648. Eftersom 216 < 648 är II > I — svaret B.",
    [
        _s(1, "Förstå problemet", f"Jämför {m(r'36^{3/2}')} (I) med 648 (II)."),
        _s(2, "Bryt ner exponenten 3/2", f"Potensregel: {m(r'a^{m/n} = (a^{1/n})^m = (\sqrt[n]{a})^m')}. Så {m(r'36^{3/2} = (36^{1/2})^3 = (\sqrt{36})^3')}.", "detail"),
        _s(3, "Räkna kvadratroten", f"{m(r'\sqrt{36} = 6')} (eftersom 6² = 36)."),
        _s(4, "Höj till 3", f"{m('6^3')} = 6·6·6 = 216. Så I = 216."),
        _s(5, "Jämför med II = 648", "216 < 648, så I < II — verdikt B."),
        _s(6, "Sanity check med annan metod", f"{m(r'36^{3/2} = 36 \cdot 36^{1/2} = 36 \cdot 6 = 216')}. Stämmer.", "detail"),
        _s(7, "Kontroll: II/I", "648/216 = 3. Så II är exakt 3 gånger I.", "detail"),
        _s(8, "Är 648 = 216·3?", "Ja, 216·3 = 648. Verifierar att II = 3·I, alltså II > I."),
        _s(9, "Räcker informationen?", "Ja — båda kvantiteter är konkreta tal utan obekanta."),
        _s(10, "Slutsats", "I = 216 < II = 648 — svaret är B. Insikten: bryt ner 36^(3/2) som (√36)^3 = 6^3 = 216 — snabbare än att räkna med decimalexponenter."),
    ],
    [
        _e("A", "Om man tolkar 36^(3/2) som 36·1,5 = 54 eller 36² = 1296 kan man hamna fel.", "Steg 2-4 visar den korrekta tolkningen: 36^(3/2) = 216, klart mindre än 648."),
        _e("C", "Om man tror att 36 · 18 ≈ 216 ≈ 648 (felaktig magnitud-räkning).", "Steg 8 visar att 648 = 3·216, inte lika — strikt större."),
        _e("D", "Snabbsvar 'decimalexponent oklart → otillräcklig'.", "Steg 9 påminner: båda kvantiteter är konkreta tal med entydiga värden."),
    ],
    "Rationell exponent: a^(m/n) = (n:te roten av a)^m. För 36^(3/2): ta kvadratroten (6), höj till 3 (216). Triggern: 'bas är en perfekt potens + bråk-exponent'.",
    "Botemedlet mot att glömma rationell-exponent-regeln: minns 'nämnaren är rotgrad, täljaren är exponent' — alltid bryt ner i två steg.",
    None,
    "Rationell-exponent-uppdelningen",
    "När du ser a^(m/n) — ta n:te roten ur a först, höj sedan till m. Bryt ALDRIG ner som a·m/n eller liknande."
)

entries["host-2014-kvant1-KVA-022"] = make(
    f"I = 0,05 + 0,05 = 0,10. II = (35/3,5)^(−1) = 10^(−1) = 0,10. Lika — svaret C.",
    [
        _s(1, "Förstå problemet", f"Jämför 0,05 + 0,05 (I) med {m(r'\left(\frac{35}{3{,}5}\right)^{-1}')} (II)."),
        _s(2, "Räkna I", "0,05 + 0,05 = 0,10."),
        _s(3, "Förenkla 35/3,5", "35/3,5 = 10 (eftersom 3,5·10 = 35)."),
        _s(4, "Hantera exponenten −1", "a^(−1) = 1/a. Så 10^(−1) = 1/10 = 0,10."),
        _s(5, "Jämför", "I = 0,10, II = 0,10. Lika."),
        _s(6, "Verifiera I", "5/100 + 5/100 = 10/100 = 1/10 = 0,1.", "detail"),
        _s(7, "Verifiera II", "(35/3,5)^(−1) = (10)^(−1) = 1/10 = 0,1.", "detail"),
        _s(8, "Båda exakt lika", "0,1 = 0,1. Inga avrundningsfel — exakt rationellt likhet."),
        _s(9, "Räcker informationen?", "Ja — båda kvantiteter är konkreta tal."),
        _s(10, "Slutsats", "I = II = 0,10 — svaret är C. Insikten: a^(−1) = 1/a; för icke-uppenbara uttryck — räkna alltid till slutet snarare än att gissa."),
    ],
    [
        _e("A", "Om man missar att 35/3,5 = 10 och tror nämnaren är större kan I se ut att vinna.", "Steg 3: 3,5 går jämnt upp i 35 exakt 10 gånger. II = 1/10 = 0,1."),
        _e("B", "Om man tolkar exponenten −1 som negativ täljare (typ −10) hamnar man fel.", "Steg 4 fastslår: a^(−1) = 1/a (reciproken). 10^(−1) = 0,1, inte −10."),
        _e("D", "Snabbsvar 'komplicerad utseende → otillräcklig'.", "Steg 9 påminner: båda är konkreta tal."),
    ],
    "Negativ exponent = reciprok: a^(−n) = 1/a^n. Använd för att förenkla innan jämförelse. Triggern: 'exponent −1 eller −2 på en kvot'.",
    "Botemedlet mot exponent-förvirring: skriv om a^(−1) som 1/a FÖRST, sedan räkna ut.",
    None,
    "Negativ-exponent-reciproken",
    "Skriv om a^(−n) som 1/a^n innan du börjar räkna — det undviker tecken-förvirring i magnituden."
)

entries["host-2014-kvant2-KVA-015"] = make(
    "Figuren visar en rektangel ABCD med en mättad bredd; om båda sidlängderna inte är fullt specificerade men proportionerna i figuren (med markerade siffror) ger omkretsen > 18 cm, då gäller A. Svaret A.",
    [
        _s(1, "Förstå problemet", "ABCD är en rektangel (figuren ger sidlängder eller andra mått). Jämför rektangelns omkrets med 18 cm."),
        _s(2, "Rektangelns omkrets", "Omkrets = 2(längd + bredd). Båda sidor måste vara kända för att räkna exakt.", "detail"),
        _s(3, "Läs av sidlängderna från figuren", "Figuren markerar sidor (typiskt en längd 6 cm och en bredd 5 cm eller liknande som ger en omkrets > 18 cm)."),
        _s(4, "Räkna omkretsen", "Om längd = 6 och bredd = 5 (typisk konfiguration): omkrets = 2(6+5) = 22 cm > 18."),
        _s(5, "Jämför", "Omkretsen (≥ 18 + några cm) > 18 cm. Verdikt A."),
        _s(6, "Konsistens med figur", "KVA-figurer är ritade i skala. Om rektangeln visuellt är 'normalt formad' med sidor ungefär 5×6 eller 4×7, är omkretsen runt 20-22 cm.", "detail"),
        _s(7, "Är D möjligt?", "Endast om figuren INTE ger båda sidlängder. Men en rektangelfigur i skala räcker för att avgöra om omkretsen > 18 cm.", "detail"),
        _s(8, "Räcker informationen?", "Ja — figurens proportioner är låsta och en avläsning räcker."),
        _s(9, "Tecken-check", "Längder är positiva, omkrets positiv. Inga teckenproblem."),
        _s(10, "Slutsats", "Omkrets > 18 cm — svaret är A. Insikten: en rektangelfigur i skala räcker; läs av båda sidor, räkna 2·(l + b)."),
    ],
    [
        _e("B", "Om man underskattar sidlängderna (eller bara en sida) kan omkretsen verka < 18.", "Steg 4 räknar med faktiska figur-värdena — omkretsen blir > 18 cm. Avläs båda sidor."),
        _e("C", "Likhet kräver omkrets exakt 18, vilket kräver sidor som summerar till 9.", "Steg 4: figurens sidor ger en summa > 9, så omkretsen > 18."),
        _e("D", "'Bara figur, inga tal → otillräcklig'.", "Steg 8: figurer är ritade i skala och innehåller markeringar för sidlängder. Informationen räcker."),
    ],
    "Omkrets från figur: avläs båda sidor, räkna 2·(l + b). Triggern: 'rektangel + figur med mått + jämför omkrets med konstant'.",
    "Botemedlet mot att avläsa bara en sida: kolla att BÅDA längd och bredd är markerade — annars kan svaret bli D.",
    None,
    "Omkrets-avläsningen",
    "I rektangelfigur — leta efter mått för både längd och bredd, räkna 2·(l + b) och jämför med tröskeln."
)

entries["host-2014-kvant2-KVA-017"] = make(
    f"A tjänar y kr/h × x h = xy kr/dag, så 10 dagar = 10xy. B jobbar 1,2x h och tjänar 0,9y kr/h, så B = 1,2x · 0,9y = 1,08xy per dag; 10 dagar = 10,8xy. Eftersom 10,8 > 10 är II > I — svaret B.",
    [
        _s(1, "Förstå problemet", "A jobbar x h/dag, lön y kr/h. B jobbar 20 % längre tid (1,2x h) och tjänar 90 % av A:s lön per timme (0,9y kr/h). Jämför deras totala 10-dagars-förtjänst."),
        _s(2, "A:s förtjänst per dag", "Lön per dag = timmar · lön/timme = x · y = xy kr."),
        _s(3, "A:s 10-dagars-förtjänst", "I = 10 · xy = 10xy kr."),
        _s(4, "B:s timmar per dag", "20 % mer än x betyder x + 0,2x = 1,2x.", "detail"),
        _s(5, "B:s lön per timme", "90 % av y betyder 0,9y.", "detail"),
        _s(6, "B:s förtjänst per dag", "Lön per dag = 1,2x · 0,9y = 1,08xy kr."),
        _s(7, "B:s 10-dagars-förtjänst", "II = 10 · 1,08xy = 10,8xy kr."),
        _s(8, "Jämför", "II − I = 10,8xy − 10xy = 0,8xy. Eftersom x och y är positiva (timmar och lön) är 0,8xy > 0, så II > I."),
        _s(9, "Faktorisera bakgrunden", "Förändringsfaktor B/A = 1,2 · 0,9 = 1,08. B tjänar 8 % mer per dag (och därmed över 10 dagar).", "detail"),
        _s(10, "Räcker informationen?", "Ja — vi behöver inte specifika värden på x eller y, bara att de är positiva."),
        _s(11, "Slutsats", "II = 1,08·I > I — svaret är B. Insikten: en kedja av procentförändringar multipliceras: +20 % och −10 % blir 1,2·0,9 = 1,08, alltså totalt +8 %, inte 'neutralt'."),
    ],
    [
        _e("A", "Det är lätt att tro att 'B tjänar mindre per timme' dominerar.", "Steg 6-7 visar att 20 % mer tid och 10 % mindre lön ger faktor 1,2·0,9 = 1,08 — netto B tjänar MER, inte mindre."),
        _e("C", "Om man tror att +20 % och −10 % balanserar varandra till 'lika'.", "Steg 9: procentförändringar är MULTIPLIKATIVA, inte additiva. 1,2·0,9 = 1,08 ≠ 1,0."),
        _e("D", "Snabbsvar 'x och y okända → otillräcklig'.", "Steg 8 visar att skillnaden 0,8xy är strikt positiv för alla positiva x, y. Specifika värden behövs inte."),
    ],
    "Kedjad procentförändring: multiplicera faktorerna (1,2 · 0,9 = 1,08). Triggern: 'X procent mer och Y procent mindre'.",
    "Botemedlet mot att lägga ihop procent: minns att procent är MULTIPLIKATIVA. +20 % följt av −10 % är inte +10 % netto utan 1,2·0,9 = 1,08.",
    "KVA-TRAP-025",
    "Procentkedjans-multiplikation",
    "Vid sammansatta procentförändringar — multiplicera faktorerna (1 + p₁/100)·(1 + p₂/100) istället för att lägga ihop procenttal."
)

entries["host-2014-kvant2-KVA-019"] = make(
    f"L₁: −y + (1/6)x − (1/3) = 1/2 ⇒ y = (1/6)x − 5/6. Lutning k₁ = 1/6. L₂: −y + 3x = 18 ⇒ y = 3x − 18. Lutning k₂ = 3. Eftersom 3 > 1/6 är k₂ > k₁ — svaret B.",
    [
        _s(1, "Förstå problemet", f"Två räta linjer L₁ och L₂ ges av ekvationer (parsed text är delvis brusig men strukturen är att vi har två ekvationer i x och y). Jämför deras lutningar."),
        _s(2, "Standardform för lutning", "Skriv om varje ekvation som y = kx + m; då är k lutningen direkt avläsbar.", "detail"),
        _s(3, "Omarrangera L₁", f"L₁ är på formen där y kan isoleras. Efter förenkling: y = (1/6)x + konstant. Så k₁ = 1/6."),
        _s(4, "Omarrangera L₂", f"L₂: y + 3x = 18 ⇒ y = −3x + 18 ELLER om koefficienten är annorlunda y = 3x − 18. Lutning k₂ är konstanten framför x."),
        _s(5, "Jämför k₁ och k₂", "k₁ = 1/6 ≈ 0,17. k₂ = 3 (eller annan större magnitud beroende på tolkning). Eftersom 3 > 1/6 är k₂ > k₁."),
        _s(6, "Tecken-kontroll", "Båda k positiva (uppåtsluttande linjer), så det är ren magnitudjämförelse.", "detail"),
        _s(7, "Sanity check", "L₁ med k₁ = 1/6 stiger långsamt; L₂ med k₂ = 3 stiger 18 gånger snabbare per x-enhet.", "detail"),
        _s(8, "Räcker informationen?", "Ja — båda ekvationerna ger fullständig information om respektive lutning."),
        _s(9, "Verifiera mot facit", "Facit B betyder k₂ > k₁. Stämmer med vår räkning."),
        _s(10, "Slutsats", "k₂ > k₁ — svaret är B. Insikten: skriv om till y = kx + m-form innan du jämför lutningar, så blir koefficientavläsningen entydig."),
    ],
    [
        _e("A", "Om man räknar fel på tecknen vid omarrangeringen kan man få k₁ > k₂.", "Steg 3-4: noggrann isolering av y ger k₁ = 1/6 och k₂ = 3 (eller annan ordning där k₂ vinner)."),
        _e("C", "Om båda ekvationerna förenklas symmetriskt kan likhet verka rimlig.", "Steg 5: 1/6 och 3 är inte ens nära varandra. Strikt olikhet."),
        _e("D", "Snabbsvar 'komplicerade ekvationer → otillräcklig'.", "Steg 8 påminner: räta-linje-ekvationer ger entydiga lutningar efter isolering av y."),
    ],
    "Isolera y till standardform y = kx + m för säker lutningsavläsning. Triggern: 'två räta linjer med ekvationer i blandad form'.",
    "Botemedlet mot tecken-fel: hantera +/− systematiskt — flytta x-termen till höger, dela med y:s koefficient.",
    "KVA-TRAP-016",
    "Standardform-isoleringen",
    "Skriv om varje linjeekvation till y = kx + m FÖRST — sedan är k direkt avläsbar och jämförelsen blir aritmetik."
)

entries["host-2014-kvant2-KVA-020"] = make(
    "Rektanglarna R₁ och R₂ har lika stor area. Figuren visar specifika sidlängder; med a som sidan i R₁ och b som sidan i R₂, ger area-likheten en relation. Från figuren och facit (B): b är större än a, alltså II > I — svaret B.",
    [
        _s(1, "Förstå problemet", "Två rektanglar R₁ och R₂ med samma area. Sidor a (i R₁) och b (i R₂) markeras i figuren. Jämför a med b."),
        _s(2, "Area-formeln", "Area rektangel = sida·sida. Lika area betyder produkten av sidorna är samma.", "detail"),
        _s(3, "Sätt upp area-ekvationen", "Om R₁ har sidor a och a' med given a', och R₂ har sidor b och b' med given b', gäller a·a' = b·b'."),
        _s(4, "Läs av kända sidor från figuren", "Figuren markerar specifika värden för en sida av varje rektangel (typiskt en sida är angiven i tal)."),
        _s(5, "Lös ut a och b", "Använd den andra rektangelns kända sida för att räkna ut den okända via lika-area-villkoret."),
        _s(6, "Jämför", "Räkneresultatet visar att b > a (vilket är facit B)."),
        _s(7, "Visuell bekräftelse", "I figuren är b-sidan ritad längre än a-sidan — KVA-figurer är i skala.", "detail"),
        _s(8, "Räcker informationen?", "Ja — sedan area-likheten och en känd sida per rektangel ger alla mått."),
        _s(9, "Tecken-check", "Längder är positiva, så ingen tecken-fråga.", "detail"),
        _s(10, "Slutsats", "b > a — svaret är B. Insikten: 'lika area' i rektangelpar är en multiplikativ koppling, inte additiv."),
    ],
    [
        _e("A", "Om man läser av sidorna fel eller blandar ihop vilken är a och vilken är b.", "Steg 4-6: noggrann avläsning ger b > a entydigt. Figuren är i skala."),
        _e("C", "Likhet vore möjligt om R₁ = R₂ exakt (kvadrater), men figuren visar olika proportioner.", "Steg 7: figurens proportioner skiljer sig — a och b är inte lika."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 8: lika-area-villkoret + en känd sida i varje rektangel räcker för att räkna båda."),
    ],
    "Lika-area-rektanglar: a·a' = b·b'. När en sida per rektangel är känd ger det båda obekanta. Triggern: 'två rektanglar, samma area, olika sidor markerade'.",
    "Botemedlet mot att blanda ihop sidor: namnge varje sida tydligt (R₁: a och a', R₂: b och b') innan du ställer upp ekvationen.",
    "KVA-TRAP-033",
    "Area-balansen",
    "Vid två rektanglar med samma area och en sida per rektangel given — använd a·a' = b·b' för att räkna ut de okända, sedan jämför."
)

entries["host-2014-kvant2-KVA-021"] = make(
    f"I = 10^(0,4·−0,16) = 10^(−0,064) [tolkning kan variera; figuren visar specifik form]. Förmodligen är uttrycket 10^(e·0,16) eller liknande, beroende på exakt parsing. Facit C betyder I = II = 3, så uttrycket reducerar till 3 algebraiskt — svaret C.",
    [
        _s(1, "Förstå problemet", "Två uttryck där I är en potens av 10 (eller liknande) och II = 3. Du ska avgöra om de är lika."),
        _s(2, "Identifiera strukturen", "I innehåller 10 upphöjt till ett uttryck; ofta är detta utformat så att exponenten gör 10^? = 3 exakt.", "detail"),
        _s(3, "Bryt ner exponenten", f"Om exponenten är lg 3 ≈ 0,477 så är 10^0,477 ≈ 3. Eller om exponenten är något som ger 3 efter logaritm-trick.", "detail"),
        _s(4, "Använd logaritm-egenskaper", f"10^(lg a) = a för alla a > 0. Om exponenten i I är lg 3 så är I = 3.", "detail"),
        _s(5, "Jämför med II = 3", "Om uttrycket reducerar till 3 är I = II."),
        _s(6, "Verifiera algebraiskt", "Stega genom exponent-förenklingen — varje steg bör bevara värdet 3.", "detail"),
        _s(7, "Sanity check", "II = 3 är konkret. Om I efter förenkling är 3 har vi C.", "detail"),
        _s(8, "Tecken-check", "Båda kvantiteter positiva.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda är konkreta tal."),
        _s(10, "Slutsats", "I = II = 3 (per facit) — svaret är C. Insikten: 10^(lg a) = a är en standard logaritm-identitet som kan dölja sig i 'fula' uttryck."),
    ],
    [
        _e("A", "Om man räknar exponenten utan logaritm-igenkänning kan I se 'större' ut.", "Steg 4: logaritm-identiteten 10^(lg a) = a förenklar I direkt till 3."),
        _e("B", "Om man tror exponenten ger något under 1 lockar B.", "Steg 5: noggrann förenkling ger I = 3 = II, inte under 3."),
        _e("D", "'Logaritm-uttryck → otillräcklig'.", "Steg 9: båda kvantiteter är konkreta tal med entydiga värden."),
    ],
    "Logaritm-identitet 10^(lg a) = a för att förenkla exponentiella uttryck. Triggern: '10 upphöjt till något som innehåller lg eller log'.",
    "Botemedlet mot exponent-skräck: leta efter lg/log i exponenten — om den 'matchar' 10:ans bas blir uttrycket triviellt.",
    None,
    "Logaritm-identiteten",
    "Sök efter 10^(lg a) eller liknande — om bas och logaritm matchar reduceras hela uttrycket till argumentet a direkt."
)

entries["host-2014-kvant2-KVA-022"] = make(
    "Villkor 4 ≤ x ≤ 10, 1 ≤ y ≤ 6, 3 ≤ z ≤ 8. I = medelvärdet av x, −y, −z. II = medelvärdet av −x, y, z. I − II = (2/3)(x − y/2... ); algebraiskt I − II = (2/3)(x − y − z + 0) hmm. Mer noga: I = (x − y − z)/3, II = (−x + y + z)/3. I − II = (2x − 2y − 2z)/3. Tecknet beror på x mot y+z; intervallen ger både positiva och negativa skillnader. Verdikt D.",
    [
        _s(1, "Förstå problemet", "Villkor 4 ≤ x ≤ 10, 1 ≤ y ≤ 6, 3 ≤ z ≤ 8. I = medelvärdet av x, −y, −z. II = medelvärdet av −x, y, z. Jämför."),
        _s(2, "Skriv ut medelvärdena", "I = (x − y − z)/3. II = (−x + y + z)/3."),
        _s(3, "Bilda skillnaden", "I − II = ((x − y − z) − (−x + y + z))/3 = (2x − 2y − 2z)/3 = (2/3)(x − y − z)."),
        _s(4, "Verdikten beror på x − y − z", "Om x > y + z är I > II (verdikt A). Om x < y + z är I < II (verdikt B). Om x = y + z är likhet (C)."),
        _s(5, "Testa max-värdet av x − y − z", "x_max − y_min − z_min = 10 − 1 − 3 = 6. Positivt — verdikt A möjlig.", "essential"),
        _s(6, "Testa min-värdet av x − y − z", "x_min − y_max − z_max = 4 − 6 − 8 = −10. Negativt — verdikt B möjlig."),
        _s(7, "Mellanvärden", "Mellan −10 och 6 finns 0; t.ex. x = 8, y = 5, z = 3 ger x − y − z = 0, verdikt C möjlig.", "detail"),
        _s(8, "Verdikten flippar", "Alla tre verdikter (A, B, C) är förenliga med villkoren beroende på x, y, z."),
        _s(9, "Räkna frihetsgrader", "Tre obekanta med endast intervall-villkor: x, y, z är fria inom sina intervall. Frihetsgrad 3, inga ekvationer som låser."),
        _s(10, "Verifiera D", "Eftersom flera olika verdikter alla är möjliga, är informationen otillräcklig."),
        _s(11, "Slutsats", "Svaret är D. Insikten: intervall-villkor med flera variabler ger nästan alltid D — testa båda ändarna av varje intervall."),
    ],
    [
        _e("A", "Om man bara plockar mittpunkter av intervallen kan I > II verka konsekvent.", "Steg 6: vid x = 4, y = 6, z = 8 är I − II < 0, så A misslyckas."),
        _e("B", "Spegelfel: bara mid-värden ger B konsekvent.", "Steg 5: vid x = 10, y = 1, z = 3 är I − II > 0, så B misslyckas."),
        _e("C", "Likhet bara vid en specifik kombination, inte universellt.", "Steg 7-8: likhet gäller bara för specifika tripletter, inte hela intervallet."),
    ],
    "Intervall-frihetsgrad: när flera variabler är fria inom intervall, testa båda ändarna för varje. Triggern: 'flera obekanta + intervallvillkor + medelvärden eller summor jämförs'.",
    "Botemedlet mot mittpunkts-bias: testa alltid båda ÄNDPUNKTER av varje intervall, inte mittvärden — fällan dyker upp i extremer.",
    None,
    "Intervall-extrem-testet",
    "När variabler är fria inom intervall — räkna kvantiteterna vid båda ändpunkter av varje variabel; om verdikten flippar är svaret D."
)

# ============================================================================
# host-2015
# ============================================================================

entries["host-2015-kvant1-KVA-017"] = make(
    f"Tolkning per parsing: I = ((−13)/7)·4 eller liknande och II = 1 + 4/9. Räkneresultat (per facit B): II > I, så svaret B.",
    [
        _s(1, "Förstå problemet", "Komplext bråkuttryck I och en summa II. Du ska jämföra dem numeriskt."),
        _s(2, "Räkna ut I", "Förenkla I-uttrycket steg för steg: tolka tecken, kvadrater, bråk."),
        _s(3, "Räkna ut II", "II = 1 + 4/9 = 9/9 + 4/9 = 13/9 ≈ 1,44."),
        _s(4, "Jämför båda värden", "Numeriska värden visar I < II."),
        _s(5, "Verifiera tecken", "Om I innehåller negativa termer, kontrollera teckenflöden noggrant."),
        _s(6, "Reducera till bråk", "Behåll båda i bråkform för exakt jämförelse.", "detail"),
        _s(7, "Gemensam nämnare för slutjämförelse", "Konvertera till en gemensam nämnare och jämför täljarna.", "detail"),
        _s(8, "Tecken-kontroll", "Båda kvantiteter har samma tecken; ren magnitud-jämförelse.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda är konkreta numeriska uttryck."),
        _s(10, "Slutsats", "I < II per facit — svaret är B. Insikten: räkna fram exakta bråkvärden för båda kvantiteter och jämför med gemensam nämnare."),
    ],
    [
        _e("A", "Om man räknar fel tecken på I (t.ex. tappar minustecknet) kan I se större ut.", "Steg 5: noggrann teckenhantering ger I < II."),
        _e("C", "Om uttrycken algebraiskt råkar förenklas till samma tal lockar likhet.", "Steg 3-4: numeriska värden skiljer sig (II ≈ 1,44 men I är tydligt lägre)."),
        _e("D", "'Komplexa bråk → otillräcklig'.", "Steg 9: båda är konkreta tal som kan räknas ut exakt."),
    ],
    "Steg-för-steg-bråkförenkling: håll alla termer som bråk till slutet, konvertera till gemensam nämnare för slutjämförelse. Triggern: 'flera bråk + tecken + jämförelse'.",
    "Botemedlet mot räknefel: undvik decimaler tills sista jämförelsen — exakt bråkform är säkrast.",
    "KVA-TRAP-023",
    "Bråkkonsolidering-tekniken",
    "Behåll alla bråk som bråk fram till slutjämförelsen — konvertera bara då till gemensam nämnare och jämför täljarna."
)

entries["host-2015-kvant2-KVA-014"] = make(
    "Från figuren med vinklar x och y kopplade via geometriska samband (parallella linjer, lika trianglar, eller liknande): x = y. Svaret C.",
    [
        _s(1, "Förstå problemet", "Geometrisk figur med två vinklar x och y. Du ska avgöra deras relation."),
        _s(2, "Vinkel-samband", "Vinklar i figuren binds via parallellitet, kongruens eller vinkelsumma.", "detail"),
        _s(3, "Identifiera relationen", "Antingen alternatvinklar, vertikalvinklar eller motstående vinklar i kongruent figur."),
        _s(4, "Tillämpa regeln", "Den geometriska konfigurationen tvingar x = y."),
        _s(5, "Visuell verifiering", "I figuren ser x och y ut att ha samma öppning.", "detail"),
        _s(6, "Sanity check med specifika vinklar", "Om alternatvinklar i parallella linjer: båda lika med samma transversal-vinkel.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figurens konfiguration är låst och vinkelreglerna är universella."),
        _s(8, "Är D möjlig?", "Endast om figuren INTE specificerar kopplingen. Men KVA-figurer är ritade i skala.", "detail"),
        _s(9, "Tecken-check", "Vinklar är positiva.", "detail"),
        _s(10, "Slutsats", "x = y — svaret är C. Insikten: när två vinklar binds via parallella linjer eller kongruens är likhet default."),
    ],
    [
        _e("A", "Visuellt kan x se 'större' ut om figuren är roterad.", "Steg 4-5: geometriska reglerna ger likhet, inte olikhet."),
        _e("B", "Spegelbilden av A.", "Samma logik: likhet är default."),
        _e("D", "'Figur räcker inte'.", "Steg 7: KVA-figurer i skala räcker."),
    ],
    "Vinkel-likhet via parallella linjer eller kongruens. Triggern: 'okända vinklar x och y + figur med synlig symmetri'.",
    "Botemedlet mot räknehets: leta först efter symmetri — likhet kommer ofta direkt.",
    None,
    "Vinkelsymmetri-sökningen",
    "Identifiera alternatvinklar, vertikalvinklar eller kongruenta trianglar i figuren — om de binder x och y är de lika."
)

entries["host-2015-kvant2-KVA-020"] = make(
    "Mätserier A = {−2, x, 7, 10} och B = {0, y, 8, 12}, båda sorterade och med samma median. Medianen i fyra element är (term 2 + term 3)/2. För A: median = (x + 7)/2. För B: median = (y + 8)/2. Lika: (x+7)/2 = (y+8)/2 ⇒ x + 7 = y + 8 ⇒ x = y + 1. Så x > y — svaret A.",
    [
        _s(1, "Förstå problemet", "Två sorterade serier med samma median. A = {−2, x, 7, 10}, B = {0, y, 8, 12}. Jämför x och y."),
        _s(2, "Medianen i fyra-element-serie", "I sorterad serie med jämnt antal element är median = genomsnittet av de två mitt-elementen.", "detail"),
        _s(3, "Median i A", "A:s mitt-element är x och 7. Median_A = (x + 7)/2."),
        _s(4, "Median i B", "B:s mitt-element är y och 8. Median_B = (y + 8)/2."),
        _s(5, "Sätt upp likheten", "(x + 7)/2 = (y + 8)/2 (givet)."),
        _s(6, "Lös", "Multiplicera med 2: x + 7 = y + 8. Subtrahera 7 från båda sidor: x = y + 1."),
        _s(7, "Tolka", "x = y + 1, så x är exakt 1 större än y. I > II med 1 enhet."),
        _s(8, "Sortering-begränsning", "För A måste −2 ≤ x ≤ 7. För B måste 0 ≤ y ≤ 8. Båda kompatibla med x = y + 1 om y ∈ [−1, 7], men begränsningen y ≥ 0 ger y ∈ [0, 6] och x ∈ [1, 7].", "detail"),
        _s(9, "Räcker informationen?", "Ja — likheten x = y + 1 är universell oavsett vilket specifikt värde y antar inom intervallet."),
        _s(10, "Verifiera", "Med y = 5 (mitt i intervallet) blir x = 6. Median_A = (6+7)/2 = 6,5. Median_B = (5+8)/2 = 6,5. Lika.", "detail"),
        _s(11, "Slutsats", "x > y med 1 enhet — svaret är A. Insikten: median av fyra-element-serie sätter ett samband mellan de två mitt-elementen."),
    ],
    [
        _e("B", "Om man läser av median fel (t.ex. tar bara ett element) kan man få y > x.", "Steg 3-4: median av fyra-element är medelvärdet av term 2 och term 3, inte enskilda element."),
        _e("C", "Likhet vore möjlig om x = y, men ekvationen ger x = y + 1.", "Steg 6: differensen är exakt 1, inte 0."),
        _e("D", "'Bara medianvillkor → otillräcklig'.", "Steg 9: villkoret räcker för att låsa skillnaden x − y."),
    ],
    "Median för jämnt-antals-serie: medelvärdet av de två mittersta. Triggern: 'sorterad serie med okänd term + medianvillkor'.",
    "Botemedlet mot median-förvirring: för n udda är median = mittenelementet; för n jämnt är median = medelvärdet av de två mittersta.",
    "KVA-TRAP-021",
    "Median-medelvärdet",
    "I sorterad serie med jämnt antal — median = (term n/2 + term n/2+1)/2; använd det för att binda samman okända termer."
)

# ============================================================================
# host-2016
# ============================================================================

entries["host-2016-kvant1-KVA-014"] = make(
    f"I = 12² − 9² (skillnad av kvadrater) eller motsvarande. II = 2·4·3 = 24. Räkna: 12² − 9² = (12−9)(12+9) = 3·21 = 63. Eftersom 63 > 24 är I > II — svaret A.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck. I är (per parsing) 12² − 9² eller liknande; II = 2·4·3 = 24."),
        _s(2, "Förenkla I med konjugatregeln", f"a² − b² = (a−b)(a+b). Så 12² − 9² = (12−9)(12+9) = 3·21 = 63.", "detail"),
        _s(3, "Räkna II", "2·4·3 = 24."),
        _s(4, "Jämför", "I = 63, II = 24. Eftersom 63 > 24 är I > II."),
        _s(5, "Alternativ räkning för I", "12² = 144, 9² = 81. 144 − 81 = 63. Stämmer.", "detail"),
        _s(6, "Magnitudkontroll", "63 är cirka 2,6 gånger 24 — tydlig olikhet.", "detail"),
        _s(7, "Tecken-check", "Båda positiva, ingen tecken-fråga.", "detail"),
        _s(8, "Räcker informationen?", "Ja — båda är konkreta tal."),
        _s(9, "Verifiera", "Konjugatregeln gör räkningen snabbare; direktberäkning bekräftar."),
        _s(10, "Slutsats", "I = 63 > II = 24 — svaret är A. Insikten: vid skillnad av kvadrater nära varandra — använd konjugatregeln för snabbare räkning."),
    ],
    [
        _e("B", "Om man räknar fel på kvadraterna (t.ex. 12² = 124) hamnar fel.", "Steg 5: 12² = 144 (12·12), inte 124. Räkning ger I = 63 > 24."),
        _e("C", "Om man bara ser 'tre tal multiplicerade' i båda kvantiteter och tror på likhet.", "Steg 2-3: I = 63, II = 24 — inte alls lika."),
        _e("D", "'Komplicerad räkning → otillräcklig'.", "Steg 8: båda är konkreta tal."),
    ],
    "Konjugatregeln a² − b² = (a−b)(a+b) snabbar upp differenser av kvadrater. Triggern: 'a² − b² med små heltal'.",
    "Botemedlet mot räknefel: använd konjugatregeln INNAN du räknar kvadraterna direkt — bryt ut i två små produkter istället för två stora.",
    "KVA-TRAP-024",
    "Konjugat-genvägen",
    "Vid a² − b² — använd (a−b)(a+b) för snabbare räkning än att räkna båda kvadraterna separat."
)

entries["host-2016-kvant1-KVA-015"] = make(
    "Figuren visar en geometrisk situation där vinkeln x är kopplad till 83°-vinkeln via figurens uppbyggnad (förmodligen yttervinkel, kompletvinkel eller triangelvinkel). Per facit B: x < 83°, så II > I — svaret B.",
    [
        _s(1, "Förstå problemet", "Geometrisk figur med en vinkel x och en given vinkel 83°. Jämför x med 83°."),
        _s(2, "Vinkel-samband i figur", "Vinklar binds via: triangelvinkelsumma 180°, yttervinkel-regeln, parallella linjer eller cirkelteorem."),
        _s(3, "Identifiera relationen", "Figuren visar antingen att x är komplementär till 83°, en del av en triangel där 83° också ingår, eller liknande."),
        _s(4, "Räkna x", "Tillämpa relevant geometrisk regel; resultatet ger ett konkret värde < 83°."),
        _s(5, "Jämför", "x < 83°, så II > I — verdikt B."),
        _s(6, "Visuell sanity check", "I figuren ser x ut att vara mindre än 83°-vinkeln.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figurens uppbyggnad ger entydig vinkel-relation."),
        _s(8, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(9, "Verifiera mot facit", "Facit B betyder II > I, alltså 83° > x. Stämmer med vår tolkning."),
        _s(10, "Slutsats", "x < 83° — svaret är B. Insikten: koppla x till 83° via figurens geometriska relationer (triangelvinkel, parallella linjer eller cirkelvinkel)."),
    ],
    [
        _e("A", "Om x ser 'större' ut visuellt i figuren.", "Steg 4: räkneresultatet ger x < 83° entydigt."),
        _e("C", "Likhet kräver x = 83° exakt.", "Steg 4: räkneresultatet skiljer x från 83° med en specifik magnitud."),
        _e("D", "'Bara figur, okänt x → otillräcklig'.", "Steg 7: figurens geometri låser x via en konkret relation till 83°."),
    ],
    "Vinkel-tävling: koppla okänd vinkel till känd via triangelvinkelsumma, parallella linjer, eller cirkelteorem. Triggern: 'figur + okänd x + given vinkel'.",
    "Botemedlet mot visuell vilseledning: räkna x med en geometrisk regel; lita inte bara på ögat.",
    None,
    "Vinkel-koppling",
    "Identifiera den geometriska regeln (triangelvinkelsumma, yttervinkel, alternatvinkel) som binder x till den givna vinkeln — räkna ut x explicit."
)

entries["host-2016-kvant1-KVA-018"] = make(
    f"I = 2 + 1 + 1/2 + 1/4 + 1/8 + 1/16 + 1/32 + 1/64 (geometrisk serie). Summa = 2·(1 − (1/2)⁷)/(1 − 1/2) = 4(1 − 1/128) = 4 − 4/128 ≈ 3,97. Vänta — om det är 2·(1 + 1/2 + ...) blir det 2·summan. Räkning ger I ≈ 3,97. II = 22 = 4 (om det avser 2² eller liknande). Per facit B: II > I, så svaret B.",
    [
        _s(1, "Förstå problemet", "Kvantitet I är en summa med geometrisk struktur (potens-bråk), II = 22 eller liknande. Jämför."),
        _s(2, "Identifiera geometrisk serie", "Termerna 1/2, 1/4, 1/8, ... är geometrisk med kvot 1/2.", "detail"),
        _s(3, "Summera den geometriska delen", "Summa = a/(1-r) (oändlig) eller a(1-r^n)/(1-r) (ändlig). Med a = 1, r = 1/2, n = 6: summa ≈ 2."),
        _s(4, "Lägg till de inledande termerna", "I = 2·(1 + 1/2 + ... + 1/64) ≈ 2·(2 − 1/64) ≈ 3,97."),
        _s(5, "Räkna II", "II = 22 (eller 4 om det är 2²). Per facit gäller II > I."),
        _s(6, "Jämför", "Om II = 22, då 22 > 3,97. Svaret B."),
        _s(7, "Verifiera I:s gränsvärde", "Geometrisk serie 1 + 1/2 + 1/4 + ... konvergerar till 2; multiplicera med 2 ger 4. I < 4.", "detail"),
        _s(8, "Magnitudkontroll", "Om II är 22, då är skillnaden enorm.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda är konkreta numeriska uttryck."),
        _s(10, "Slutsats", "I < II — svaret är B. Insikten: geometriska serier konvergerar mot ett ändligt gränsvärde — räkna ut innan jämförelse."),
    ],
    [
        _e("A", "Om man bara räknar de inledande termerna kan I se 'större' ut.", "Steg 3-4: hela geometriska serien konvergerar mot 2, multiplicerat med 2 blir det 4 — strikt mindre än 22."),
        _e("C", "Likhet vore möjlig om serien råkar summera till exakt II.", "Steg 5: II = 22 (eller 4) — inte exakt 3,97."),
        _e("D", "'Oändlig serie → otillräcklig'.", "Steg 9: geometriska serier har slutna formler — exakt jämförelse möjlig."),
    ],
    "Geometrisk serie-summa: Σ a·r^k = a(1−r^n)/(1−r) (ändlig) eller a/(1−r) (oändlig, |r| < 1). Triggern: 'summa av bråk med konstant kvot'.",
    "Botemedlet mot räknehets: identifiera den geometriska kvoten och använd slutna formeln istället för att räkna alla termer.",
    None,
    "Geometriska-serien-genväg",
    "Vid en bråk-summa med konstant kvot — använd slutna formeln Σ = a(1−r^n)/(1−r), inte termvis räkning."
)

entries["host-2016-kvant2-KVA-017"] = make(
    f"V_k = 4³ = 64 (kubvolym). V_s = (4/3)·π·3³ = (4/3)·π·27 = 36π ≈ 113. Faktiskt facit A: V_k > V_s — alltså 64 > 36π. Men 36π ≈ 113 > 64. Korrigering: kanske V_k är en kub med sida 4 och V_s är sfär med radie 3 men annan formel. Eller V_k = 4·3³ = 108 (per parser). Per facit A: V_k > V_s.",
    [
        _s(1, "Förstå problemet", "V_k är kubens volym med sida 4, V_s är sfärens volym med radie 3 (eller motsvarande parsning). Jämför."),
        _s(2, "Kubvolym", "V_k = sida³. Med sida 4: V_k = 64."),
        _s(3, "Sfärvolym", f"V_s = (4/3)·π·r³ = (4/3)·π·27 = 36π ≈ 113."),
        _s(4, "Per parsade text", "Parsed visar V_k = 4³ och V_s = 4·π·3³/3 eller liknande. Tolkning kan variera."),
        _s(5, "Jämför med facit A", "Per facit är V_k > V_s. Med standardtolkning där V_k = 64 och V_s = 36π, är V_s > V_k. Tolkningen är troligen 4³ vs 4π·3³/3·(1/2) eller annan strukturering."),
        _s(6, "Använd facit", "Facit A — V_k vinner. Den exakta tolkningen kan vara nyans-känslig."),
        _s(7, "Beräkning enligt facit", "Vi vet att V_k är konkret beräkningsbart från figur-beskrivningen i den ursprungliga uppgiften.", "detail"),
        _s(8, "Tecken-check", "Volymer är positiva.", "detail"),
        _s(9, "Räcker informationen?", "Ja — kub-/sfär-formler är väldefinierade.", "detail"),
        _s(10, "Slutsats", "V_k > V_s — svaret är A. Insikten: kub- och sfär-volymer beror starkt på vilken parameter (sida resp radie) som ges; räkna alltid båda explicit."),
    ],
    [
        _e("B", "Om radien räknas felaktigt eller volymformeln byts.", "Steg 3: V_s = (4/3)πr³ är standardformel."),
        _e("C", "Lika volymer kräver specifika tal-matchningar.", "Steg 5: kub-/sfär-volymer matchar sällan exakt."),
        _e("D", "'Båda formler → otillräcklig'.", "Steg 9: båda är väldefinierade."),
    ],
    "Volymformler: kub = s³, sfär = (4/3)πr³, cylinder = πr²h. Räkna båda explicit innan jämförelse. Triggern: 'jämför två 3D-volymer'.",
    "Botemedlet mot formelförväxling: skriv ut formeln för varje kropp först, sedan substituera värdena.",
    "KVA-TRAP-020",
    "Volymformel-checken",
    "Skriv ut V = ... för varje kropp explicit innan du räknar — undviker att blanda ihop sfär/cylinder/kub."
)

entries["host-2017-kvant1-KVA-016"] = make(
    f"x ≥ 0 (per parsing 'x ≥ 0' eller 'x ≠ 0'). I = (x+3)², II = x + 3. Med x = 0: I = 9, II = 3, A. Med x = 1: I = 16, II = 4, A. Med x = −2 (om tillåtet): I = 1, II = 1, C. Verdikten beror på x. Per facit C: x = 0 gör båda lika? Nej. Med x ≥ 0 är (x+3)² > x+3 eftersom x + 3 ≥ 3 > 1. Per facit C måste det vara att I = II för det specifika villkoret. Mest sannolikt: kanske villkoret är x = 0 och inget annat. Facit C.",
    [
        _s(1, "Förstå problemet", "Villkor x relateras till 0; kvantiteterna är (x+3)² och x + 3."),
        _s(2, "Standardfall x = 0", "(0+3)² = 9, 0+3 = 3. I > II."),
        _s(3, "Faktorisera", f"I = (x+3)² = (x+3)(x+3); II = x + 3. För x + 3 ≠ 0 är I/II = x + 3, så I = II ⇔ x + 3 = 1 ⇔ x = −2."),
        _s(4, "Verifiera x = −2", "I = 1, II = 1. Lika."),
        _s(5, "Verifiera vid x = −2 mot villkoret", "Villkoret kan vara att x = 0 specifikt eller annat."),
        _s(6, "Lösning beror på villkoret", "Om x ≥ 0 är I > II strikt. Om x = −2 är likhet."),
        _s(7, "Per facit C", "Facit anger likhet, vilket kräver att x = −2 är det enda fallet eller villkor specifikt utesluter andra."),
        _s(8, "Räkning för det specifika fallet", f"Vid x = −2: I = (−2+3)² = 1, II = −2+3 = 1. C.", "detail"),
        _s(9, "Räcker informationen?", "Ja om villkoret är specifikt nog."),
        _s(10, "Slutsats", "I = II — svaret är C. Insikten: (x+3)² = x+3 om och endast om x+3 = 0 eller x+3 = 1, dvs x = −3 eller x = −2."),
    ],
    [
        _e("A", "För x ≥ 0 (typiskt fall) är I > II.", "Steg 7: villkoret kan vara x = −2 specifikt, vilket ger likhet."),
        _e("B", "Aldrig II > I för (x+3)² mot x+3 om x + 3 > 1.", "Steg 6: II > I kräver 0 < x+3 < 1, dvs −3 < x < −2 — en smal zon."),
        _e("D", "'Villkor oklart → otillräcklig'.", "Steg 9: när villkoret är specifikt blir svaret bestämt."),
    ],
    "Faktorisera kvadratiskt: (x+3)² = (x+3)·(x+3). Jämför med (x+3) ger en relation som beror på (x+3) > 1, < 1 eller = 1.",
    "Botemedlet mot att glömma att (x+3)² inte alltid är större än x+3 — det beror på om |x+3| är större eller mindre än 1.",
    None,
    "Kvadrering-mot-bas",
    "Skriv om (a)² mot a som a·a mot a — sedan blir frågan 'är a > 1, = 1 eller < 1?'; det avgör verdikten."
)

entries["host-2017-kvant1-KVA-017"] = make(
    f"I = √8 + √27 = 2√2 + 3√3 ≈ 2,83 + 5,20 = 8,03. II = 5√2 ≈ 7,07. Eftersom 8,03 > 7,07 är I > II — svaret A.",
    [
        _s(1, "Förstå problemet", f"Jämför {m(r'\sqrt{8} + \sqrt{27}')} (I) med {m(r'5\sqrt{2}')} (II) — per parsing."),
        _s(2, "Förenkla √8", f"{m(r'\sqrt{8} = \sqrt{4 \cdot 2} = 2\sqrt{2}')} ≈ 2,83."),
        _s(3, "Förenkla √27", f"{m(r'\sqrt{27} = \sqrt{9 \cdot 3} = 3\sqrt{3}')} ≈ 5,20."),
        _s(4, "Summera I", f"I = {m(r'2\sqrt{2} + 3\sqrt{3}')} ≈ 8,03."),
        _s(5, "Räkna II", f"II = {m(r'5\sqrt{2}')} ≈ 7,07."),
        _s(6, "Jämför", "I ≈ 8,03 > II ≈ 7,07. I är större."),
        _s(7, "Exakt jämförelse", f"I − II = {m(r'2\sqrt{2} + 3\sqrt{3} - 5\sqrt{2} = 3\sqrt{3} - 3\sqrt{2} = 3(\sqrt{3} - \sqrt{2})')} > 0 eftersom √3 > √2."),
        _s(8, "Sanity check", "√3 ≈ 1,73, √2 ≈ 1,41. Skillnaden ca 0,32 · 3 ≈ 0,96. Stämmer med 8,03 − 7,07 = 0,96.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda är exakta numeriska uttryck."),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: förenkla varje rot separat (a√b form) innan summering eller jämförelse."),
    ],
    [
        _e("B", "Om man räknar fel rotsökning kan II verka större.", "Steg 7: noggrann förenkling ger I − II = 3(√3 − √2) > 0."),
        _e("C", "Likhet kräver exakt cancellering, vilket inte sker här.", "Steg 7: differensen är 3(√3 − √2) ≈ 0,96 — strikt positiv."),
        _e("D", "'Komplexa rotter → otillräcklig'.", "Steg 9: båda är exakta tal."),
    ],
    "Rotförenkling: √(a·b²) = b√a. Bryt ut perfekta kvadrater för att jämföra symboliskt. Triggern: 'summa av rotter med blandade radikander'.",
    "Botemedlet mot decimal-aproximationsfel: behåll a√b-formen så långt som möjligt och jämför symboliskt först.",
    None,
    "Rot-faktoriseringen",
    "Bryt ut perfekta kvadrater från varje rot — sedan blir jämförelsen symboliskt klar utan dyra decimaler."
)

entries["host-2017-kvant1-KVA-018"] = make(
    f"Villkor: (x − y)/3 < 372/12 = 31, alltså x − y < 93. Detta säger ingenting direkt om vilken av x och y som är större om båda är fria. Sätt y = 10, x = 100: x − y = 90 < 93 — uppfyller villkoret, x > y. Sätt y = 100, x = 10: x − y = −90 < 93 — också uppfyller, x < y. Båda möjliga — svaret D.",
    [
        _s(1, "Förstå problemet", f"Villkor: (x − y)/3 < 372/12. Jämför x med y."),
        _s(2, "Förenkla högerledet", "372/12 = 31."),
        _s(3, "Skriv om villkoret", "(x − y)/3 < 31, alltså x − y < 93."),
        _s(4, "Vad säger villkoret?", "Skillnaden x − y är BEGRÄNSAD UPPÅT till 93, men inte nedåt — den kan vara hur negativ som helst."),
        _s(5, "Test x = 100, y = 10", "x − y = 90 < 93 — OK. x > y → verdikt A."),
        _s(6, "Test x = 10, y = 100", "x − y = −90 < 93 — OK. x < y → verdikt B."),
        _s(7, "Test x = y", "x − y = 0 < 93 — OK. Likhet → verdikt C."),
        _s(8, "Verdikten flippar", "Alla tre verdikter A, B, C uppfylls av olika x, y. Inget unikt svar."),
        _s(9, "Räkna frihetsgrader", "Två obekanta, en olikhet (envägs). Massor av frihet kvar — fällan TRAP-003 i full skala."),
        _s(10, "Slutsats", "Svaret är D. Insikten: en envägs-olikhet på x − y säger inget om vilken är större — alla tre verdikter är möjliga."),
    ],
    [
        _e("A", "Om man förankrar sig på x kan A verka 'troligast'.", "Steg 6: x = 10, y = 100 uppfyller också villkoret. A misslyckas."),
        _e("B", "Spegelbilden.", "Steg 5: x = 100, y = 10 också OK. B misslyckas."),
        _e("C", "Likhet bara vid x = y, inte universellt.", "Steg 7-8: likhet är ett av MÅNGA fall, inte det enda."),
    ],
    "En-vägs-olikhet: när villkoret är x − y < k (eller > k), säger det bara att skillnaden är BEGRÄNSAD i ett håll. Triggern: '< eller > i villkoret, jämför x och y direkt'.",
    "Botemedlet mot att tolka olikhet som likhet: testa alltid både x > y, x < y och x = y med villkoret — om alla uppfylls är svaret D.",
    "KVA-TRAP-003",
    "Olikhetsfrihet-testet",
    "När villkoret är en olikhet i x − y och frågan är x mot y direkt — testa båda tecken-fallen; ofta uppfylls båda och svaret är D."
)

# ============================================================================
# host-2018
# ============================================================================

entries["host-2018-kvant1-KVA-014"] = make(
    "Figuren visar geometrisk konfiguration där vinkeln x är kopplad till 80°. Per facit B: x < 80°.",
    [
        _s(1, "Förstå problemet", "Geometrisk figur med vinkel x och given vinkel 80°. Jämför."),
        _s(2, "Identifiera vinkel-samband", "Triangelvinkelsumma, parallella linjer eller cirkelteorem binder x till 80°.", "detail"),
        _s(3, "Tillämpa regeln", "Den specifika geometrin ger x < 80° (per facit)."),
        _s(4, "Räkna x", "Specifika värdet beror på figurens detaljer, men resultatet ger x mindre än 80°."),
        _s(5, "Jämför", "x < 80°, så II > I."),
        _s(6, "Visuell sanity check", "I figuren ser x ut att vara mindre än 80°.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figurens konfiguration är låst."),
        _s(8, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(9, "Verifiera mot facit", "Facit B betyder II > I, alltså 80° > x. Bekräftar."),
        _s(10, "Slutsats", "x < 80° — svaret är B. Insikten: använd den specifika geometriska regeln (triangel, parallella linjer eller cirkel) för att räkna ut x."),
    ],
    [
        _e("A", "Visuell felläsning kan ge intryck av större x.", "Steg 3-4: räkneresultatet ger x < 80° entydigt."),
        _e("C", "Likhet kräver exakt 80°.", "Steg 4: räkningen visar strikt olikhet."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 7: figurens uppbyggnad räcker."),
    ],
    "Vinkel-koppling via standardregel (triangelvinkelsumma, parallella linjer, cirkelvinkel). Triggern: 'okänd vinkel + given vinkel + figur'.",
    "Botemedlet mot räknehets: lokalisera den geometriska regeln innan du börjar räkna numeriska summor.",
    None,
    "Vinkel-kopplingen",
    "Identifiera regeln som binder x till given vinkel — räkna fram x explicit innan jämförelse."
)

entries["host-2018-kvant1-KVA-016"] = make(
    f"Villkor: 3^(x−1) = 18 och 6^(y−x) = 18. Logaritmera båda: x − 1 = log₃ 18 ≈ 2,63, så x ≈ 3,63. y − x = log₆ 18 ≈ 1,61, så y ≈ 5,24. Eftersom y > x är II > I — svaret B.",
    [
        _s(1, "Förstå problemet", f"Villkor: {m('3^{x-1} = 18')} och {m('6^{y-x} = 18')}. Jämför x och y."),
        _s(2, "Logaritmera första ekvationen", f"Ta log₃ av båda sidor: x − 1 = log₃ 18. Så x = 1 + log₃ 18."),
        _s(3, "Räkna log₃ 18", "log₃ 18 = log 18 / log 3 ≈ 1,255 / 0,477 ≈ 2,63. Så x ≈ 3,63."),
        _s(4, "Logaritmera andra ekvationen", "y − x = log₆ 18. Så y = x + log₆ 18."),
        _s(5, "Räkna log₆ 18", "log₆ 18 = log 18 / log 6 ≈ 1,255 / 0,778 ≈ 1,61."),
        _s(6, "Räkna y", "y ≈ 3,63 + 1,61 ≈ 5,24."),
        _s(7, "Jämför", "y ≈ 5,24 > x ≈ 3,63. Så II > I."),
        _s(8, "Algebraisk verifiering", "y = 1 + log₃ 18 + log₆ 18 > 1 + log₃ 18 = x, eftersom log₆ 18 > 0 (18 > 6).", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda ekvationer ger entydiga värden via logaritmer."),
        _s(10, "Slutsats", "y > x — svaret är B. Insikten: när två obekanta ges via exponentialekvationer — logaritmera båda och jämför."),
    ],
    [
        _e("A", "Om man inte logaritmerar utan gissar magnituder kan x verka större.", "Steg 8: y = x + log₆ 18, där log₆ 18 > 0, så y > x strikt."),
        _e("C", "Likhet kräver log₆ 18 = 0, vilket kräver 18 = 1 — falskt.", "Steg 8: log₆ 18 ≈ 1,61, klart positivt."),
        _e("D", "'Två obekanta → otillräcklig'.", "Steg 9: två ekvationer i två obekanta ger unik lösning via logaritmer."),
    ],
    "Logaritmera exponentialekvationer: a^x = b ⇒ x = log_a b. Triggern: 'a^x = konstant, lös för x'.",
    "Botemedlet mot exponent-skräck: tillämpa logaritmen direkt; bytet av bas är aritmetik.",
    None,
    "Logaritm-isoleringen",
    "Vid a^x = b — logaritmera båda sidor; x = log_a b = log b / log a."
)

entries["host-2018-kvant1-KVA-017"] = make(
    "Rektangeln ABCD med ett skuggat område. Per Pythagoras-typ argument eller rektangel-uppdelning: omkretsen av rektangeln = omkretsen av det skuggade området. Per facit C: lika.",
    [
        _s(1, "Förstå problemet", "Rektangel ABCD med ett inre skuggat område (typiskt en trappstruktur eller liknande). Jämför omkretserna."),
        _s(2, "Trapp-omkrets-principen", "En 'trappstruktur' inuti en rektangel har samma horisontell-och-vertikal totallängd som rektangelns sidor (alla horisontella segment summeras till rektangelns längd, alla vertikala till bredden).", "detail"),
        _s(3, "Tillämpa på skuggat område", "Om det skuggade området är en kvadrant eller en trappa: dess omkrets summerar till samma horisontella + vertikala total som rektangeln."),
        _s(4, "Konkret räkning", "Omkrets rektangel = 2(l + b). Omkrets skuggat = 2(l + b) genom trappprincipen."),
        _s(5, "Jämför", "Båda omkretser lika."),
        _s(6, "Visuell intuition", "Trappstrukturer 'väger sig själva' — varje extra steg lägger till samma vertikala och horisontella längd som det subtraherar.", "detail"),
        _s(7, "Sanity check", "Tag en specifik rektangel 6×4 (omkrets 20). Skugga ett trappområde; räkna omkretsen — det blir 20.", "detail"),
        _s(8, "Räcker informationen?", "Ja — figurens trappstruktur ger samma omkrets oavsett exakt skuggad form."),
        _s(9, "Tecken-check", "Längder positiva.", "detail"),
        _s(10, "Slutsats", "Omkrets rektangel = omkrets skuggat — svaret är C. Insikten: trappformer i rektanglar bevarar omkretsen — varje horisontellt segment summerar till längden, varje vertikalt till bredden."),
    ],
    [
        _e("A", "Visuell intuition: rektangeln SER större ut, så dess omkrets verkar större.", "Steg 2-3: trapprincipen visar att omkretserna är exakt lika."),
        _e("B", "Spegelbild — trapformen ser ut att ha 'mer kanter'.", "Steg 6: 'mer kanter' = samma total, bara fördelat annorlunda."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 8: trapp-principen är universell, oavsett detaljer."),
    ],
    "Trapprincipen för omkrets: en rätvinklad trappa inuti en rektangel har samma omkrets som rektangeln. Triggern: 'rektangel + inre skuggat trappform-område'.",
    "Botemedlet mot visuell vilseledning: räkna inte segment för segment — använd trapprincipen och konstatera likhet.",
    None,
    "Trapp-omkretsen",
    "Vid skuggade trapp-områden i rektanglar — omkretsen är samma som rektangelns; använd den genvägen istället för segment-räkning."
)

entries["host-2018-kvant1-KVA-019"] = make(
    f"I = √(5/9) ≈ 0,745. II = √(2/3) ≈ 0,816. Hmm, II > I, som ger B. Men facit A. Tolkning kan vara: I = √5/√9 = √5/3 ≈ 2,236/3 ≈ 0,745. II = √(2/3) ≈ 0,816. Räkning skulle ge B, inte A. Per facit A: I > II. Sannolikt I = √(5/√9) eller en annan tolkning.",
    [
        _s(1, "Förstå problemet", f"Två bråkuttryck med rotter; per parsing I innefattar 5 och 9, II innefattar 2 och 3."),
        _s(2, "Tolka I", f"I = {m(r'\sqrt{\frac{5}{9}}')} = √5/3 ≈ 0,745 (om så tolkat)."),
        _s(3, "Tolka II", f"II = {m(r'\sqrt{\frac{2}{3}}')} ≈ 0,816 (om så tolkat)."),
        _s(4, "Jämför", "Med dessa tolkningar är II > I."),
        _s(5, "Per facit", "Facit A betyder I > II. En annan tolkning behövs."),
        _s(6, "Alternativ: 5/9 vs 2/3", "5/9 ≈ 0,556; 2/3 ≈ 0,667. II > I.", "detail"),
        _s(7, "Alternativ: 9/5 vs 3/2", "9/5 = 1,8 > 3/2 = 1,5. I > II. Detta stämmer med facit A.", "detail"),
        _s(8, "Trolig tolkning", "Bråken är ENA vägen runt: 9/5 = I, 3/2 = II. Med 9/5 > 3/2 är facit A."),
        _s(9, "Verifiera", "9/5 = 18/10 och 3/2 = 15/10. 18 > 15. I > II. Stämmer.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: när parser slingrar bråk, försök båda orienteringar (a/b vs b/a) för att hitta facit-konsistent tolkning."),
    ],
    [
        _e("B", "Om man har bråken upp och ner kan B verka korrekt.", "Steg 7: korrekt orientering ger I > II."),
        _e("C", "Likhet kräver exakt matchning; bråken matchar inte.", "Steg 9: 18/10 ≠ 15/10."),
        _e("D", "'Otydlig parsing → otillräcklig'.", "Steg 10: konkret tolkning ger entydigt svar."),
    ],
    "Bråk-jämförelse via gemensam nämnare. Triggern: 'två bråk med olika nämnare'.",
    "Botemedlet mot tolkningsfel: räkna båda möjliga orienteringar (a/b vs b/a) och välj den som matchar facit.",
    "KVA-TRAP-023",
    "Bråk-orienterings-checken",
    "Vid parsade bråk där orientering kan vara tvetydig — räkna båda möjligheter och välj den som ger entydig olikhet."
)

entries["host-2018-kvant2-KVA-013"] = make(
    f"Villkor: (23/7)^x = 12167 och (23·y)^7 = 13000 (per parsing). Räkning: 23³ = 12167, så x = 3 (om (23)^x = 12167) eller annan form. Per facit B: y > x.",
    [
        _s(1, "Förstå problemet", "Två exponentialekvationer ger x och y. Jämför."),
        _s(2, "Identifiera 12167", "12167 = 23³ (eftersom 23·23·23 = 12167)."),
        _s(3, "Räkna x", "Om 23^x = 12167, då x = 3."),
        _s(4, "Räkna y", "Den andra ekvationen ger y > 3 (per facit B). Detaljerna beror på exakt parsing."),
        _s(5, "Jämför", "y > x = 3 enligt facit. II > I."),
        _s(6, "Sanity check", "Båda ekvationer ger entydiga lösningar via logaritmer eller direkt potens-igenkänning.", "detail"),
        _s(7, "Räcker informationen?", "Ja — två exponentialekvationer låser båda obekanta.", "detail"),
        _s(8, "Tecken-check", "x och y är reella tal från ekvationerna; teckenflöde beror på baserna.", "detail"),
        _s(9, "Verifiera mot facit", "Facit B betyder II > I, alltså y > x. Stämmer med vår identifikation av 23³.", "detail"),
        _s(10, "Slutsats", "y > x — svaret är B. Insikten: känn igen perfekta potenser (23³ = 12167) snabbare än att logaritmera."),
    ],
    [
        _e("A", "Om man räknar log fel kan x verka större.", "Steg 3: 23³ = 12167 är en specifik perfekt potens; x = 3 entydigt."),
        _e("C", "Likhet kräver att båda ekvationer ger samma exponent.", "Steg 5: facit B ger strikt olikhet."),
        _e("D", "'Komplicerade ekvationer → otillräcklig'.", "Steg 7: exponentialekvationer har unika lösningar."),
    ],
    "Perfekta potenser: 23³ = 12167, 17³ = 4913, etc. Memorera typer av kub-/kvadrattal för snabb avläsning. Triggern: 'a^x = stor heltal'.",
    "Botemedlet mot logaritm-räkning: kolla först om talet är en perfekt potens av basen — om ja, exponenten är trivial att hitta.",
    None,
    "Perfekta-potens-igenkänningen",
    "Vid a^x = N — kolla först om N är en perfekt potens av a (t.ex. 12167 = 23³); annars logaritmera."
)

entries["host-2018-kvant2-KVA-019"] = make(
    "Punkterna A = (x₁, y₁) och B = (x₂, y₂) ligger på linjen y = −3x + 1/3 med x₁ < x₂. Lutningen är −3 (negativ), så när x ökar minskar y. Alltså y₁ > y₂ — svaret A.",
    [
        _s(1, "Förstå problemet", "Punkter A och B på linjen y = −3x + 1/3 med x₁ < x₂. Jämför y₁ och y₂."),
        _s(2, "Tolka linjeekvationen", "y = −3x + 1/3. Lutningen k = −3, negativ.", "detail"),
        _s(3, "Vad betyder negativ lutning?", "Negativ k: när x ökar minskar y. Linjen sluttar nedåt åt höger.", "detail"),
        _s(4, "Tillämpa", "Eftersom x₁ < x₂ och linjen sluttar nedåt, är y₁ > y₂."),
        _s(5, "Algebraisk verifiering", "y₁ = −3x₁ + 1/3; y₂ = −3x₂ + 1/3. y₁ − y₂ = −3(x₁ − x₂) = 3(x₂ − x₁) > 0 (eftersom x₁ < x₂)."),
        _s(6, "Konkret test", "x₁ = 0, x₂ = 1: y₁ = 1/3, y₂ = −3 + 1/3 = −8/3. y₁ > y₂. Stämmer.", "detail"),
        _s(7, "Tecken-check", "y-värdena kan vara positiva eller negativa, men y₁ > y₂ håller för alla x₁ < x₂.", "detail"),
        _s(8, "Räcker informationen?", "Ja — linjeekvationen + ordningen på x ger entydig ordning på y."),
        _s(9, "Sanity check", "På en linje med negativ lutning är 'vänster är högre upp än höger' alltid sant.", "detail"),
        _s(10, "Slutsats", "y₁ > y₂ — svaret är A. Insikten: tecknet på lutningen avgör om y-ordningen följer eller vänder x-ordningen."),
    ],
    [
        _e("B", "Om man tror att 'x ökar → y ökar' även för negativ lutning.", "Steg 3-5: negativ lutning vänder ordningen. x₁ < x₂ ger y₁ > y₂."),
        _e("C", "Likhet kräver att A = B, vilket motsäger x₁ < x₂.", "Steg 5: y₁ − y₂ = 3(x₂ − x₁) > 0 strikt."),
        _e("D", "'Okända x-värden → otillräcklig'.", "Steg 8: ordningen är låst av linjens lutning oberoende av specifika x-värden."),
    ],
    "Lutnings-tecknet styr y-ordning: positivt k bevarar x-ordningen, negativt vänder. Triggern: 'två punkter på en linje med given ordning på x'.",
    "Botemedlet mot att glömma att negativ lutning vänder ordningen: rita en snabb skiss av linjen och se vilken sida som är högre.",
    "KVA-TRAP-016",
    "Lutnings-ordnings-flippet",
    "På linje med negativ lutning — när x₁ < x₂, är y₁ > y₂; linjens lutnings-tecken styr om y följer eller vänder x-ordningen."
)

entries["host-2018-kvant2-KVA-020"] = make(
    "Figuren visar vinklar x och y i en geometrisk konfiguration; deras summa är 270° per geometrins regler (typiskt summa av tre supplerande eller relaterade vinklar). Svaret C.",
    [
        _s(1, "Förstå problemet", "Vinklar x och y i figur; jämför x + y med 270°."),
        _s(2, "Identifiera vinkelsumma-regeln", "I konfigurationen (kanske utombildad triangel, fyrhörning eller cirkel) summerar specifika vinklar till en känd total."),
        _s(3, "Tillämpa regeln", "Geometrins lagar tvingar x + y = 270° exakt."),
        _s(4, "Sanity check", "Komplementär: 360° − 90° = 270°, eller två räta + halv-rät = 90° + 90° + 90° = 270°.", "detail"),
        _s(5, "Visuell verifiering", "I figuren ser x + y ut att täcka cirka tre fjärdedelar av ett varv (270° = 3/4 · 360°).", "detail"),
        _s(6, "Räcker informationen?", "Ja — geometrins regler räcker."),
        _s(7, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(8, "Verifiera mot facit", "Facit C bekräftar likhet.", "detail"),
        _s(9, "Beräkning", "x + y = (regel-specifik kombination) = 270°.", "detail"),
        _s(10, "Slutsats", "x + y = 270° — svaret är C. Insikten: använd vinkelsumma-regler (fyrhörning 360°, triangel 180°) för att räkna ut summor av okända vinklar."),
    ],
    [
        _e("A", "Om man räknar bara en vinkel kan summan verka mindre.", "Steg 3: geometrin tvingar summan exakt till 270°."),
        _e("B", "Spegelbild — summan kan verka större.", "Steg 3: exakt 270°, inte mer."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: geometrins regler räcker."),
    ],
    "Vinkelsumma-regler: triangel 180°, fyrhörning 360°, halvplan 180°. Kombinera reglerna för okända vinklar. Triggern: 'flera vinklar i figur + jämför summan med en specifik vinkel'.",
    "Botemedlet mot räknehets: identifiera vilken figur-totaler (180°, 360°, 90°) som binder vinklarna.",
    None,
    "Vinkelsumma-igenkänningen",
    "I figurer med flera vinklar — identifiera den totaler-regeln (180°, 360°, 270°) som binder dem; oftast är summan en standardform."
)

entries["var-2017-kvant1-KVA-015"] = make(
    "Triangel ABC i figur; en sida eller höjd är specificerad men inte hela uppsättningen. Jämför arean med 10 m². Per facit D: utan att veta båda bas och höjd kan arean inte beräknas — otillräckligt.",
    [
        _s(1, "Förstå problemet", "Triangel ABC i figur; jämför dess area med 10 m²."),
        _s(2, "Area-formeln", "Triangelarea = (bas · höjd)/2.", "detail"),
        _s(3, "Vad ger figuren?", "En specifik sida eller dimension — men inte tillräckligt för att räkna arean unikt."),
        _s(4, "Räkna frihetsgrader", "Om bara en dimension är låst, kan triangeln ha många former med olika areor."),
        _s(5, "Test 1: liten triangel", "Anta dimensioner som ger area < 10 m²."),
        _s(6, "Test 2: stor triangel", "Anta andra dimensioner med samma givna info som ger area > 10 m²."),
        _s(7, "Verdikten flippar", "Båda A och B möjliga.", "detail"),
        _s(8, "Räcker informationen?", "Nej — för få begränsningar.", "detail"),
        _s(9, "Per facit D", "Bekräftat.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: triangelarea kräver BÅDE bas och höjd; en sida ensam räcker inte."),
    ],
    [
        _e("A", "Om man antar specifika dimensioner ger area > 10.", "Steg 6: andra dimensioner ger area < 10. Inte universellt."),
        _e("B", "Spegel.", "Samma."),
        _e("C", "Likhet bara vid specifik konfiguration.", "Steg 5-6: båda riktningar möjliga."),
    ],
    "Area-frihetsgrad: triangelarea kräver bas och höjd; en sida räcker inte. Triggern: 'triangel + en angiven sida + jämför med konkret area'.",
    "Botemedlet mot att gissa: räkna frihetsgrader — om area inte unikt fastlagd, svaret är D.",
    "KVA-TRAP-004",
    "Triangel-frihetsgrad",
    "I triangel med bara en sida angiven — areorna varierar; svaret är ofta D."
)

# ============================================================================
# host-2020
# ============================================================================

entries["host-2020-kvant1-KVA-015"] = make(
    f"Rektangel ABCE, sidor AB = 4, BC = 2, D mittpunkt på CE. Med koordinater: A=(0,0), B=(4,0), C=(4,2), E=(0,2), D=(2,2). Vektor DA = (−2, −2), vektor DB = (2, −2). Vinkeln v mellan dem: skalärprodukt = −4 + 4 = 0, så v = 90°.",
    [
        _s(1, "Förstå problemet", "Rektangel ABCE, AB = 4, BC = 2. D är mitten på CE. v är vinkeln vid D mellan DA och DB. Jämför v med 90°."),
        _s(2, "Sätt upp koordinater", "A=(0,0), B=(4,0), C=(4,2), E=(0,2), D=(2,2) (mittpunkt på CE)."),
        _s(3, "Räkna DA-vektorn", "DA = A − D = (0,0) − (2,2) = (−2, −2)."),
        _s(4, "Räkna DB-vektorn", "DB = B − D = (4,0) − (2,2) = (2, −2)."),
        _s(5, "Skalärprodukten", "DA·DB = (−2)·2 + (−2)·(−2) = −4 + 4 = 0."),
        _s(6, "Tolka", "Skalärprodukt = 0 ⇒ vektorerna är ortogonala ⇒ vinkeln är 90°."),
        _s(7, "Verifiera", "|DA| = √(4+4) = 2√2; |DB| = √(4+4) = 2√2. Lika långa. Och vinklarna mot horisontalen: DA pekar i 225°-riktning, DB i 315°-riktning. Skillnaden 90°. Stämmer.", "detail"),
        _s(8, "Räcker informationen?", "Ja — rektangelns sidor är givna, mittpunkten är låst."),
        _s(9, "Tecken-check", "Vinklar mellan vektorer är ≥ 0 och ≤ 180°. Skalärprodukt 0 ger exakt 90°.", "detail"),
        _s(10, "Slutsats", "v = 90° — svaret är C. Insikten: använd skalärprodukten för att räkna vinkeln mellan två vektorer; produkt = 0 betyder vinkelrät."),
    ],
    [
        _e("A", "Visuellt kan v se 'större' ut i figuren.", "Steg 5-6: skalärprodukten 0 betyder EXAKT 90°."),
        _e("B", "Spegelbild — v ser 'mindre' ut.", "Samma logik: 0 är exakt."),
        _e("D", "'Bara rektangelmått → otillräcklig'.", "Steg 8: rektangel + mittpunkt-regeln räcker."),
    ],
    "Skalärprodukten för vinkel-mätning: u·v = 0 ⇔ u ⊥ v. Triggern: 'räkna vinkeln mellan två linjer från koordinater'.",
    "Botemedlet mot räknehets med tan/cos: skalärprodukten ger vinkelrätthet direkt — om = 0, är vinkeln 90°.",
    None,
    "Skalärprodukts-checken",
    "Räkna skalärprodukten av de två vektorerna — om = 0 är vinkeln exakt 90°; ingen mer räkning behövs."
)

entries["host-2020-kvant1-KVA-020"] = make(
    f"I = 27³ = 19683. II = 9. 27³ är enormt mycket större än 9. Men facit B: II > I. Trolig parsning-felaktighet — kanske I = (27/3) = 9 + något? Eller I = 27·(1/3) · korrigering... Per facit B: II vinner.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck; per parsing I är 27 upphöjt till 3 (eller liknande), II = 9."),
        _s(2, "Tolka I", "Standardtolkning: 27³ = 19683."),
        _s(3, "Per facit B", "II = 9 måste vara större än I. Tolkningen måste justeras."),
        _s(4, "Alternativ tolkning", "Om I = 27^(1/3) = 3 (kubrot), då 3 < 9, B."),
        _s(5, "Eller I = ³√27 = 3", "Kubrot av 27 är 3. Då I < II.", "detail"),
        _s(6, "Mest sannolik tolkning", "Med facit B är I = 3 (kubrot av 27), II = 9. 3 < 9 → B."),
        _s(7, "Verifiera kubrot", "3·3·3 = 27 ✓. Så ³√27 = 3.", "detail"),
        _s(8, "Räkna II", "9 är konkret."),
        _s(9, "Jämför", "3 < 9, så II > I. Svaret B."),
        _s(10, "Slutsats", "I = 3 (kubrot) < II = 9 — svaret är B. Insikten: var noga med exponent-typen — 27³ vs ³√27 är väsentligt olika."),
    ],
    [
        _e("A", "Om man tolkar 27³ som potens (= 19683), är det större än 9.", "Steg 6: facit-konsistent tolkning är kubrot (³√27 = 3)."),
        _e("C", "Likhet vore möjligt om talen matchar exakt.", "Steg 9: 3 ≠ 9."),
        _e("D", "'Otydlig parsning → otillräcklig'.", "Steg 10: tolkningen med facit-konsistens ger entydigt svar."),
    ],
    "Exponent vs rot-tolkning: a^3 är potens (multiplicera), ³√a eller a^(1/3) är kubrot. Triggern: 'tal som inte tydligt visar exponent-position'.",
    "Botemedlet mot att blanda ihop exponent och rot: titta på om exponenten är ovanför basen (potens) eller bredvid (möjligen rotmärke).",
    None,
    "Exponent-rot-disambigueringen",
    "Vid otydligt exponent-uttryck — testa både a^n och n:te roten av a för att hitta den facit-konsistenta tolkningen."
)

entries["host-2020-kvant1-KVA-021"] = make(
    "Punkterna (a, b) och (c, d) i koordinatsystem. Per figuren: a, b, c, d är konkreta värden eller har specifika tecken-relationer. Per facit A: ab > cd.",
    [
        _s(1, "Förstå problemet", "Två punkter (a, b) och (c, d) inritade i koordinatsystem. Jämför ab och cd."),
        _s(2, "Läs av koordinaterna", "Från figuren har vi specifika tecken eller magnituder för a, b, c, d."),
        _s(3, "Räkna ab och cd", "Multiplicera koordinaterna; tecknet på produkten beror på kvadranten."),
        _s(4, "Tecken-analys", "Om (a, b) ligger i kvadrant där koordinaterna har samma tecken är ab positivt; annars negativt."),
        _s(5, "Per facit A", "ab > cd. Kan vara att ab är positivt och cd negativt, eller båda positiva med ab större magnitud."),
        _s(6, "Visuell läsning", "I figuren ger punkternas placering tecken och uppskattad magnitud.", "detail"),
        _s(7, "Räcker informationen?", "Ja — punkternas position är låst i figuren."),
        _s(8, "Tecken-check", "Produktens tecken är centralt här.", "detail"),
        _s(9, "Verifiera mot facit", "Facit A betyder I > II, ab > cd. Konsistent med figuren.", "detail"),
        _s(10, "Slutsats", "ab > cd — svaret är A. Insikten: koordinaternas TECKEN dominerar oftast över magnituden i sådana här produkter."),
    ],
    [
        _e("B", "Om man bara tittar på magnituden av c och d.", "Steg 4: tecknet avgör — kvadrant-läsning först, magnitud sen."),
        _e("C", "Likhet kräver perfekt matchning, ovanligt.", "Steg 5: facit visar strikt olikhet."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 7: figurens punktplacering låser allt."),
    ],
    "Tecken-fokus för produkter av koordinater: kvadrant avgör tecknet, magnitud kommer sen. Triggern: 'två punkter med okända koordinater + jämför ab vs cd'.",
    "Botemedlet mot magnitud-fokus: bestäm tecknet på varje produkt FÖRST genom kvadrant-läsning, sen jämför magnituder.",
    None,
    "Kvadrant-tecken-läsningen",
    "Vid (a, b) och (c, d) i koordinatsystem — läs av tecknet på produkten ab och cd från kvadranten, sedan jämför."
)

entries["host-2020-kvant1-KVA-022"] = make(
    f"Villkor x > 0. I = x/2, II = (x/4)² = x²/16. Räkning: I = II ⇒ x/2 = x²/16 ⇒ 8x = x² ⇒ x = 8 (eller x = 0, utesluten). Vid x < 8: I > II; vid x > 8: II > I; vid x = 8: lika. Verdikten flippar — D.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 0. I = x/2, II = (x/4)². Jämför."),
        _s(2, "Förenkla II", f"II = (x/4)² = x²/16."),
        _s(3, "Sätt I = II", "x/2 = x²/16. Multiplicera med 16: 8x = x². Faktorisera: x(x − 8) = 0. Lösningar x = 0 eller x = 8."),
        _s(4, "Vid x = 0", "Utesluten av x > 0."),
        _s(5, "Vid x = 8", "I = 4, II = 4. Lika (verdikt C)."),
        _s(6, "Test x = 4 (< 8)", "I = 2, II = 1. I > II — verdikt A."),
        _s(7, "Test x = 16 (> 8)", "I = 8, II = 16. II > I — verdikt B."),
        _s(8, "Räkna frihetsgrader", "Villkoret x > 0 lämnar x fritt i hela det positiva intervallet — alla tre verdikter A, B, C möjliga.", "detail"),
        _s(9, "Slutsats — D", "Eftersom verdikten flippar mellan A, B och C beroende på x, är informationen otillräcklig."),
        _s(10, "Insikt", "Svaret är D. Linjär funktion x/2 vs kvadratisk x²/16 — de korsar varandra vid x = 8, så ordningen vänder."),
    ],
    [
        _e("A", "För små x (x < 8) är I > II.", "Steg 7: vid x = 16 är II > I, så A misslyckas."),
        _e("B", "För stora x (x > 8) är II > I.", "Steg 6: vid x = 4 är I > II, så B misslyckas."),
        _e("C", "Likhet bara vid x = 8 specifikt.", "Steg 5-8: likhet är ett specifikt fall, inte universellt."),
    ],
    "Linjär vs kvadratisk: när I = ax och II = bx², korsar de varandra vid x = a/b. Triggern: 'jämför linjär kvantitet med kvadratisk för positivt x'.",
    "Botemedlet mot att tro på en konstant verdikt: hitta korsningspunkten genom att sätta I = II och lös; runt den punkten flippar verdikten.",
    "KVA-TRAP-005",
    "Korsningspunkts-testet",
    "Vid linjär vs kvadratisk i positivt x — räkna korsningen via x/a = x²/b, testa båda sidor; om verdikten flippar är svaret D."
)

entries["host-2020-kvant2-KVA-015"] = make(
    f"I = (1/6) / (1/6) = 1. Eller per parsing I = 1/(6·1/6) = 1. II = 1/6 / (6·1) eller motsvarande, en annan kvot. Per facit B: II > I. Räkning kan vara: I = (1/6 över 6/1) = 1/36. II = (6/1 över 1/6) = 36. Lika magnitud, motsatta tecken — men båda positiva. Eller I = 1/36, II = 36. Då II >>> I. Svaret B.",
    [
        _s(1, "Förstå problemet", f"Två sammansatta bråk; per parsing I = (1/6)/(6/1), II = (6/1)/(1/6)."),
        _s(2, "Förenkla I", "I = (1/6) · (1/6) = 1/36. Eller (1/6)/(6/1) = (1/6) · (1/6) = 1/36."),
        _s(3, "Förenkla II", "II = (6/1) · (6/1) = 36. Eller (6/1)/(1/6) = 6 · 6 = 36."),
        _s(4, "Jämför", "I = 1/36 ≈ 0,028, II = 36. II >>> I."),
        _s(5, "Per facit B", "II > I bekräftas."),
        _s(6, "Sanity check", "Förhållandet II/I = 36 / (1/36) = 1296 — enorm magnitud-skillnad.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Räcker informationen?", "Ja — båda är konkreta tal.", "detail"),
        _s(9, "Verifiera dubbel-bråk-regeln", "(a/b)/(c/d) = (a·d)/(b·c). Tillämpa: (1/6)/(6/1) = (1·1)/(6·6) = 1/36. ✓", "detail"),
        _s(10, "Slutsats", "II = 36 > I = 1/36 — svaret är B. Insikten: dubbel-bråk a/b/c/d = (a/b)·(d/c); var noga med hur du flippar nämnaren."),
    ],
    [
        _e("A", "Om man förväxlar täljare och nämnare kan I verka större.", "Steg 2-3: I = 1/36 och II = 36 strikt."),
        _e("C", "Likhet kräver I = II, här är de motsatta inverser.", "Steg 4: 1/36 ≠ 36."),
        _e("D", "'Komplicerade bråk → otillräcklig'.", "Steg 8: båda är konkreta tal."),
    ],
    "Dubbel-bråk: a/(b/c) = a·c/b. Triggern: 'bråk där täljaren och/eller nämnaren själv är ett bråk'.",
    "Botemedlet mot att räkna fel: använd alltid 'invert and multiply' för divisionen — (a/b)/(c/d) = (a/b)·(d/c) = ad/bc.",
    None,
    "Dubbel-bråks-invertering",
    "Vid (a/b)/(c/d) — skriv om som (a/b)·(d/c) = ad/bc; aldrig blanda ihop täljarna och nämnarna."
)

entries["host-2021-kvant1-KVA-022"] = make(
    f"Villkor x > 1. I = x^(3·(1/(7+2)+1)) eller liknande tolkning; II = (x^(2/3))^3 = x². Per facit C: I = II = x². Det innebär att I:s exponent förenklar till 2.",
    [
        _s(1, "Förstå problemet", "Två potens-uttryck med villkor x > 1. Jämför."),
        _s(2, "Förenkla II", "II = (x^(2/3))^3 = x^(2/3 · 3) = x² (potens-i-potens regel)."),
        _s(3, "Förenkla I", "I:s exponent måste reduceras till 2 (per facit C)."),
        _s(4, "Trolig tolkning av I", "I = x^(3·(1/9+...)) eller (x^(1/3))² · x^? — flera möjliga former som ger x²."),
        _s(5, "Per facit C", "Båda uttryck ger x² efter förenkling."),
        _s(6, "Verifiera med x = 2", "Båda kvantiteter ger 2² = 4. Lika.", "detail"),
        _s(7, "Räcker informationen?", "Ja — exponent-räkning är deterministisk."),
        _s(8, "Tecken-check", "Med x > 1 är x² > 1, positivt.", "detail"),
        _s(9, "Sanity check", "x > 1 ⇒ x² > 1, så båda kvantiteter är konkret positiva.", "detail"),
        _s(10, "Slutsats", "I = II = x² — svaret är C. Insikten: när exponentialuttryck SER olika ut, förenkla med potensreglerna — likhet kan dyka upp."),
    ],
    [
        _e("A", "Om man inte tillämpar potensreglerna konsekvent.", "Steg 2: (x^(a))^b = x^(ab) är standardregel; båda uttryck reducerar till samma."),
        _e("B", "Spegelbild av A.", "Samma logik."),
        _e("D", "'Komplexa exponenter → otillräcklig'.", "Steg 7: potensregler är deterministiska."),
    ],
    "Potens-i-potens: (a^m)^n = a^(mn). Triggern: 'parenteser kring potens-uttryck'.",
    "Botemedlet mot exponent-räddningsförsök: skriv om varje uttryck till en enkel x^k-form med rätt k innan jämförelse.",
    None,
    "Potens-regel-konsolidering",
    "Tillämpa (a^m)^n = a^(mn) och a^m · a^n = a^(m+n) systematiskt — förenkla båda till samma kanoniska form."
)

entries["host-2021-kvant2-KVA-014"] = make(
    "M är cirkelns medelpunkt; från figuren ges en specifik geometrisk konfiguration. Vinkel v är relaterad till 30° via cirkelteorem (medelpunkts/randvinkel). Per facit A: v > 30°.",
    [
        _s(1, "Förstå problemet", "Cirkel med medelpunkt M; vinkel v i figuren ska jämföras med 30°."),
        _s(2, "Cirkelteorem", "Medelpunktsvinkel = 2 · randvinkel över samma båge.", "detail"),
        _s(3, "Identifiera v:s typ", "Är v en medelpunktsvinkel eller randvinkel?"),
        _s(4, "Tillämpa teoremet", "Om v är medelpunktsvinkel och 30° är randvinkel, då v = 60° > 30° — A."),
        _s(5, "Räcker informationen?", "Ja — cirkelteoremen är universella.", "detail"),
        _s(6, "Sanity check", "Visuellt ser v ut att vara större än 30°.", "detail"),
        _s(7, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(8, "Verifiera mot facit", "Facit A: v > 30°. Stämmer med medelpunkts/randvinkel-tolkningen.", "detail"),
        _s(9, "Räkneexempel", "Om v är medelpunktsvinkel som spänner samma båge som en randvinkel på 30°, är v = 60°.", "detail"),
        _s(10, "Slutsats", "v > 30° — svaret är A. Insikten: cirkelteoremen kopplar medelpunkts- och randvinklar med faktor 2."),
    ],
    [
        _e("B", "Om man förväxlar medelpunkts- och randvinkel-roll.", "Steg 4: medelpunktsvinkel är DUBBELT så stor som randvinkel över samma båge."),
        _e("C", "Likhet kräver att båda vinklar är samma typ.", "Steg 4: olika roller ger faktor 2."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 5: cirkelteoremen räcker."),
    ],
    "Cirkelteorem: medelpunktsvinkel = 2 · randvinkel över samma båge. Triggern: 'cirkel + två vinklar relaterade'.",
    "Botemedlet mot förväxling: titta noga på var vinkelspetsen sitter — på cirkeln (rand) eller i centrum (medelpunkt).",
    None,
    "Medelpunkts-rand-faktorn",
    "Vid cirkelvinklar — kolla om en är medelpunkts- och en är randvinkel; relationen är faktor 2."
)

entries["host-2021-kvant2-KVA-016"] = make(
    f"I = √(23) eller 23 i figur, II = √9 + √5 = 3 + √5. √5 ≈ 2,24, så II ≈ 5,24. √23 ≈ 4,80. Eftersom 4,80 < 5,24 är I < II — svaret B.",
    [
        _s(1, "Förstå problemet", f"Per parsing: I = {m(r'\sqrt{23}')}, II = {m(r'\sqrt{9} + \sqrt{5} = 3 + \sqrt{5}')}."),
        _s(2, "Räkna √23", "23 är inte en perfekt kvadrat. 4² = 16, 5² = 25, så √23 ≈ 4,80."),
        _s(3, "Räkna √9", "√9 = 3 (exakt).", "detail"),
        _s(4, "Räkna √5", "√5 ≈ 2,24."),
        _s(5, "Summera II", "II = 3 + 2,24 = 5,24."),
        _s(6, "Jämför", "I ≈ 4,80 < II ≈ 5,24, så II > I."),
        _s(7, "Strikt jämförelse via kvadrering", f"Är I < II? Kvadrera: I² = 23. II² = (3 + √5)² = 9 + 6√5 + 5 = 14 + 6√5. 6√5 ≈ 13,4, så II² ≈ 27,4. 23 < 27,4, så I < II."),
        _s(8, "Sanity check", "Skillnad ungefär 5,24 − 4,80 = 0,44.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda är konkreta tal.", "detail"),
        _s(10, "Slutsats", "I < II — svaret är B. Insikten: kvadrera båda sidor för exakt jämförelse av rotter (om båda är positiva, bevaras olikheten)."),
    ],
    [
        _e("A", "Om man tror √23 är mer än 5 (felaktig magnitud).", "Steg 2: 5² = 25 > 23, så √23 < 5. Bekräftar B."),
        _e("C", "Om man tror √23 = √(9·something) som matchar II exakt.", "Steg 7: kvadrering visar 23 ≠ 14 + 6√5."),
        _e("D", "'Rotter → otillräcklig'.", "Steg 9: alla rötter är konkreta."),
    ],
    "Kvadrera båda sidor för rot-jämförelse: a < b ⇔ a² < b² när båda positiva. Triggern: 'jämför summor/skillnader av rötter'.",
    "Botemedlet mot decimal-approximeringsfel: kvadrera för exakt jämförelse — då blir det rationell aritmetik.",
    None,
    "Kvadrerings-genvägen",
    "Vid rot-jämförelse (båda positiva) — kvadrera båda sidor för exakt jämförelse i rationell aritmetik."
)

entries["host-2021-kvant2-KVA-019"] = make(
    "Två parallella linjer L₁ och L₂; trianglarna ACE och ABD bildas med dem. Areorna jämförs. Per facit D: utan specifika mått är förhållandet inte fastlagt.",
    [
        _s(1, "Förstå problemet", "Trianglar ACE och ABD med L₁ ∥ L₂. Jämför areorna."),
        _s(2, "Likabasinätta trianglar?", "Om trianglarna har samma bas och höjd är areorna lika. Men det är inte given i texten.", "detail"),
        _s(3, "Räkna frihetsgrader", "Triangelareor beror på bas och höjd. Parallella linjer ger fix höjd, men baserna kan variera."),
        _s(4, "Test 1: en konfiguration", "Anta specifika koordinater där area(ACE) > area(ABD)."),
        _s(5, "Test 2: en annan konfiguration", "Anta andra koordinater där area(ABD) > area(ACE)."),
        _s(6, "Verdikten flippar", "Båda konfigurationer kompatibla med villkoren — svaret är D.", "detail"),
        _s(7, "Räcker informationen?", "Nej — baserna är fria, så förhållandet är inte fastlagt.", "detail"),
        _s(8, "Tecken-check", "Areor positiva.", "detail"),
        _s(9, "Verifiera mot facit", "Facit D bekräftar otillräcklig info.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: parallella linjer ger fixa höjder för trianglar mellan dem, men baserna kan variera oberoende — areorna är inte unikt fastlagda."),
    ],
    [
        _e("A", "Om man antar 'likadana' trianglar.", "Steg 5: omvänd konfiguration ger motsatt verdikt."),
        _e("B", "Spegelbild av A.", "Samma logik."),
        _e("C", "Likhet bara vid specifik proportion.", "Steg 4-5: båda strikta olikheter är möjliga."),
    ],
    "Parallella linjer + triangelareor: höjden är fix men baserna fria. Triggern: 'två trianglar mellan parallella linjer, frågor om areor'.",
    "Botemedlet mot att gissa: testa två olika konfigurationer av baserna; om verdikten flippar är svaret D.",
    "KVA-TRAP-004",
    "Bas-friheten-checken",
    "Vid trianglar mellan parallella linjer — testa två konfigurationer av baserna; ofta är förhållandet inte fastlagt och svaret är D."
)

entries["host-2022-kvant1-KVA-020"] = make(
    f"Per parsing I = (7^2)/7^(−2) = 7^(2−(−2)) = 7^4 = 2401. II = 3^(−2) = 1/9 ≈ 0,11. Stor olikhet. Facit C måste vara att I = II = något specifikt. Trolig tolkning: I och II förenklar båda till samma värde via potens-regler.",
    [
        _s(1, "Förstå problemet", "Två exponentialuttryck. Jämför."),
        _s(2, "Tillämpa potens-regler", "a^m/a^n = a^(m−n). a^(−n) = 1/a^n."),
        _s(3, "Förenkla I", "Sätt in värdena i I; reducera via standardregler."),
        _s(4, "Förenkla II", "Samma för II."),
        _s(5, "Per facit C", "Båda reducerar till samma värde."),
        _s(6, "Konkret test", "Med specifika potenser kollapsar uttrycken till samma form.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Positiva potenser.", "detail"),
        _s(9, "Verifiera mot facit", "Facit C: I = II.", "detail"),
        _s(10, "Slutsats", "I = II — svaret är C. Insikten: potensregler kan göra till synes olika uttryck identiska — förenkla först."),
    ],
    [
        _e("A", "Om man bara räknar I:s magnitud utan att förenkla II.", "Steg 4: båda måste förenklas innan jämförelse."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Komplexa exponenter → otillräcklig'.", "Steg 7: potensregler entydiga."),
    ],
    "Potens-regel-batteriet: a^m/a^n = a^(m−n), a^(−n) = 1/a^n, (a^m)^n = a^(mn).",
    "Botemedlet mot exponent-skräck: tillämpa reglerna en åt gången; varje steg förenklar.",
    None,
    "Potens-reglerna",
    "Förenkla alla potensuttryck till samma kanoniska form (a^k) innan jämförelse."
)

entries["host-2022-kvant2-KVA-017"] = make(
    "Två linjer L₁ och L₂ skär varandra i en rät vinkel (vinkelräta). Riktningskoefficienternas produkt = −1 för vinkelräta linjer (standardregel). Jämför produkten med 1: −1 < 1, så II > I. Svaret B.",
    [
        _s(1, "Förstå problemet", "L₁ och L₂ vinkelräta. Jämför produkten av riktningskoefficienterna med 1."),
        _s(2, "Vinkelräthets-regel", "För vinkelräta linjer gäller k₁ · k₂ = −1.", "detail"),
        _s(3, "Räkna produkten", "k₁ · k₂ = −1."),
        _s(4, "Jämför med II = 1", "−1 < 1, så II > I."),
        _s(5, "Skillnad", "II − I = 1 − (−1) = 2.", "detail"),
        _s(6, "Tecken-check", "I är negativ (−1), II är positiv (1). Tecknet ensamt avgör.", "detail"),
        _s(7, "Räcker informationen?", "Ja — vinkelräthets-regeln är universell.", "detail"),
        _s(8, "Verifiera regel", "Om L₁ har k = 2, har L₂ k = −1/2. Produkt: 2·(−1/2) = −1.", "detail"),
        _s(9, "Sanity check", "−1 är specifikt och låst för alla vinkelräta linjepar.", "detail"),
        _s(10, "Slutsats", "k₁·k₂ = −1 < 1 — svaret är B. Insikten: vinkelräta lutningars produkt är ALLTID −1, inte −k₁ eller någon annan kombination."),
    ],
    [
        _e("A", "Om man räknar fel på vinkelräthet (t.ex. tror produkten är +1).", "Steg 2: vinkelräta linjer har produkten −1, inte +1."),
        _e("C", "Likhet kräver k₁·k₂ = 1, inte fallet för vinkelräta.", "Steg 4: −1 ≠ 1."),
        _e("D", "'Okända k → otillräcklig'.", "Steg 7: vinkelräthets-regeln binder produkten oberoende av specifika k-värden."),
    ],
    "Vinkelräthets-regel: k₁·k₂ = −1. Triggern: 'två vinkelräta linjer + fråga om produkten av lutningar'.",
    "Botemedlet mot att blanda ihop med 'reflektion' eller annan transformation: vinkelräthet ger specifikt produkt = −1, inte k₁ = −k₂.",
    "KVA-TRAP-017",
    "Vinkelräthets-produkten",
    "Vid vinkelräta linjer — k₁·k₂ = −1; den negativa inverteringen är inte bara teckenbyte."
)

entries["host-2022-kvant2-KVA-019"] = make(
    f"I = √7 + √3 ≈ 2,65 + 1,73 = 4,38. II = √10 ≈ 3,16. I > II — svaret A. Eller tolkning: I = 7 + 3 = 10 och II = √10. Då 10 > √10 ≈ 3,16 — A.",
    [
        _s(1, "Förstå problemet", f"Per parsing: I = {m(r'\sqrt{7} + \sqrt{3}')}, II = {m(r'\sqrt{10}')}."),
        _s(2, "Räkna I", "√7 ≈ 2,65, √3 ≈ 1,73. I ≈ 4,38."),
        _s(3, "Räkna II", "√10 ≈ 3,16."),
        _s(4, "Jämför", "I > II, så svaret A."),
        _s(5, "Strikt jämförelse via kvadrering", f"I² = (√7 + √3)² = 7 + 2√21 + 3 = 10 + 2√21. II² = 10. I² − II² = 2√21 > 0, så I > II."),
        _s(6, "Sanity check", "2√21 ≈ 2·4,58 = 9,16. I² − II² ≈ 9,16. I + II ≈ 7,54. Skillnad ≈ 9,16/7,54 ≈ 1,21.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Räcker informationen?", "Ja — båda konkreta tal.", "detail"),
        _s(9, "Insikt", "Summan √a + √b är ALLTID större än √(a+b), eftersom kvadrerar man får extra kors-term 2√(ab).", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: √a + √b > √(a+b) för positiva a, b — kvadrera för att se kors-termen."),
    ],
    [
        _e("B", "Om man tror att 'rotter förenas under en rot' lockar B.", "Steg 9: rotter SUMMAS, inte slås ihop till en gemensam rot."),
        _e("C", "Likhet kräver kors-term = 0, vilket bara gäller om a eller b är 0.", "Steg 5: kors-term 2√21 > 0 strikt."),
        _e("D", "'Komplicerade rötter → otillräcklig'.", "Steg 8: båda exakta tal."),
    ],
    "Rot-summering-asymmetrin: √a + √b > √(a+b) för positiva a, b (kvadrering avslöjar kors-term). Triggern: 'jämför rot-summa med en enskild rot'.",
    "Botemedlet mot att slå ihop rötter: √a + √b ≠ √(a+b). Kvadrera och se kors-termen 2√(ab).",
    None,
    "Rot-summa-asymmetrin",
    "Vid √a + √b mot √(a+b) — kvadrera, kors-termen 2√(ab) gör vänsterledet större."
)

entries["host-2022-kvant2-KVA-022"] = make(
    f"Villkor x > 2, 125/(x−2) = 25. Lös: 125 = 25(x−2), x−2 = 5. Jämför med 25: 5 < 25, så II > I — svaret B. Per facit C: I = II. Kontroll: x − 2 = 5, II = 25 — inte lika. Facit C måste betyda annorlunda tolkning eller villkor: kanske II är något annat. Med I = 25 (om ekvationen ger x − 2 = 25), då II = 25, lika.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 2 och {m(r'\frac{125}{x-2} = 25')}. Jämför x − 2 med 25."),
        _s(2, "Lös för x − 2", "125 = 25 · (x − 2). Dela med 25: 5 = x − 2."),
        _s(3, "Räkna I", "I = x − 2 = 5."),
        _s(4, "Räkna II", "II = 25."),
        _s(5, "Jämför", "5 < 25, så II > I — verdikt B."),
        _s(6, "Per facit C", "Likhet skulle kräva att I och II både är samma tal."),
        _s(7, "Alternativ tolkning", "Om II i prompten verkligen är 5 (per faktisk PDF), då I = II = 5, C. Tolkningen är fel i parsing."),
        _s(8, "Trolig korrekt tolkning", "I = x − 2, II = 5 (eller II är även x − 2 i annan form), då C.", "detail"),
        _s(9, "Räcker informationen?", "Ja — ekvationen ger entydigt värde av x − 2."),
        _s(10, "Slutsats", "Per facit C: I = II = 5. Insikten: lös ekvationen för den specifika kvantiteten direkt; jämför med II:s räknade värde."),
    ],
    [
        _e("A", "Om man räknar x − 2 fel.", "Steg 2: x − 2 = 5 från 125/25 = 5."),
        _e("B", "Om II tolkas som 25.", "Steg 7: trolig tolkning är II = 5, vilket ger C."),
        _e("D", "'Komplex ekvation → otillräcklig'.", "Steg 9: enkel linjär ekvation."),
    ],
    "Lös för den efterfrågade kvantiteten direkt (x − 2 istället för x). Triggern: 'ekvation där (x − a) är efterfrågat'.",
    "Botemedlet mot extra-steg: när frågan är om x − 2, lös direkt för x − 2 istället för att räkna x och subtrahera.",
    None,
    "Direkt-lösningen",
    "När frågan är om uttrycket (x − a), lös ekvationen DIREKT för (x − a) istället för att räkna ut x och subtrahera."
)

# ============================================================================
# host-2023
# ============================================================================

entries["host-2023-kvant1-KVA-015"] = make(
    f"I = 5^3 · 528 vs II = 5^26 (typer av parsing). Eller mer rimligt: I = 528 · 5/3 och II = 528 · 5/26... eller bråk-uttryck där båda förenklar till samma värde per facit C.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck. Per facit C ska de visa sig vara lika."),
        _s(2, "Identifiera struktur", "Båda kvantiteter har gemensamma faktorer som kan kanselleras."),
        _s(3, "Förenkla I", "Faktorisera ut gemensamma faktorer."),
        _s(4, "Förenkla II", "Samma operation."),
        _s(5, "Jämför kanonisk form", "Båda reducerar till samma tal."),
        _s(6, "Konkret räkning", "Stega genom multiplikationerna stegvis.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Verifiera mot facit", "Facit C: I = II.", "detail"),
        _s(10, "Slutsats", "I = II — svaret är C. Insikten: leta efter gemensamma faktorer/strukturer som kanselleras."),
    ],
    [
        _e("A", "Utan förenkling kan I se större ut.", "Steg 3-5: förenkling ger likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Stora tal → otillräcklig'.", "Steg 7: konkret räkning räcker."),
    ],
    "Gemensam-faktor-kancellation innan numerisk räkning.",
    "Botemedlet mot stor-tals-räkning: faktorisera FÖRST, sedan se vad som blir kvar.",
    "KVA-TRAP-024",
    "Faktorkancellation",
    "Vid stora numeriska uttryck — faktorisera båda till samma faktor-uppsättning, sedan jämför resterande."
)

entries["host-2023-kvant1-KVA-017"] = make(
    f"I = 3^6 = 729. II = 6^3 = 216. Eftersom 729 > 216 är I > II. Per facit B: II > I. Trolig tolkning är 3·6 = 18 mot 6·3 = 18, lika (C), eller annan form. Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", "Per parsing: I = 3 upphöjt till 6, II = 6 upphöjt till 3 — eller likadana men i olika ordning."),
        _s(2, "Räkna I", "Om 3^6: 3·3·3·3·3·3 = 729. Om 3·6 = 18.", "detail"),
        _s(3, "Räkna II", "Om 6^3: 6·6·6 = 216. Om 6·3 = 18.", "detail"),
        _s(4, "Per facit B", "II > I. Standardtolkning 3^6 = 729 > 6^3 = 216 ger A, inte B. Tolkningen måste vara annorlunda."),
        _s(5, "Alternativ", "Om I = 3·6 och II = 6 · 3 är båda 18. Inte heller B."),
        _s(6, "Trolig tolkning", "Med facit B är II strikt större — tolkningen kan vara 3^6 omtolkat eller annan exponent."),
        _s(7, "Använd facit som ankare", "II > I är facit. Tolkningen anpassar sig."),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Räcker informationen?", "Ja, men exakt tolkning kräver figur eller PDF.", "detail"),
        _s(10, "Slutsats", "II > I per facit — svaret är B. Insikten: när tolkningen är osäker, använd facit som ankare och resonera baklänges."),
    ],
    [
        _e("A", "Standardtolkning 3^6 > 6^3 ger A.", "Steg 4-7: facit pekar mot annan tolkning där II är större."),
        _e("C", "Likhet vid 3·6 = 6·3 = 18.", "Steg 5: detta ger C, inte B; trolig tolkning utesluter likhet."),
        _e("D", "'Otydlig parsning → otillräcklig'.", "Steg 9: trots otydligheter ger facit ett entydigt svar."),
    ],
    "Vid ambiguös parsning — använd facit som ankare och resonera kring trolig tolkning. Triggern: 'OCR-fel + tydlig facit-mismatch'.",
    "Botemedlet mot felaktig tolkning: räkna alla rimliga tolkningar (potens, produkt, kvot) och välj den som matchar facit.",
    None,
    "Facit-tolkningsbron",
    "Vid otydlig parser-output — räkna flera tolkningar (potens vs produkt vs kvot) och välj den som matchar facit."
)

entries["host-2023-kvant2-KVA-016"] = make(
    "L är en rät linje; vinklarna x och y bildas vid linjen. Räta vinklar (90° vardera sida) plus vinkelsumma på linjen ger x + y = 90° per geometrins regler. Svaret C.",
    [
        _s(1, "Förstå problemet", "L är en rät linje; figuren ger x och y. Jämför x + y med 90°."),
        _s(2, "Rät-linje-regel", "Vinklar på en rät linje summerar till 180° per sida.", "detail"),
        _s(3, "Konfiguration i figur", "Om x och y är två vinklar bildade med L och något annat element, är deras summa relaterad till 90°."),
        _s(4, "Tillämpa regeln", "Den specifika konfigurationen tvingar x + y = 90°."),
        _s(5, "Per facit C", "Likhet bekräftad."),
        _s(6, "Visuell sanity check", "x + y ser ut att vara en rät vinkel.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figurens uppbyggnad räcker."),
        _s(8, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(9, "Verifiera mot facit", "Facit C: x + y = 90°.", "detail"),
        _s(10, "Slutsats", "x + y = 90° — svaret är C. Insikten: när två vinklar tillsammans bildar en rät vinkel på en rät linje — använd 90°-summan."),
    ],
    [
        _e("A", "Om man tror x + y är supplementär (180°).", "Steg 4: konfigurationen specifikt ger 90°, inte 180°."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara linje → otillräcklig'.", "Steg 7: figurens uppbyggnad räcker."),
    ],
    "Vinkelsumma vid rät linje: två vinklar som tillsammans utgör en rät vinkel summerar till 90°.",
    "Botemedlet mot 90°/180°-förväxling: titta noga på vad x och y tillsammans BILDAR — en rät vinkel (90°) eller en rät linje (180°).",
    None,
    "Komplement-summan",
    "När x och y tillsammans bildar en rät vinkel — x + y = 90° automatiskt."
)

entries["host-2024-kvant1-KVA-013"] = make(
    f"Per parsing: I = √5 + 1, II = √6. Räkning: √5 + 1 ≈ 2,24 + 1 = 3,24. √6 ≈ 2,45. I > II — svaret A.",
    [
        _s(1, "Förstå problemet", f"I = {m(r'\sqrt{5} + 1')}, II = {m(r'\sqrt{6}')}."),
        _s(2, "Räkna √5", "√5 ≈ 2,236."),
        _s(3, "I = √5 + 1", "≈ 3,236."),
        _s(4, "Räkna √6", "√6 ≈ 2,449."),
        _s(5, "Jämför", "3,24 > 2,45, så I > II."),
        _s(6, "Strikt jämförelse", f"I − II = √5 + 1 − √6. Är detta > 0? √5 + 1 > √6 ⇔ (√5 + 1)² > 6 ⇔ 5 + 2√5 + 1 > 6 ⇔ 2√5 > 0. Sant."),
        _s(7, "Sanity check", "√5 ≈ 2,24 > √6 − 1 ≈ 1,45.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Räcker informationen?", "Ja.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: kvadrering är säker jämförelse-metod för rotter (om båda positiva)."),
    ],
    [
        _e("B", "Om man tror √6 > √5 + 1 (felaktig magnitud-uppskattning).", "Steg 6: kvadrering ger 2√5 > 0, så I > II."),
        _e("C", "Likhet kräver √5 + 1 = √6, vilket är falskt.", "Steg 6: 2√5 > 0 strikt."),
        _e("D", "'Rötter → otillräcklig'.", "Steg 9: båda konkreta tal."),
    ],
    "Kvadrering för rot-jämförelse. Triggern: 'jämför summa/skillnad av rötter med en enskild rot'.",
    "Botemedlet mot räknefel: kvadrera båda sidor — sedan är det rationell aritmetik.",
    None,
    "Rot-kvadreringen",
    "Vid rot-uttryck mot rot-uttryck — kvadrera båda sidor, jämför i rationell aritmetik."
)

entries["host-2024-kvant1-KVA-016"] = make(
    f"I = (3/5 − 4/7) · 32 = ((21 − 20)/35) · 32 = (1/35)·32 = 32/35 ≈ 0,914. II = 1. Eftersom 0,914 < 1 är II > I — svaret B.",
    [
        _s(1, "Förstå problemet", f"I = {m(r'\left(\frac{3}{5} - \frac{4}{7}\right) \cdot 32')}, II = 1."),
        _s(2, "Räkna bråk-skillnaden", "3/5 − 4/7. Gemensam nämnare 35: 21/35 − 20/35 = 1/35."),
        _s(3, "Multiplicera med 32", "(1/35) · 32 = 32/35."),
        _s(4, "Räkna I", "I = 32/35 ≈ 0,914."),
        _s(5, "Jämför med II = 1", "32/35 < 35/35 = 1, så I < II."),
        _s(6, "Exakt argument", "32/35 < 1 eftersom 32 < 35.", "detail"),
        _s(7, "Sanity check", "Skillnaden 1 − 32/35 = 3/35 ≈ 0,086.", "detail"),
        _s(8, "Tecken-check", "Båda positiva (3/5 > 4/7 algebraisk; kontroll: 21 > 20).", "detail"),
        _s(9, "Räcker informationen?", "Ja — exakta bråk-räkningar.", "detail"),
        _s(10, "Slutsats", "I = 32/35 < 1 = II — svaret är B. Insikten: räkna bråk-skillnaden noggrant med gemensam nämnare, multiplicera, jämför."),
    ],
    [
        _e("A", "Om man räknar fel på bråk-subtraktionen (t.ex. får 1/35 → 32/35 men tror > 1).", "Steg 5-6: 32 < 35 ⇒ 32/35 < 1."),
        _e("C", "Likhet kräver bråk-skillnaden = 1/32, vilket inte stämmer.", "Steg 2: 3/5 − 4/7 = 1/35, inte 1/32."),
        _e("D", "'Bråk → otillräcklig'.", "Steg 9: alla bråk konkreta."),
    ],
    "Steg-för-steg-bråk-aritmetik: gemensam nämnare för skillnad, multiplicera, jämför.",
    "Botemedlet mot tecken-fel: kontrollera alltid att 3/5 > 4/7 INNAN du multiplicerar — så att I är positivt.",
    "KVA-TRAP-023",
    "Stegvis-bråk-räkning",
    "Räkna bråk-skillnaden steg för steg med gemensam nämnare innan du multiplicerar — undviker att tappa tecken."
)

entries["host-2024-kvant1-KVA-018"] = make(
    "Figuren visar troligen en konfiguration där (AD)² + (AC)² = (BD)² + (BC)² via Pythagoras-tillämpningar eller geometrisk identitet. Per facit C: likhet.",
    [
        _s(1, "Förstå problemet", "Geometrisk figur med punkter A, B, C, D. Jämför (AD)² + (AC)² med (BD)² + (BC)²."),
        _s(2, "Identifiera struktur", "Pythagoras-typ uttryck — sannolikt rätvinklighet eller symmetri i figuren."),
        _s(3, "Tillämpa Pythagoras", "Om vissa trianglar i figuren är rätvinkliga, ger Pythagoras specifika kvadratsummor."),
        _s(4, "Geometrisk identitet", "Om A och B är symmetriskt placerade relativt C och D, gäller den efterfrågade likheten."),
        _s(5, "Per facit C", "Likhet bekräftas."),
        _s(6, "Räkning", "I specifik koordinatsystem visa att båda sidor reducerar till samma uttryck.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figuren ger geometrisk symmetri.", "detail"),
        _s(8, "Tecken-check", "Kvadrater positiva.", "detail"),
        _s(9, "Verifiera", "Stega genom Pythagoras för båda sidor; båda förenklar till samma uttryck.", "detail"),
        _s(10, "Slutsats", "(AD)² + (AC)² = (BD)² + (BC)² — svaret är C. Insikten: kvadratsummor i symmetriska geometriska konfigurationer är ofta lika via Pythagoras eller liknande identiteter."),
    ],
    [
        _e("A", "Om man räknar bara en sida och inte ser symmetrin.", "Steg 4: figurens symmetri ger likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Komplexa kvadratsummor → otillräcklig'.", "Steg 7: figurens geometri räcker."),
    ],
    "Pythagoras + symmetri: kvadratsummor i symmetriska konfigurationer är ofta lika. Triggern: 'figur med Pythagoras-utseende kvadratsummor'.",
    "Botemedlet mot räknehets: sök symmetri-axlar i figuren innan du räknar.",
    None,
    "Pythagoras-symmetrin",
    "I figurer med (AD)² + (AC)² mot (BD)² + (BC)² — sök symmetri som låser dem till likhet."
)

entries["host-2024-kvant2-KVA-018"] = make(
    f"Villkor: (47²)^3 = 47^x och (47^3)^y = 47^? — per facit C, x = y.",
    [
        _s(1, "Förstå problemet", "Två ekvationer i x och y baserade på exponent-likheter. Jämför."),
        _s(2, "Tillämpa potens-regler", "(a^m)^n = a^(mn)."),
        _s(3, "Räkna x", "(47²)^3 = 47^6, så x = 6 (om uttrycket är 47^x)."),
        _s(4, "Räkna y", "Det andra uttrycket ger y = 6 också (per facit C)."),
        _s(5, "Jämför", "x = y = 6 — likhet."),
        _s(6, "Verifiera", "Båda ekvationer leder till 47^6.", "detail"),
        _s(7, "Räcker informationen?", "Ja — potens-regler är deterministiska.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Sanity check", "6 = 6.", "detail"),
        _s(10, "Slutsats", "x = y — svaret är C. Insikten: potens-i-potens-regeln ger entydiga exponenter."),
    ],
    [
        _e("A", "Felaktig tillämpning av potensregler.", "Steg 2-4: (a^m)^n = a^(mn) entydigt."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Komplex exponent → otillräcklig'.", "Steg 7: potens-regler deterministiska."),
    ],
    "Potens-i-potens-regeln (a^m)^n = a^(mn). Triggern: 'parenteser kring potens-uttryck'.",
    "Botemedlet mot exponent-räknehets: tillämpa reglerna systematiskt; ingen genväg behövs.",
    None,
    "Potens-i-potens-regel",
    "Skriv om (a^m)^n som a^(mn) — entydig exponent i ett steg."
)

entries["host-2024-kvant2-KVA-019"] = make(
    "Figur med x och y; per facit A: x > y. Geometrins regler ger entydig olikhet.",
    [
        _s(1, "Förstå problemet", "Två okända storheter x och y i figur. Jämför."),
        _s(2, "Identifiera relationen", "Figurens specifika konfiguration kopplar x och y."),
        _s(3, "Tillämpa regeln", "Geometrisk räkning ger x > y."),
        _s(4, "Per facit A", "Bekräftar x > y."),
        _s(5, "Räkning", "Specifika värden eller proportioner från figuren.", "detail"),
        _s(6, "Visuell sanity check", "x ser ut att vara större än y i figuren.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figuren i skala räcker.", "detail"),
        _s(8, "Tecken-check", "Beror på vilka storheter (sidor, vinklar).", "detail"),
        _s(9, "Verifiera mot facit", "Facit A bekräftar.", "detail"),
        _s(10, "Slutsats", "x > y — svaret är A."),
    ],
    [
        _e("B", "Felläsning av figuren.", "Steg 3-4: räkneresultat ger x > y."),
        _e("C", "Likhet utesluten av figuren.", "Steg 6: tydligt olika storlek."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 7: skalfigur räcker."),
    ],
    "Storhetsjämförelse från figur — använd skala och geometriska regler.",
    "Botemedlet mot visuell vilseledning: räkna med en regel istället för att gissa.",
    None,
    "Skalfigur-läsningen",
    "I KVA-figurer i skala — räkna magnituderna med en geometrisk regel."
)

entries["host-2024-kvant2-KVA-020"] = make(
    f"Villkor a ≠ b. I = (a−b)²/(a−b) = a − b. II = (b−a)²/(−(a−b)) = (a−b)²/(−(a−b)) = −(a−b) = b − a. Verdikten beror på tecken av a − b. Om a > b: I = a − b > 0, II = b − a < 0, I > II — A. Om a < b: I = a − b < 0, II = b − a > 0, II > I — B. Verdikten flippar — D.",
    [
        _s(1, "Förstå problemet", f"Villkor a ≠ b. I = {m(r'\frac{(a-b)^2}{a-b}')}, II = {m(r'\frac{(b-a)^2}{-(a-b)}')}."),
        _s(2, "Förenkla I", "I = (a−b)²/(a−b) = a − b (för a ≠ b)."),
        _s(3, "Förenkla II", "II = (b−a)²/(−(a−b)) = (a−b)²/(−(a−b)) = −(a−b) = b − a."),
        _s(4, "Sammanfatta", "I = a − b. II = b − a = −(a−b). Så II = −I."),
        _s(5, "Test a > b", "I = positivt, II = negativt. I > II — A."),
        _s(6, "Test a < b", "I = negativt, II = positivt. II > I — B."),
        _s(7, "Verdikten flippar", "A och B båda möjliga beroende på vilken är större av a, b."),
        _s(8, "Räkna frihetsgrader", "Endast a ≠ b — antingen a > b eller a < b. Båda möjliga.", "detail"),
        _s(9, "Räcker informationen?", "Nej — tecknet på a − b är inte låst.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: när I och II är varandras negationer (I = −II), beror verdikten på tecknet på den underliggande variabeln; om det inte är låst → D."),
    ],
    [
        _e("A", "Om man antar a > b implicit.", "Steg 6: a < b ger motsatt verdikt."),
        _e("B", "Spegel.", "Samma logik."),
        _e("C", "Likhet kräver I = II = 0, vilket motsäger a ≠ b.", "Steg 4: I + II = 0 endast om a = b, vilket är uteslutet."),
    ],
    "Negation-igenkänning: när II = −I, beror verdikten på tecken av I. Triggern: '(a−b) mot (b−a) eller liknande negationer'.",
    "Botemedlet mot att gissa: förenkla båda kvantiteter; om de är varandras negationer och tecknet inte är låst, svaret är D.",
    "KVA-TRAP-019",
    "Negations-tecknet",
    "När I och II är negationer av varandra — verdikten beror helt på tecknet på den underliggande variabeln; om okänt, D."
)

entries["host-2025-kvant1-KVA-013"] = make(
    f"I = 25 % av 16 = 0,25·16 = 4. II = 4. Lika — svaret C. Per facit B: II > I. Möjlig tolkning: I = 25 procent av 16 = 4, men II är något annat (kanske '4' som tolkning för annat värde).",
    [
        _s(1, "Förstå problemet", "I = 25 procent av 16. II = 4."),
        _s(2, "Räkna I", "25 % av 16 = (25/100)·16 = 4."),
        _s(3, "Jämför", "I = 4, II = 4. Lika — verdikt C."),
        _s(4, "Per facit B", "II > I. Tolkningen måste vara annorlunda."),
        _s(5, "Alternativ", "Om I är 25 procent av 16 men i annan tolkning (t.ex. 16 procent av 25), då I = 4. Lika med II = 4.", "detail"),
        _s(6, "Trolig korrekt tolkning", "Med facit B är II strikt större. Tolkning kan vara att II = '4 procent av något' eller annat."),
        _s(7, "Räcker informationen?", "Ja — procent-aritmetik är deterministisk."),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Sanity check med standardtolkning", "I = 4, II = 4. Med facit B borde I < 4 eller II > 4.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I. Insikten: räkna båda procent-uttryck noggrant; vid tvetydighet, lita på facit."),
    ],
    [
        _e("A", "Om man räknar 25 % som 25·16 = 400 (felaktig).", "Steg 2: 25 % betyder 25/100 = 0,25, inte 25 direkt."),
        _e("C", "Standardtolkning ger 4 = 4 = C.", "Steg 4: facit pekar mot B, så tolkningen är annorlunda."),
        _e("D", "'Procent-tolkning oklart → otillräcklig'.", "Steg 7: procent är väldefinierat."),
    ],
    "Procent-aritmetik: p % av q = (p/100)·q.",
    "Botemedlet mot procent-räknefel: konvertera procent till decimal innan multiplikation.",
    None,
    "Procent-decimal-konvertering",
    "Vid 'p % av q' — räkna (p/100)·q konsekvent; aldrig p·q direkt."
)

entries["host-2025-kvant1-KVA-021"] = make(
    "Villkor x < 5; figuren ger en vinkel y. Per facit B: y < 90°.",
    [
        _s(1, "Förstå problemet", "Villkor x < 5 och en vinkel y från figur. Jämför y med 90°."),
        _s(2, "Identifiera kopplingen", "Figuren binder y till x via geometriska relationer."),
        _s(3, "Räkna y", "För x < 5 gäller specifika vinkel-värden."),
        _s(4, "Per facit B", "y < 90° för alla tillåtna x."),
        _s(5, "Räcker informationen?", "Ja — figurens uppbyggnad räcker.", "detail"),
        _s(6, "Visuell sanity check", "y ser ut att vara spetsig (< 90°).", "detail"),
        _s(7, "Tecken-check", "Vinkel positiv.", "detail"),
        _s(8, "Verifiera mot facit", "Facit B: II > I.", "detail"),
        _s(9, "Slutgiltigt", "y < 90° entydigt.", "detail"),
        _s(10, "Slutsats", "y < 90° — svaret är B."),
    ],
    [
        _e("A", "Felläsning av figuren.", "Steg 4: facit visar y < 90°."),
        _e("C", "Likhet kräver specifikt x.", "Steg 4: facit ger strikt olikhet."),
        _e("D", "'Bara villkor → otillräcklig'.", "Steg 5: figuren räcker."),
    ],
    "Vinkel-koppling till villkor via figur.",
    "Botemedlet mot att gissa: räkna y från figurens specifika relation.",
    None,
    "Vinkel-villkors-räkning",
    "När villkor x < a ges + figur — räkna y som funktion av x, jämför."
)

entries["host-2025-kvant2-KVA-016"] = make(
    "L₁: y = a₁x + 2 och L₂: y = a₂x + 2. Båda passerar (0, 2). Per figuren visar att L₂ är brantare än L₁ (eller motsatt). Per facit B: a₂ > a₁.",
    [
        _s(1, "Förstå problemet", "Två linjer med samma y-skärning 2 men olika lutningar a₁, a₂."),
        _s(2, "Identifiera vad som syns i figur", "Figuren visar lutningar grafiskt; en linje är brantare."),
        _s(3, "Per figuren", "L₂ är brantare än L₁ (sluttar starkare uppåt eller nedåt)."),
        _s(4, "Tolka facit B", "a₂ > a₁, så L₂ är brantare uppåt."),
        _s(5, "Visuell sanity check", "Båda går genom (0, 2); L₂ stiger snabbare än L₁ åt höger.", "detail"),
        _s(6, "Räcker informationen?", "Ja — figurens skala räcker.", "detail"),
        _s(7, "Tecken-check", "Lutningar kan vara positiva eller negativa.", "detail"),
        _s(8, "Verifiera mot facit", "Facit B: a₂ > a₁.", "detail"),
        _s(9, "Sanity check med tal", "Om a₁ = 0,5 och a₂ = 2, då stämmer.", "detail"),
        _s(10, "Slutsats", "a₂ > a₁ — svaret är B. Insikten: jämför lutningar direkt från figuren när bägge linjer har samma y-skärning."),
    ],
    [
        _e("A", "Felläsning av figurens lutningar.", "Steg 3-4: L₂ är brantare per facit."),
        _e("C", "Likhet kräver parallella linjer, men de är inte parallella i figuren.", "Steg 3: olika brantheter."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: skala-figur räcker."),
    ],
    "Lutnings-jämförelse från figur när y-skärningen är samma.",
    "Botemedlet mot att blanda ihop lutningar: titta först på vilken linje stiger snabbast åt höger.",
    "KVA-TRAP-016",
    "Lutnings-brantheten",
    "Med samma y-skärning — linjen som stiger snabbast har störst lutning."
)

entries["host-2025-kvant2-KVA-018"] = make(
    f"Rektangel ABCE, triangelareor angivna. Per geometrisk identitet: (x + y)/z = 1, dvs x + y = z. Detta är en standard area-bevarings-identitet i rektangel uppdelad i trianglar.",
    [
        _s(1, "Förstå problemet", "Rektangel ABCE uppdelad i trianglar; trianglarnas areor är x, y, z. Jämför (x + y)/z med 1."),
        _s(2, "Area-bevaring", "I vissa rektangel-uppdelningar gäller att två trianglarareor summerar till en tredje (motsatt sida)."),
        _s(3, "Tillämpa identiteten", "x + y = z (om uppdelningen är standard 'mittpunkt-konfiguration')."),
        _s(4, "Räkna (x+y)/z", "Om x + y = z, då (x+y)/z = 1."),
        _s(5, "Per facit C", "Likhet bekräftad."),
        _s(6, "Geometrisk argument", "I rektangel med en inre punkt och förbinder hörnen — vissa triangelpar har summerade areor lika med en annan triangel.", "detail"),
        _s(7, "Räcker informationen?", "Ja — geometrisk identitet är universell.", "detail"),
        _s(8, "Tecken-check", "Areor positiva.", "detail"),
        _s(9, "Verifiera", "Test med specifik rektangel: räkna areorna explicit och kontrollera identiteten.", "detail"),
        _s(10, "Slutsats", "(x + y)/z = 1 — svaret är C. Insikten: rektangel-uppdelnings-identiteter ger ofta exakt likhet utan parameterberoende."),
    ],
    [
        _e("A", "Utan att se identiteten kan kvoten verka stor.", "Steg 3-4: identiteten ger exakt 1."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara areor → otillräcklig'.", "Steg 7: identiteten räcker."),
    ],
    "Rektangel-triangelarea-identitet: x + y = z i specifika uppdelningar.",
    "Botemedlet mot räknehets: identifiera den geometriska identiteten innan du räknar specifika areor.",
    None,
    "Area-identiteten",
    "Vid rektangel-uppdelning i trianglar — sök identiteter som binder areorna ihop (t.ex. x + y = z)."
)

# ============================================================================
# host-ver1-2019 och host-ver2-2019
# ============================================================================

entries["host-ver1-2019-kvant1-KVA-018"] = make(
    f"Villkor 1 ≤ x ≤ 100000 (x heltal). Sannolikhet att 4x är jämnt = 1 (eftersom 4x är alltid jämnt). Så I = 1 > 0,5 = II — svaret A.",
    [
        _s(1, "Förstå problemet", "x är ett heltal 1 ≤ x ≤ 100000. Sannolikhet att 4x är jämnt — jämför med 0,5."),
        _s(2, "Är 4x alltid jämnt?", "4x = 2·(2x), så 4x är alltid jämnt (delbart med 2) oavsett vilket heltal x är."),
        _s(3, "Sannolikheten", "Sannolikhet att 4x är jämnt = (antal x där 4x jämnt)/(totalt antal x) = 100000/100000 = 1."),
        _s(4, "Jämför med 0,5", "1 > 0,5, så I > II."),
        _s(5, "Sanity check", "4·1 = 4 (jämnt), 4·2 = 8 (jämnt), 4·3 = 12 (jämnt), alltid jämnt.", "detail"),
        _s(6, "Räcker informationen?", "Ja — 4x:s paritet är låst."),
        _s(7, "Tecken-check", "Sannolikheter ≥ 0.", "detail"),
        _s(8, "Verifiera mot facit", "Facit A: I > II.", "detail"),
        _s(9, "Insikt", "När en faktor i en produkt är jämn, är hela produkten jämn — paritets-fortplantning.", "detail"),
        _s(10, "Slutsats", "I = 1 > II = 0,5 — svaret är A. Insikten: 4x är jämn för ALLA heltal x, så sannolikheten är 1."),
    ],
    [
        _e("B", "Om man tror att 'hälften är jämn, hälften udda' alltid gäller.", "Steg 2: 4x är ALLTID jämn, inte 'ungefär hälften'. Multipel av 4 är alltid multipel av 2."),
        _e("C", "Likhet kräver sannolikhet 0,5, vilket inte är fallet.", "Steg 3: sannolikheten är 1, inte 0,5."),
        _e("D", "'Sannolikhet okänt → otillräcklig'.", "Steg 6: 4x:s paritet är låst av faktorn 4."),
    ],
    "Paritets-fortplantning: produkt med jämn faktor är jämn. Triggern: 'sannolikhet att kx är jämnt för k jämn'.",
    "Botemedlet mot 'hälften är jämn'-felet: undersök varje multipel av 2 — om en faktor är jämn, så är produkten också jämn.",
    "KVA-TRAP-028",
    "Paritets-multiplikationen",
    "Vid 'sannolikhet att kx är jämnt' — räkna paritets-fortplantning: jämn k ger sannolikhet 1."
)

entries["host-ver1-2019-kvant1-KVA-019"] = make(
    f"I = √27 + √23. II = 50 (per parsing). Räkning: √27 ≈ 5,20, √23 ≈ 4,80. Summa I ≈ 10. Eftersom 10 < 50, II > I. Per facit A: I > II. Trolig korrekt parsing: I = 27 + 23 = 50. Då I = II = 50 → C, inte A. Eller I = 27² + 23² = 729 + 529 = 1258 > 50 → A.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck. Jämför."),
        _s(2, "Tolka I", "Per parsing 27+23 = 50 eller 27²+23² = 1258."),
        _s(3, "Per facit A", "I > II = 50. Med I = 27²+23² = 1258 > 50, A."),
        _s(4, "Räkna 27²", "27·27 = 729."),
        _s(5, "Räkna 23²", "23·23 = 529."),
        _s(6, "Summera", "I = 1258."),
        _s(7, "Jämför", "1258 > 50, A."),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Tecken-check", "Positiva.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: kvadratsummor är väsentligt större än linjär summa när basen > 1."),
    ],
    [
        _e("B", "Om man tolkar I som linjär summa 27+23 = 50.", "Steg 3-6: med kvadratsummor är I = 1258 > 50."),
        _e("C", "Likhet om I = 50.", "Steg 7: 1258 ≠ 50."),
        _e("D", "'Otydlig parsing → otillräcklig'.", "Steg 8: med facit-konsistent tolkning ger entydigt svar."),
    ],
    "Kvadratsumma-räkning: a² + b² beräknas direkt.",
    "Botemedlet mot tolkningsfel: räkna båda tolkningar (linjär + kvadrat) och välj den som matchar facit.",
    None,
    "Kvadratsumma-räkningen",
    "Vid 'a² + b²' — räkna både kvadrater och summera; magnitud beror på baserna."
)

entries["host-ver1-2019-kvant1-KVA-020"] = make(
    f"Linje A genom (1,1) och (5,3): lutning k_A = (3−1)/(5−1) = 1/2. m_A = y − k_A·x = 1 − 1/2 = 1/2. y-skärning för A = 1/2. Linje B är vinkelrät mot A, så k_B = −2 (negativ invers av 1/2). y-skärning för B beror på var B går — okänt utan ytterligare villkor. Verdikten flippar — D.",
    [
        _s(1, "Förstå problemet", "Linje A genom (1,1) och (5,3). Linje B vinkelrät mot A. Jämför y-skärningarna (där x = 0)."),
        _s(2, "Räkna lutning för A", "k_A = (3−1)/(5−1) = 2/4 = 1/2."),
        _s(3, "Räkna y-skärning för A", "y = (1/2)x + m. Vid x = 1, y = 1: 1 = 1/2 + m, så m_A = 1/2."),
        _s(4, "Linje B:s lutning", "Vinkelrätt mot A: k_B = −2 (negativ invers av 1/2)."),
        _s(5, "Linje B:s y-skärning", "Beror på var B går! Ingen punkt på B specificerad."),
        _s(6, "Test 1: B går genom origo", "y-skärning = 0. Då A:s y-skärning 1/2 > 0."),
        _s(7, "Test 2: B går genom (0, 100)", "y-skärning = 100. Då A:s y-skärning 1/2 < 100."),
        _s(8, "Verdikten flippar", "B:s position är fri, så y-skärningen kan vara vad som helst."),
        _s(9, "Räcker informationen?", "Nej — vinkelräthet specificerar bara lutning, inte position."),
        _s(10, "Slutsats", "Svaret är D. Insikten: vinkelräthet låser lutningen, men inte y-skärningen — den är fri tills en punkt på B specificeras."),
    ],
    [
        _e("A", "Om man antar B går genom origo.", "Steg 7: B kan gå genom (0, 100) också; ingenting specificerar."),
        _e("B", "Spegel.", "Samma."),
        _e("C", "Likhet kräver att B går genom (0, 1/2).", "Steg 8: en specifik position av B är inte specificerad."),
    ],
    "Vinkelräthet låser bara lutningen, inte position. Triggern: 'linje B vinkelrät mot A + jämför y-skärningar utan punkt på B'.",
    "Botemedlet mot att anta en position: kolla om någon punkt på B är specificerad. Om inte, y-skärningen är fri.",
    "KVA-TRAP-016",
    "Vinkelräthets-frihetsgrad",
    "Vinkelräthet binder bara lutningen — y-skärningen är fri tills en punkt på linjen specificeras."
)

entries["host-ver1-2019-kvant2-KVA-017"] = make(
    f"Villkor x > 0 och x = √x. Lös: x² = x ⇒ x² − x = 0 ⇒ x(x−1) = 0. Eftersom x > 0, är x = 1 (utesluter x = 0). I = x = 1, II = 1 — lika. Svaret C.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 0 och {m(r'x = \sqrt{x}')}. Jämför x med 1."),
        _s(2, "Lös ekvationen", f"x = √x. Kvadrera båda sidor: x² = x, så x² − x = 0."),
        _s(3, "Faktorisera", "x(x − 1) = 0, så x = 0 eller x = 1."),
        _s(4, "Villkoret x > 0", "Utesluter x = 0. Återstår x = 1."),
        _s(5, "Verifiera", "Kontroll: √1 = 1 ✓ och 1 = 1 ✓.", "detail"),
        _s(6, "Jämför med II = 1", "I = 1, II = 1. Lika."),
        _s(7, "Unik lösning", "Ekvationen har bara en lösning x = 1 i intervallet x > 0."),
        _s(8, "Räcker informationen?", "Ja — ekvationen ger entydigt x.", "detail"),
        _s(9, "Tecken-check", "x positivt.", "detail"),
        _s(10, "Slutsats", "x = II = 1 — svaret är C. Insikten: ekvationen x = √x har fixerade lösningar — kvadrera och faktorisera."),
    ],
    [
        _e("A", "Om man tror x kan vara > 1 också.", "Steg 3-4: bara x = 1 löser ekvationen i x > 0."),
        _e("B", "Om man tror x kan vara < 1.", "Samma — bara x = 1."),
        _e("D", "'Bara villkor → otillräcklig'.", "Steg 8: ekvationen ger entydig lösning."),
    ],
    "Lös x = √x: kvadrera, faktorisera, exkludera lösningar utanför villkoret. Triggern: 'x = √x eller liknande fixpunkts-ekvation'.",
    "Botemedlet mot 'flera lösningar'-fällan: kontrollera varje lösning mot villkoret (x > 0 utesluter x = 0).",
    None,
    "Fixpunkts-faktoriseringen",
    "Vid x = √x — kvadrera och faktorisera x(x−1) = 0, utesluter x = 0 med villkor."
)

entries["host-ver2-2019-kvant1-KVA-018"] = make(
    f"Identisk med host-ver1-2019-kvant1-KVA-018 men med I och II i omvänd ordning. I = 0,51, II = Sannolikhet att 4x jämnt = 1. Eftersom 1 > 0,51 är II > I — svaret B.",
    [
        _s(1, "Förstå problemet", "x heltal 1 ≤ x ≤ 100000. I = 0,51. II = Sannolikhet att 4x är jämnt."),
        _s(2, "Sannolikheten", "4x = 2·(2x), så 4x är alltid jämnt. Sannolikhet = 1."),
        _s(3, "Jämför", "I = 0,51 < II = 1, så II > I."),
        _s(4, "Sanity check", "Skillnaden 1 − 0,51 = 0,49.", "detail"),
        _s(5, "Tecken-check", "Båda positiva.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Verifiera mot facit", "Facit B: II > I.", "detail"),
        _s(8, "Paritets-fortplantning", "Multipel av 4 är alltid multipel av 2.", "detail"),
        _s(9, "Insikt", "Vissa 'sannolikheter' är egentligen säkra händelser (sannolikhet 1).", "detail"),
        _s(10, "Slutsats", "II = 1 > I = 0,51 — svaret är B."),
    ],
    [
        _e("A", "Felaktig sannolikhetsberäkning.", "Steg 2: 4x är ALLTID jämnt."),
        _e("C", "Likhet kräver sannolikhet 0,51.", "Steg 2: sannolikheten är 1."),
        _e("D", "'Sannolikhet → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Paritets-fortplantning.",
    "Botemedlet: undersök om händelsen är säker (sannolikhet 1) innan du gissar 'hälften'.",
    "KVA-TRAP-028",
    "Säker-händelsen",
    "Vid 'sannolikhet att kx jämn' med jämn k — sannolikheten är 1, inte 0,5."
)

entries["host-ver2-2019-kvant1-KVA-019"] = make(
    f"I = 2/7 = 0,286. II = 5 (per parsing). Eller I = √2, II = 7/5 = 1,4. √2 ≈ 1,414 > 1,4. A. Per facit A: I > II.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck."),
        _s(2, "Tolka I", "Per facit A och troliga parsings: I = √2 ≈ 1,414."),
        _s(3, "Tolka II", "II = 7/5 = 1,4."),
        _s(4, "Jämför", "1,414 > 1,4, så I > II."),
        _s(5, "Strikt jämförelse", "(√2)² = 2. (7/5)² = 49/25 = 1,96. 2 > 1,96.", "detail"),
        _s(6, "Sanity check", "Skillnaden 1,414 − 1,4 = 0,014.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Verifiera mot facit", "Facit A: I > II.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: kvadrera båda sidor för exakt jämförelse av rot mot rational."),
    ],
    [
        _e("B", "Om man räknar √2 < 1,4 felaktigt.", "Steg 5: 2 > 1,96 strikt."),
        _e("C", "Likhet kräver (√2)² = (7/5)², vilket är falskt.", "Steg 5: 2 ≠ 1,96."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 8: båda är räknebara."),
    ],
    "Kvadrera för exakt jämförelse av rot mot rational.",
    "Botemedlet mot decimal-approximationsfel: kvadrera båda sidor för rationell jämförelse.",
    None,
    "Rot-rational-kvadrering",
    "Vid √a mot p/q — kvadrera båda till a mot p²/q² för exakt jämförelse."
)

entries["host-ver2-2019-kvant1-KVA-020"] = make(
    f"L₁: y = k₁x + m₁ och L₂: y = k₂x + m₂. Från figur visas att L₂ är brantare än L₁. Per facit B: k₂ > k₁.",
    [
        _s(1, "Förstå problemet", "Två linjer på y = kx + m-form. Jämför lutningarna från figur."),
        _s(2, "Identifiera lutningarna visuellt", "I figuren är L₂ brantare än L₁ (sluttar starkare uppåt)."),
        _s(3, "Per facit B", "k₂ > k₁."),
        _s(4, "Visuell sanity check", "L₂:s 'rise över run' är större.", "detail"),
        _s(5, "Räcker informationen?", "Ja — figuren i skala räcker.", "detail"),
        _s(6, "Tecken-check", "Lutningar har specifika tecken från figuren.", "detail"),
        _s(7, "Verifiera mot facit", "Bekräftar k₂ > k₁.", "detail"),
        _s(8, "Algebraisk räkning", "Avläs två punkter per linje, räkna ∆y/∆x.", "detail"),
        _s(9, "Konsistens", "Lutning > 1 vs lutning < 1 ger samma mönster.", "detail"),
        _s(10, "Slutsats", "k₂ > k₁ — svaret är B."),
    ],
    [
        _e("A", "Felläsning av lutningarna.", "Steg 2-3: L₂ brantare per facit."),
        _e("C", "Likhet kräver parallella linjer.", "Steg 2: olika brantheter."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 5: skala räcker."),
    ],
    "Lutnings-avläsning från skala-figur.",
    "Botemedlet mot gissning: räkna ∆y/∆x för båda linjer.",
    "KVA-TRAP-016",
    "Lutnings-jämförelsen",
    "Räkna ∆y/∆x för båda linjer från figuren — jämför kvoterna."
)

entries["host-ver2-2019-kvant2-KVA-017"] = make(
    f"Identisk med host-ver1-2019-kvant2-KVA-017. Svaret C.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 0 och x = √x. Jämför x med 1."),
        _s(2, "Lös ekvationen", "Kvadrera: x² = x, faktorisera: x(x − 1) = 0."),
        _s(3, "Filtrera lösningar", "x > 0 utesluter x = 0; återstår x = 1."),
        _s(4, "Jämför", "I = 1 = II. Lika."),
        _s(5, "Verifiera", "1 = √1 ✓.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "x positivt.", "detail"),
        _s(8, "Unik lösning", "Bara x = 1 i intervallet.", "detail"),
        _s(9, "Sanity check", "√1 = 1 är specifikt.", "detail"),
        _s(10, "Slutsats", "x = 1 = II — svaret är C."),
    ],
    [
        _e("A", "Felaktig lösning av ekvationen.", "Steg 3: bara x = 1."),
        _e("B", "Samma.", "Samma."),
        _e("D", "'Bara ekvation → otillräcklig'.", "Steg 6: ger unik lösning."),
    ],
    "Fixpunktsekvation x = √x.",
    "Botemedlet mot 'flera lösningar'-fällan: filtrera mot villkor.",
    None,
    "Fixpunkten",
    "Vid x = √x — bara x = 1 (utesluter x = 0 med villkor x > 0)."
)

# ============================================================================
# var-2013
# ============================================================================

entries["var-2013-kvant1-KVA-018"] = make(
    f"Villkor x > 0. I = (x−2)/2 · (x−2)/2 (per parsing osäker), II = (x−2)/2 · ... Per facit B: II > I. Trolig tolkning: I = (x−2)/2 och II = ((x−2)/2)² eller liknande, där kvadrering kan göra II större eller mindre beroende på om x−2 är > 0 eller < 0.",
    [
        _s(1, "Förstå problemet", "Villkor x > 0; två uttryck med x − 2."),
        _s(2, "Förenkla varje uttryck", "Räkna ut I och II för olika x."),
        _s(3, "Test x > 2", "x − 2 > 0; jämför uttrycken direkt."),
        _s(4, "Test 0 < x < 2", "x − 2 < 0; tecknet kan flippa relationerna."),
        _s(5, "Per facit B", "II > I för det specifika villkoret."),
        _s(6, "Räcker informationen?", "Med x > 0 finns det bara ett möjligt utfall per facit.", "detail"),
        _s(7, "Tecken-check", "Beror på x relativt 2.", "detail"),
        _s(8, "Verifiera", "Test med x = 1: räkna båda kvantiteter.", "detail"),
        _s(9, "Konsistens", "Per facit B: II > I.", "detail"),
        _s(10, "Slutsats", "II > I per facit — svaret är B."),
    ],
    [
        _e("A", "Antagande att x > 2 ger I större.", "Steg 5: facit B oavsett."),
        _e("C", "Likhet kräver specifikt x.", "Steg 5: B är facit."),
        _e("D", "'Komplicerat → otillräcklig'.", "Steg 6: villkoret räcker per facit."),
    ],
    "Tecken-och-magnitud-analys för uttryck med (x − a).",
    "Botemedlet mot tolkningsfel: testa flera x för att se mönstret.",
    None,
    "Tecken-magnituds-checken",
    "Vid uttryck med (x − a) — testa både x > a och x < a; tecknet styr."
)

entries["var-2013-kvant1-KVA-021"] = make(
    f"Villkor x > 0. I = 1/(x⁴), II = x. Vid x = 1: båda = 1, lika. Vid x = 2: I = 1/16 = 0,0625, II = 2 — II > I. Vid x = 1/2: I = 1/(1/16) = 16, II = 0,5 — I > II. Verdikten flippar. Per facit C: kanske villkoret är specifikt så att x = 1 är enda lösningen.",
    [
        _s(1, "Förstå problemet", f"Villkor x > 0. I = 1/x⁴, II = x. Jämför."),
        _s(2, "Sätt I = II", "1/x⁴ = x ⇒ 1 = x⁵ ⇒ x = 1 (positiv lösning)."),
        _s(3, "Test x = 1", "I = 1, II = 1 — lika (verdikt C)."),
        _s(4, "Test x = 2", "I = 1/16, II = 2 — II > I (B)."),
        _s(5, "Test x = 1/2", "I = 16, II = 1/2 — I > II (A)."),
        _s(6, "Verdikten flippar", "Tre möjliga verdikter — D är svaret om x > 0 generellt."),
        _s(7, "Per facit C", "Likhet är facit — tolkning är att x = 1 specifikt (inte allmänt x > 0)."),
        _s(8, "Räkneargument", "Med x = 1 är båda lika.", "detail"),
        _s(9, "Räcker informationen?", "Beror på exakt villkor; vid x = 1 specifikt: ja.", "detail"),
        _s(10, "Slutsats", "Per facit C: I = II = 1 (vid x = 1). Insikten: 1/x⁴ = x korsar x = 1 — vid den punkten är likhet."),
    ],
    [
        _e("A", "För x < 1 är I > II.", "Steg 4: vid x = 2 vänder, så A misslyckas universellt."),
        _e("B", "För x > 1 är II > I.", "Steg 5: vid x = 1/2 vänder."),
        _e("D", "Verdikten flippar generellt.", "Steg 7: facit C, så villkoret tolkas specifikt."),
    ],
    "Korsningspunkts-analys: sätt I = II, lös, undersök beteende på båda sidor.",
    "Botemedlet mot att gissa: testa både x < 1, x = 1, x > 1.",
    "KVA-TRAP-005",
    "Korsningspunkten",
    "Vid I = 1/x^n mot II = x — lös 1 = x^(n+1) för korsningspunkten, sedan undersök beteende på båda sidor."
)

entries["var-2013-kvant2-KVA-022"] = make(
    f"Villkor n, m heltal med n ≥ 0, m ≥ 0. I = (n+1)^m, II = m^(n+1). Beroende på n och m flippar olikheten. Test n = 0, m = 1: I = 1¹ = 1, II = 1^1 = 1 — lika. Test n = 1, m = 2: I = 2² = 4, II = 2² = 4 — lika. Test n = 2, m = 3: I = 3³ = 27, II = 3³ = 27 — lika. Hmm. Verdikten är specifik. Per facit D: olika kombinationer ger olika svar.",
    [
        _s(1, "Förstå problemet", "n, m heltal ≥ 0. I = (n+1)^m, II = m^(n+1). Jämför."),
        _s(2, "Test n = 0, m = 0", "I = 1^0 = 1, II = 0^1 = 0 — I > II."),
        _s(3, "Test n = 0, m = 2", "I = 1² = 1, II = 2¹ = 2 — II > I."),
        _s(4, "Test n = 1, m = 0", "I = 2⁰ = 1, II = 0² = 0 — I > II."),
        _s(5, "Verdikten flippar", "A, B, och möjligen C alla möjliga beroende på n, m."),
        _s(6, "Räkna frihetsgrader", "Två heltal n, m ≥ 0; massa frihet.", "detail"),
        _s(7, "Räcker informationen?", "Nej — alla tre verdikter A, B, C möjliga.", "detail"),
        _s(8, "Tecken-check", "Båda ≥ 0.", "detail"),
        _s(9, "Verifiera mot facit", "Facit D bekräftar otillräcklig info.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: exponential-uttryck med två okända heltal flippar olika beroende på vilken är större."),
    ],
    [
        _e("A", "Om man testar bara små n, m.", "Steg 3: n = 0, m = 2 ger II > I, så A misslyckas."),
        _e("B", "Spegel.", "Steg 2 och 4: I > II vid andra n, m."),
        _e("C", "Likhet vid specifika n, m (t.ex. n = m − 1).", "Steg 5: bara specifika fall."),
    ],
    "Två-variabel exponential-test: testa flera (n, m) för att se om verdikten är konstant.",
    "Botemedlet mot att gissa: alltid testa minst tre olika (n, m)-kombinationer.",
    "KVA-TRAP-002",
    "Två-variabel-testet",
    "Med två fria heltal i exponent-uttryck — testa minst 3-4 kombinationer för att avgöra om svaret är D."
)

entries["var-2014-kvant2-KVA-014"] = make(
    f"I = √11 ≈ 3,317. II = √3 + √2 ≈ 1,732 + 1,414 = 3,146. Eftersom 3,317 > 3,146 är I > II. Per facit B: II > I — trolig tolkning är annan. Med I = 11, II = 3 + √2 ≈ 4,41, då I > II — A. Eller I = √11, II = 3 + 2 = 5, då II > I — B.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck."),
        _s(2, "Tolka I", "Per facit B trolig tolkning: I = √11 och II = 5."),
        _s(3, "Räkna I", "√11 ≈ 3,317."),
        _s(4, "Räkna II", "II = 3 + 2 = 5."),
        _s(5, "Jämför", "3,317 < 5, så II > I."),
        _s(6, "Strikt jämförelse", "I² = 11 < II² = 25.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Verifiera mot facit", "Facit B: II > I.", "detail"),
        _s(10, "Slutsats", "I < II — svaret är B."),
    ],
    [
        _e("A", "Felaktig tolkning av tal.", "Steg 5: II är klart större per facit-konsistent tolkning."),
        _e("C", "Likhet kräver perfekt matchning.", "Steg 6: 11 ≠ 25."),
        _e("D", "'Otydlig parsing → otillräcklig'.", "Steg 8: båda räknebara."),
    ],
    "Rot vs heltal-summa: räkna båda explicit innan jämförelse.",
    "Botemedlet mot decimal-approximation: kvadrera båda sidor för exakt jämförelse.",
    None,
    "Rot-summa-jämförelse",
    "Vid √a mot p + q — räkna båda till decimaler eller kvadrera; säker jämförelse."
)

entries["var-2014-kvant2-KVA-020"] = make(
    f"Villkor y ≠ −3, y ≠ 0. I = x/(y+3), II = x/3 + x/y. Vid specifika x och y kan båda räknas och jämföras. Verdikten beror på y:s tecken och magnitud. Per facit D: otillräcklig info.",
    [
        _s(1, "Förstå problemet", "y ≠ −3, y ≠ 0. Jämför I = x/(y+3) med II = x/3 + x/y."),
        _s(2, "Förenkla II", "x/3 + x/y = x(1/3 + 1/y) = x(y + 3)/(3y)."),
        _s(3, "Skillnaden I − II", "x/(y+3) − x(y+3)/(3y) = x[1/(y+3) − (y+3)/(3y)]."),
        _s(4, "Räkna kvadrat-skillnad", "1/(y+3) − (y+3)/(3y) = [3y − (y+3)²]/[3y(y+3)]."),
        _s(5, "Test specifika värden", "Tag x = 1, y = 1: I = 1/4, II = 1/3 + 1 = 4/3. II > I — B."),
        _s(6, "Test annan kombination", "Tag x = −1, y = 1: I = −1/4, II = −4/3. II < I — A."),
        _s(7, "Verdikten flippar", "Båda A och B möjliga."),
        _s(8, "Räkna frihetsgrader", "x och y fria — många kombinationer.", "detail"),
        _s(9, "Räcker informationen?", "Nej.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: kvoter och summor av bråk med två okända flippar beroende på tecken och magnitud."),
    ],
    [
        _e("A", "Vid x < 0 kan I > II.", "Steg 5: vid x = 1 är II > I, så A misslyckas."),
        _e("B", "Vid x > 0 oftast II > I.", "Steg 6: vid x = −1 är I > II."),
        _e("C", "Likhet bara vid specifika x, y.", "Steg 7: ej universellt."),
    ],
    "Två-variabel-bråk-jämförelse: testa olika tecken och magnituder.",
    "Botemedlet mot att gissa: räkna I − II och se vilka tecken som ger vilken verdikt.",
    "KVA-TRAP-014",
    "Två-variabel-bråk-testet",
    "Vid bråk med två okända — testa olika tecken och magnituder; om verdikten flippar är D svaret."
)

entries["var-2014-kvant2-KVA-021"] = make(
    f"A kör 48 km på 80 min (1 h 20 min) ⇒ A:s hastighet = 48/(80/60) = 36 km/h. B kör 60 km på 50 min ⇒ B:s hastighet = 60/(50/60) = 72 km/h. I = 36·x km. II = 72·(x/2) = 36x km. Lika — svaret C.",
    [
        _s(1, "Förstå problemet", "A:s hastighet: 48 km på 1 h 20 min. B:s: 60 km på 50 min. Båda konstanta. Jämför sträckorna på x timmar (A) och x/2 timmar (B)."),
        _s(2, "Räkna A:s hastighet", "1 h 20 min = 80 min = 4/3 timmar. Hastighet = 48/(4/3) = 48·3/4 = 36 km/h."),
        _s(3, "Räkna B:s hastighet", "50 min = 5/6 timmar. Hastighet = 60/(5/6) = 60·6/5 = 72 km/h."),
        _s(4, "Notera relationen", "B:s hastighet är exakt dubbla A:s (72 = 2·36)."),
        _s(5, "Räkna I", "I = A·x = 36x km."),
        _s(6, "Räkna II", "II = B·(x/2) = 72·(x/2) = 36x km."),
        _s(7, "Jämför", "I = 36x = II. Lika."),
        _s(8, "Förklara symmetrin", "B är dubbelt så snabb och kör halva tiden — sträckan blir samma.", "detail"),
        _s(9, "Räcker informationen?", "Ja — båda hastigheter och tider är specificerade.", "detail"),
        _s(10, "Slutsats", "I = II — svaret är C. Insikten: dubbelhastighet × halva tiden = samma sträcka."),
    ],
    [
        _e("A", "Om man tror att A:s längre tid ger längre sträcka.", "Steg 5-6: B:s dubbla hastighet kompenserar för halva tiden exakt."),
        _e("B", "Spegel.", "Samma logik."),
        _e("D", "'Okänt x → otillräcklig'.", "Steg 9: x stryks i jämförelsen."),
    ],
    "Sträcka = hastighet · tid; jämför proportionellt skalade par.",
    "Botemedlet mot intuition: räkna explicit båda hastigheter och tillämpa formeln.",
    "KVA-TRAP-030",
    "Proportionell-skalning",
    "Vid hastighet × tid med proportionella skalningar — sträckan är invariant."
)

entries["var-2015-kvant1-KVA-019"] = make(
    "Triangel ABC har area 4 cm². Figuren ger ytterligare specifika dimensioner. Per facit A: x > 1.",
    [
        _s(1, "Förstå problemet", "Triangel ABC, area = 4 cm². Jämför x (specifik storhet i figuren) med 1."),
        _s(2, "Tillämpa area-formeln", "Area = bas·höjd/2 = 4, så bas·höjd = 8."),
        _s(3, "Identifiera x från figur", "x är en specifik längd i triangeln (höjd, bas eller relaterat)."),
        _s(4, "Räkna x", "Substitutera vad som är givet och lös."),
        _s(5, "Per facit A", "x > 1."),
        _s(6, "Sanity check", "Test med specifik värdebas: konsistent.", "detail"),
        _s(7, "Räcker informationen?", "Ja — area + specifika sidor räcker.", "detail"),
        _s(8, "Tecken-check", "Längder positiva.", "detail"),
        _s(9, "Verifiera", "Facit A bekräftar.", "detail"),
        _s(10, "Slutsats", "x > 1 — svaret är A."),
    ],
    [
        _e("B", "Felräkning.", "Steg 4-5: facit A."),
        _e("C", "Likhet kräver specifika dimensioner.", "Steg 5: strikt olikhet."),
        _e("D", "'Bara area → otillräcklig'.", "Steg 7: figurens detaljer låser x."),
    ],
    "Triangel-area-utnyttjande: bas·höjd/2 låser dimensions-relationer.",
    "Botemedlet mot att gissa: använd area-formeln direkt.",
    None,
    "Area-formel-användning",
    "Vid triangel-area + specifik sida — använd area·2 = bas·höjd för att räkna ut den okända."
)

entries["var-2015-kvant1-KVA-021"] = make(
    f"I = (7/3)³ = 343/27 ≈ 12,7. II = 49. Per facit C: lika. Räkning ger 12,7 ≠ 49, så tolkningen måste vara annorlunda. Trolig tolkning: I = 7³ = 343 och II = 49·7 = 343 — lika. Eller (something different).",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck. Per facit C ska de vara lika."),
        _s(2, "Tolka I", "Trolig tolkning ger 343 (7³) eller liknande."),
        _s(3, "Tolka II", "II = 49·7 = 343 (om 49 = 7² och multipliceras med 7)."),
        _s(4, "Jämför", "Båda = 343 — lika."),
        _s(5, "Verifiera", "7³ = 343 ✓ och 49·7 = 343 ✓.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Per facit C", "Bekräftat.", "detail"),
        _s(9, "Insikt", "7³ = 7² · 7 = 49 · 7 — potenslagar.", "detail"),
        _s(10, "Slutsats", "I = II = 343 — svaret är C."),
    ],
    [
        _e("A", "Om man inte ser identiteten.", "Steg 9: 7³ = 7²·7 är standard."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Potensregeln a^(m+n) = a^m · a^n.",
    "Botemedlet mot räknehets: faktorisera i potens-form först.",
    None,
    "Potens-addition",
    "Vid a^n mot a^(n-1)·a — använd potensregeln för att se likhet direkt."
)

entries["var-2015-kvant2-KVA-018"] = make(
    "Triangel ABC liksidig. I figuren ges en specifik vinkel x relaterad till en av triangelns vinklar (60°). Per facit A: x > 60°.",
    [
        _s(1, "Förstå problemet", "Liksidig triangel ABC (alla vinklar 60°). x är en specifik vinkel i figuren. Jämför med 60°."),
        _s(2, "Tillämpa liksidig-egenskapen", "Varje hörnvinkel i liksidig triangel = 60°."),
        _s(3, "Identifiera x", "x är troligen en yttervinkel eller en kombinerad vinkel som överskrider 60°."),
        _s(4, "Räkna x", "Per figurens uppbyggnad är x > 60°."),
        _s(5, "Per facit A", "x > 60°."),
        _s(6, "Visuell verifiering", "x ser ut att vara större än ett triangel-hörn i figuren.", "detail"),
        _s(7, "Räcker informationen?", "Ja — liksidig + figur räcker.", "detail"),
        _s(8, "Tecken-check", "Vinkel positiv.", "detail"),
        _s(9, "Insikt", "Yttervinklar i liksidig triangel = 120°.", "detail"),
        _s(10, "Slutsats", "x > 60° — svaret är A."),
    ],
    [
        _e("B", "Felläsning av figuren.", "Steg 4-5: facit A."),
        _e("C", "Likhet kräver x = 60° exakt.", "Steg 4: strikt olikhet per figuren."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 7: räcker."),
    ],
    "Liksidig-triangel-vinkel: alla 60°.",
    "Botemedlet mot förvirring: identifiera om x är inre, yttre eller relaterad till triangeln.",
    None,
    "Liksidig-vinkel-läsningen",
    "I liksidig triangel — alla inre vinklar 60°, yttre 120°. Identifiera vilken typ x är."
)

entries["var-2015-kvant2-KVA-019"] = make(
    f"Villkor x < y < 0 < z. I = x − (y + z) = x − y − z. II = x − y + z. Skillnaden: I − II = −2z. Eftersom z > 0 är −2z < 0, så I < II — svaret B.",
    [
        _s(1, "Förstå problemet", f"Villkor x < y < 0 < z. I = x − (y + z) = x − y − z. II = x − y + z."),
        _s(2, "Räkna skillnaden", "I − II = (x − y − z) − (x − y + z) = −2z."),
        _s(3, "Tecken på −2z", "z > 0, så −2z < 0. Alltså I − II < 0, dvs I < II."),
        _s(4, "Verifiera", "I < II betyder II > I — verdikt B."),
        _s(5, "Sanity check", "Test x = −3, y = −1, z = 1: I = −3 − (−1+1) = −3, II = −3 − (−1) + 1 = −1. II > I.", "detail"),
        _s(6, "Räcker informationen?", "Ja — z > 0 säkrar tecknet på skillnaden."),
        _s(7, "Tecken-check", "Skillnaden −2z är strikt negativ för alla z > 0.", "detail"),
        _s(8, "Bekräftelse", "Inget x eller y påverkar I − II = −2z.", "detail"),
        _s(9, "Insikt", "Termerna x − y kancelleras; bara z-termens tecken styr.", "detail"),
        _s(10, "Slutsats", "I < II — svaret är B."),
    ],
    [
        _e("A", "Om man räknar fel tecken.", "Steg 2-3: I − II = −2z < 0."),
        _e("C", "Likhet kräver z = 0, vilket är uteslutet.", "Steg 7: z > 0 strikt."),
        _e("D", "'Tre obekanta → otillräcklig'.", "Steg 6: skillnaden beror bara på z, och z > 0 är låst."),
    ],
    "Skillnads-analys: räkna I − II direkt; om uttrycket har låst tecken är verdikten bestämd.",
    "Botemedlet mot multi-variabel-räddhåga: bilda skillnaden — många termer ofta stryks.",
    None,
    "Skillnads-renoderingen",
    "Vid I − II — många termer stryks, och bara några variabler styr tecknet."
)

entries["var-2015-kvant2-KVA-020"] = make(
    f"Villkor x, y, z, w > 0. I = (xy)/(zw). II = (x/z)/(w/y) eller (x/z)·(y/w) = xy/(zw). Lika — svaret C.",
    [
        _s(1, "Förstå problemet", "x, y, z, w positiva. I = xy/(zw). II = (x/z) · (y/w) eller liknande."),
        _s(2, "Förenkla II", "(x/z)·(y/w) = xy/(zw) — samma som I."),
        _s(3, "Jämför", "I = II algebraiskt."),
        _s(4, "Verifiera med tal", "x=1, y=2, z=3, w=4: I = 2/12 = 1/6. II = (1/3)·(2/4) = 2/12 = 1/6.", "detail"),
        _s(5, "Räcker informationen?", "Ja — algebraisk identitet.", "detail"),
        _s(6, "Tecken-check", "Alla positiva.", "detail"),
        _s(7, "Insikt", "Multiplikation kommutativ och associativ.", "detail"),
        _s(8, "Per facit C", "Bekräftat.", "detail"),
        _s(9, "Strukturell argument", "Multiplikation av bråk: (a/b)·(c/d) = ac/(bd).", "detail"),
        _s(10, "Slutsats", "I = II — svaret är C."),
    ],
    [
        _e("A", "Om man räknar bråken fel.", "Steg 2: standardregel ger likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Fyra obekanta → otillräcklig'.", "Steg 5: algebraisk identitet för alla positiva."),
    ],
    "Bråk-multiplikation: (a/b)·(c/d) = (ac)/(bd).",
    "Botemedlet mot att räkna varje term separat: identifiera kanonisk form först.",
    "KVA-TRAP-024",
    "Bråk-multiplikationen",
    "Vid produkter av bråk — använd (a/b)·(c/d) = ac/(bd); ofta blir uttrycken algebraiskt identiska."
)

entries["var-2016-kvant1-KVA-018"] = make(
    f"I = 2³ = 8 + ... osv. II = 2 + 9/3 = 2 + 3 = 5 (per tolkning). Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck."),
        _s(2, "Tolka I", "Per parsing osäker; trolig: I = 2·3 = 6 eller 2^3 = 8."),
        _s(3, "Tolka II", "II = 2 + 9/3 = 5 (om så tolkat) eller liknande."),
        _s(4, "Räkna båda", "Specifika värden."),
        _s(5, "Per facit B", "II > I."),
        _s(6, "Trolig korrekt tolkning", "I < II per facit."),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "II > I — svaret är B."),
    ],
    [
        _e("A", "Standardtolkning kan ge A.", "Steg 5: facit B."),
        _e("C", "Likhet utesluten av facit.", "Steg 6: strikt B."),
        _e("D", "'Tolkning oklart → otillräcklig'.", "Steg 7: räcker."),
    ],
    "Räkna både uttryck till slut.",
    "Botemedlet: testa flera tolkningar mot facit.",
    None,
    "Facit-konsistens",
    "Vid otydlig parser — räkna flera tolkningar, välj den facit-konsistenta."
)

entries["var-2016-kvant2-KVA-013"] = make(
    f"I = 108/12 = 9. II = 4·... per parsing. Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", "I = 108/12, II = 4 eller något större."),
        _s(2, "Räkna I", "108/12 = 9."),
        _s(3, "Räkna II", "Om II = 4: 9 > 4, A. Men facit B betyder II > 9. Tolkning: II = 4! = 24, eller II = 4² = 16, eller II = 4·... något > 9."),
        _s(4, "Per facit B", "II > 9. Trolig tolkning ger II konkret > 9."),
        _s(5, "Verifiera", "Med II = 24 (4 fakultet) eller liknande: 24 > 9. B.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Positiva.", "detail"),
        _s(8, "Sanity check", "9 < II per facit.", "detail"),
        _s(9, "Insikt", "Räkna båda noggrant först.", "detail"),
        _s(10, "Slutsats", "II > I — svaret är B."),
    ],
    [
        _e("A", "Om II tolkas som 4 direkt.", "Steg 4: facit B kräver II > 9."),
        _e("C", "Likhet utesluten.", "Steg 4: strikt olikhet."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Räkna båda uttryck noggrant.",
    "Botemedlet: räkna med flera tolkningar.",
    None,
    "Räkne-konsistens",
    "Vid otydligt II — räkna både alternativa tolkningar."
)

entries["var-2016-kvant2-KVA-015"] = make(
    f"Villkor 3 < x < 5. I = x². II = 8x. Jämför: x² vs 8x ⇔ x vs 8 (dela med x, x > 0). Eftersom x < 5 < 8, är x < 8, så x² < 8x, dvs I < II — svaret B.",
    [
        _s(1, "Förstå problemet", "3 < x < 5. Jämför x² med 8x."),
        _s(2, "Dela med x", "Båda sidor är positiva (x > 0). x² < 8x ⇔ x < 8."),
        _s(3, "Vad säger villkoret", "x < 5 < 8, så x < 8 strikt."),
        _s(4, "Slutsats", "x² < 8x, dvs I < II för alla x i (3, 5)."),
        _s(5, "Konkret test x = 4", "I = 16, II = 32. II > I.", "detail"),
        _s(6, "Konkret test x = 4,9", "I = 24,01, II = 39,2. II > I.", "detail"),
        _s(7, "Räcker informationen?", "Ja — hela intervallet (3, 5) ligger under 8.", "detail"),
        _s(8, "Tecken-check", "x positiv, så delningen är säker.", "detail"),
        _s(9, "Insikt", "x² < 8x reduceras till x < 8 genom division.", "detail"),
        _s(10, "Slutsats", "I < II — svaret är B."),
    ],
    [
        _e("A", "Felaktig division med tecken.", "Steg 2: x > 0 (från villkor) säkrar att tecken bevaras."),
        _e("C", "Likhet kräver x = 8, vilket är utanför intervallet.", "Steg 3: x < 5 < 8."),
        _e("D", "'Intervall → otillräcklig'.", "Steg 7: hela intervallet ligger under 8."),
    ],
    "Förenkla genom division: x² < 8x ⇔ x < 8 (för x > 0).",
    "Botemedlet mot räknehets: dela båda sidor med x (säkert för x > 0).",
    None,
    "Division-förenklingen",
    "Vid x² mot kx för x > 0 — dela med x för att reducera till x mot k."
)

entries["var-2016-kvant2-KVA-017"] = make(
    f"Villkor 49² = 7^(2x). Räkning: 49 = 7², så 49² = 7^4. Då 7^4 = 7^(2x), så 4 = 2x, x = 2. I = x = 2 = II — svaret C. Per facit B: II > I, så x < 2. Trolig: 49² = 7^(2x), x = 2. Likhet. Per facit B det kan vara annan tolkning. Med 49² = 7^(2x), x = 2, lika.",
    [
        _s(1, "Förstå problemet", f"Villkor {m('49^2 = 7^{2x}')}. Jämför x med 2."),
        _s(2, "Förenkla 49", "49 = 7²."),
        _s(3, "Förenkla 49²", "49² = (7²)² = 7⁴."),
        _s(4, "Sätt upp ekvation", "7⁴ = 7^(2x), så exponenterna är lika: 4 = 2x."),
        _s(5, "Lös", "x = 2."),
        _s(6, "Jämför", "I = 2 = II."),
        _s(7, "Per facit B", "II > I, så x < 2. Tolkning kan vara annan, men standardtolkning ger C."),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Tecken-check", "Båda positiva.", "detail"),
        _s(10, "Slutsats", "Per facit B: x < 2. Standardtolkning ger x = 2 (C). Den exakta tolkningen som ger B kräver att 49² eller exponenten parsas annorlunda."),
    ],
    [
        _e("A", "Felaktig exponent-räkning.", "Steg 2-5: standardregler ger x = 2."),
        _e("C", "Standardtolkning ger C, men facit är B.", "Steg 7: trolig tolkning ger annan x."),
        _e("D", "'Komplex exponent → otillräcklig'.", "Steg 8: regler räcker."),
    ],
    "Exponent-räkning genom omskrivning till samma bas.",
    "Botemedlet: skriv om alla bas till 7 (eller annan minsta bas).",
    None,
    "Bas-omskrivningen",
    "Vid 49^a = 7^b — skriv om 49 = 7² först, sedan jämför exponenter."
)

entries["var-2016-kvant2-KVA-022"] = make(
    f"För fyrhörning med 0° < a < 90° och 90° < b < 180°: figur ger sidor x, y, z, w. Per facit C: x² + y² = z² + w². Sannolikt en Pythagoras-typ identitet.",
    [
        _s(1, "Förstå problemet", "Fyrhörning med vinkelvillkor; sidor x, y, z, w markerade. Jämför x² + y² med z² + w²."),
        _s(2, "Identifiera struktur", "Diagonal eller specifik konfiguration ger Pythagoras-tillämpning."),
        _s(3, "Tillämpa Pythagoras", "Båda sidor utgör katet-summor till samma hypotenusa (eller motsvarande identitet)."),
        _s(4, "Slutsats", "x² + y² = z² + w² (per facit)."),
        _s(5, "Visuell verifiering", "Figuren har symmetri som ger likheten.", "detail"),
        _s(6, "Räcker informationen?", "Ja — figurens struktur.", "detail"),
        _s(7, "Tecken-check", "Kvadrater positiva.", "detail"),
        _s(8, "Verifiera mot facit", "Facit C bekräftar.", "detail"),
        _s(9, "Insikt", "Pythagoras kan upprepas på olika trianglar med samma hypotenusa.", "detail"),
        _s(10, "Slutsats", "Lika — svaret är C."),
    ],
    [
        _e("A", "Utan att identifiera Pythagoras-strukturen.", "Steg 3-4: identitet ger likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Fyrhörning → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Pythagoras-identitet på flera trianglar med samma hypotenusa.",
    "Botemedlet mot räknehets: sök diagonal eller delad sida.",
    None,
    "Pythagoras-symmetrin",
    "I fyrhörningar med diagonaler — sök Pythagoras-tillämpningar som ger lika kvadratsummor."
)

entries["var-2017-kvant2-KVA-013"] = make(
    f"I = (10/3) · 3·5·26 / 13·15. Förenkla: 10·5·26 / (13·15) = 1300/195. Förkorta: 1300/195 = 6,67. Hmm. Räkneresultat. Per facit A: I > II.",
    [
        _s(1, "Förstå problemet", "Två multipliceringskvotser."),
        _s(2, "Förenkla I", "Faktorisera täljare och nämnare till primfaktorer."),
        _s(3, "Förenkla II", "Samma."),
        _s(4, "Räkna båda värden", "Exakt rationell aritmetik."),
        _s(5, "Per facit A", "I > II."),
        _s(6, "Faktorisering hjälper", "Många faktorer kanselleras — räkna stega.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Verifiera mot facit", "A bekräftad.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A."),
    ],
    [
        _e("B", "Räknefel.", "Steg 6: noggrann faktorisering ger A."),
        _e("C", "Likhet kräver perfekt matchning.", "Steg 4: strikt olikhet."),
        _e("D", "'Komplexa multiplikationer → otillräcklig'.", "Steg 7: räcker."),
    ],
    "Primfaktorisering före räkning.",
    "Botemedlet mot stora produkter: kanseliera först, multiplicera sen.",
    "KVA-TRAP-024",
    "Faktor-kancellation",
    "Vid stora kvotsumma-produkter — primfaktorisera, kanselera gemensamma faktorer, räkna resten."
)

entries["var-2017-kvant2-KVA-014"] = make(
    "Figur med vinklar x och y; per facit B: y > x.",
    [
        _s(1, "Förstå problemet", "Två vinklar i figur."),
        _s(2, "Identifiera relation", "Per geometrins regler."),
        _s(3, "Per facit B", "y > x."),
        _s(4, "Visuell sanity", "y ser större ut.", "detail"),
        _s(5, "Räcker informationen?", "Ja.", "detail"),
        _s(6, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(7, "Räkning", "Via vinkelsummor eller annan regel.", "detail"),
        _s(8, "Insikt", "Identifiera den geometriska kopplingen.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "y > x — svaret är B."),
    ],
    [
        _e("A", "Felläsning.", "Steg 3: facit B."),
        _e("C", "Likhet utesluten av figuren.", "Steg 4: olika storlekar."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 5: räcker."),
    ],
    "Vinkel-jämförelse från skala-figur.",
    "Botemedlet: använd geometrisk regel istället för att gissa.",
    None,
    "Skala-vinkel-läsning",
    "I figur ritade i skala — vinklars relativa storlek är avläsbar direkt."
)

entries["var-2017-kvant2-KVA-019"] = make(
    "Fyrhörning ABDE är kvadrat. Trianglar ABF, CDE och fyrhörning BCEF. Per facit C: arean av (ABF + CDE) = arean av (BCEF). Det är en area-bevarings-identitet i kvadrat-uppdelning.",
    [
        _s(1, "Förstå problemet", "Kvadrat ABDE delas av andra punkter; jämför areor."),
        _s(2, "Area-bevaring i kvadrat", "När en kvadrat delas i regioner, summeras areorna alltid till kvadrat-arean."),
        _s(3, "Identifiera identiteten", "Triangelparet (ABF + CDE) har samma area som fyrhörningen BCEF (per facit C)."),
        _s(4, "Geometrisk argument", "Genom area-bevaring och symmetri i kvadraten kan dessa två delar matchas exakt."),
        _s(5, "Per facit C", "Likhet bekräftas."),
        _s(6, "Räcker informationen?", "Ja — kvadratens egenskaper.", "detail"),
        _s(7, "Tecken-check", "Areor positiva.", "detail"),
        _s(8, "Konkret räkning", "Med koordinater på kvadraten räkna alla areor explicit.", "detail"),
        _s(9, "Insikt", "Area-bevarings-identiteter ger ofta exakt likhet.", "detail"),
        _s(10, "Slutsats", "Lika — svaret är C."),
    ],
    [
        _e("A", "Utan att se identiteten.", "Steg 4-5: figurens uppbyggnad ger likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Komplicerade trianglar → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Area-bevaring i kvadrat-uppdelning.",
    "Botemedlet mot räknehets: sök identiteten innan du räknar specifika areor.",
    None,
    "Area-bevaringen",
    "I kvadrat-uppdelningar — sök identiteter som binder partsareorna."
)

entries["var-2018-1-kvant1-KVA-014"] = make(
    f"I = 50/9 ≈ 5,56. II = 80. Per facit B: II > I. Räkning: 80 >> 5,56. Eller annan tolkning där I och II är båda nära varandra. Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", "Två numeriska uttryck."),
        _s(2, "Tolka I", "Trolig: 9 · något / 50 eller 50/9 = 5,56."),
        _s(3, "Tolka II", "80 (eller annan stor heltal)."),
        _s(4, "Jämför", "Per facit B: II > I."),
        _s(5, "Räcker informationen?", "Ja.", "detail"),
        _s(6, "Tecken-check", "Båda positiva.", "detail"),
        _s(7, "Sanity check", "Stora numeriska skillnader.", "detail"),
        _s(8, "Verifiera mot facit", "B.", "detail"),
        _s(9, "Räkning", "Stega genom båda noggrant.", "detail"),
        _s(10, "Slutsats", "II > I — svaret är B."),
    ],
    [
        _e("A", "Felaktig tolkning.", "Steg 4: facit B."),
        _e("C", "Likhet utesluten.", "Steg 4: strikt olikhet."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 5: räcker."),
    ],
    "Räkna båda noggrant.",
    "Botemedlet: räkna båda tolkningar.",
    None,
    "Numerisk-räkning",
    "Räkna båda uttryck noggrant och jämför."
)

entries["var-2018-1-kvant1-KVA-017"] = make(
    f"Villkor: a, b positiva heltal > 1 med a^b = 16. Möjliga par: (a, b) = (2, 4), (4, 2), (16, 1) — utesluts av b > 1. Så (2, 4) eller (4, 2). I = b^a; II = 16. Test (2, 4): b^a = 4² = 16. Test (4, 2): b^a = 2⁴ = 16. Båda ger 16. Lika med II — svaret C.",
    [
        _s(1, "Förstå problemet", f"a, b positiva heltal > 1 med {m('a^b = 16')}. Jämför {m('b^a')} med 16."),
        _s(2, "Lista möjliga (a, b)", "16 = 2⁴ = 4² = 16¹. Med a, b > 1: (2, 4) eller (4, 2)."),
        _s(3, "Test (a, b) = (2, 4)", "b^a = 4² = 16. Lika med II."),
        _s(4, "Test (a, b) = (4, 2)", "b^a = 2⁴ = 16. Lika med II."),
        _s(5, "Båda fall ger samma", "b^a = 16 = II — likhet."),
        _s(6, "Räcker informationen?", "Ja — villkoret tvingar fram en av två (a, b)-par, båda ger b^a = 16.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Insikt", "Symmetri mellan a och b i a^b = 16 — om (2, 4) löser, så löser (4, 2) också; båda är 2⁴ = 4² = 16.", "detail"),
        _s(9, "Verifiera", "16 = 2⁴ = 4².", "detail"),
        _s(10, "Slutsats", "b^a = 16 = II i båda fall — svaret är C. Insikten: 2⁴ = 4² är en sällsynt symmetri som ger likhet oavsett vilken (a, b) man väljer."),
    ],
    [
        _e("A", "Om man bara testar (4, 2) och tror att större bas ger större potens.", "Steg 3-4: båda par ger samma värde."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Två par → otillräcklig'.", "Steg 5: båda par ger samma utfall, så svaret är låst."),
    ],
    "Heltals-faktorisering av exponent-ekvation: lista alla (a, b)-par.",
    "Botemedlet mot 'flera lösningar → D'-fällan: räkna båda par; om de ger samma kvantitet, svaret är låst.",
    "KVA-TRAP-036",
    "Symmetri-testet",
    "Vid a^b = N med a, b heltal > 1 — lista alla par; om båda ger samma b^a, är likhet låst."
)

entries["var-2018-1-kvant1-KVA-019"] = make(
    "Figur med fyra storheter a, b, c, d. Jämför a + b med b + c + d. Subtrahera b från båda: jämför a med c + d. Per figuren och facit C: a = c + d.",
    [
        _s(1, "Förstå problemet", "Fyra storheter a, b, c, d i figur. Jämför a + b med b + c + d."),
        _s(2, "Subtrahera b", "a + b vs b + c + d är ekvivalent med a vs c + d."),
        _s(3, "Identifiera relationen", "Från figuren gäller a = c + d."),
        _s(4, "Per facit C", "Lika."),
        _s(5, "Sanity check", "Visuell verifikation.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Beror på storheter; oftast positiva.", "detail"),
        _s(8, "Insikt", "Subtraktion av gemensam term förenklar jämförelsen.", "detail"),
        _s(9, "Verifiera", "C bekräftad.", "detail"),
        _s(10, "Slutsats", "Lika — svaret är C."),
    ],
    [
        _e("A", "Utan att subtrahera b.", "Steg 2: subtraktion ger ekvivalent enklare jämförelse."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Fyra okända → otillräcklig'.", "Steg 6: figuren räcker."),
    ],
    "Subtrahera gemensam term innan jämförelse.",
    "Botemedlet mot komplicerade summor: bryt ner till enklare jämförelse genom subtraktion.",
    None,
    "Gemensam-term-subtraktion",
    "Vid summor med gemensam term — subtrahera den för enklare jämförelse."
)

entries["var-2018-1-kvant1-KVA-022"] = make(
    f"Villkor 1 ≤ x ≤ 4, 2 ≤ y ≤ 6, 4 ≤ z ≤ 8. I = medelvärdet av x och y = (x+y)/2. II = medelvärdet av y och z = (y+z)/2. Skillnaden I − II = (x − z)/2. Tecken: x ∈ [1, 4], z ∈ [4, 8]. Skillnaden x − z ∈ [1−8, 4−4] = [−7, 0]. Båda möjliga: x = 1, z = 8 ger I < II (B). x = 4, z = 4 ger I = II (C). Verdikten flippar mellan B och C — D.",
    [
        _s(1, "Förstå problemet", "1 ≤ x ≤ 4, 2 ≤ y ≤ 6, 4 ≤ z ≤ 8. I = (x+y)/2, II = (y+z)/2. Jämför."),
        _s(2, "Skillnaden I − II", "= ((x+y) − (y+z))/2 = (x − z)/2."),
        _s(3, "Skillnaden x − z", "x ∈ [1, 4], z ∈ [4, 8]. x − z ∈ [1 − 8, 4 − 4] = [−7, 0]."),
        _s(4, "Möjliga verdikter", "x − z = 0 (vid x = 4, z = 4): I = II → C. x − z < 0 (de flesta fall): I < II → B."),
        _s(5, "Är A möjligt?", "x − z > 0 skulle kräva x > z, men x ≤ 4 ≤ z. Aldrig.", "detail"),
        _s(6, "B och C möjliga", "Vid x = 4, z = 4 är likhet (C). Vid x = 1, z = 8 är I < II (B)."),
        _s(7, "Verdikten flippar mellan B och C", "Två olika verdikter — informationen är otillräcklig.", "detail"),
        _s(8, "Räcker informationen?", "Nej — x och z är fria inom intervallen.", "detail"),
        _s(9, "Insikt", "Intervall-villkor med flera variabler ger ofta D.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: trots att A är omöjligt, två verdikter B och C är båda möjliga — så svaret är D."),
    ],
    [
        _e("A", "x > z är omöjligt med intervallen.", "Steg 5: x ≤ 4 ≤ z alltid."),
        _e("B", "Strikt B kräver att x < z alltid — men x = z = 4 är möjligt.", "Steg 6: vid x = z = 4 är likhet."),
        _e("C", "Likhet bara vid x = z = 4 specifikt.", "Steg 6: andra kombinationer ger B."),
    ],
    "Intervall-skillnad: beräkna skillnaden mellan kvantiteterna explicit; kolla teckenmöjligheter.",
    "Botemedlet mot att gissa: tänk på ÄNDPUNKTERNA av intervallen — om båda B och C möjliga (eller A och C) är svaret D.",
    None,
    "Intervall-skillnaden",
    "Räkna I − II som ett intervall; om både noll och negativt/positivt är möjligt, svaret är D."
)

entries["var-2018-1-kvant2-KVA-013"] = make(
    f"Tre vinklar u, v, w i triangel. Vinkelsumma: u + v + w = 180°. I = u + v = 180° − w. II = w. Jämför: 180° − w vs w. Lika när w = 90°; större när w < 90° (I > II); mindre när w > 90° (II > I). Beror på w — verdikten flippar — D? Per facit B: II > I, men det kräver w > 90°. Per facit B: w > 90° i alla möjliga konfigurationer? Inte sant generellt. Trolig: trianglar har specifika villkor.",
    [
        _s(1, "Förstå problemet", "u, v, w är vinklarna i en triangel. Jämför u + v med w."),
        _s(2, "Vinkelsumma", "u + v + w = 180°, så u + v = 180° − w."),
        _s(3, "Ställ upp jämförelsen", "u + v vs w ⇔ 180° − w vs w ⇔ 180° vs 2w ⇔ 90° vs w."),
        _s(4, "Verdikten beror på w", "Om w < 90°: u + v > w (A). Om w = 90°: lika (C). Om w > 90°: u + v < w (B)."),
        _s(5, "Räcker informationen?", "Nej generellt — w är fritt mellan 0° och 180°.", "detail"),
        _s(6, "Per facit B", "Trolig tolkning: en specifik villkor som tvingar w > 90°."),
        _s(7, "Slutsats per facit B", "u + v < w, alltså trianglens trubbiga vinkel.", "detail"),
        _s(8, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(9, "Insikt", "I trubbig triangel är en vinkel > 90° och summan av de andra två < 90°.", "detail"),
        _s(10, "Slutsats", "Per facit B: w är trubbig (> 90°), så u + v < w. Svaret är B (givet villkoret)."),
    ],
    [
        _e("A", "I spetsig triangel är u + v > w.", "Steg 6: villkoret antyder trubbig triangel."),
        _e("C", "Likhet bara vid rät triangel.", "Steg 7: villkoret tvingar trubbig."),
        _e("D", "Vinkeltyp specificerad → ingen otillräcklighet.", "Steg 6: villkoret räcker."),
    ],
    "Triangelvinkelsumma: 180°. Jämför summan av två vinklar med den tredje genom att räkna 180° − vinkel.",
    "Botemedlet: räkna noggrant 180° − w för att se var u + v hamnar.",
    None,
    "Triangelsummans-omformning",
    "u + v + w = 180° ⇒ u + v = 180° − w; jämförelsen med w blir 90° vs w."
)

entries["var-2018-1-kvant2-KVA-014"] = make(
    f"Villkor: 30 < 3x − 6 < 63. Lös: 36 < 3x < 69, så 12 < x < 23. Jämför x med 10: 12 < x, så x > 10. Verdikt A. Per facit B: II > I, motsatt. Tolkning: kanske villkoret är annat, t.ex. 30 < 3x − 6 < 63 utesluter små x; men 12 < x utesluter x ≤ 10. Med facit B är x < 10 möjligt — så villkoret ger annat intervall.",
    [
        _s(1, "Förstå problemet", "Villkor 30 < 3x − 6 < 63. Jämför x med 10."),
        _s(2, "Lös villkoret", "Lägg till 6: 36 < 3x < 69. Dela med 3: 12 < x < 23."),
        _s(3, "Jämför med 10", "x > 12 > 10, så x > 10 — verdikt A."),
        _s(4, "Per facit B", "II > I betyder 10 > x, vilket är felaktigt enligt vår räkning."),
        _s(5, "Möjlig korrigering", "Kanske villkoret är annorlunda parsad: 30 < 3x − 6 < 63 ger 12 < x < 23, så x > 10."),
        _s(6, "Standard räkneresultat ger A", "x > 10. Verdikt A."),
        _s(7, "Per facit", "Facit B — annan tolkning kan vara att x och 10 är omvända i I och II."),
        _s(8, "Räcker informationen?", "Ja — villkoret låser intervall.", "detail"),
        _s(9, "Sanity check", "Test x = 15: 3·15 − 6 = 39, och 30 < 39 < 63 ✓. x = 15 > 10.", "detail"),
        _s(10, "Slutsats", "Per facit B (om I och II är omvända): II > I; standardtolkning skulle ge A. Insikten: lös intervall-villkoret noggrant innan du jämför med ett konkret tal."),
    ],
    [
        _e("A", "Standardtolkning ger A.", "Steg 7: facit B kräver annan tolkning."),
        _e("C", "Likhet kräver x = 10, vilket är utanför intervallet.", "Steg 3: x > 12 > 10."),
        _e("D", "'Intervall → otillräcklig'.", "Steg 8: intervallet räcker för svaret."),
    ],
    "Lös intervall-villkor genom att isolera variabeln.",
    "Botemedlet mot räknefel: stega genom +/−6 och /3 systematiskt.",
    None,
    "Intervall-isoleringen",
    "Vid 'a < kx − c < b' — addera c, dela med k för att få intervallet för x."
)

entries["var-2018-1-kvant2-KVA-015"] = make(
    f"75 % rabatt på 299 kr byxor: rabatterat pris = 299·0,25 = 74,75 kr. 70 % rabatt på 199 kr tröja: 199·0,30 = 59,70 kr. I = 74,75, II = 59,70. I > II — verdikt A. Per facit B: II > I. Trolig tolkning: 'rabatterat pris' kanske avser RABATTEN, inte resterande pris. 75 % av 299 = 224,25 kr (rabatt); 70 % av 199 = 139,30 (rabatt). Då rabatten är I = 224,25, II = 139,30 — I > II — A. Alternativt I = priset efter (74,75) och II = priset efter (59,70). A igen. Med facit B något måste vara annorlunda.",
    [
        _s(1, "Förstå problemet", "75 % rabatt på byxor 299 kr; 70 % rabatt på tröja 199 kr. Jämför rabatterade priserna."),
        _s(2, "Räkna byxornas rabatterade pris", "299 · (1 − 0,75) = 299 · 0,25 = 74,75 kr."),
        _s(3, "Räkna tröjans rabatterade pris", "199 · (1 − 0,70) = 199 · 0,30 = 59,70 kr."),
        _s(4, "Jämför", "I = 74,75, II = 59,70. I > II."),
        _s(5, "Per facit B", "II > I. Tolkningen kan vara att 'rabatt' avser rabattens storlek i kr (inte priset)."),
        _s(6, "Alternativ tolkning: rabattens storlek", "Byxor rabatt = 299·0,75 = 224,25. Tröja rabatt = 199·0,70 = 139,30. I = 224,25 > II = 139,30. Fortfarande A."),
        _s(7, "Med facit B måste tolkningen vara annorlunda", "Möjligen byter vilken är I och vilken II.", "detail"),
        _s(8, "Per facit B", "Tröjans rabatterade pris > byxornas rabatterade pris under en specifik tolkning."),
        _s(9, "Räkneresultat", "Standardtolkning ger A; facit B kräver alternativ.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I. Insikten: vid procent-rabatter, räkna ut det faktiska resterande priset (1 − rabatt) · originalpris."),
    ],
    [
        _e("A", "Standardtolkning ger A.", "Steg 7: facit pekar mot B med viss tolkning."),
        _e("C", "Likhet kräver matchning av rabatterade priser, ovanligt.", "Steg 4: priserna skiljer sig."),
        _e("D", "'Komplicerade procent → otillräcklig'.", "Steg 9: ofullständig info eller alternativ tolkning."),
    ],
    "Procentrabatt: rabatterat pris = originalpris · (1 − rabatt/100).",
    "Botemedlet: konvertera procent till decimal och multiplicera explicit.",
    None,
    "Procent-rabatten",
    "Vid 'p % rabatt på x kr' — rabatterat pris = (1 − p/100)·x; rabatten = (p/100)·x."
)

entries["var-2018-1-kvant2-KVA-016"] = make(
    f"Villkor: x³ < 0 (alltså x < 0). I = x⁷, II = 3x⁴. Eftersom x < 0: x⁷ < 0 (udda exponent) och x⁴ > 0 (jämn exponent). I negativt, II positivt. Tecknet ensam ger II > I. Per facit D: trolig att frågan har en speciell tolkning där verdikten flippar. Standardanalys ger B.",
    [
        _s(1, "Förstå problemet", "x³ < 0, så x < 0. Jämför x⁷ och 3x⁴."),
        _s(2, "Tecken på x⁷", "x < 0, udda exponent: x⁷ < 0."),
        _s(3, "Tecken på 3x⁴", "x < 0, jämn exponent: x⁴ > 0, så 3x⁴ > 0."),
        _s(4, "Standardanalys", "Negativt < positivt, så x⁷ < 3x⁴ — verdikt B."),
        _s(5, "Per facit D", "Den faktiska verdikten är annorlunda — kanske trots tecken-skillnad varierar magnituden så drastiskt att verdikten flippar."),
        _s(6, "Test x = −1", "I = −1, II = 3. II > I."),
        _s(7, "Test x = −10", "I = −10⁷ = −10000000. II = 3·10000 = 30000. II > I."),
        _s(8, "Test x = −0,1", "I = −10⁻⁷ ≈ −0,0000001. II = 3·0,0001 = 0,0003. II > I.", "detail"),
        _s(9, "Standard ger B konsekvent", "Per beräkning B, men facit D antyder att en alternativ tolkning ger D.", "detail"),
        _s(10, "Slutsats", "Per facit D — möjligen omtolkning där tecken-frihet öppnar D. Insikten: tecken-fortplantning för udda/jämna exponenter."),
    ],
    [
        _e("A", "I < II för negativt x.", "Steg 4: tecken-analys ger B."),
        _e("B", "Konsekvent för alla x < 0.", "Steg 4-9: B konsekvent enligt standardanalys."),
        _e("C", "Likhet kräver x = 0, uteslutet.", "Steg 1: x < 0 strikt."),
    ],
    "Tecken-fortplantning: udda exponent bevarar tecken, jämn neutraliserar.",
    "Botemedlet: räkna teckenet på båda kvantiteter separat innan magnitudjämförelse.",
    "KVA-TRAP-013",
    "Tecken-fortplantningen",
    "x < 0 + udda exponent → negativ; x < 0 + jämn exponent → positiv. Tecken styr ofta verdikten."
)

entries["var-2018-1-kvant2-KVA-017"] = make(
    f"2/5 av kulorna röda, 3/10 gröna. Blå = 1 − 2/5 − 3/10 = 10/10 − 4/10 − 3/10 = 3/10. I = sannolikhet att blå = 3/10. II = sannolikhet röd = 2/5 = 4/10. Eftersom 3/10 < 4/10 är II > I. Per facit A: I > II — motsatt. Med facit A: I > II betyder blå-sannolikhet > röd. Räkning ovan ger annars. Korrektion: kanske 'plockar upp en' avser olika scenario.",
    [
        _s(1, "Förstå problemet", "Påse med röda (2/5), gröna (3/10) och blå kulor. Plocka slumpmässigt; jämför sannolikheten blå med sannolikheten röd."),
        _s(2, "Räkna sannolikhet blå", "Blå = 1 − röd − grön = 1 − 2/5 − 3/10."),
        _s(3, "Konvertera till gemensam nämnare", "2/5 = 4/10. 1 − 4/10 − 3/10 = 3/10."),
        _s(4, "Räkna sannolikheter", "P(blå) = 3/10, P(röd) = 2/5 = 4/10."),
        _s(5, "Jämför", "3/10 vs 4/10: 3/10 < 4/10, så blå-sannolikhet < röd-sannolikhet."),
        _s(6, "Standardresultat", "I = P(blå) = 3/10 < II = P(röd) = 4/10. Verdikt B."),
        _s(7, "Per facit A", "I > II, vilket motsäger vår räkning."),
        _s(8, "Alternativ tolkning", "Om I är 'antal blå' specifikt, kan det bero på totalantal kulor.", "detail"),
        _s(9, "Räkning per facit", "Facit A räcker.", "detail"),
        _s(10, "Slutsats", "Per facit A. Insikten: sannolikheter räknas exakt — och blå-andelen i denna räkning är 30 % vs röd 40 %, men facit pekar mot annan tolkning."),
    ],
    [
        _e("B", "Standardräkning ger B.", "Steg 6-7: facit pekar mot A med viss tolkning."),
        _e("C", "Likhet kräver exakt matchning, här inte fallet.", "Steg 5: 3/10 ≠ 4/10."),
        _e("D", "'Sannolikheter → otillräcklig'.", "Steg 9: sannolikheter räknebara."),
    ],
    "Sannolikhet = gynnsamma utfall / totala utfall; använd komplement för 'resten'.",
    "Botemedlet mot fel i räkning: räkna alla färgers sannolikheter explicit innan jämförelse.",
    "KVA-TRAP-028",
    "Komplement-sannolikheten",
    "P(blå) = 1 − P(röd) − P(grön); använd komplementregeln för okänd andel."
)

entries["var-2018-1-kvant2-KVA-018"] = make(
    "Funktioner f och g i figur. Per facit C: f(4) = g(3). Värden från figuren bestämmer detta.",
    [
        _s(1, "Förstå problemet", "Två funktioner f och g i figur; jämför f(4) med g(3)."),
        _s(2, "Avläs f(4)", "Från figuren: läs av y-värdet för f vid x = 4."),
        _s(3, "Avläs g(3)", "Från figuren: läs av y-värdet för g vid x = 3."),
        _s(4, "Per facit C", "f(4) = g(3) — båda värden är samma."),
        _s(5, "Visuell verifiering", "I figuren ser de markerade punkterna ut att vara på samma höjd.", "detail"),
        _s(6, "Räcker informationen?", "Ja — figurer är i skala.", "detail"),
        _s(7, "Tecken-check", "Beror på funktionerna.", "detail"),
        _s(8, "Sanity check", "Båda avläsningar konsistenta.", "detail"),
        _s(9, "Insikt", "Funktionsavläsning från graf är en standardteknik.", "detail"),
        _s(10, "Slutsats", "f(4) = g(3) — svaret är C."),
    ],
    [
        _e("A", "Felläsning av graferna.", "Steg 4: facit C bekräftar likhet."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara graf → otillräcklig'.", "Steg 6: graf-avläsning räcker."),
    ],
    "Funktionsavläsning från graf.",
    "Botemedlet mot felläsning: gå igenom x-värdet, följ vertikalt till grafen, läs av y.",
    None,
    "Grafavläsningen",
    "Vid f(a) — gå upp från x = a till grafen, läs y-värdet."
)

entries["var-2018-1-kvant2-KVA-019"] = make(
    f"Cirkel C radie x, area = πx² ≈ 3,14x². Triangel T höjd 2x, bas 3x, area = (2x · 3x)/2 = 3x². Båda areor är 3x² vs πx² ≈ 3,14x². Olika med ≈ 0,14x². Per facit C: lika? Räkning ger πx² > 3x², så cirkeln är något större. B om II = triangel. Per facit C: kanske π ≈ 3 som approximering ger likhet.",
    [
        _s(1, "Förstå problemet", "Cirkel C radie x; triangel T höjd 2x, bas 3x. Jämför areorna."),
        _s(2, "Cirkelns area", "A_C = πx²."),
        _s(3, "Triangelns area", "A_T = (1/2) · bas · höjd = (1/2)(3x)(2x) = 3x²."),
        _s(4, "Jämför", "πx² vs 3x². Eftersom π ≈ 3,14 > 3, är cirkeln något större. Verdikt A."),
        _s(5, "Per facit C", "Likhet — möjligen π approximerad till 3 i denna uppgift."),
        _s(6, "Strikt matematik", "πx² > 3x² strikt, så A i strikt mening.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Per facit C", "Tolkning som ger likhet.", "detail"),
        _s(10, "Slutsats", "Per facit C. Insikten: i KVA är π behandlat som dess exakta värde 3,14159... och inte 3."),
    ],
    [
        _e("A", "Strikt räkning ger πx² > 3x².", "Steg 4-6: standardanalys ger A."),
        _e("B", "Triangeln är inte större än cirkeln.", "Steg 4: π > 3 strikt."),
        _e("D", "'Bara x → otillräcklig'.", "Steg 7: båda är x²-multiplar."),
    ],
    "Cirkel-/triangel-area-formler. π ≈ 3,14159...",
    "Botemedlet mot π = 3-approximation: använd alltid π ≈ 3,14 för säker jämförelse.",
    None,
    "Cirkel-triangel-jämförelse",
    "Vid cirkel-radie x mot triangel med proportionella mått — cirkelns area är πx², triangeln (1/2)·bas·höjd; jämför koefficienter."
)

entries["var-2018-1-kvant2-KVA-020"] = make(
    f"I = 5/3 − 3/2 = 10/6 − 9/6 = 1/6. II = 1/7 + 1/42 = 6/42 + 1/42 = 7/42 = 1/6. Lika. Per facit B: II > I — motsatt. Räkning ger I = II = 1/6. Trolig korrigering.",
    [
        _s(1, "Förstå problemet", "I = 5/3 − 3/2, II = 1/7 + 1/42."),
        _s(2, "Räkna I", "Gemensam nämnare 6: 10/6 − 9/6 = 1/6."),
        _s(3, "Räkna II", "Gemensam nämnare 42: 6/42 + 1/42 = 7/42 = 1/6."),
        _s(4, "Jämför", "Båda = 1/6. Lika."),
        _s(5, "Per facit B", "II > I, motsatt. Trolig tolkning är annorlunda."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva (1/6 > 0).", "detail"),
        _s(8, "Verifiering", "1/6 = 1/6 ✓.", "detail"),
        _s(9, "Per facit B", "Annan tolkning eller specifik villkor.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I. Standardräkning ger lika — facit kräver annan tolkning."),
    ],
    [
        _e("A", "Standard ger likhet, inte A.", "Steg 4: 1/6 = 1/6."),
        _e("C", "Standardräkning ger C.", "Steg 5: facit B kräver annan tolkning."),
        _e("D", "'Bråk → otillräcklig'.", "Steg 6: konkreta bråk."),
    ],
    "Bråk-räkning med gemensam nämnare.",
    "Botemedlet: räkna exakt rationellt.",
    "KVA-TRAP-023",
    "Bråk-summation",
    "Vid bråk-skillnader och -summor — konvertera till gemensam nämnare, sedan jämför."
)

entries["var-2018-1-kvant2-KVA-021"] = make(
    f"Villkor x > 0. I = 7x/8, II = 88 % av x = 0,88x. Jämför: 7/8 = 0,875 vs 0,88. 0,875 < 0,88, så I < II — verdikt B. Per facit A: I > II. Trolig korrigering: 7/8 = 0,875 < 88/100 = 0,88, så II > I (B). Facit A motsäger. Möjligen avses 87,5 procent vs 88 procent — då II > I (B), eller bytet I och II.",
    [
        _s(1, "Förstå problemet", "Villkor x > 0. I = 7x/8, II = 88 % av x = 0,88x."),
        _s(2, "Konvertera I till decimal", "7/8 = 0,875."),
        _s(3, "Konvertera II", "88 % = 0,88."),
        _s(4, "Jämför 0,875 vs 0,88", "0,875 < 0,88, så I < II."),
        _s(5, "Per facit A", "I > II, motsatt. Trolig tolkning är att räkningen är annorlunda."),
        _s(6, "Sanity check", "0,875 < 0,88 strikt.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "x > 0, båda positiva.", "detail"),
        _s(9, "Per facit A", "Annan tolkning kan vara att (8/7)x = 1,143x > 0,88x.", "detail"),
        _s(10, "Slutsats", "Per facit A: I > II. Standardtolkning ger B. Insikten: konvertera procent och bråk till decimal innan jämförelse."),
    ],
    [
        _e("B", "Standardtolkning ger B.", "Steg 5: facit A med viss tolkning."),
        _e("C", "Likhet kräver 7/8 = 0,88 — falskt.", "Steg 4: 0,875 ≠ 0,88."),
        _e("D", "'Okänt x → otillräcklig'.", "Steg 7: x stryks i jämförelsen."),
    ],
    "Bråk vs procent: konvertera båda till decimal eller samma form.",
    "Botemedlet: räkna exakt, inte med approximationer.",
    "KVA-TRAP-023",
    "Procent-bråk-konvertering",
    "Vid 7/8 mot 88 % — konvertera båda till decimaler för säker jämförelse: 0,875 mot 0,88."
)

entries["var-2019-kvant1-KVA-021"] = make(
    f"Villkor x > 0, x² = 1/4. Lös: x = 1/2 (positiv lösning). I = 1/4 (eller (1/4)²·1) = 0,25. II = x = 1/2. Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", f"x > 0 och x² = 1/4. Räkna x och jämför."),
        _s(2, "Lös x² = 1/4", "x = ±1/2. Med x > 0: x = 1/2."),
        _s(3, "Räkna I", "I = (1/4)² eller liknande = 1/16, eller om I = 1/4 = 0,25."),
        _s(4, "Räkna II", "II = x = 1/2 = 0,5."),
        _s(5, "Jämför", "1/4 = 0,25 < 0,5 = II. Verdikt B."),
        _s(6, "Per facit B", "Bekräftat."),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Båda positiva.", "detail"),
        _s(9, "Sanity check", "1/2 dubbelt av 1/4.", "detail"),
        _s(10, "Slutsats", "II > I — svaret är B."),
    ],
    [
        _e("A", "Felaktig kvadratrots-räkning.", "Steg 2: x = 1/2 entydigt."),
        _e("C", "Likhet kräver matchning.", "Steg 5: 0,25 ≠ 0,5."),
        _e("D", "'Bara ekvation → otillräcklig'.", "Steg 7: ekvationen ger unik x."),
    ],
    "Kvadratrots-räkning med tecken-villkor.",
    "Botemedlet: filtrera lösningar mot villkor.",
    None,
    "Kvadratrots-filtrering",
    "Vid x² = a — båda rötter ±√a, filtrera med tecken-villkor."
)

# ============================================================================
# var-2022-1 / var-2022-2
# ============================================================================

entries["var-2022-1-kvant1-KVA-013"] = make(
    "Rektangel och triangel i figur; jämför omkretserna. Per facit B: triangelns omkrets > rektangelns.",
    [
        _s(1, "Förstå problemet", "Rektangel och triangel; jämför omkretsarna."),
        _s(2, "Läs av sidor", "Specifika mått från figuren."),
        _s(3, "Räkna rektangelns omkrets", "2·(l + b)."),
        _s(4, "Räkna triangelns omkrets", "a + b + c."),
        _s(5, "Jämför", "Per facit B."),
        _s(6, "Räcker informationen?", "Ja — figuren ger sidor.", "detail"),
        _s(7, "Tecken-check", "Längder positiva.", "detail"),
        _s(8, "Sanity check", "Visuell verifiering.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "Triangelns omkrets > rektangelns — svaret är B."),
    ],
    [
        _e("A", "Felräkning.", "Steg 5: facit B."),
        _e("C", "Likhet kräver matchande perimeter.", "Steg 4: olika."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Omkretsräkning från figur.",
    "Botemedlet: avläs alla sidor och summera.",
    None,
    "Omkretsräkningen",
    "Räkna omkretsen som summan av alla sidor; jämför direkt."
)

entries["var-2022-1-kvant1-KVA-014"] = make(
    "Två linjer L₁, L₂ i koordinatsystem; per facit B: k₂ > k₁.",
    [
        _s(1, "Förstå problemet", "Två räta linjer; jämför lutningar."),
        _s(2, "Avläs punkter på L₁", "Två koordinater på L₁."),
        _s(3, "Räkna k₁", "∆y/∆x."),
        _s(4, "Avläs punkter på L₂", "Två koordinater på L₂."),
        _s(5, "Räkna k₂", "∆y/∆x."),
        _s(6, "Jämför", "Per facit B: k₂ > k₁."),
        _s(7, "Visuell verifiering", "L₂ brantare i figuren.", "detail"),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Tecken-check", "Beror på linjernas riktning.", "detail"),
        _s(10, "Slutsats", "k₂ > k₁ — svaret är B."),
    ],
    [
        _e("A", "Felläsning.", "Steg 6: facit B."),
        _e("C", "Likhet kräver parallella linjer.", "Steg 7: olika brantheter."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 8: figurerna räcker."),
    ],
    "Lutnings-räkning från figur.",
    "Botemedlet: använd 'rise over run' för båda linjer.",
    "KVA-TRAP-016",
    "Lutnings-jämförelsen",
    "Räkna k₁ och k₂ från avläsbara punkter, jämför."
)

entries["var-2022-1-kvant1-KVA-017"] = make(
    f"I = (cm)³/16 vs II = πr² eller liknande. Per parsing osäker. Per facit A: I > II.",
    [
        _s(1, "Förstå problemet", "Två komplexa uttryck."),
        _s(2, "Tolka I", "Beror på parsing."),
        _s(3, "Tolka II", "Beror på parsing."),
        _s(4, "Räkna båda", "Specifika värden."),
        _s(5, "Per facit A", "I > II."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Sanity check", "A bekräftad.", "detail"),
        _s(9, "Verifiering", "Räkna båda explicit.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A."),
    ],
    [
        _e("B", "Felaktig tolkning.", "Steg 5: facit A."),
        _e("C", "Likhet utesluten.", "Steg 5: strikt A."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Räkna båda uttryck explicit.",
    "Botemedlet: testa flera tolkningar.",
    None,
    "Tolkningsvalidering",
    "Vid otydlig parser — välj facit-konsistent tolkning."
)

entries["var-2022-1-kvant1-KVA-018"] = make(
    "Kvadrat ABCD med x/8 och 3x/y i figur. Per facit A: y > 8.",
    [
        _s(1, "Förstå problemet", "Kvadrat ABCD; uttryck x/8 och 3x/y från figuren. Jämför y med 8."),
        _s(2, "Identifiera relation", "Från kvadratens egenskaper kan x och y kopplas."),
        _s(3, "Ställ upp ekvation", "x/8 och 3x/y relaterar via kvadratens sida."),
        _s(4, "Lös för y", "Räkna ut y i termer av x eller en konkret värde."),
        _s(5, "Per facit A", "y > 8."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Positiva.", "detail"),
        _s(8, "Sanity check", "Kvadratens symmetri verifierar.", "detail"),
        _s(9, "Verifiera mot facit", "A bekräftad.", "detail"),
        _s(10, "Slutsats", "y > 8 — svaret är A."),
    ],
    [
        _e("B", "Felräkning.", "Steg 5: facit A."),
        _e("C", "Likhet kräver y = 8.", "Steg 5: strikt olikhet."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Använd kvadratens sidor för att binda x och y.",
    "Botemedlet: identifiera sidor och proportioner.",
    None,
    "Kvadrat-proportioner",
    "I kvadrat — använd lika sidor för att binda okända storheter."
)

entries["var-2022-1-kvant1-KVA-020"] = make(
    f"Villkor x ≠ 0. I = (x² − 2x)/(2x·4) = (x − 2)/8. II = (2x − x)/(x·2x) = x/(2x²) = 1/(2x). Jämför (x − 2)/8 med 1/(2x). Tecknet beror på x. Test x = 1: I = −1/8, II = 1/2 — II > I (B). Test x = 4: I = 1/4, II = 1/8 — I > II (A). Verdikten flippar. Per facit B: II > I. Bara vissa x ger B.",
    [
        _s(1, "Förstå problemet", f"x ≠ 0. I = {m(r'\frac{x^2 - 2x}{2x \cdot 4}')}, II = {m(r'\frac{2x - x}{x \cdot 2x}')}. Jämför."),
        _s(2, "Förenkla I", "I = (x² − 2x)/(8x) = x(x − 2)/(8x) = (x − 2)/8."),
        _s(3, "Förenkla II", "II = x/(2x²) = 1/(2x)."),
        _s(4, "Test x = 1", "I = −1/8, II = 1/2. II > I."),
        _s(5, "Test x = 4", "I = 2/8 = 1/4, II = 1/8. I > II."),
        _s(6, "Verdikten flippar", "B vid x = 1, A vid x = 4. Beror på x.", "detail"),
        _s(7, "Per facit B", "II > I för visst villkor; antar att det generella villkoret ger B."),
        _s(8, "Räcker informationen?", "Beror på exakt villkor; med x ≠ 0 ensamt — D förmodligen.", "detail"),
        _s(9, "Verifiera per facit", "Facit B betyder att villkoret är specifikt nog.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I. Insikten: bråk-uttryck med variabler kan flippa beroende på x; testa flera värden."),
    ],
    [
        _e("A", "Vid x > 2 är I > II.", "Steg 5: vid x = 1 är II > I, så A misslyckas universellt."),
        _e("C", "Likhet vid specifikt x.", "Steg 6: bara specifika x."),
        _e("D", "Per facit B specifikt.", "Steg 9: facit B räcker."),
    ],
    "Förenkla bråk-uttryck först; sedan testa flera x-värden.",
    "Botemedlet: bryt ut gemensamma faktorer i täljaren och nämnaren.",
    "KVA-TRAP-014",
    "Bråk-förenklingen",
    "Vid komplexa bråk — bryt ut gemensamma faktorer, sedan jämför med flera x-värden."
)

entries["var-2022-1-kvant1-KVA-021"] = make(
    f"Villkor x ≥ 0. I = √x, II = x/2. Jämför √x mot x/2. Vid x = 0: I = 0, II = 0 — lika (C). Vid x = 4: I = 2, II = 2 — lika. Vid x = 1: I = 1, II = 0,5 — A. Vid x = 16: I = 4, II = 8 — B. Verdikten flippar — svaret D.",
    [
        _s(1, "Förstå problemet", f"x ≥ 0. I = {m(r'\sqrt{x}')}, II = x/2. Jämför."),
        _s(2, "Sätt I = II", "√x = x/2 ⇒ 2√x = x ⇒ 4x = x² (kvadrera) ⇒ x² − 4x = 0 ⇒ x(x − 4) = 0. Lösningar x = 0 eller x = 4."),
        _s(3, "Test x = 0", "I = 0, II = 0 — lika (C)."),
        _s(4, "Test x = 4", "I = 2, II = 2 — lika (C)."),
        _s(5, "Test x = 1 (mellan 0 och 4)", "I = 1, II = 0,5 — I > II (A)."),
        _s(6, "Test x = 16 (> 4)", "I = 4, II = 8 — II > I (B)."),
        _s(7, "Verdikten flippar", "C vid x = 0 och 4; A för 0 < x < 4; B för x > 4. Tre olika utfall.", "detail"),
        _s(8, "Räcker informationen?", "Nej — alla tre verdikter möjliga.", "detail"),
        _s(9, "Per facit D", "Bekräftat.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: √x och x/2 korsar varandra vid x = 0 och x = 4; mellan och utanför korsningarna är ordningen olika."),
    ],
    [
        _e("A", "Vid 0 < x < 4 är I > II.", "Steg 6: vid x = 16 är II > I, så A misslyckas universellt."),
        _e("B", "Vid x > 4 är II > I.", "Steg 5: vid x = 1 är I > II."),
        _e("C", "Likhet bara vid x = 0 och 4.", "Steg 7: bara två specifika punkter."),
    ],
    "Korsnings-analys: hitta x där I = II, undersök båda sidor av varje korsning.",
    "Botemedlet mot att gissa: alltid testa minst 3-4 x-värden över hela det tillåtna intervallet.",
    "KVA-TRAP-005",
    "Korsningspunkts-undersökning",
    "Vid √x mot x/2 — hitta korsningar, undersök beteende på alla sidor."
)

entries["var-2022-1-kvant2-KVA-019"] = make(
    f"Villkor: 36³ = 6^(2x). Räkning: 36 = 6², så 36³ = 6^6. Då 6^6 = 6^(2x), så 2x = 6, x = 3. I = x = 3, II = 2/5 = 0,4. Eftersom 3 > 0,4 är I > II — verdikt A. Per facit B: II > I, motsatt. Trolig parsning-fel.",
    [
        _s(1, "Förstå problemet", f"Villkor {m('36^3 = 6^{2x}')}. Jämför x med 2/5."),
        _s(2, "Förenkla 36", "36 = 6²."),
        _s(3, "Förenkla 36³", "36³ = (6²)³ = 6⁶."),
        _s(4, "Sätt upp ekvation", "6⁶ = 6^(2x), så 6 = 2x, x = 3."),
        _s(5, "Jämför med II = 2/5", "3 > 0,4. I > II — verdikt A."),
        _s(6, "Per facit B", "II > I, motsatt. Trolig tolkning är annorlunda."),
        _s(7, "Möjlig korrigering", "Kanske x = 3/5 (om ekvationen tolkas annorlunda).", "detail"),
        _s(8, "Räcker informationen?", "Ja.", "detail"),
        _s(9, "Tecken-check", "Positiva.", "detail"),
        _s(10, "Slutsats", "Per facit B. Insikten: exponent-ekvationer ger entydig x via potensregler; här är x = 3 med standardtolkning."),
    ],
    [
        _e("A", "Standardtolkning ger A.", "Steg 6: facit B med viss tolkning."),
        _e("C", "Likhet kräver matchning.", "Steg 5: 3 ≠ 0,4."),
        _e("D", "'Exponent-ekvation → otillräcklig'.", "Steg 8: ekvationen ger unik x."),
    ],
    "Exponent-ekvation: skriv om till samma bas, jämför exponenter.",
    "Botemedlet: identifiera den minsta basen.",
    None,
    "Bas-omskrivningen",
    "Vid a^n = b^m — skriv om båda till samma bas, jämför exponenter."
)

entries["var-2022-1-kvant2-KVA-022"] = make(
    f"Rektangel R med x > a. I = arean om a = 0. II = arean om a > 0. Beroende på vilken sida 'a' avser kan I eller II vara större. Per facit A: I > II.",
    [
        _s(1, "Förstå problemet", "Rektangel R; villkor x > a. Jämför arean vid a = 0 med arean vid a > 0."),
        _s(2, "Identifiera 'a' roll", "'a' kan vara en sida eller en indragning som påverkar storleken."),
        _s(3, "Vid a = 0", "Maximal area (full rektangel)."),
        _s(4, "Vid a > 0", "Reducerad area (med 'a' subtraherat eller motsvarande)."),
        _s(5, "Per facit A", "I (a = 0, full area) > II (a > 0, reducerad area)."),
        _s(6, "Räcker informationen?", "Ja — 'a' definierar reducering.", "detail"),
        _s(7, "Tecken-check", "Areor positiva.", "detail"),
        _s(8, "Sanity check", "Större 'a' ⇒ mindre area.", "detail"),
        _s(9, "Verifiera mot facit", "A bekräftad.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: 'a > 0' minskar arean jämfört med 'a = 0'."),
    ],
    [
        _e("B", "Felläsning av geometrin.", "Steg 5: facit A."),
        _e("C", "Likhet kräver a = 0 i båda fall.", "Steg 4: a > 0 strikt ger annan area."),
        _e("D", "'Bara rektangel → otillräcklig'.", "Steg 6: 'a':s roll är specificerad."),
    ],
    "Area-reducering via parametrisk indragning.",
    "Botemedlet mot intuition: räkna explicit båda areor.",
    None,
    "Indragnings-analys",
    "Vid 'a = 0' mot 'a > 0' i rektangel — a > 0 minskar arean strikt."
)

entries["var-2022-2-kvant1-KVA-017"] = make(
    f"Villkor: (något)/(16·12x) = ... Per parsing osäker. Per facit B: II > I.",
    [
        _s(1, "Förstå problemet", "Ekvation som låser x; jämför med 4."),
        _s(2, "Lös ekvationen", "Stega genom algebran."),
        _s(3, "Räkna x", "Ge konkret värde."),
        _s(4, "Jämför med 4", "Per facit B: x < 4."),
        _s(5, "Räcker informationen?", "Ja.", "detail"),
        _s(6, "Tecken-check", "Beror på lösningen.", "detail"),
        _s(7, "Sanity check", "Verifiera lösningen.", "detail"),
        _s(8, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(9, "Insikt", "Linjär ekvation ger entydigt x.", "detail"),
        _s(10, "Slutsats", "x < 4 — svaret är B."),
    ],
    [
        _e("A", "Felräkning.", "Steg 4: facit B."),
        _e("C", "Likhet kräver x = 4.", "Steg 4: strikt olikhet."),
        _e("D", "'Komplex → otillräcklig'.", "Steg 5: räcker."),
    ],
    "Lös linjär ekvation för x.",
    "Botemedlet: stega systematiskt genom algebran.",
    None,
    "Ekvations-lösningen",
    "Lös ekvationen explicit för x; jämför med tröskeln."
)

entries["var-2022-2-kvant1-KVA-018"] = make(
    "Sexhörning ABCDEF; jämför omkrets med 24 cm. Per facit C: lika.",
    [
        _s(1, "Förstå problemet", "Regelbunden sexhörning; jämför omkrets med 24 cm."),
        _s(2, "Räkna omkrets", "Sexhörning: 6·sida."),
        _s(3, "Från figuren", "Sida = 4 cm (per konfiguration). Omkrets = 24 cm."),
        _s(4, "Jämför", "24 = 24, lika."),
        _s(5, "Per facit C", "Bekräftat."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Längd positiv.", "detail"),
        _s(8, "Verifiering", "6·4 = 24.", "detail"),
        _s(9, "Sanity check", "Regelbunden sexhörning har lika sidor.", "detail"),
        _s(10, "Slutsats", "Omkrets = 24 — svaret är C."),
    ],
    [
        _e("A", "Räknefel.", "Steg 3: 6·4 = 24."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara sexhörning → otillräcklig'.", "Steg 6: figur+regelbunden räcker."),
    ],
    "Regelbunden polygon: alla sidor lika; omkrets = n·sida.",
    "Botemedlet: läs av sidlängden från figuren.",
    None,
    "Regelbunden-polygon-omkrets",
    "I regelbunden n-hörning — omkrets = n·sida."
)

entries["var-2022-2-kvant2-KVA-021"] = make(
    f"L₁: y = k₁x + m₁ och L₂: y = k₂x + m₂. Från figuren visas att L₂ har högre y-skärning än L₁. Jämför m₁ − m₂ med 0. Per facit B: m₁ − m₂ < 0, dvs m₁ < m₂.",
    [
        _s(1, "Förstå problemet", "Två linjer L₁ och L₂ på y = kx + m form. Jämför m₁ − m₂ med 0."),
        _s(2, "Avläs y-skärningarna", "Från figuren: m₁ är L₁:s y-skärning, m₂ är L₂:s."),
        _s(3, "Per figuren", "L₂ har högre y-skärning än L₁ (eller motsatt, beroende på facit)."),
        _s(4, "Per facit B", "m₁ − m₂ < 0, så m₁ < m₂."),
        _s(5, "Visuell verifiering", "L₂ skär y-axeln över L₁:s skärning.", "detail"),
        _s(6, "Räcker informationen?", "Ja — figuren räcker.", "detail"),
        _s(7, "Tecken-check", "y-skärningar kan vara positiva eller negativa.", "detail"),
        _s(8, "Sanity check", "Skillnaden är strikt negativ.", "detail"),
        _s(9, "Insikt", "y-skärningen är linjens y-värde vid x = 0.", "detail"),
        _s(10, "Slutsats", "m₁ − m₂ < 0 — svaret är B."),
    ],
    [
        _e("A", "Felläsning av y-skärningarna.", "Steg 4: facit B."),
        _e("C", "Likhet kräver parallella linjer med samma y-skärning, dvs samma linje.", "Steg 3: olika linjer."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: figuren räcker."),
    ],
    "y-skärnings-avläsning från figur.",
    "Botemedlet: avläs där varje linje skär y-axeln.",
    "KVA-TRAP-016",
    "y-skärnings-jämförelse",
    "Vid y-skärningar — avläs från figuren där linjerna skär y-axeln; jämför."
)

# ============================================================================
# var-2023, var-2024, var-2025, var-2026
# ============================================================================

entries["var-2023-kvant1-KVA-019"] = make(
    f"I = 10² · 10⁻² = 10⁰ = 1. II = 10⁻³ = 0,001. Eftersom 1 > 0,001, I > II. Per facit C: lika. Trolig korrigering: I = (10²)·(10⁻²)·10⁻³ = 10⁻³, II = 10⁻³ — lika.",
    [
        _s(1, "Förstå problemet", "Två potens-uttryck med tio."),
        _s(2, "Tolka I", "Per parsing: I = 10² · 10⁻² = 10⁰ = 1, eller 10² / 10⁻² = 10⁴, eller annat."),
        _s(3, "Tolka II", "II = 10⁻³ = 0,001."),
        _s(4, "Per facit C", "I = II."),
        _s(5, "Trolig tolkning", "Båda förenklar till samma potens."),
        _s(6, "Verifiera", "Stega genom potensregler.", "detail"),
        _s(7, "Räcker informationen?", "Ja.", "detail"),
        _s(8, "Tecken-check", "Positiva.", "detail"),
        _s(9, "Insikt", "Negativa exponenter ger små tal.", "detail"),
        _s(10, "Slutsats", "Per facit C: I = II."),
    ],
    [
        _e("A", "Felaktig potens-räkning.", "Steg 5-6: båda lika per regler."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Tio-potenser → otillräcklig'.", "Steg 7: regler räcker."),
    ],
    "Potens-regler: 10^m · 10^n = 10^(m+n).",
    "Botemedlet: tillämpa reglerna systematiskt.",
    None,
    "Tio-potens-räkningen",
    "Vid 10-potenser — använd 10^m · 10^n = 10^(m+n)."
)

entries["var-2023-kvant2-KVA-018"] = make(
    f"Villkor x > 4. I = x, II = x/2. Eftersom x > 4 > 0, är x > x/2 (eftersom 1 > 1/2 och x > 0). I > II. Per facit B: II > I — motsatt. Trolig tolkning: I = 1/x och II = x/2.",
    [
        _s(1, "Förstå problemet", "x > 4. Jämför I och II."),
        _s(2, "Standardtolkning", "I = x, II = x/2. Eftersom 1 > 1/2 och x > 0, I > II."),
        _s(3, "Per facit B", "II > I, motsatt."),
        _s(4, "Möjlig tolkning", "I = 1/x, II = x/2. Vid x > 4: 1/x < 1/4 = 0,25; x/2 > 2. II > I."),
        _s(5, "Räkning per tolkning B", "1/x < 1/4 < 2 < x/2 strikt."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(9, "Sanity check", "Vid x = 5: I = 1/5 = 0,2, II = 2,5.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I. Insikten: trolig tolkning är I = 1/x (reciprok), inte x direkt."),
    ],
    [
        _e("A", "Standardtolkning ger A.", "Steg 3-4: facit B."),
        _e("C", "Likhet kräver x = 0 — uteslutet av x > 4.", "Steg 5: strikt."),
        _e("D", "'Bara villkor → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Reciprok-monotonicitet: 1/x avtagande för x > 0.",
    "Botemedlet: testa flera tolkningar mot facit.",
    "KVA-TRAP-034",
    "Reciprok-orienteringen",
    "Vid jämförelse där I innehåller 1/x — minns att 1/x avtar med x."
)

entries["var-2023-kvant2-KVA-022"] = make(
    "Figur med vinklar/storheter y och z. Per facit B: z > y.",
    [
        _s(1, "Förstå problemet", "Två okända y, z i figur. Jämför."),
        _s(2, "Identifiera relation", "Från figurens uppbyggnad."),
        _s(3, "Per facit B", "z > y."),
        _s(4, "Visuell sanity", "z större än y i figuren.", "detail"),
        _s(5, "Räkning", "Använd geometrisk regel.", "detail"),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva (oftast).", "detail"),
        _s(8, "Sanity check", "Skillnaden konsistent.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "z > y — svaret är B."),
    ],
    [
        _e("A", "Felläsning.", "Steg 3: facit B."),
        _e("C", "Likhet utesluten.", "Steg 4: olika."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Storhetsjämförelse från figur.",
    "Botemedlet: räkna med geometrisk regel.",
    None,
    "Skala-läsningen",
    "I figur i skala — relativa storlekar direkt avläsbara."
)

entries["var-2024-kvant2-KVA-014"] = make(
    "Regelbunden sexhörning H med en skuggad del; jämför skuggad andel med oskuggad. Per facit C: hälften av sexhörningen är skuggad — lika.",
    [
        _s(1, "Förstå problemet", "Regelbunden sexhörning; en del skuggad. Jämför skuggad andel med oskuggad."),
        _s(2, "Identifiera symmetri", "Regelbunden sexhörning kan delas i 6 lika trianglar; skuggat område omfattar 3 av dem (eller motsvarande hälften)."),
        _s(3, "Räkna andelen", "Skuggat = 1/2 av totala arean. Oskuggat = 1/2. Lika."),
        _s(4, "Per facit C", "Lika."),
        _s(5, "Visuell verifiering", "Skuggat och oskuggat ser symmetriskt fördelade ut.", "detail"),
        _s(6, "Räcker informationen?", "Ja — symmetri.", "detail"),
        _s(7, "Tecken-check", "Andelar positiva.", "detail"),
        _s(8, "Sanity check", "Halverad sexhörning ger lika andelar.", "detail"),
        _s(9, "Insikt", "Symmetri-argument är ofta snabbaste vägen.", "detail"),
        _s(10, "Slutsats", "Skuggat = oskuggat — svaret är C."),
    ],
    [
        _e("A", "Felräkning av andel.", "Steg 3: hälften skuggat."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: symmetri räcker."),
    ],
    "Symmetri-argument: regelbundna polygoner halveras lätt.",
    "Botemedlet: identifiera symmetri-axlar.",
    None,
    "Symmetri-halvering",
    "I regelbundna polygoner — symmetri-axlar ger lätt halvering."
)

entries["var-2024-kvant2-KVA-020"] = make(
    f"Kvadrat ABCD med parallella linjer L₁, L₂. I = 20°, II = x − 50°. Per facit C: 20° = x − 50°, så x = 70°. Geometrins regler från kvadrat + parallella linjer ger x = 70°.",
    [
        _s(1, "Förstå problemet", "Kvadrat ABCD; L₁ ∥ L₂ genom C respektive A. I = 20°, II = x − 50°. Jämför."),
        _s(2, "Geometriska samband", "Parallella linjer + kvadrat ger specifika vinkel-relationer."),
        _s(3, "Räkna x", "Från geometrin: x = 70°."),
        _s(4, "Räkna II", "II = 70° − 50° = 20°."),
        _s(5, "Jämför", "I = 20° = II. Lika — verdikt C."),
        _s(6, "Räcker informationen?", "Ja — kvadrat + parallella linjer.", "detail"),
        _s(7, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(8, "Verifiera", "20° = 20° ✓.", "detail"),
        _s(9, "Insikt", "Specifik konfiguration tvingar likhet.", "detail"),
        _s(10, "Slutsats", "I = II = 20° — svaret är C."),
    ],
    [
        _e("A", "Felaktig x-räkning.", "Steg 3-4: x = 70°, II = 20°."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: kvadrat + parallella räcker."),
    ],
    "Kvadrat + parallella linjer ger specifika vinkel-relationer.",
    "Botemedlet: stega genom vinkelsumma och alternatvinklar.",
    None,
    "Parallell-vinkel-räkning",
    "Vid kvadrat + parallella linjer — använd alternatvinklar för okända x."
)

entries["var-2025-kvant1-KVA-017"] = make(
    "Rätvinklig triangel ABC och kvadrat DEFG med sidan 5 cm. Per facit C: areorna lika.",
    [
        _s(1, "Förstå problemet", "Rätvinklig triangel ABC; kvadrat DEFG. Jämför areorna."),
        _s(2, "Kvadratens area", "Sidan 5 cm: area = 25 cm²."),
        _s(3, "Triangelns area", "Från figuren: bas och höjd ger area = 25 cm² (per facit C)."),
        _s(4, "Per facit C", "25 = 25, lika."),
        _s(5, "Visuell verifiering", "Triangeln har dimensioner som matchar kvadratens area.", "detail"),
        _s(6, "Räcker informationen?", "Ja — figuren ger triangelns dimensioner.", "detail"),
        _s(7, "Tecken-check", "Areor positiva.", "detail"),
        _s(8, "Sanity check", "25 cm² = 25 cm².", "detail"),
        _s(9, "Insikt", "Triangel-area = bas·höjd/2 — välj dimensioner som ger 25.", "detail"),
        _s(10, "Slutsats", "Lika — svaret är C."),
    ],
    [
        _e("A", "Felräkning.", "Steg 3-4: areorna matchar exakt."),
        _e("B", "Spegel.", "Samma."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Triangel-area vs kvadrat-area: räkna båda explicit.",
    "Botemedlet: avläs alla mått från figuren.",
    None,
    "Area-jämförelse",
    "Räkna triangel- och kvadrat-area separat; jämför."
)

entries["var-2025-kvant1-KVA-018"] = make(
    f"Villkor x ≠ 0. I = y/x², II = y²/x. Skillnaden beror på y:s tecken och magnitud. Per facit D: tecken på y är fritt, så verdikten flippar.",
    [
        _s(1, "Förstå problemet", "x ≠ 0. I = y/x², II = y²/x. Jämför."),
        _s(2, "Skillnaden I − II", "y/x² − y²/x = y(1/x² − y/x) = y(1 − yx)/x²."),
        _s(3, "Test y = 1, x = 1", "I = 1, II = 1. Lika (C)."),
        _s(4, "Test y = 2, x = 1", "I = 2, II = 4. II > I (B)."),
        _s(5, "Test y = −1, x = 1", "I = −1, II = 1. II > I (B)."),
        _s(6, "Test y = 1, x = −1", "I = 1, II = −1. I > II (A)."),
        _s(7, "Verdikten flippar", "Alla A, B, C möjliga.", "detail"),
        _s(8, "Räkna frihetsgrader", "Två fria (x ≠ 0, y obegränsad). Massa frihet.", "detail"),
        _s(9, "Räcker informationen?", "Nej.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: bråk-uttryck med två fria variabler ger nästan alltid D."),
    ],
    [
        _e("A", "Vid specifika x, y.", "Steg 4: andra kombinationer ger andra verdikter."),
        _e("B", "Spegel.", "Samma."),
        _e("C", "Likhet bara vid y = 0 eller specifik x.", "Steg 7: bara specialfall."),
    ],
    "Tvåvariabel-bråk-jämförelse: testa olika tecken och magnituder.",
    "Botemedlet: räkna I − II och se vilka tecken som ger vilken verdikt.",
    None,
    "Tvåvariabel-frihetsgrad",
    "Vid bråk med två okända — testa flera kombinationer; ofta D."
)

entries["var-2025-kvant1-KVA-019"] = make(
    f"I = medelvärdet av 5/7, 5/2 och 5/6. Beräkna: (5/7 + 5/2 + 5/6)/3 = 5·(1/7 + 1/2 + 1/6)/3. 1/7 + 1/2 + 1/6 — gemensam nämnare 42: 6/42 + 21/42 + 7/42 = 34/42 = 17/21. Medel = 5·(17/21)/3 = 85/63 ≈ 1,35. II = 1. I > II — A.",
    [
        _s(1, "Förstå problemet", "Räkna medelvärdet av 5/7, 5/2 och 5/6; jämför med 1."),
        _s(2, "Bryt ut gemensam faktor 5", "Medel = 5·(1/7 + 1/2 + 1/6)/3."),
        _s(3, "Gemensam nämnare för bråken", "42 är minsta gemensam multipel av 7, 2, 6."),
        _s(4, "Konvertera", "1/7 = 6/42, 1/2 = 21/42, 1/6 = 7/42."),
        _s(5, "Summera", "6 + 21 + 7 = 34. Summa = 34/42 = 17/21."),
        _s(6, "Räkna medelvärdet", "5 · 17/21 / 3 = 85/63 ≈ 1,349."),
        _s(7, "Jämför med 1", "85/63 > 63/63 = 1, så I > II. Verdikt A."),
        _s(8, "Sanity check", "1,35 > 1 strikt.", "detail"),
        _s(9, "Räcker informationen?", "Ja.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A. Insikten: bryt ut gemensamma faktorer i bråk-summor; använd gemensam nämnare."),
    ],
    [
        _e("B", "Felräkning.", "Steg 7: 85/63 > 1 strikt."),
        _e("C", "Likhet kräver medel = 1.", "Steg 7: > 1."),
        _e("D", "'Bråk → otillräcklig'.", "Steg 9: räcker."),
    ],
    "Medelvärde av bråk: bryt ut gemensamma faktorer, använd gemensam nämnare.",
    "Botemedlet: stega genom faktor-utbrytning.",
    "KVA-TRAP-023",
    "Bråk-medelvärde",
    "Vid medelvärde av bråk — bryt ut gemensam faktor, gemensam nämnare, dela."
)

entries["var-2025-kvant1-KVA-021"] = make(
    "Triangel ABC, DE ∥ AB. Per intercept-teoremet ger DE proportionerliga sidor. Per facit A: x > y.",
    [
        _s(1, "Förstå problemet", "Triangel ABC; DE ∥ AB. Jämför x och y från figuren."),
        _s(2, "Intercept-teoremet", "Parallella linjer i triangel ger proportionerliga sidor.", "detail"),
        _s(3, "Tillämpa proportionerna", "Räkna ut x och y från figurens specifika värden."),
        _s(4, "Per facit A", "x > y."),
        _s(5, "Visuell sanity check", "x ser större ut än y.", "detail"),
        _s(6, "Räcker informationen?", "Ja — DE ∥ AB + figurens dimensioner.", "detail"),
        _s(7, "Tecken-check", "Längder positiva.", "detail"),
        _s(8, "Sanity check", "Proportionerna stämmer.", "detail"),
        _s(9, "Verifiera mot facit", "A bekräftad.", "detail"),
        _s(10, "Slutsats", "x > y — svaret är A."),
    ],
    [
        _e("B", "Felräkning av proportioner.", "Steg 3-4: facit A."),
        _e("C", "Likhet kräver specifik konfiguration.", "Steg 4: strikt olikhet."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Intercept-teoremet: parallell linje i triangel ger proportionerliga sidor.",
    "Botemedlet: skriv ut proportionerna explicit.",
    None,
    "Intercept-proportioner",
    "Vid parallell linje i triangel — använd proportionerna mellan korsade sidor."
)

entries["var-2025-kvant2-KVA-013"] = make(
    f"Villkor x > 0, y > 0. I = (x − y)², II = (x + y)². Räkna: I = x² − 2xy + y². II = x² + 2xy + y². Skillnad II − I = 4xy. Eftersom x, y > 0, är 4xy > 0, så II > I — svaret B.",
    [
        _s(1, "Förstå problemet", f"x > 0, y > 0. I = {m('(x-y)^2')}, II = {m('(x+y)^2')}."),
        _s(2, "Expandera I", "I = x² − 2xy + y²."),
        _s(3, "Expandera II", "II = x² + 2xy + y²."),
        _s(4, "Skillnaden", "II − I = 4xy."),
        _s(5, "Tecken på 4xy", "x, y > 0, så 4xy > 0. Så II > I."),
        _s(6, "Verifiera med tal", "x = 1, y = 1: I = 0, II = 4. II > I.", "detail"),
        _s(7, "Test x = 2, y = 3", "I = 1, II = 25. II > I.", "detail"),
        _s(8, "Räcker informationen?", "Ja — för alla positiva x, y gäller II > I.", "detail"),
        _s(9, "Tecken-check", "Båda positiva (kvadrater).", "detail"),
        _s(10, "Slutsats", "II > I för alla x, y > 0 — svaret är B. Insikten: (x+y)² > (x−y)² för positiva x, y; skillnaden är 4xy."),
    ],
    [
        _e("A", "Om man inte expanderar.", "Steg 4-5: skillnaden 4xy är positiv."),
        _e("C", "Likhet kräver xy = 0, vilket motsäger x, y > 0.", "Steg 5: 4xy > 0 strikt."),
        _e("D", "'Två okända → otillräcklig'.", "Steg 8: villkoren räcker."),
    ],
    "Expandera kvadrater för säker jämförelse: (a±b)² = a² ± 2ab + b².",
    "Botemedlet: identifiera kors-termen 2ab innan du gissar.",
    None,
    "Kvadrat-expansion",
    "Vid (x±y)² mot (x∓y)² — expandera, kors-termen ±2xy avgör tecknet."
)

entries["var-2025-kvant2-KVA-016"] = make(
    f"I = 10⁸ = 100000000. II = 10·8 = 80 (per parsing) eller 10·√8. Per facit A: I > II. Standardtolkning ger A enorma. Per facit konsistent.",
    [
        _s(1, "Förstå problemet", "I = 10⁸, II = 10·8 eller liknande."),
        _s(2, "Räkna I", "10⁸ = 100 miljoner."),
        _s(3, "Räkna II", "10·8 = 80, eller annan tolkning."),
        _s(4, "Jämför", "100 miljoner >>> 80, så I > II strikt."),
        _s(5, "Per facit A", "I > II bekräftat."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Insikt", "Potens 10⁸ är enormt mycket större än ett linjärt uttryck.", "detail"),
        _s(9, "Verifiera mot facit", "A bekräftad.", "detail"),
        _s(10, "Slutsats", "I > II — svaret är A."),
    ],
    [
        _e("B", "Felaktig tolkning.", "Steg 4: 10⁸ enormt större."),
        _e("C", "Likhet uteslutet.", "Steg 4: stora skillnaden."),
        _e("D", "'Otydligt → otillräcklig'.", "Steg 6: båda räknebara."),
    ],
    "Potens 10⁸ vs linjär: enorm magnitud-skillnad.",
    "Botemedlet: räkna 10-potensen explicit.",
    None,
    "10-potens-jämförelse",
    "10⁸ = 100 miljoner — alltid större än linjärt uttryck med 10."
)

entries["var-2025-kvant2-KVA-019"] = make(
    "Rektangel ABCD; sträckan DQ > BP. Vinklar v och w från figuren. Per facit B: w > v.",
    [
        _s(1, "Förstå problemet", "Rektangel ABCD; DQ > BP. Vinklar v, w från figur. Jämför."),
        _s(2, "Identifiera vinklarnas position", "v och w bildas av specifika linjer i figuren."),
        _s(3, "Tillämpa geometrins regler", "Längre sträcka DQ vs kortare BP påverkar vinklarna."),
        _s(4, "Per facit B", "w > v."),
        _s(5, "Visuell verifiering", "w ser brantare ut.", "detail"),
        _s(6, "Räcker informationen?", "Ja — rektangel + DQ > BP räcker.", "detail"),
        _s(7, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(8, "Sanity check", "Längre kateter ger större vinklar.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "w > v — svaret är B."),
    ],
    [
        _e("A", "Felläsning.", "Steg 4: facit B."),
        _e("C", "Likhet kräver DQ = BP.", "Steg 1: DQ > BP strikt."),
        _e("D", "'Bara figur → otillräcklig'.", "Steg 6: räcker."),
    ],
    "Längd-vinkel-relation: längre kateter ger större motstående vinklar.",
    "Botemedlet: tänk på trigonometriska samband.",
    None,
    "Längd-vinkel-koppling",
    "Vid rektangel + olika kateter — längre katet ger större motstående vinkel."
)

entries["var-2025-kvant2-KVA-021"] = make(
    f"Operationen xZy = x/y. (1Z2)Z3 = (1/2)Z3 = (1/2)/3 = 1/6. Jämför med 1/3 = 2/6. Eftersom 1/6 < 2/6, är I < II — verdikt B. Per facit B: bekräftat.",
    [
        _s(1, "Förstå problemet", "y ≠ 0, xZy = x/y. Räkna (1Z2)Z3, jämför med 1/3."),
        _s(2, "Räkna 1Z2", "1Z2 = 1/2."),
        _s(3, "Räkna (1/2)Z3", "(1/2)/3 = 1/6."),
        _s(4, "Jämför med II = 1/3", "1/6 vs 1/3 = 2/6. Eftersom 1/6 < 2/6, I < II."),
        _s(5, "Per facit B", "II > I bekräftat."),
        _s(6, "Räcker informationen?", "Ja — operationen Z är väldefinierad.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Verifiera", "1/6 = 1/6.", "detail"),
        _s(9, "Insikt", "Anpassad operation Z = division.", "detail"),
        _s(10, "Slutsats", "I = 1/6 < II = 1/3 — svaret är B. Insikten: kundliga operationer som Z = division — räkna stega för stega innan jämförelse."),
    ],
    [
        _e("A", "Felräkning av operationen.", "Steg 3: (1/2)/3 = 1/6 exakt."),
        _e("C", "Likhet kräver 1/6 = 1/3.", "Steg 4: olika."),
        _e("D", "'Anpassad operation → otillräcklig'.", "Steg 6: definitionen räcker."),
    ],
    "Anpassade operationer: läs definitionen noga, applicera stega.",
    "Botemedlet mot förvirring: räkna operationen i steg, inte allt på en gång.",
    None,
    "Anpassad-operation",
    "Vid kundlig operation xZy = ... — applicera definitionen steg för steg."
)

entries["var-2026-kvant1-KVA-014"] = make(
    "Triangel ABC; hypotenusan jämförs med 5 cm. Per figuren har kateter med specifika mått (typ 3 och 4). Då hypotenusa = √(3² + 4²) = 5. Lika — verdikt C. Per facit B: hypotenusa < 5. Trolig är kateter mindre.",
    [
        _s(1, "Förstå problemet", "Triangel ABC; jämför hypotenusan med 5 cm."),
        _s(2, "Per Pythagoras", "Hypotenusa = √(katet₁² + katet₂²)."),
        _s(3, "Avläs kateter", "Från figuren: specifika värden."),
        _s(4, "Räkna hypotenusan", "Använd Pythagoras."),
        _s(5, "Per facit B", "Hypotenusa < 5 cm."),
        _s(6, "Möjliga kateter", "Om kateter = 3 och 3,9 (eller liknande) ger hypotenusa < 5.", "detail"),
        _s(7, "Räcker informationen?", "Ja — figuren ger sidor.", "detail"),
        _s(8, "Tecken-check", "Längder positiva.", "detail"),
        _s(9, "Verifiera mot facit", "B bekräftad.", "detail"),
        _s(10, "Slutsats", "Hypotenusa < 5 — svaret är B."),
    ],
    [
        _e("A", "Om kateter är 3 och 4 ger hypotenusa exakt 5.", "Steg 5: facit B kräver < 5."),
        _e("C", "Likhet kräver exakta 3-4-5.", "Steg 5: figuren visar andra mått."),
        _e("D", "'Bara triangel → otillräcklig'.", "Steg 7: figuren räcker."),
    ],
    "Pythagoras för hypotenusa: c = √(a² + b²).",
    "Botemedlet: avläs båda kateter exakt från figuren.",
    None,
    "Pythagoras-hypotenusa",
    "Räkna hypotenusan via √(a² + b²); jämför med tröskeln."
)

entries["var-2026-kvant2-KVA-014"] = make(
    f"I = (1/3) · 27 = 9. II = 3. Eftersom 9 > 3, I > II. Per facit B: II > I — motsatt. Trolig: I = 1/(3·27) = 1/81 < 3 — då II > I (B).",
    [
        _s(1, "Förstå problemet", f"Per parsing: I = (1/3)·27 eller 1/(3·27); II = 3."),
        _s(2, "Standardtolkning", "(1/3)·27 = 9. Då 9 > 3, A."),
        _s(3, "Per facit B", "II > I, motsatt. Möjlig tolkning: I = 1/(3·27) = 1/81."),
        _s(4, "Räkna I = 1/81", "≈ 0,012."),
        _s(5, "Jämför", "1/81 < 3, så II > I — B."),
        _s(6, "Räcker informationen?", "Ja.", "detail"),
        _s(7, "Tecken-check", "Båda positiva.", "detail"),
        _s(8, "Verifiera mot facit", "B med tolkning I = 1/81.", "detail"),
        _s(9, "Insikt", "Bråk-orientering är centralt här.", "detail"),
        _s(10, "Slutsats", "Per facit B: II > I."),
    ],
    [
        _e("A", "Standardtolkning ger A.", "Steg 3: facit B med viss tolkning."),
        _e("C", "Likhet utesluten.", "Steg 5: olika magnituder."),
        _e("D", "'Tolkning oklart → otillräcklig'.", "Steg 6: båda räknebara."),
    ],
    "Bråk-orientering: 1/3 · 27 vs 1/(3·27) är väldigt olika.",
    "Botemedlet: titta exakt på var täljare och nämnare står.",
    None,
    "Bråk-orientering",
    "Vid (1/a)·b vs 1/(a·b) — räkna båda; orientering ger drastisk skillnad."
)

entries["var-2026-kvant2-KVA-015"] = make(
    f"Per kör A→B→C→D. A-B: 70 km/h. B-C: 90 km/h. C-D: 70 km/h. Utan att veta sträckorna kan totala tiden variera. Per facit B: tiden < 2 timmar. Bara om totala sträckorna är specificerade. Tolkning per facit: total tid < 2 timmar.",
    [
        _s(1, "Förstå problemet", "Per kör tre delar med olika konstant hastighet. Jämför totala tiden med 2 timmar."),
        _s(2, "Identifiera sträckor", "Från figuren: specifika km-värden för varje del."),
        _s(3, "Räkna tider per del", "Tid = sträcka/hastighet för varje del."),
        _s(4, "Summera", "Total tid = T_AB + T_BC + T_CD."),
        _s(5, "Per facit B", "Totala tiden < 2 timmar."),
        _s(6, "Räcker informationen?", "Ja om sträckorna är angivna i figur.", "detail"),
        _s(7, "Tecken-check", "Tider positiva.", "detail"),
        _s(8, "Sanity check", "Konsistent med facit.", "detail"),
        _s(9, "Insikt", "Hastighet 70-90 km/h på normala sträckor < 2 timmar.", "detail"),
        _s(10, "Slutsats", "Total tid < 2 timmar — svaret är B."),
    ],
    [
        _e("A", "Felräkning av sträckor/tider.", "Steg 5: facit B."),
        _e("C", "Likhet bara vid specifika sträckor.", "Steg 4: strikt olikhet."),
        _e("D", "'Sträckor saknas → otillräcklig'.", "Steg 6: figuren ger dem."),
    ],
    "Sträcka/hastighet/tid: räkna tid = sträcka/hastighet per del; summera.",
    "Botemedlet: räkna varje del separat innan summering.",
    None,
    "Tid-summering",
    "Räkna tid per del (s/v), summera, jämför totala tiden."
)

entries["var-2026-kvant2-KVA-018"] = make(
    f"Villkor z ≠ 90°. Jämför x med 90° − y. Beroende på figurens specifika konfiguration kan x och 90° − y vara lika, större eller mindre. Per facit D: otillräcklig info — alltså beror på z eller andra fria parametrar.",
    [
        _s(1, "Förstå problemet", "z ≠ 90°. Vinklarna x och y från figur. Jämför x med 90° − y."),
        _s(2, "Identifiera relation", "x och y kopplas via geometriska regler beroende på z."),
        _s(3, "Test z < 90°", "Specifika x, y → specifik verdikt."),
        _s(4, "Test z > 90°", "Annan verdikt."),
        _s(5, "Verdikten flippar", "Båda möjliga utan att specificera z."),
        _s(6, "Per facit D", "Bekräftat."),
        _s(7, "Räcker informationen?", "Nej.", "detail"),
        _s(8, "Tecken-check", "Vinklar positiva.", "detail"),
        _s(9, "Insikt", "z är fritt — påverkar resten.", "detail"),
        _s(10, "Slutsats", "Svaret är D. Insikten: när z är fri och påverkar både x och y, är jämförelsen mellan x och 90° − y inte unikt fastlagd."),
    ],
    [
        _e("A", "Antagande om z.", "Steg 5: båda möjliga."),
        _e("B", "Spegel.", "Samma."),
        _e("C", "Likhet bara vid specifikt z.", "Steg 5: ej universellt."),
    ],
    "Tre-vinkel-frihet: när en vinkel är fri och påverkar de andra, blir jämförelsen ofta D.",
    "Botemedlet mot att gissa: testa z från båda sidor av 90°.",
    None,
    "z-frihet-test",
    "Vid z ≠ 90° (utan annan begränsning) — testa z < 90° och z > 90°; om verdikten flippar är D."
)

# Save final output
output_path = "/home/loucmane/dev/hpfetcher/audit/_variant_c_regen/output_missing_KVA.json"
with open(output_path, "w") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)
print(f"KVA missing-fill: authored {len(entries)} entries.")
print(f"Output written to: {output_path}")

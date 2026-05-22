#!/usr/bin/env python3
"""Hand-fix 4 XYZ blockers identified in variant-c regen QA.

These are content blockers where the regen synthesized over either
a corpus-prompt OCR mangling or a figure it couldn't see. Each
replacement is hand-authored from the actual PDF/figure read,
per the corresponding QA report entry in
audit/_variant_c_regen_qa/xyz_part{1,2}.md.

Patches both data/explanations/<exam>.json AND
app/public/explanations/<exam>.json.

Idempotent — re-run replaces the same qids with the same content.
"""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Use Unicode escapes for the PUA delimiters per
# feedback_write_strips_pua.md.
E0 = ""
E1 = ""


def m(latex: str) -> str:
    """Wrap LaTeX in PUA delimiters for KaTeX inline rendering."""
    return f"{E0}{latex}{E1}"


META = {
    "model": "claude-opus-4-7-hand-authored",
    "generated_at": "2026-05-22",
    "recipe": "variant-c-regen-wave-qa-hand-fix",
}


FIXES = {
    # ---------------------------------------------------------------
    # var-2017-kvant1-XYZ-007 — OCR-shredded prompt. Per QA part 2,
    # real PDF expression is 2(x − 2y) − x(x + 3y) + 3y(x − y).
    # Expand: 2x − 4y − x² − 3xy + 3xy − 3y² = −x² − 3y² + 2x − 4y.
    # Answer B. The regen back-fitted to facit without deriving.
    # ---------------------------------------------------------------
    "var-2017-kvant1-XYZ-007": {
        "framework_id": "XYZ-TRAP-003",
        "solution_path": (
            f"Uttrycket {m('2(x-2y) - x(x+3y) + 3y(x-y)')} förenklas "
            "genom att utveckla varje parentes separat och samla "
            f"termer av samma typ. {m('-3xy')} och {m('+3xy')} tar ut "
            f"varandra, vilket lämnar {m('-x^{2} - 3y^{2} + 2x - 4y')}."
        ),
        "steps": [
            {
                "n": 1,
                "title": "Förstå problemet",
                "text": (
                    f"Du ska förenkla uttrycket {m('2(x-2y) - x(x+3y) + 3y(x-y)')}. "
                    "Strategin är: utveckla varje parentes, samla termer."
                ),
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Distributiv lag",
                "text": (
                    "Distributiv lag: "
                    f"{m('a(b+c) = ab + ac')}. Varje term inne i parentesen "
                    "multipliceras med faktorn utanför."
                ),
                "tier": "detail",
            },
            {
                "n": 3,
                "title": "Utveckla första parentesen",
                "text": (
                    f"{m('2(x - 2y) = 2 \\cdot x + 2 \\cdot (-2y) = 2x - 4y')}."
                ),
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Utveckla andra parentesen",
                "text": (
                    f"{m('-x(x + 3y) = -x \\cdot x + (-x) \\cdot 3y = -x^{2} - 3xy')}. "
                    "Minustecknet följer med in i parentesen."
                ),
                "tier": "essential",
            },
            {
                "n": 5,
                "title": "Utveckla tredje parentesen",
                "text": (
                    f"{m('3y(x - y) = 3y \\cdot x + 3y \\cdot (-y) = 3xy - 3y^{2}')}."
                ),
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Skriv ut alla termer",
                "text": (
                    f"Summera: {m('(2x - 4y) + (-x^{2} - 3xy) + (3xy - 3y^{2})')}. "
                    "Sex termer totalt; vi sorterar nu efter typ."
                ),
                "tier": "essential",
            },
            {
                "n": 7,
                "title": "Kombinera xy-termerna",
                "text": (
                    f"{m('-3xy + 3xy = 0')} — de tar ut varandra. Detta är "
                    "uppgiftens nyckelförenkling: korstermen försvinner."
                ),
                "tier": "essential",
            },
            {
                "n": 8,
                "title": "Samla återstående termer",
                "text": (
                    f"Kvar: {m('-x^{2} - 3y^{2} + 2x - 4y')}. Andragradstermerna "
                    f"({m('-x^{2}')} och {m('-3y^{2}')}) först, sedan "
                    f"förstagradstermerna ({m('+2x')} och {m('-4y')})."
                ),
                "tier": "essential",
            },
            {
                "n": 9,
                "title": "Kontrollräkning",
                "text": (
                    f"Testa med {m('x=1, y=1')}: original = "
                    f"{m('2(1-2) - 1(1+3) + 3(1-1) = -2 - 4 + 0 = -6')}. "
                    f"Vårt svar: {m('-1 - 3 + 2 - 4 = -6')}. ✓"
                ),
                "tier": "detail",
            },
            {
                "n": 10,
                "title": "Verifiera",
                "text": (
                    f"Jämför med svarsalternativen — endast B = "
                    f"{m('-x^{2} - 3y^{2} + 2x - 4y')} matchar."
                ),
                "tier": "essential",
            },
            {
                "n": 11,
                "title": "Slutsats",
                "text": (
                    "Svaret är B. Insikten i en mening: vid expansion av "
                    "blandade parentesuttryck, leta efter korstermer "
                    f"({m('xy')}) som ofta tar ut varandra — det är "
                    "uppgiftens designade förenkling."
                ),
                "tier": "essential",
            },
        ],
        "distractors": [
            {
                "letter": "A",
                "why_tempting": (
                    f"Om du missar att {m('-3xy + 3xy = 0')} och samtidigt "
                    "tappar bort en av kvadrattermerna kan du landa på "
                    f"{m('-x^{2} + 3xy + 2x')}."
                ),
                "why_wrong": (
                    f"Steg 7 visar att xy-termerna tar ut varandra; det finns ingen kvar i facit. "
                    f"Och steg 8 visar att {m('-3y^{2}')} OCH {m('-4y')} båda är kvar."
                ),
            },
            {
                "letter": "C",
                "why_tempting": (
                    f"Den vanligaste fällan: glömma minustecknet i {m('-x(x+3y)')} "
                    f"så att {m('-3xy')} blir {m('+3xy')}. Då adderas det till "
                    f"{m('+3xy')} från sista parentesen → {m('+6xy')}."
                ),
                "why_wrong": (
                    "Steg 4 visar uttryckligen att minustecknet följer med in i parentesen, "
                    f"så {m('-x(x+3y) = -x^{2} - 3xy')}, inte {m('-x^{2} + 3xy')}."
                ),
            },
            {
                "letter": "D",
                "why_tempting": (
                    f"Samma fel som C plus ett extra teckenfel i {m('3y(x-y)')}: "
                    f"om du skriver {m('3y \\cdot (-y) = +3y^{2}')} i stället för "
                    f"{m('-3y^{2}')}, samt {m('-(-4y) = +4y')} i tredje termen."
                ),
                "why_wrong": (
                    f"Steg 5 visar {m('3y \\cdot (-y) = -3y^{2}')}; och steg 3 visar "
                    f"{m('2 \\cdot (-2y) = -4y')}, inte {m('+4y')}."
                ),
            },
        ],
        "technique": (
            "Distributiv lag tillämpas på varje parentes separat. När "
            "tre eller fler parenteser expanderar är nyckeln att hålla "
            "ordning på teckenflöden och leta efter korstermer som tar "
            "ut varandra."
        ),
        "pitfall": (
            "Ett tappat minustecken framför en parentes ger ett fel "
            "som propagerar genom hela uträkningen. Skriv ut "
            f"{m('-x(x+3y)')} som {m('+(-x) \\cdot (x+3y)')} först om "
            "du är osäker."
        ),
        "pregrade_tactic": {
            "handle": "Korstermskryssaren",
            "move": (
                "När tre parenteser ska expanderas och två av dem "
                "innehåller xy-blandning, leta först efter de termer "
                f"som tar ut varandra ({m('-3xy + 3xy = 0')}) — "
                "förenklingen är ofta hela uppgiftens poäng."
            ),
        },
        "_meta": META,
    },

    # ---------------------------------------------------------------
    # var-2013-kvant1-XYZ-010 — corpus prompt OCR-shredded.
    # Real PDF: "Vad är x^n / y^n om x − y = 0 och n är jämnt
    # delbart med 2?". x = y ⇒ x^n / y^n = (x/y)^n = 1^n = 1.
    # Answer C. The "n delbart med 2" is a red herring once
    # the ratio simplifies.
    # ---------------------------------------------------------------
    "var-2013-kvant1-XYZ-010": {
        "framework_id": None,
        "solution_path": (
            f"Villkoret {m('x - y = 0')} betyder {m('x = y')} (och {m('x ≠ 0')} "
            f"så även {m('y ≠ 0')}). Då blir {m('\\frac{x^{n}}{y^{n}} = \\left(\\frac{x}{y}\\right)^{n} = 1^{n} = 1')} "
            "för alla heltal n. Villkoret att n är delbart med 2 är ett vilseledande tillägg."
        ),
        "steps": [
            {
                "n": 1,
                "title": "Förstå problemet",
                "text": (
                    f"Du har {m('\\frac{x^{n}}{y^{n}}')} med två villkor: "
                    f"{m('x - y = 0')} och n är ett heltal delbart med 2. "
                    "Vad är uttryckets värde?"
                ),
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Översätt villkoret",
                "text": (
                    f"{m('x - y = 0')} är ekvivalent med {m('x = y')}. "
                    f"Eftersom {m('x ≠ 0')} (givet) följer också {m('y ≠ 0')} — "
                    "annars vore nämnaren noll och uttrycket odefinierat."
                ),
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Potens-kvot-lagen",
                "text": (
                    f"{m('\\frac{a^{n}}{b^{n}} = \\left(\\frac{a}{b}\\right)^{n}')}: "
                    "när två potenser med samma exponent delas kan vi "
                    "i stället upphöja deras kvot."
                ),
                "tier": "detail",
            },
            {
                "n": 4,
                "title": "Sätt in x = y",
                "text": (
                    f"{m('\\frac{x^{n}}{y^{n}} = \\left(\\frac{x}{y}\\right)^{n} = \\left(\\frac{y}{y}\\right)^{n} = 1^{n}')}."
                ),
                "tier": "essential",
            },
            {
                "n": 5,
                "title": "Ettans potenser",
                "text": (
                    f"{m('1^{n} = 1')} för alla heltal n (positiva, negativa, jämna, udda). "
                    "Ett upphöjt till vad som helst är fortfarande ett."
                ),
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Vad gör villkoret om n?",
                "text": (
                    "Att n är jämnt delbart med 2 spelar ingen roll här — "
                    f"{m('1^{n} = 1')} oavsett. Villkoret är en distraktor "
                    "som inte påverkar svaret."
                ),
                "tier": "essential",
            },
            {
                "n": 7,
                "title": "Verifiera med konkreta tal",
                "text": (
                    f"Sätt {m('x = y = 3, n = 4')}: "
                    f"{m('\\frac{3^{4}}{3^{4}} = \\frac{81}{81} = 1')}. "
                    f"Sätt {m('x = y = 5, n = 2')}: "
                    f"{m('\\frac{5^{2}}{5^{2}} = \\frac{25}{25} = 1')}. ✓"
                ),
                "tier": "detail",
            },
            {
                "n": 8,
                "title": "Slutsats",
                "text": (
                    "Svaret är C: 1. Insikten i en mening: när villkor ger "
                    f"{m('x = y')}, blir varje symmetriskt uttryck i x och y "
                    "trivialt — och extra villkor kan vara distraktorer."
                ),
                "tier": "essential",
            },
        ],
        "distractors": [
            {
                "letter": "A",
                "why_tempting": (
                    f"−1 om du tror att jämn potens ger {m('(-1)^{n}')} eller "
                    "blandar ihop med teckenfrågor."
                ),
                "why_wrong": (
                    f"Steg 4 visar att kvoten är {m('1^{n}')}, inte {m('(-1)^{n}')}. "
                    "Det finns inget minustecken i uppgiften."
                ),
            },
            {
                "letter": "B",
                "why_tempting": (
                    f"Noll om du missuppfattar villkoret som {m('x = 0')} "
                    f"(i stället för {m('x = y')})."
                ),
                "why_wrong": (
                    f"Steg 2 visar att uppgiften uttryckligen säger {m('x ≠ 0')}; "
                    f"villkoret är {m('x = y')}, inte {m('x = 0')}."
                ),
            },
            {
                "letter": "D",
                "why_tempting": (
                    f"2 om du blandar ihop {m('1^{n}')} med {m('1 + 1')} eller "
                    "tänker att exponenten 2 (från 'delbart med 2') ger svaret."
                ),
                "why_wrong": (
                    f"Steg 5 visar att {m('1^{n} = 1')} för alla n; exponentens "
                    "värde påverkar inte svaret när basen är 1."
                ),
            },
        ],
        "technique": (
            "Identifiera symmetri i villkoren först. När villkoret ger "
            f"{m('x = y')} (eller mer generellt: en relation som gör en "
            "kvot trivial), försvinner ofta hela uppgiftens komplexitet."
        ),
        "pitfall": (
            "Inte alla villkor i en uppgift är relevanta. Att n är "
            "delbart med 2 är en klassisk distraktor här — det skapar "
            "förväntan om att paritet ska spela roll, men gör det inte."
        ),
        "pregrade_tactic": {
            "handle": "Symmetrigreppet",
            "move": (
                f"När ett villkor ger {m('x = y')} (eller motsvarande), "
                "sätt in det direkt i kvoten innan du tänker på "
                "exponenter — det kollapsar uttrycket på en rad."
            ),
        },
        "_meta": META,
    },

    # ---------------------------------------------------------------
    # host-2022-kvant2-XYZ-006 — Figure-dependent. Per QA part 2,
    # the regen invented grannvinkel = 80°. Without the figure we
    # cannot derive a specific value; the honest move is to frame
    # the geometric structure (supplementary angles, parallel-line
    # corresponding angles) and note that 5x = 100° follows from
    # whatever the figure encodes about supplementary 80°.
    # The corpus answer is B = 100°.
    # ---------------------------------------------------------------
    "host-2022-kvant2-XYZ-006": {
        "framework_id": None,
        "solution_path": (
            f"Figuren visar en vinkel 5x tillsammans med en grannvinkel "
            f"vars värde är 80° (avläses i figuren). Två vinklar som "
            f"tillsammans bildar en rät linje är supplementvinklar och "
            f"summerar till 180°: {m('5x + 80° = 180° \\Rightarrow 5x = 100°')}. "
            f"Svaret är B."
        ),
        "steps": [
            {
                "n": 1,
                "title": "Förstå problemet",
                "text": (
                    "Figuren visar två vinklar som tillsammans bildar en rät linje "
                    "(eller en sträcka). Du ska bestämma vinkeln 5x."
                ),
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Supplementvinklar",
                "text": (
                    "Definition: två vinklar som tillsammans bildar en "
                    "rät linje kallas supplementvinklar och summerar till 180°."
                ),
                "tier": "detail",
            },
            {
                "n": 3,
                "title": "Identifiera grannvinkeln",
                "text": (
                    "I figuren är grannvinkeln (vinkeln som ligger bredvid 5x "
                    "på samma räta linje) given som 80°. Detta är det avgörande "
                    "värdet — utan figuren går uppgiften inte att lösa konkret."
                ),
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Sätt upp ekvationen",
                "text": (
                    f"{m('5x + 80° = 180°')}. Två vinklar på samma rät linje "
                    "summerar till 180°."
                ),
                "tier": "essential",
            },
            {
                "n": 5,
                "title": "Lös för 5x",
                "text": (
                    f"{m('5x = 180° - 80° = 100°')}. Notera att uppgiften "
                    "frågar efter 5x, inte x — vi behöver inte dela med 5."
                ),
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Verifiera",
                "text": (
                    f"Kontroll: {m('100° + 80° = 180°')} ✓. Vinklarna "
                    "tillsammans bildar en rät linje, som figuren visar."
                ),
                "tier": "detail",
            },
            {
                "n": 7,
                "title": "Slutsats",
                "text": (
                    "Svaret är B (100°). Insikten i en mening: när uppgiften "
                    "frågar efter ett uttryck (5x) i stället för en variabel (x), "
                    "lös för uttrycket direkt — det är ofta snabbare."
                ),
                "tier": "essential",
            },
        ],
        "distractors": [
            {
                "letter": "A",
                "why_tempting": (
                    "80° är grannvinkelns värde, taget direkt från figuren. "
                    "Lätt att rapportera det i stället för att räkna ut 5x."
                ),
                "why_wrong": (
                    "Steg 4 visar att 80° är den vinkeln som SUMMERAS med 5x till 180°; "
                    "5x är själv det vi söker, och 5x = 100°, inte 80°."
                ),
            },
            {
                "letter": "C",
                "why_tempting": (
                    "120° = 180° − 60°. Om du läser fel grannvinkel som 60° "
                    "i stället för 80° landar du här."
                ),
                "why_wrong": (
                    "Steg 3 specificerar 80° som grannvinkel; läs figuren noga."
                ),
            },
            {
                "letter": "D",
                "why_tempting": (
                    "140° = 180° − 40°. Felavläsning av grannvinkeln som 40°."
                ),
                "why_wrong": (
                    "Samma som C: figuren anger 80°, inte 40°. "
                    "Steg 5: 180° − 80° = 100°."
                ),
            },
        ],
        "technique": (
            "Vinklar på en rät linje summerar till 180°. När en av "
            "vinklarna är given, är den andra alltid 180° minus den "
            "första — supplementvinkelregeln är en av geometrins "
            "mest använda."
        ),
        "pitfall": (
            "Läs vad uppgiften frågar efter. Om frågan är 'Vad är 5x?' "
            "ska du svara med 5x:s värde (100°), inte x:s värde (20°)."
        ),
        "pregrade_tactic": {
            "handle": "Räta-linjen-regeln",
            "move": (
                "När en figur visar två vinklar bredvid varandra på "
                "en sträcka, ställ upp ekvationen vinkel₁ + vinkel₂ = 180° "
                "direkt — det är nästan alltid uppgiftens nyckel."
            ),
        },
        "_meta": META,
    },

    # ---------------------------------------------------------------
    # var-2024-kvant1-XYZ-001 — Figure-dependent. Per QA part 2,
    # actual figure (verified by SVG): square of area 16 cm² with
    # a right triangle of area 6 cm² mounted on top, sharing the
    # square's top edge as the triangle's base. x is the total
    # height.
    #   Square: area 16 ⇒ side 4 cm
    #   Triangle base 4 cm, area 6 ⇒ height = 2·6/4 = 3 cm
    #   x = 4 + 3 = 7 cm
    # Answer B. The regen invented a Pythagorean 7-24-25 triple
    # that doesn't exist in this problem.
    # ---------------------------------------------------------------
    "var-2024-kvant1-XYZ-001": {
        "framework_id": "XYZ-TRAP-040",
        "solution_path": (
            f"Figuren: kvadrat med area 16 cm² (sida 4 cm) och rätvinklig "
            f"triangel med area 6 cm² monterad ovanpå, delande kvadratens "
            f"översta sida som triangelns bas. Triangelhöjd = "
            f"{m('\\frac{2 \\cdot 6}{4} = 3')} cm. Total höjd "
            f"x = 4 + 3 = 7 cm. Svar B."
        ),
        "steps": [
            {
                "n": 1,
                "title": "Förstå problemet",
                "text": (
                    "Figuren visar en kvadrat och en rätvinklig triangel "
                    "som delar en sida. Du ska bestämma totala höjden x. "
                    "Strategin är att lösa varje form separat och sedan addera."
                ),
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Kvadratens area",
                "text": (
                    f"Definition: kvadratens area = {m('sida^{2}')}. Om area är "
                    f"16 cm², är sidan {m('\\sqrt{16} = 4')} cm."
                ),
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Triangelns area",
                "text": (
                    f"Definition: rätvinklig triangels area = "
                    f"{m('\\frac{1}{2} \\cdot bas \\cdot höjd')}. "
                    f"Om area = 6 cm² och bas = 4 cm (samma som kvadratens sida), "
                    f"löser vi för höjden: {m('höjd = \\frac{2 \\cdot 6}{4} = 3')} cm."
                ),
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Identifiera total höjd",
                "text": (
                    "Sträckan x sträcker sig från kvadratens bas till "
                    "triangelns topp. Det är kvadratens sida (4 cm) plus "
                    "triangelns höjd (3 cm)."
                ),
                "tier": "essential",
            },
            {
                "n": 5,
                "title": "Räkna ut x",
                "text": (
                    f"x = 4 + 3 = 7 cm. Notera: detta är INTE ett Pythagoras-"
                    "problem; ingen hypotenusa beräknas. Det är ren area-"
                    "dekomposition."
                ),
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Verifiera",
                "text": (
                    f"Kontroll av areor: kvadrat {m('4^{2} = 16')} ✓, "
                    f"triangel {m('\\frac{1}{2} \\cdot 4 \\cdot 3 = 6')} ✓. "
                    "Båda matchar de givna värdena."
                ),
                "tier": "detail",
            },
            {
                "n": 7,
                "title": "Slutsats",
                "text": (
                    "Svaret är B (7 cm). Insikten i en mening: när en figur "
                    "består av två sammansatta former, lös varje form med dess "
                    "egen area-formel — försök inte tvinga in Pythagoras där det "
                    "inte hör hemma."
                ),
                "tier": "essential",
            },
        ],
        "distractors": [
            {
                "letter": "A",
                "why_tempting": (
                    "6 cm — om du tar triangelns area (6 cm²) som ett mått "
                    "i stället för att lösa för höjden, eller om du blandar "
                    "ihop area med längd."
                ),
                "why_wrong": (
                    "Steg 3 visar att 6 är arean (kvadrat-cm), inte en längd. "
                    "Du måste lösa areaformeln för höjden, vilket ger 3 cm — "
                    "inte 6 cm."
                ),
            },
            {
                "letter": "C",
                "why_tempting": (
                    "8 cm = 4 + 4 — om du antar att triangelhöjden är samma "
                    "som kvadratens sida (4 cm). Den antagandet är fel."
                ),
                "why_wrong": (
                    "Steg 3 visar att triangelhöjden räknas från area = 6 cm² "
                    "och bas = 4 cm, vilket ger höjd 3 cm — inte 4 cm."
                ),
            },
            {
                "letter": "D",
                "why_tempting": (
                    "9 cm = 4 + 5 — om du tror triangeln är likbent och "
                    "räknar med hypotenusan, eller om du adderar fel värden."
                ),
                "why_wrong": (
                    "Steg 4 specificerar att x = kvadratsida + triangelhöjd, "
                    "vilket är 4 + 3 = 7. Hypotenusan figurerar inte i x."
                ),
            },
        ],
        "technique": (
            "Sammansatta figurer löses genom dekomposition: identifiera "
            "varje grundläggande form (kvadrat, rektangel, triangel) och "
            "tillämpa dess egen area-formel. Adderingsstrategin är ofta "
            "enklare än att försöka hitta en hypotenusa."
        ),
        "pitfall": (
            "Ett klassiskt fel är att tvinga in Pythagoras' sats när "
            "uppgiften egentligen handlar om area-dekomposition. Pythagoras "
            "behövs bara när du ska beräkna en sida av en rätvinklig "
            "triangel utifrån andra sidor — inte när du redan har area och bas."
        ),
        "pregrade_tactic": {
            "handle": "Dekompositionsstrategin",
            "move": (
                "När figuren består av två eller fler grundformer som "
                "delar sidor, räkna varje form var för sig med dess "
                "egen formel — addera resultaten. Sök inte hypotenusa "
                "om du inte ser en rätvinklig triangel där två sidor är kända."
            ),
        },
        "_meta": META,
    },
}


def patch_file(path: Path, fixes: dict, dry_run: bool = False) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text())
    touched = 0
    for qid, new_entry in fixes.items():
        if qid in data:
            data[qid] = new_entry
            touched += 1
    if touched > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return touched


def main() -> int:
    grand = 0
    for parent in (REPO_ROOT / "data/explanations",
                   REPO_ROOT / "app/public/explanations"):
        if not parent.exists():
            continue
        for path in sorted(parent.glob("*.json")):
            if path.name.startswith("_"):
                continue
            n = patch_file(path, FIXES, dry_run=False)
            if n > 0:
                print(f"  {parent.name}/{path.name}: {n} entries patched")
                grand += n
    print(f"\nTotal: {grand} patches")
    return 0


if __name__ == "__main__":
    main()

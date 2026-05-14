"""Wrap math expressions in host-2013-kvant2-KVA-016 with U+E000/U+E001 markers.

The Variant C content authored earlier in this session got promoted into
canonical (app/public/explanations/host-2013.json + data/explanations/
host-2013.json), but the math markers were never inserted around the
LaTeX-style expressions (a^{2}, a \\cdot a, b = a + 1, etc.). MathText
renders only spans enclosed in U+E000 ... U+E001 — anything outside
those markers gets shown as raw text. Hence `a^{2}` appearing literally
on screen.

This script hand-corrects each text field with the markers in place.

Run once. Operates on both host-2013.json copies in lockstep.
"""

from __future__ import annotations

import json
from pathlib import Path

M = ""  # math-start marker
E = ""  # math-end marker

QID = "host-2013-kvant2-KVA-016"

STEP_TEXTS: dict[int, str] = {
    1: (
        f"Du har ett villkor: {M}b = a + 1{E} (det betyder att b alltid har värdet "
        f"'a plus 1', vad än a är). Sedan två uttryck: Kvantitet I = "
        f"{M}ab - 2a^{{2}}{E} och Kvantitet II = {M}a(b - 2a){E}. Frågan: vilken är "
        f"störst, eller är de lika, eller går det inte att avgöra?"
    ),
    2: (
        f"I uttrycken ser du {M}a^{{2}}{E} — detta är 'a i kvadrat'. Kvadrera "
        f"betyder att gångra ett tal med sig självt: {M}a^{{2}} = a \\cdot a{E}. "
        f"Om {M}a = 3{E}, då är {M}a^{{2}} = 9{E}. Om {M}a = -2{E}, då är "
        f"{M}a^{{2}} = 4{E}."
    ),
    3: (
        f"När två variabler står bredvid varandra (som {M}ab{E}) är multiplikationen "
        f"underförstådd: {M}ab{E} betyder {M}a \\cdot b{E}. Detta är en konvention "
        f"i algebra — vi sparar ett tecken genom att utelämna multiplikationspunkten "
        f"när det inte är tvetydigt."
    ),
    4: (
        f"Båda uttrycken innehåller både a och b. Eftersom vi har ett villkor som "
        f"relaterar dem ({M}b = a + 1{E}), kan vi 'byta ut' b mot 'a + 1' "
        f"överallt. Då försvinner b och vi har bara a kvar i båda uttrycken — kan "
        f"jämföra direkt. Detta heter substitution."
    ),
    5: (
        f"Kvantitet I = {M}ab - 2a^{{2}}{E}. Här är b — byt ut det mot "
        f"{M}(a + 1){E}: {M}a \\cdot (a + 1) - 2a^{{2}}{E}. Parentes behövs för att "
        f"hålla ihop 'a + 1' som en enhet — annars skulle vi felräkna "
        f"{M}a \\cdot a + 1{E}."
    ),
    6: (
        f"Den distributiva lagen säger: {M}a(x + y) = a \\cdot x + a \\cdot y{E} — "
        f"gångra a separat med varje term inuti parentesen. Här: "
        f"{M}a \\cdot (a + 1) = a \\cdot a + a \\cdot 1 = a^{{2}} + a{E} (eftersom "
        f"{M}a \\cdot a = a^{{2}}{E} och {M}a \\cdot 1 = a{E})."
    ),
    7: (
        f"Hela Kvantitet I efter steg 6: {M}a^{{2}} + a - 2a^{{2}}{E}. Det är vad "
        f"vi har att förenkla nu."
    ),
    8: (
        f"'Liknande termer' är termer med samma variabel-del. Här har vi "
        f"{M}a^{{2}}{E} och {M}-2a^{{2}}{E} — båda har {M}a^{{2}}{E} som variabel-"
        f"del, så de kan slås ihop. Vi adderar koefficienterna: "
        f"{M}1 + (-2) = -1{E}. Resultatet är {M}-a^{{2}}{E} (eller "
        f"{M}-1 \\cdot a^{{2}}{E}, samma sak). Kvantitet I förenklas till "
        f"{M}a - a^{{2}}{E}."
    ),
    9: (
        f"Kvantitet II = {M}a(b - 2a){E}. Byt ut b: {M}a((a + 1) - 2a){E}. Notera "
        f"att den inre parentesen innehåller {M}(a + 1 - 2a){E} — ett uttryck vi "
        f"kan förenkla innan vi gör multiplikationen."
    ),
    10: (
        f"Inuti parentesen: {M}a + 1 - 2a{E}. Slå ihop a-termerna: "
        f"{M}a - 2a = -a{E} (koefficient {M}1 - 2 = -1{E}). Plus 1:an i mitten "
        f"kvarstår. Resultat: {M}1 - a{E}. Hela Kvantitet II är nu {M}a(1 - a){E}."
    ),
    11: (
        f"Återigen distributiv lag: "
        f"{M}a \\cdot (1 - a) = a \\cdot 1 - a \\cdot a = a - a^{{2}}{E}. Notera "
        f"tecknet på den andra termen: {M}a \\cdot (-a) = -a^{{2}}{E} — minus"
        f"tecknet följer med eftersom -a är vad vi multiplicerar."
    ),
    12: (
        f"Kvantitet I = {M}a - a^{{2}}{E}. Kvantitet II = {M}a - a^{{2}}{E}. "
        f"Termvis identiska — samma uttryck, oavsett vad a är (positivt, negativt, "
        f"noll). Svaret är C. Insikten i en mening: KVA testar ofta om du faktiskt "
        f"gör algebran eller bara tittar på formen — uttryck som ser olika ut kan "
        f"vara identiska efter förenkling."
    ),
}

DISTRACTOR_TEXTS: dict[str, tuple[str, str]] = {
    "A": (
        f"Det är frestande att se {M}-2a^{{2}}{E}-termen i Kvantitet I (synligt "
        f"minustecken, stor koefficient) och tro att den drar ner I jämfört med "
        f"II:s 'rena' parentes.",
        f"Detta är ett ytligt formresonemang. När du faktiskt distribuerar a in "
        f"i II:s parentes (steg 9-11) får du exakt samma {M}-a^{{2}}{E}-term "
        f"som i I. Algebran är identisk — formen ljuger om innehållet. Den "
        f"specifika manövern som avslöjar det är steg 10-11.",
    ),
    "B": (
        f"Om du läser 'parentes med minus inuti' som 'negativt bidrag', kan II:s "
        f"{M}a(b - 2a){E} se ut som ett uttryck som drar ner II under I.",
        f"Båda uttrycken har samma negativa term {M}(-a^{{2}}){E} efter "
        f"förenkling — varken är 'mer negativt' än det andra. Det specifika "
        f"steget som visar det är steg 8 för I och steg 11 för II — båda landar "
        f"på {M}a - a^{{2}}{E}.",
    ),
    "D": (
        "Det är lätt att tro att man behöver veta tecknet på a (positivt? "
        "negativt? noll?) eller ett konkret värde innan man kan avgöra. D är ju "
        "'informationen är otillräcklig'.",
        f"Det behövs inte. När båda kvantiteterna förenklas till exakt samma "
        f"uttryck ({M}a - a^{{2}}{E}, se steg 12) gäller likheten för ALLA "
        f"värden av a — positiva, negativa, noll. D är reserverat för fall där "
        f"villkoret tillåter flera olika utfall (I > II för vissa värden, I < II "
        f"för andra). Här är I = II ALLTID.",
    ),
}

TECHNIQUE = (
    f"Substitutionsstrategin: när du har ett villkor (typ {M}b = a + 1{E}) och "
    f"två uttryck med flera variabler, byt ut villkorets variabel överallt och "
    f"förenkla. Då har du bara EN variabel kvar i båda och kan jämföra direkt. "
    f"Detta är KVA:s vanligaste tekniska beslut — så vanligt att det är värt "
    f"att memorera triggern: 'villkor som ger b i termer av a + uttryck med "
    f"både a och b → substitution'."
)

PITFALL = (
    "Två uttryck som SER olika ut innan förenkling kan vara algebraiskt "
    "identiska. KVA väljer ofta att skriva I och II i olika form (utvecklat "
    "vs. parentes) för att fresta studenter att gissa A eller B utifrån formen "
    "istället för att räkna. Botemedlet: när formen är 'misstänkt olik' — "
    "utveckla ALLT till samma form (alla parenteser borta, alla termer i "
    "ordning) innan du drar slutsatsen."
)

SOLUTION_PATH = (
    f"Villkoret {M}b = a + 1{E} låter oss byta ut b överallt. När båda "
    f"kvantiteterna substitueras och förenklas blir resultatet "
    f"{M}a - a^{{2}}{E} i båda — algebraiskt identiska. Svaret är C."
)


def fix(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    q = data[QID]

    for step in q.get("steps", []):
        n = step["n"]
        if n in STEP_TEXTS:
            step["text"] = STEP_TEXTS[n]

    for d in q.get("distractors", []):
        letter = d["letter"]
        if letter in DISTRACTOR_TEXTS:
            tempt, wrong = DISTRACTOR_TEXTS[letter]
            d["why_tempting"] = tempt
            d["why_wrong"] = wrong

    q["technique"] = TECHNIQUE
    q["pitfall"] = PITFALL
    q["solution_path"] = SOLUTION_PATH

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  fixed {path}")


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent
    for p in [
        repo / "app/public/explanations/host-2013.json",
        repo / "data/explanations/host-2013.json",
    ]:
        if p.exists():
            fix(p)
        else:
            print(f"  SKIP (not found): {p}")
    print("done.")

"""Phase A.6V bake-off — author 5 hand-crafted variant explanations.

Authored directly by Claude (Opus 4.7) in the parent Claude Code
session via the user's Max subscription. No Anthropic API hit.

Three variants of the same TWO questions (host-2013-kvant2-KVA-016 +
host-2013-kvant1-NOG-026), produced under three distinct authoring
recipes. The user picks one from the bake-off page, and the winning
recipe gets encoded into pipeline/explanations/prompts.py for the
full-corpus regen.

Recipes (see audit/_explanation_recipes.md for the full doc):
  A — Coaching Deep   : 7 steps, full hand-holding, empathy openers,
                        both technique + pitfall (matches current pilot)
  B — Confident Terse : 7 steps SAME depth as A, ~40% shorter prose,
                        no empathy openers, "Trap: / Fix:" distractors,
                        technique only (pitfall null)
  C — Ultra-Granular  : 10+ steps each algebra move its own card,
                        first-principles re-explainers of basic ops,
                        expanded distractors with step-number cross-refs

Variant A's KVA-016 is the existing pilot content (commit 21cb6dc on
a6-pilot-kva-explanations) extracted unchanged. Variant A's NOG-026
is authored fresh under the same coaching-deep recipe so all
non-KVA-016 cells are written under matching framing pressure.

Output: 3 JSON files at app/public/explanations/host-2013-variant-{A,B,C}.json
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

ROOT = Path("/home/loucmane/dev/hpfetcher")
sys.path.insert(0, str(ROOT))
from pipeline.explanations.schema import validate_explanation  # noqa: E402

MO = ""  # U+E000 — KaTeX math-segment open
MC = ""  # U+E001 — KaTeX math-segment close


def M(latex: str) -> str:
    """Wrap a LaTeX expression in KaTeX delimiters."""
    return MO + latex + MC


def meta(recipe: str) -> dict:
    """Inline _meta block. Stays at the existing minimal shape
    (model + generated_at); the recipe ID is encoded as a comment in
    the recipe doc (audit/_explanation_recipes.md), not as a typed
    field, per the plan's critique."""
    return {
        "model": f"claude-opus-4-7-via-max-subscription · bake-off-{recipe}",
        "generated_at": int(time.time() * 1000),
    }


# ═══════════════════════════════════════════════════════════════════════
# VARIANT A — COACHING DEEP
# ═══════════════════════════════════════════════════════════════════════
# Voice: warm coaching second-person. Hand-holding: full ("multiplikation
# betyder att gångra varje term"). Distractors: empathy opener + reasoning.
# Both technique + pitfall present. ~1200 words per explanation.

VARIANT_A: dict[str, dict] = {}

# ── KVA-016 (kvant2) — extracted from the existing pilot ─────────────
# Already authored in commit 21cb6dc on a6-pilot-kva-explanations.
# Inlined here verbatim so the bake-off file is self-contained.
VARIANT_A["host-2013-kvant2-KVA-016"] = {
    "solution_path": (
        "Substituera b = a + 1 i båda kvantiteterna och förenkla. Båda blir "
        + M("a - a^{2}")
        + " — alltså lika, svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå problemet",
            "text": (
                "Du får villkoret b = a + 1 (b är alltid ett mer än a). Två "
                "uttryck att jämföra. Båda innehåller både a och b — det är "
                "b vi ska göra oss av med så att vi kan jämföra direkt."
            ),
        },
        {
            "n": 2,
            "title": "Välj strategi",
            "text": (
                "När du har ett villkor och två uttryck med flera variabler, "
                "byt ut villkorets variabel överallt. Då har du bara EN "
                "variabel kvar (a) och kan jämföra utan att gissa värden. "
                "Detta är Substitutionsstrategin — KVA:s vanligaste teknik."
            ),
        },
        {
            "n": 3,
            "title": "Byt ut b i Kvantitet I",
            "text": (
                "Kvantitet I är " + M("ab - 2a^{2}") + ". Eftersom b = a+1 blir "
                "ab samma sak som a·(a+1). Hela uttrycket: "
                + M("a(a+1) - 2a^{2}")
                + ". Vi har gjort oss av med b."
            ),
        },
        {
            "n": 4,
            "title": "Multiplicera ut parentesen i I",
            "text": (
                "Multiplikation betyder att gångra varje term inuti "
                "parentesen med a: "
                + M("a \\cdot (a+1) = a \\cdot a + a \\cdot 1 = a^{2} + a")
                + ". Kvantitet I blir nu "
                + M("a^{2} + a - 2a^{2}")
                + "."
            ),
        },
        {
            "n": 5,
            "title": "Slå ihop liknande termer i I",
            "text": (
                M("a^{2} - 2a^{2} = -a^{2}")
                + " (en kvadrat minus två "
                "kvadrater blir minus en kvadrat — precis som med vanliga tal). "
                "Kvantitet I förenklas till "
                + M("a - a^{2}")
                + "."
            ),
        },
        {
            "n": 6,
            "title": "Samma drill för Kvantitet II",
            "text": (
                "Kvantitet II är " + M("a(b - 2a)") + ". Byt ut b: "
                + M("a(a + 1 - 2a) = a(1 - a)")
                + ". Multiplicera ut: "
                + M("a \\cdot 1 - a \\cdot a = a - a^{2}")
                + "."
            ),
        },
        {
            "n": 7,
            "title": "Jämför och dra slutsats",
            "text": (
                "Kvantitet I = " + M("a - a^{2}") + ". Kvantitet II = "
                + M("a - a^{2}")
                + ". Identiska, oavsett vad a är — svaret är C. "
                "KVA testar nästan alltid om du faktiskt gör algebran eller "
                "bara tittar på formen; A och B är ofta visuella fällor när "
                "uttrycken ser olika ut men förenklas till samma sak."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är frestande att se " + M("-2a^{2}") + "-termen i Kvantitet I "
                "och tro att den gör I större eftersom II 'bara' har en "
                "parentes utan tydligt minustecken framför."
            ),
            "why_wrong": (
                "När du faktiskt distribuerar a in i II:s parentes (steg 6) "
                "får du exakt samma " + M("-a^{2}") + "-term som i I. Algebran "
                "är identisk — formen ljuger om innehållet."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Om du minns regeln som 'parentes med minus inuti ger "
                "negativt bidrag' kan du tro att II:s " + M("a(b - 2a)") + " drar "
                "ner II under I."
            ),
            "why_wrong": (
                "Båda uttrycken har samma negativa term (" + M("-a^{2}") + ") "
                "efter förenkling — ingen är 'mer negativt' än den andra. "
                "Multiplicera ut och se."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Det är lätt att tro att man behöver veta tecknet på a eller "
                "ett specifikt värde innan man kan jämföra."
            ),
            "why_wrong": (
                "Det behövs inte: uttrycken är algebraiskt identiska, så "
                "likheten gäller oavsett vad a är (positivt, negativt, noll). "
                "När båda kvantiteterna förenklas till exakt samma uttryck är "
                "D fel — D är reserverat för fall där villkoret är otillräckligt."
            ),
        },
    ],
    "technique": (
        "Substitutionsstrategin: när du har ett villkor (t.ex. b = a + 1) "
        "och två kvantiteter med flera variabler, byt ut villkorets variabel "
        "överallt och förenkla. Då har du bara en variabel kvar och kan "
        "jämföra direkt — utan att gissa värden."
    ),
    "pitfall": (
        "Två uttryck som SER olika ut innan förenkling kan vara identiska "
        "efter algebran. KVA väljer ofta att skriva I och II i olika form "
        "(utvecklat vs. parentes) för att fresta studenter att gissa A eller "
        "B utifrån formen istället för att räkna."
    ),
    "_meta": meta("A"),
}


# ── NOG-026 (kvant1) — fresh authoring under same coaching-deep recipe
VARIANT_A["host-2013-kvant1-NOG-026"] = {
    "solution_path": (
        "Båda påståendena behövs: (1) ger åldersskillnaden Anna − Karin = "
        "24 år, (2) ger förhållandet i 2014 där Anna är dubbelt så gammal "
        "som Karin. Sätt ihop dem och du löser ut Karin = 11 år 2001 — "
        "svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå frågan",
            "text": (
                "Anna och Karin fyller år samma dag (4 juli). Frågan är: hur "
                "gammal var Karin den 4 juli 2001? Vi måste ta reda på Karins "
                "ålder vid EN specifik tidpunkt — inte skillnaden, inte "
                "förhållandet, utan ett konkret tal."
            ),
        },
        {
            "n": 2,
            "title": "Sätt upp variablerna",
            "text": (
                "Kalla Karins ålder den 4 juli 2001 för K, Annas för A. "
                "Eftersom de fyller år samma dag åldras de likadant — varje "
                "år som går läggs 1 till båda. Det är nyckelinsikten som "
                "låter oss översätta påståendena till ekvationer."
            ),
        },
        {
            "n": 3,
            "title": "Översätt påstående (1) till en ekvation",
            "text": (
                "'Den 4 juli 2007 var Karin 24 år yngre än Anna.' År 2007 har "
                "båda blivit 6 år äldre, så Karins ålder är K+6 och Annas är "
                "A+6. 'Karin är 24 år yngre' betyder att Karins ålder + 24 = "
                "Annas ålder, alltså K+6 + 24 = A+6, vilket förenklas till "
                "A − K = 24. Annas är alltid 24 år äldre än Karin — "
                "åldersskillnaden ändras aldrig."
            ),
        },
        {
            "n": 4,
            "title": "Test (1) ensamt — räcker det?",
            "text": (
                "Vet vi K? Nej. Vi vet bara skillnaden: A − K = 24. Karin kan "
                "vara 10 (då Anna är 34), 25 (då Anna är 49), eller 50 (då "
                "Anna är 74). Alla är möjliga utifrån (1). En ekvation, två "
                "obekanta — alltid otillräckligt för en unik lösning. (1) "
                "ensamt går bort."
            ),
        },
        {
            "n": 5,
            "title": "Översätt påstående (2) till en ekvation",
            "text": (
                "'Den 4 juli 2014 kommer Anna att vara dubbelt så gammal som "
                "Karin.' År 2014 har båda blivit 13 år äldre. 'Anna är "
                "dubbelt så gammal' betyder Anna = 2·Karin, alltså "
                "A+13 = 2(K+13). Multiplicera ut parentesen: "
                "A+13 = 2K + 26, vilket förenklas till A = 2K + 13."
            ),
        },
        {
            "n": 6,
            "title": "Test (2) ensamt — räcker det?",
            "text": (
                "Återigen: vet vi K? Nej. Vi har bara en relation mellan A och "
                "K vid en framtida tidpunkt. K kan vara 5 (då A=23), 11 (då "
                "A=35), 20 (då A=53), osv. En ekvation, två obekanta — "
                "fortfarande otillräckligt. (2) ensamt går också bort."
            ),
        },
        {
            "n": 7,
            "title": "Test (1) + (2) tillsammans — slutsats",
            "text": (
                "Nu har vi TVÅ ekvationer och TVÅ obekanta: A − K = 24 och "
                "A = 2K + 13. Substituera den andra in i den första: "
                "(2K + 13) − K = 24, vilket ger K + 13 = 24, alltså K = 11. "
                "Unik lösning. Tillsammans ger (1) och (2) ett komplett "
                "ekvationssystem — svaret är C. Insikten: NOG testar om "
                "påståendena ger TILLRÄCKLIGT med oberoende relationer för "
                "att låsa fast ALLA obekanta, inte bara om de innehåller siffror."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är frestande att läsa '24 år yngre' som konkret nog att "
                "räkna ut åldern — siffran 24 ser ut som ett svar i sig."
            ),
            "why_wrong": (
                "24 är en SKILLNAD, inte en ålder. Påstående (1) berättar bara "
                "att Anna är 24 år äldre, men inte hur gamla de faktiskt är. "
                "Karin kan vara 10 eller 50 — båda passar (1). Steg 4 visar "
                "räkneexemplen."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid 'Anna är dubbelt så gammal som Karin' "
                "eftersom förhållandet känns mer konkret än en skillnad — "
                "det säger något om vem som är vem."
            ),
            "why_wrong": (
                "Ett förhållande räcker inte heller: Karin kan vara 5 eller 11 "
                "eller 20, och Anna är alltid 2·Karin + 13. Två okända, en "
                "ekvation — samma problem som med (1). Steg 6 visar att "
                "förhållandet matchar oändligt många åldrar."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Om du översätter både (1) och (2) men aldrig testar dem var "
                "för sig, kan det se ut som om båda ensamma räcker — varje "
                "ger ju 'en formel'."
            ),
            "why_wrong": (
                "D kräver att VARDERA påståendet ensamt ger en unik lösning. "
                "Här ger varken (1) eller (2) det — båda är ekvationer med "
                "två obekanta. Bara TILLSAMMANS bildar de ett lösbart system "
                "(steg 7). D är reserverat för fall där två oberoende "
                "absoluta värden ges, inte två relationer."
            ),
        },
        {
            "letter": "E",
            "why_tempting": (
                "Snabbsvar är ofta 'frågar om ett konkret tal, men jag ser "
                "bara relationer — alltså omöjligt'."
            ),
            "why_wrong": (
                "Två oberoende ekvationer med två obekanta GÅR alltid att "
                "lösa (så länge ekvationerna inte är samma ekvation skriven "
                "på två sätt). A − K = 24 och A = 2K + 13 är olika typer av "
                "relationer (skillnad vs. linjär förhållande), så systemet "
                "är lösbart. E gäller bara när påståendena är redundanta eller "
                "motsägelsefulla."
            ),
        },
    ],
    "technique": (
        "NOG-systemstrategin: översätt varje påstående till en ekvation FÖRST, "
        "testa sedan om varje ger en unik lösning ensamt. Två oberoende "
        "ekvationer + två obekanta = lösbart system; en ekvation med två "
        "obekanta = alltid otillräckligt; två ekvationer som säger samma sak "
        "= också otillräckligt."
    ),
    "pitfall": (
        "Konkreta siffror i påståendena (här '24' och 'dubbelt') lurar "
        "studenter att tro att informationen räcker. Räkna antalet ekvationer "
        "och antalet obekanta istället för att titta på hur 'fyllig' "
        "påståendet ser ut språkligt."
    ),
    "_meta": meta("A"),
}


# Build the JSON file
def write_variant(variant_letter: str, data: dict[str, dict]) -> None:
    # Validate each entry against the v1 schema (the one currently on
    # main — Phase A.6's stricter steps-required schema lives on the
    # a6-zero-knowledge-explanations branch and ships separately).
    for qid, expl in data.items():
        errors = validate_explanation(expl)
        if errors:
            sys.exit(f"validation failed for {variant_letter}/{qid}: {errors}")

    out_path = ROOT / "app" / "public" / "explanations" / f"host-2013-variant-{variant_letter}.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    print(f"✓ wrote {out_path.relative_to(ROOT)}  ({len(data)} explanations)")


# ═══════════════════════════════════════════════════════════════════════
# VARIANT B — CONFIDENT TERSE
# ═══════════════════════════════════════════════════════════════════════
# Voice: confident-direct. Hand-holding: full (same algebra moves as A),
# but no explainer prose ("multiplikation betyder att gångra varje term"
# → just do the math; the reader sees the move from context).
# Distractors: "Trap: … / Fix: …" — no empathy openers, no rationale.
# Technique only, pitfall null. ~40% shorter than A.

VARIANT_B: dict[str, dict] = {}

VARIANT_B["host-2013-kvant2-KVA-016"] = {
    "solution_path": (
        "Substituera b = a + 1 i båda. Båda förenklas till "
        + M("a - a^{2}") + ". Lika — svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå villkoret",
            "text": (
                "b = a + 1. Två uttryck med a och b ska jämföras. Eliminera b."
            ),
        },
        {
            "n": 2,
            "title": "Välj substitution",
            "text": (
                "Byt ut b mot a + 1 i båda kvantiteterna. Då har du en variabel "
                "kvar och kan jämföra direkt."
            ),
        },
        {
            "n": 3,
            "title": "Substituera i Kvantitet I",
            "text": (
                M("ab - 2a^{2}") + "  →  " + M("a(a+1) - 2a^{2}") + "."
            ),
        },
        {
            "n": 4,
            "title": "Förenkla Kvantitet I",
            "text": (
                M("a(a+1) - 2a^{2} = a^{2} + a - 2a^{2} = a - a^{2}") + "."
            ),
        },
        {
            "n": 5,
            "title": "Substituera och förenkla Kvantitet II",
            "text": (
                M("a(b - 2a)") + "  →  " + M("a(a + 1 - 2a) = a(1 - a) = a - a^{2}") + "."
            ),
        },
        {
            "n": 6,
            "title": "Jämför",
            "text": (
                "Kvantitet I = " + M("a - a^{2}") + ". Kvantitet II = "
                + M("a - a^{2}") + ". Termvis identiska."
            ),
        },
        {
            "n": 7,
            "title": "Slutsats",
            "text": (
                "I = II oavsett a. Svaret är C. Form lurar — algebra avgör."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Trap: " + M("-2a^{2}") + " syns i I men inte i II:s parentes — "
                "I ser 'mer negativt' ut än II."
            ),
            "why_wrong": (
                "Fix: Multiplicera ut II:s parentes (steg 5); a multipliceras "
                "in och ger samma " + M("-a^{2}") + "-term."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Trap: " + M("a(b - 2a)") + " ser ut som ett negativt bidrag → II < I."
            ),
            "why_wrong": (
                "Fix: Båda har samma negativa term (" + M("-a^{2}") + ") efter "
                "förenkling. Ingen 'mer negativ' än den andra."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Trap: Variabler utan kända värden → 'kan inte avgöras'."
            ),
            "why_wrong": (
                "Fix: Uttrycken är algebraiskt identiska för ALLA a. D är "
                "reserverat för fall där villkoret tillåter flera utfall — "
                "inte här."
            ),
        },
    ],
    "technique": (
        "Substitutionsstrategin: villkor + två uttryck med flera variabler → "
        "byt ut villkorets variabel överallt, förenkla, jämför."
    ),
    "pitfall": None,
    "_meta": meta("B"),
}


VARIANT_B["host-2013-kvant1-NOG-026"] = {
    "solution_path": (
        "(1) ger A − K = 24. (2) ger A = 2K + 13. Var för sig: en ekvation, "
        "två obekanta — otillräckligt. Tillsammans: K = 11, unik lösning. "
        "Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå frågan",
            "text": (
                "Karins ålder den 4 juli 2001 = ? Båda fyller år samma dag, "
                "så de åldras lika fort."
            ),
        },
        {
            "n": 2,
            "title": "Sätt upp variablerna",
            "text": (
                "K = Karins ålder 2001, A = Annas ålder 2001."
            ),
        },
        {
            "n": 3,
            "title": "Översätt (1)",
            "text": (
                "År 2007: båda + 6 år. 'Karin 24 år yngre': K+6+24 = A+6 → "
                "A − K = 24."
            ),
        },
        {
            "n": 4,
            "title": "Test (1) ensamt",
            "text": (
                "En ekvation, två obekanta. K = 10 → A = 34; K = 50 → A = 74. "
                "Båda passar. Otillräckligt."
            ),
        },
        {
            "n": 5,
            "title": "Översätt (2)",
            "text": (
                "År 2014: båda + 13 år. 'Anna dubbelt så gammal': A+13 = 2(K+13) → "
                "A = 2K + 13."
            ),
        },
        {
            "n": 6,
            "title": "Test (2) ensamt",
            "text": (
                "Återigen en ekvation, två obekanta. K = 5 → A = 23; K = 11 → "
                "A = 35. Båda passar. Otillräckligt."
            ),
        },
        {
            "n": 7,
            "title": "Test (1) + (2) tillsammans",
            "text": (
                "Två oberoende ekvationer. Substituera: (2K + 13) − K = 24 → "
                "K = 11. Unik lösning. Svaret är C."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Trap: '24 år yngre' ser konkret ut — verkar räcka."
            ),
            "why_wrong": (
                "Fix: 24 är en SKILLNAD, inte en ålder. (1) ensamt ger två "
                "okända, en ekvation — alltid otillräckligt."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Trap: 'Dubbelt så gammal' känns konkret — ett tydligt förhållande."
            ),
            "why_wrong": (
                "Fix: Förhållandet är fortfarande en ekvation med två okända. "
                "K kan vara 5 eller 11 eller 20 — alla matchar (2) ensamt."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Trap: Båda påståendena ger 'en formel' — kan se ut som om var "
                "för sig räcker."
            ),
            "why_wrong": (
                "Fix: D kräver att varje påstående ensamt ger unik lösning. Här "
                "ger varken (1) eller (2) det — båda har två okända."
            ),
        },
        {
            "letter": "E",
            "why_tempting": (
                "Trap: 'Frågan vill ha ett konkret tal men jag ser bara relationer' → "
                "omöjligt."
            ),
            "why_wrong": (
                "Fix: Två oberoende ekvationer + två obekanta = alltid lösbart. "
                "(1) och (2) är oberoende (skillnad vs. förhållande), så systemet "
                "har en unik lösning."
            ),
        },
    ],
    "technique": (
        "NOG-systemstrategin: översätt varje påstående till ekvation, räkna "
        "ekvationer mot obekanta. En ekvation + två obekanta = otillräckligt; "
        "två oberoende ekvationer + två obekanta = lösbart."
    ),
    "pitfall": None,
    "_meta": meta("B"),
}


# ═══════════════════════════════════════════════════════════════════════
# VARIANT C — ULTRA-GRANULAR
# ═══════════════════════════════════════════════════════════════════════
# Voice: coaching (same as A). Hand-holding: maximum first-principles —
# explain WHAT each basic operation means when it appears (a·a = a²,
# 1−2 = −1, "två obekanta i en ekvation" semantics). Granularity:
# every algebra micro-move its own step (10+ for quant). Distractors
# expanded with step-number cross-references. Technique + pitfall +
# "Sammanfatta-i-en-mening" coda. ~1800 words per explanation.

VARIANT_C: dict[str, dict] = {}

VARIANT_C["host-2013-kvant2-KVA-016"] = {
    "solution_path": (
        "Villkoret b = a + 1 låter oss byta ut b överallt. När båda "
        "kvantiteterna substitueras och förenklas blir resultatet "
        + M("a - a^{2}") + " i båda — algebraiskt identiska. Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Läs problemet noggrant",
            "text": (
                "Du har ett villkor: b = a + 1 (det betyder att b alltid har "
                "värdet 'a plus 1', vad än a är). Sedan två uttryck: "
                "Kvantitet I = " + M("ab - 2a^{2}") + " och Kvantitet II = "
                + M("a(b - 2a)") + ". Frågan: vilken är störst, eller är "
                "de lika, eller går det inte att avgöra?"
            ),
        },
        {
            "n": 2,
            "title": "Vad är 'kvadrera'?",
            "text": (
                "I uttrycken ser du " + M("a^{2}") + " — detta är 'a i "
                "kvadrat'. Kvadrera betyder att gångra ett tal med sig självt: "
                + M("a^{2} = a \\cdot a") + ". Om a = 3, då är "
                + M("a^{2} = 9") + ". Om a = -2, då är " + M("a^{2} = 4") + "."
            ),
        },
        {
            "n": 3,
            "title": "Vad är 'ab'?",
            "text": (
                "När två variabler står bredvid varandra (som ab) är "
                "multiplikationen underförstådd: ab betyder " + M("a \\cdot b") + ". "
                "Detta är en konvention i algebra — vi sparar ett tecken genom "
                "att utelämna multiplikationspunkten när det inte är tvetydigt."
            ),
        },
        {
            "n": 4,
            "title": "Välj strategi — substitution",
            "text": (
                "Båda uttrycken innehåller både a och b. Eftersom vi har ett "
                "villkor som relaterar dem (b = a + 1), kan vi 'byta ut' b "
                "mot 'a + 1' överallt. Då försvinner b och vi har bara a kvar "
                "i båda uttrycken — kan jämföra direkt. Detta heter substitution."
            ),
        },
        {
            "n": 5,
            "title": "Substituera b i Kvantitet I",
            "text": (
                "Kvantitet I = " + M("ab - 2a^{2}") + ". Här är b — byt ut det "
                "mot (a + 1): " + M("a \\cdot (a + 1) - 2a^{2}") + ". Parentes "
                "behövs för att hålla ihop 'a + 1' som en enhet — annars skulle "
                "vi felräkna a·a + 1."
            ),
        },
        {
            "n": 6,
            "title": "Multiplicera ut parentesen i Kvantitet I",
            "text": (
                "Den distributiva lagen säger: " + M("a(x + y) = a \\cdot x + "
                "a \\cdot y") + " — gångra a separat med varje term inuti "
                "parentesen. Här: " + M("a \\cdot (a + 1) = a \\cdot a + a "
                "\\cdot 1 = a^{2} + a") + " (eftersom " + M("a \\cdot a = "
                "a^{2}") + " och " + M("a \\cdot 1 = a") + ")."
            ),
        },
        {
            "n": 7,
            "title": "Skriv om Kvantitet I efter multiplikationen",
            "text": (
                "Hela Kvantitet I efter steg 6: " + M("a^{2} + a - 2a^{2}") + ". "
                "Det är vad vi har att förenkla nu."
            ),
        },
        {
            "n": 8,
            "title": "Slå ihop liknande termer",
            "text": (
                "'Liknande termer' är termer med samma variabel-del. Här har vi "
                + M("a^{2}") + " och " + M("-2a^{2}") + " — båda har " + M("a^{2}")
                + " som variabel-del, så de kan slås ihop. Vi adderar koefficienterna: "
                "1 + (−2) = −1. Resultatet är " + M("-a^{2}") + " (eller "
                + M("-1 \\cdot a^{2}") + ", samma sak). Kvantitet I förenklas "
                "till " + M("a - a^{2}") + "."
            ),
        },
        {
            "n": 9,
            "title": "Substituera b i Kvantitet II — yttre led",
            "text": (
                "Kvantitet II = " + M("a(b - 2a)") + ". Byt ut b: "
                + M("a((a + 1) - 2a)") + ". Notera att den inre parentesen "
                "innehåller (a + 1 − 2a) — ett uttryck vi kan förenkla innan vi "
                "gör multiplikationen."
            ),
        },
        {
            "n": 10,
            "title": "Förenkla den inre parentesen i Kvantitet II",
            "text": (
                "Inuti parentesen: a + 1 − 2a. Slå ihop a-termerna: "
                + M("a - 2a = -a") + " (koefficient 1 − 2 = −1). Plus 1:an i "
                "mitten kvarstår. Resultat: 1 − a. Hela Kvantitet II är nu "
                + M("a(1 - a)") + "."
            ),
        },
        {
            "n": 11,
            "title": "Multiplicera ut parentesen i Kvantitet II",
            "text": (
                "Återigen distributiv lag: " + M("a \\cdot (1 - a) = a \\cdot "
                "1 - a \\cdot a = a - a^{2}") + ". Notera tecknet på den andra "
                "termen: " + M("a \\cdot (-a) = -a^{2}") + " — minustecknet följer "
                "med eftersom −a är vad vi multiplicerar."
            ),
        },
        {
            "n": 12,
            "title": "Jämför och dra slutsats",
            "text": (
                "Kvantitet I = " + M("a - a^{2}") + ". Kvantitet II = "
                + M("a - a^{2}") + ". Termvis identiska — samma uttryck, "
                "oavsett vad a är (positivt, negativt, noll). Svaret är C. "
                "Insikten i en mening: KVA testar ofta om du faktiskt gör "
                "algebran eller bara tittar på formen — uttryck som ser olika "
                "ut kan vara identiska efter förenkling."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är frestande att se " + M("-2a^{2}") + "-termen i Kvantitet I "
                "(synligt minustecken, stor koefficient) och tro att den drar "
                "ner I jämfört med II:s ' rena' parentes."
            ),
            "why_wrong": (
                "Detta är ett ytligt formresonemang. När du faktiskt distribuerar "
                "a in i II:s parentes (steg 9–11) får du exakt samma " + M("-a^{2})")
                + "-term som i I. Algebran är identisk — formen ljuger om "
                "innehållet. Den specifika manövern som avslöjar det är steg 10–11."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Om du läser 'parentes med minus inuti' som 'negativt bidrag', "
                "kan II:s " + M("a(b - 2a)") + " se ut som ett uttryck som "
                "drar ner II under I."
            ),
            "why_wrong": (
                "Båda uttrycken har samma negativa term (" + M("-a^{2}") + ") "
                "efter förenkling — varken är 'mer negativt' än det andra. "
                "Det specifika steget som visar det är steg 8 för I och "
                "steg 11 för II — båda landar på " + M("a - a^{2}") + "."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Det är lätt att tro att man behöver veta tecknet på a (positivt? "
                "negativt? noll?) eller ett konkret värde innan man kan avgöra. "
                "D är ju 'informationen är otillräcklig'."
            ),
            "why_wrong": (
                "Det behövs inte. När båda kvantiteterna förenklas till exakt "
                "samma uttryck (" + M("a - a^{2}") + ", se steg 12) gäller "
                "likheten för ALLA värden av a — positiva, negativa, noll. "
                "D är reserverat för fall där villkoret tillåter flera olika "
                "utfall (I > II för vissa värden, I < II för andra). Här är "
                "I = II ALLTID."
            ),
        },
    ],
    "technique": (
        "Substitutionsstrategin: när du har ett villkor (typ b = a + 1) och två "
        "uttryck med flera variabler, byt ut villkorets variabel överallt och "
        "förenkla. Då har du bara EN variabel kvar i båda och kan jämföra direkt. "
        "Detta är KVA:s vanligaste tekniska beslut — så vanligt att det är värt "
        "att memorera triggern: 'villkor som ger b i termer av a + uttryck med "
        "både a och b → substitution'."
    ),
    "pitfall": (
        "Två uttryck som SER olika ut innan förenkling kan vara algebraiskt "
        "identiska. KVA väljer ofta att skriva I och II i olika form (utvecklat "
        "vs. parentes) för att fresta studenter att gissa A eller B utifrån "
        "formen istället för att räkna. Botemedlet: när formen är 'misstänkt "
        "olik' — utveckla ALLT till samma form (alla parenteser borta, alla "
        "termer i ordning) innan du drar slutsatsen."
    ),
    "_meta": meta("C"),
}


VARIANT_C["host-2013-kvant1-NOG-026"] = {
    "solution_path": (
        "Översätt (1) till A − K = 24, (2) till A = 2K + 13. Var för sig är "
        "vardera en ekvation med två obekanta — otillräckligt. Tillsammans bildar "
        "de ett 2x2-system med unik lösning K = 11. Svaret är C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Förstå frågan",
            "text": (
                "Anna och Karin fyller år samma dag (4 juli). Frågan: hur gammal "
                "var Karin den 4 juli 2001? Vi vill ha ett KONKRET TAL — en ålder "
                "i år, inte en relation eller skillnad."
            ),
        },
        {
            "n": 2,
            "title": "Vad betyder 'tillräcklig information' i NOG?",
            "text": (
                "NOG (numerisk och grafisk) frågar inte 'är svaret rätt' — utan "
                "'räcker informationen för att hitta ETT unikt svar?'. Om "
                "informationen lämnar flera möjliga svar är den otillräcklig, "
                "även om vi vet en hel del. Detta är en strukturell skillnad mot "
                "vanliga räkneuppgifter."
            ),
        },
        {
            "n": 3,
            "title": "Sätt upp variablerna",
            "text": (
                "Vi behöver namn på de okända storheterna. Kalla Karins ålder "
                "den 4 juli 2001 för K, och Annas för A. Båda är heltal (åldrar "
                "i hela år) och positiva (de var redan födda 2001). Eftersom "
                "de fyller år samma dag åldras de identiskt — om K år går har "
                "K blivit K + K_diff och A blivit A + K_diff. Detta är nyckeln "
                "som låter oss översätta påståenden om framtida ålder till "
                "ekvationer i K och A."
            ),
        },
        {
            "n": 4,
            "title": "Översätt påstående (1)",
            "text": (
                "'Den 4 juli 2007 var Karin 24 år yngre än Anna.' 2007 är 6 år "
                "efter 2001, så Karins ålder då är K + 6, Annas är A + 6. "
                "'Karin 24 år yngre än Anna' betyder att Karins ålder + 24 lika "
                "med Annas ålder: (K + 6) + 24 = (A + 6)."
            ),
        },
        {
            "n": 5,
            "title": "Förenkla ekvationen från (1)",
            "text": (
                "(K + 6) + 24 = A + 6. Subtrahera 6 från båda sidor: K + 24 = A. "
                "Skriv om: A − K = 24. Insikt: åldersskillnaden mellan Anna och "
                "Karin är ALLTID 24 år (den ändras inte över tid, eftersom de "
                "fyller år samma dag)."
            ),
        },
        {
            "n": 6,
            "title": "Test (1) ensamt — vad får vi veta?",
            "text": (
                "(1) ger oss EN ekvation: A − K = 24. Vi har TVÅ obekanta (A och "
                "K). I algebra: en ekvation med två obekanta har OÄNDLIGT MÅNGA "
                "lösningar. Konkret: K = 10 → A = 34; K = 25 → A = 49; K = 50 → "
                "A = 74. Alla matchar (1). Otillräckligt för att låsa fast K."
            ),
        },
        {
            "n": 7,
            "title": "Översätt påstående (2) — första halvan",
            "text": (
                "'Den 4 juli 2014 kommer Anna att vara dubbelt så gammal som "
                "Karin.' 2014 är 13 år efter 2001, så Karins ålder är K + 13, "
                "Annas är A + 13. 'Dubbelt så gammal' betyder Annas ålder lika "
                "med 2 gånger Karins ålder: A + 13 = 2(K + 13)."
            ),
        },
        {
            "n": 8,
            "title": "Förenkla ekvationen från (2)",
            "text": (
                "A + 13 = 2(K + 13). Multiplicera ut höger sida (distributiv "
                "lag): 2 · K + 2 · 13 = 2K + 26. Så A + 13 = 2K + 26. Subtrahera "
                "13 från båda sidor: A = 2K + 13."
            ),
        },
        {
            "n": 9,
            "title": "Test (2) ensamt — vad får vi veta?",
            "text": (
                "(2) ger oss EN ekvation: A = 2K + 13. Återigen TVÅ obekanta. "
                "Konkret: K = 5 → A = 23; K = 11 → A = 35; K = 20 → A = 53. "
                "Alla passar (2). Otillräckligt ensamt — samma problem som (1)."
            ),
        },
        {
            "n": 10,
            "title": "Test (1) + (2) tillsammans",
            "text": (
                "Nu har vi TVÅ ekvationer och TVÅ obekanta:\n"
                "  A − K = 24      (från 1)\n"
                "  A = 2K + 13     (från 2)\n"
                "Detta är ett 2x2-system. När ekvationerna är oberoende (säger "
                "olika saker — vilket de gör här: skillnad vs. förhållande), "
                "har systemet exakt en lösning."
            ),
        },
        {
            "n": 11,
            "title": "Lös systemet med substitution",
            "text": (
                "Vi vet A = 2K + 13 från (2). Sätt in det i (1): "
                "(2K + 13) − K = 24. Förenkla vänster sida: 2K − K + 13 = K + 13. "
                "Så K + 13 = 24. Subtrahera 13: K = 11. Karin var 11 år den 4 "
                "juli 2001."
            ),
        },
        {
            "n": 12,
            "title": "Verifiera",
            "text": (
                "Med K = 11: från (1), A = K + 24 = 35. Kontrollera (2): år 2014 "
                "är K + 13 = 24 och A + 13 = 48. Är 48 = 2 · 24? Ja. Båda "
                "påståenden stämmer med K = 11, A = 35. Lösningen är unik och "
                "korrekt."
            ),
        },
        {
            "n": 13,
            "title": "Slutsats",
            "text": (
                "Varken (1) eller (2) ensamt räcker (en ekvation, två obekanta — "
                "alltid otillräckligt för unik lösning). TILLSAMMANS bildar de "
                "ett 2x2-system med unik lösning K = 11. Svaret är C — "
                "tillräckligt i (1) tillsammans med (2). Insikten i en mening: "
                "NOG handlar om att RÄKNA EKVATIONER MOT OBEKANTA, inte om att "
                "tolka språket — siffror i påståenden lurar."
            ),
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Det är frestande att läsa '24 år yngre' som ett konkret tal "
                "och tro att (1) räcker — siffran 24 SER UT som ett svar i sig, "
                "och 'år yngre' känns informativt."
            ),
            "why_wrong": (
                "24 är en SKILLNAD mellan två okända, inte en ålder. Som steg "
                "6 visar: Karin kan vara 10 eller 25 eller 50, och Anna är "
                "alltid 24 mer. Konkreta tal i påståenden lurar — vad som "
                "räknas är ekvationer mot obekanta."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Många stannar vid 'Anna dubbelt så gammal som Karin' eftersom "
                "förhållandet känns konkretare — det säger något om relativ "
                "storlek, inte bara skillnad."
            ),
            "why_wrong": (
                "Ett förhållande är fortfarande en ekvation med två obekanta. "
                "Som steg 9 visar: K kan vara 5 eller 11 eller 20, och Anna är "
                "alltid 2K + 13. Samma strukturella problem som med (1)."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Om du översätter båda påståendena men inte testar var för sig, "
                "kan det kännas som om båda ger 'användbar information' och "
                "alltså räcker ensamma. D är ju 'tillräckligt var för sig'."
            ),
            "why_wrong": (
                "D kräver att VARDERA påståendet ensamt ger unik lösning. Steg 6 "
                "och steg 9 visar att varken (1) eller (2) gör det — båda är "
                "ekvationer med två okända. D är reserverat för fall där två "
                "oberoende ABSOLUTA värden ges (typ 'Karin är 11 år' och "
                "'Anna är 35 år'), inte två relationer."
            ),
        },
        {
            "letter": "E",
            "why_tempting": (
                "Snabbsvar är ofta 'frågan vill ha ett konkret tal men jag ser "
                "bara relationer — alltså omöjligt'."
            ),
            "why_wrong": (
                "Detta är fel intuition. Två oberoende ekvationer + två obekanta "
                "= ALLTID en unik lösning (det är en grundläggande algebrasats). "
                "(1) ger A − K = 24, (2) ger A = 2K + 13 — olika typer av "
                "relationer, alltså oberoende. Steg 10–11 löser systemet. E "
                "gäller bara när påståendena är redundanta eller motsägelsefulla."
            ),
        },
    ],
    "technique": (
        "NOG-systemstrategin: 1) översätt varje påstående till en ekvation, "
        "2) räkna ekvationer mot obekanta, 3) lös systemet när antalet "
        "oberoende ekvationer matchar antalet obekanta. Regel: en ekvation + "
        "två obekanta = otillräckligt; två oberoende ekvationer + två obekanta "
        "= unik lösning. Detta gäller oavsett hur 'konkret' siffrorna i "
        "påståendena ser ut."
    ),
    "pitfall": (
        "Konkreta siffror i påståendena (här '24' och 'dubbelt') lurar studenter "
        "att tro att informationen räcker. Botemedlet: räkna ALLTID antalet "
        "ekvationer och antalet obekanta, snarare än att titta på hur 'fyllig' "
        "varje påstående ser ut språkligt. En enda ekvation med två obekanta "
        "är otillräcklig, även om den innehåller flera konkreta tal."
    ),
    "_meta": meta("C"),
}


if __name__ == "__main__":
    write_variant("A", VARIANT_A)
    write_variant("B", VARIANT_B)
    write_variant("C", VARIANT_C)

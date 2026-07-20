"""Classify each LÄS passage into a source-genre using scored lexical signals.

Genres observed in the corpus (HP LÄS draws from published Swedish non-fiction
+ some literary texts):
  populärvetenskap  — research-journalism / forskningsreferat
  recension         — book/music/exhibition review
  debatt_opinion    — argumentative op-ed / debate piece
  juridik_myndighet — court rulings, agency reports, legal referats
  skonlitteratur    — prose fiction / literary excerpt
  poesi             — poem(s)
  intervju_reportage— interview / feature reportage with quoted speech
  facktext_larobok  — encyclopedic / textbook exposition

Method: each genre gets a score from weighted regex hits over the passage
(title + body + author line). Highest score wins; ties -> priority order.
Signals are proxies, not ground truth — the script also emits the raw scores
so the classification is auditable per passage.

Run: python3 pipeline/synthetic/las/scripts/genre_classify.py
"""

import json
import re
from collections import Counter
from pathlib import Path

from common import clean_text, group_passages, load_las_questions, words

OUTD = Path(__file__).resolve().parent.parent / "outputs"

def _lines(raw):
    return [l for l in raw.split("\n") if l.strip()]


def _short_line_ratio(raw):
    lines = _lines(raw)
    if not lines:
        return 0.0
    return sum(1 for l in lines if len(l.split()) <= 9) / len(lines)


def score_genre(p):
    raw = p["raw"]
    t = clean_text(p["text"])
    low = t.lower()
    w = words(t)
    nwords = max(len(w), 1)
    per1k = lambda n: 1000.0 * n / nwords
    s = {g: 0.0 for g in
         ["populärvetenskap", "recension", "debatt_opinion", "juridik_myndighet",
          "skonlitteratur", "poesi", "intervju_reportage", "facktext_larobok"]}

    # ---- POESI: verse layout is the decisive, high-precision signal.
    slr = _short_line_ratio(raw)
    nlines = len(_lines(raw))
    if nlines >= 8 and slr >= 0.55 and len(w) < 520:
        s["poesi"] += 8.0
    # explicit verse vocabulary, but NOT "diktning/diktare" (about writing prose)
    s["poesi"] += 3.0 * len(re.findall(r"\b(dikten|dikter|diktsamling|strof\w*|versrad|poem\w*)\b", low))

    # ---- JURIDIK/MYNDIGHET: institutional tokens, very discriminative.
    s["juridik_myndighet"] += 4.0 * len(re.findall(r"\b(HFD|HD|AD|VA-nämnden|Arbetsdomstolen|Högsta (förvaltnings)?domstolen|disciplinnämnd\w*|Försäkringskassan|Naturvårdsverket)\b", raw))
    s["juridik_myndighet"] += 3.0 * len(re.findall(r"\b(mål \d|dnr|överklag\w*|remiss\w*|domen|domskäl|rättsprövning|förbindelsepunkt|yrka\w*|disciplin)\b", low))
    s["juridik_myndighet"] += 1.0 * len(re.findall(r"\b(lagen|lagstiftning|paragraf|rättslig\w*|myndighet\w*|förordning|nämnden (ansåg|beslutade|fann))\b", low))

    # ---- RECENSION: explicit review framing or reviewer evaluating a named work.
    s["recension"] += 5.0 * len(re.findall(r"\b(recension|skivrecension|anmälan av)\b", low))
    s["recension"] += 3.0 * len(re.findall(r"\b(i sin (senaste )?(bok|studie|avhandling|roman)|hans (nya |senaste )?(bok|roman|studie)|hennes (nya |senaste )?(bok|roman|studie)|debutroman|antologin \w)\b", low))
    s["recension"] += 2.0 * len(re.findall(r"\b(recensent\w*|läsvärd|välskriven|nydanande|läsaren får|bokens (styrka|svaghet)|rått bot)\b", low))

    # ---- INTERVJU / REPORTAGE: line-initial dialogue dashes + attributed speech.
    dash = len(re.findall(r"(^|\n)\s*[–—]\s+[A-ZÅÄÖ]", raw))
    s["intervju_reportage"] += 2.0 * dash
    s["intervju_reportage"] += 4.0 * len(re.findall(r"\b(intervju med|berättar (han|hon|hen)|säger (han|hon|hen|forskaren)|förklarar (han|hon|hen))\b", low))

    # ---- SKÖNLITTERATUR (prose fiction): narrative motion + sensory verbs,
    #      only credited when SCIENCE / REVIEW / LEGAL markers are essentially absent.
    narr = len(re.findall(r"\b(han|hon|jag|vi) (satt|gick|sa|sade|tänkte|kände|såg|låg|reste sig|vaknade|sprang|log|grät|stod|kom|somnade)\b", low))
    s["skonlitteratur"] += 1.2 * narr
    s["skonlitteratur"] += 1.0 * len(re.findall(r"[”\"][^”\"]{25,}[”\"]", raw))

    # ---- POPULÄRVETENSKAP: research-journalism register.
    s["populärvetenskap"] += 1.6 * per1k(len(re.findall(r"\b(forskar\w+|studie[nr]?|studien|undersökning\w*|forskningsprojekt|experiment|professor|universitet\w*|institut\w*|docent)\b", low)))
    s["populärvetenskap"] += 1.2 * len(re.findall(r"\b(visar att|enligt (studien|forskarna|forskning\w*)|har (upptäckt|visat|kunnat visa|påvisat)|forskarna (fann|såg|tror))\b", low))

    # ---- FACKTEXT / LÄROBOK: definitional/expository openings, generic present tense.
    s["facktext_larobok"] += 3.0 * len(re.findall(r"\b\w+ (är (det svenska namnet|en så kallad|en typ av|ett slags)|kallas (för )?|definieras som|orsakas av)\b", low))
    s["facktext_larobok"] += 0.6 * len(re.findall(r"\b(det vill säga|så kallad|kallas för|innebär att|består av)\b", low))

    # ---- DEBATT / OPINION: normative modality + argumentative stance.
    s["debatt_opinion"] += 1.4 * per1k(len(re.findall(r"\b(bör|borde|måste|vi måste|det är dags| vi ska |i stället för att)\b", low)))
    s["debatt_opinion"] += 2.0 * len(re.findall(r"\b(debattartikel|replik|inlägg [12]|ifrågasätt\w*|jag (menar|anser|hävdar|tycker) att|min (poäng|tes))\b", low))

    return s


def _short_line_ratio(raw):
    lines = [l for l in raw.split("\n") if l.strip()]
    if not lines:
        return 0.0
    short = sum(1 for l in lines if len(l.split()) <= 9)
    return short / len(lines)


PRIORITY = ["poesi", "juridik_myndighet", "recension", "intervju_reportage",
            "skonlitteratur", "debatt_opinion", "populärvetenskap", "facktext_larobok"]

# Curated overrides for cases the lexical signals cannot separate reliably.
# Each was confirmed by reading the passage incipit + author line. Rationale:
# literary vs. essay-about-literature is not lexically separable, and verse set
# as prose blocks defeats the short-line heuristic. Keyed by passage_id.
OVERRIDES = {
    # verse (poems / prose-poems) reprinted with lost line breaks or as a pair
    "host-2022:verb2:011": "poesi",       # Två dikter — Karin Boye
    "var-2022-1:verb1:011": "poesi",      # Språk — Tranströmer + Björk-poem
    "var-2022-2:verb1:011": "poesi",      # Glömskan — Thomas Tidholm (prose poem)
    "host-2021:verb2:011": "poesi",       # 40 — Pär Hansson
    # literary prose fiction / literary memoir excerpts
    "host-2023:verb2:011": "skonlitteratur",  # Tre sekunders minne — Barbro Lindgren
    "host-2024:verb2:011": "skonlitteratur",  # Apparatsöndagen — Tage Danielsson
    "var-2023:verb1:017": "skonlitteratur",   # Kerstin Thorvall
    "var-2024:verb1:017": "skonlitteratur",   # Stina Stoor
    "var-2025:verb1:017": "skonlitteratur",   # Marianne Fredriksson
    "var-2026:verb2:011": "skonlitteratur",   # Vilse — Niklas Rådström
    "host-2025:verb1:017": "skonlitteratur",  # Falska minnen — Johannes Edfelt (memoir)
    # essay ABOUT literature that the poem-heuristic mis-flagged as verse
    "var-2014:verb2:017": "recension",    # Lättillgängligt om Bellman (book review)
}

# Macro genre: the reliable coarse layer the generator branches on first.
MACRO = {
    "poesi": "litterar",
    "skonlitteratur": "litterar",
    "juridik_myndighet": "juridik_myndighet",
    "recension": "sakprosa",
    "intervju_reportage": "sakprosa",
    "debatt_opinion": "sakprosa",
    "populärvetenskap": "sakprosa",
    "facktext_larobok": "sakprosa",
}


# Literary genres are assigned ONLY via curated OVERRIDES: the automated
# narrative/verse signals produced too many false positives on expository prose
# that merely quotes speech or discusses literature. So the auto-classifier
# chooses among the non-literary genres; literary is a hand-verified layer.
AUTO_POOL = [g for g in PRIORITY if g not in ("poesi", "skonlitteratur")]


def classify(p):
    s = score_genre(p)
    pool = {g: s[g] for g in AUTO_POOL}
    best = max(pool.values())
    if best <= 0:
        return "populärvetenskap", s, "low"
    winners = [g for g in AUTO_POOL if pool[g] == best]
    ordered = sorted(pool.values(), reverse=True)
    runner = ordered[1] if len(ordered) > 1 else 0
    conf = "low" if (best < 3.0 or (runner >= 0.8 * best and runner > 0)) else "ok"
    return winners[0], s, conf


def main():
    passages = group_passages(load_las_questions())
    rows = []
    counts = Counter()
    lowconf = 0
    n_override = 0
    macro_counts = Counter()
    for p in passages:
        pid = f'{p["exam_id"]}:{p["provpass"]}:{p["questions"][0]["number"]:03d}'
        g, s, conf = classify(p)
        if pid in OVERRIDES:
            g = OVERRIDES[pid]
            conf = "curated"
            n_override += 1
        counts[g] += 1
        macro_counts[MACRO[g]] += 1
        lowconf += conf == "low"
        rows.append({
            "passage_id": pid,
            "exam_id": p["exam_id"],
            "title": p["title"],
            "n_questions": p["n_questions"],
            "qids": p["qids"],
            "genre": g,
            "macro_genre": MACRO[g],
            "confidence": conf,
            "scores": {k: round(v, 1) for k, v in sorted(s.items(), key=lambda kv: -kv[1]) if v > 0},
        })
    (OUTD / "genres.json").write_text(json.dumps(
        {"n_passages": len(passages), "n_low_confidence": lowconf, "n_curated_override": n_override,
         "genre_counts": dict(counts.most_common()),
         "macro_genre_counts": dict(macro_counts.most_common()), "rows": rows},
        ensure_ascii=False, indent=1))
    print("MACRO GENRE (n=%d passages):" % len(passages))
    for k, v in macro_counts.most_common():
        print(f"  {v:4d} {100*v/len(passages):4.1f}%  {k}")
    print("FINE GENRE (%d low-confidence, %d curated overrides):" % (lowconf, n_override))
    for k, v in counts.most_common():
        print(f"  {v:4d} {100*v/len(passages):4.1f}%  {k}")


if __name__ == "__main__":
    main()

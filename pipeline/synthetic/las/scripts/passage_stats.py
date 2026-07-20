"""Measure the structural DNA of authentic LÄS passages.

Outputs pipeline/synthetic/las/outputs/passage_stats.json with per-passage
metrics (word/sentence/paragraph counts, LIX, TTR, register markers) plus
corpus-level distributions, split by passage size (2q short vs 4q long).

Run: python3 pipeline/synthetic/las/scripts/passage_stats.py
"""

import json
import re
from collections import Counter
from pathlib import Path

from common import (
    clean_text,
    group_passages,
    lix,
    load_las_questions,
    paragraphs,
    sentences,
    summarize,
    type_token_ratio,
    words,
)

OUT = Path(__file__).resolve().parent.parent / "outputs" / "passage_stats.json"

# Register / stance markers (regex, applied per word or per text)
FIRST_PERSON = re.compile(r"\b(jag|vi|min|mitt|mina|vår|vårt|våra|oss|mig)\b", re.I)
QUESTION_MARK = re.compile(r"\?")
PASSIVE_S = re.compile(r"\b\w{3,}[aä]s\b")  # rough -s passive/deponent marker
NOMINALIZATION = re.compile(r"\b\w+(?:ning|ande|else|het|tion|ism)(?:en|et|er|erna|ar|arna)?\b", re.I)
CITATION = re.compile(r"\((?:[A-ZÅÄÖ][\w&., ]*\d{4}[a-z]?(?:[;,] ?[\w&., ]*\d{4}[a-z]?)*)\)")
QUOTE = re.compile(r"[”\"]")


def passage_metrics(p):
    t = clean_text(p["text"])
    w = words(t)
    s = sentences(t)
    paras = paragraphs(t)
    slens = [len(words(x)) for x in s]
    first_sent = s[0] if s else ""
    last_sent = s[-1] if s else ""
    return {
        "passage_id": f'{p["exam_id"]}:{p["provpass"]}:{p["questions"][0]["number"]:03d}',
        "exam_id": p["exam_id"],
        "qids": p["qids"],
        "n_questions": p["n_questions"],
        "has_title": p["title"] is not None,
        "title_words": len(p["title"].split()) if p["title"] else 0,
        "words": len(w),
        "sentences": len(s),
        "paragraphs": len(paras),
        "words_per_paragraph": round(len(w) / len(paras), 1) if paras else 0,
        "sentence_len_mean": round(sum(slens) / len(slens), 1) if slens else 0,
        "sentence_len_min": min(slens) if slens else 0,
        "sentence_len_max": max(slens) if slens else 0,
        "lix": round(lix(t), 1),
        "ttr": round(type_token_ratio(t), 3),
        "long_word_pct": round(100 * sum(1 for x in w if len(x) > 6) / len(w), 1) if w else 0,
        "first_person_per_1k": round(1000 * len(FIRST_PERSON.findall(t)) / len(w), 1) if w else 0,
        "questions_in_text": len(QUESTION_MARK.findall(t)),
        "passive_s_per_1k": round(1000 * len(PASSIVE_S.findall(t)) / len(w), 1) if w else 0,
        "nominalization_per_1k": round(1000 * len(NOMINALIZATION.findall(t)) / len(w), 1) if w else 0,
        "has_citation_parens": bool(CITATION.search(t)),
        "has_quotes": bool(QUOTE.search(t)),
        "first_sentence_words": len(words(first_sent)),
        "last_sentence_words": len(words(last_sent)),
        "opens_with_question": first_sent.rstrip().endswith("?"),
        "closes_with_question": last_sent.rstrip().endswith("?"),
    }


def main():
    qs = load_las_questions()
    passages = group_passages(qs)
    rows = [passage_metrics(p) for p in passages]

    def dist(rows, key):
        return summarize([r[key] for r in rows])

    def block(rows):
        keys = [
            "words",
            "sentences",
            "paragraphs",
            "words_per_paragraph",
            "sentence_len_mean",
            "sentence_len_max",
            "lix",
            "ttr",
            "long_word_pct",
            "first_person_per_1k",
            "passive_s_per_1k",
            "nominalization_per_1k",
            "first_sentence_words",
            "last_sentence_words",
        ]
        out = {k: dist(rows, k) for k in keys}
        out["has_title_pct"] = round(100 * sum(r["has_title"] for r in rows) / len(rows), 1)
        out["has_citation_pct"] = round(100 * sum(r["has_citation_parens"] for r in rows) / len(rows), 1)
        out["has_quotes_pct"] = round(100 * sum(r["has_quotes"] for r in rows) / len(rows), 1)
        out["opens_with_question_pct"] = round(100 * sum(r["opens_with_question"] for r in rows) / len(rows), 1)
        out["closes_with_question_pct"] = round(100 * sum(r["closes_with_question"] for r in rows) / len(rows), 1)
        out["any_first_person_pct"] = round(100 * sum(r["first_person_per_1k"] > 0 for r in rows) / len(rows), 1)
        return out

    long_rows = [r for r in rows if r["n_questions"] == 4]
    short_rows = [r for r in rows if r["n_questions"] == 2]

    # per-provpass composition: how many long/short passages per 10-question pass
    comp = Counter()
    per_pass = Counter()
    for p in passages:
        per_pass[(p["exam_id"], p["provpass"])] += 0  # ensure key
    from collections import defaultdict

    bypass = defaultdict(list)
    for p in passages:
        bypass[(p["exam_id"], p["provpass"])].append(p["n_questions"])
    for k, v in bypass.items():
        comp[tuple(sorted(v, reverse=True))] += 1

    result = {
        "corpus": {
            "n_questions": len(qs),
            "n_passages": len(passages),
            "n_long_4q": len(long_rows),
            "n_short_2q": len(short_rows),
            "n_exams": len({p["exam_id"] for p in passages}),
            "provpass_composition_counts": {"+".join(map(str, k)): v for k, v in sorted(comp.items())},
        },
        "long_4q": block(long_rows),
        "short_2q": block(short_rows),
        "all": block(rows),
        "passages": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({k: v for k, v in result.items() if k != "passages"}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

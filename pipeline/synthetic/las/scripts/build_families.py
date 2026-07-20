"""Assemble the LÄS item-family taxonomy from the type, genre and trap outputs.

A FAMILY is primarily a question TYPE (the reliably classifiable axis), enriched
with: corpus frequency, the genre distribution of its passages, its trap-tag
profile (mined from Layer-2 explanations), 2-3 authentic exemplar qids, and a
difficulty field (marked "unknown" — no Elo/item_stats exist in the repo).

Also emits a type x macro-genre cross-tab so the generator can see which
(type, genre) cells actually occur and how often.

Inputs: outputs/question_types.json, outputs/genres.json, outputs/trap_tags.json
Output: pipeline/synthetic/las/families.json
Run: python3 pipeline/synthetic/las/scripts/build_families.py
"""

import json
from collections import Counter, defaultdict
from pathlib import Path

from common import load_las_explanations, load_las_questions

BASE = Path(__file__).resolve().parent.parent
OUTD = BASE / "outputs"

TYPE_LABELS = {
    "enligt_texten_detalj": "Detaljhämtning (text-ankrad)",
    "detalj_ospecificerad": "Detaljhämtning (innehålls-ankrad)",
    "huvudbudskap_syfte": "Huvudbudskap / syfte / bästa rubrik",
    "forfattarens_hallning": "Författarens hållning / värdering / kritik",
    "hallning_stamning_ton": "Ton / stämning / stil",
    "inference_slutsats": "Inferens / slutsats bortom det bokstavliga",
    "struktur_funktion": "Struktur / funktion av ett textelement",
    "jamforelse_relation": "Jämförelse / relation (ofta fler-texts)",
    "ordbetydelse_i_kontext": "Ordbetydelse i kontext",
}

TRAP_GLOSS = {
    "overgeneralisation": "Distraktorn tar textens nyanserade påstående och gör det absolut (alla/alltid/aldrig/bara).",
    "reversed_causality": "Rätt element, fel riktning: orsak/verkan eller subjekt/objekt kastas om (textens 'tvärtom').",
    "scope_shift": "Rätt tema, fel omfång/stycke: svaret gäller en annan del eller vidgar/snävar räckvidden.",
    "detail_as_main": "En delfråga eller ett exempel presenteras som textens huvudpoäng.",
    "plausible_worldknowledge": "Låter rimligt utifrån allmän kunskap men saknar stöd i just denna text.",
    "true_but_irrelevant": "Sant i sig men besvarar inte den ställda frågan.",
    "surface_lexical_echo": "Återanvänder ord/fraser som finns i texten för att kännas bekant och rätt.",
    "half_right_conjunction": "Två-ledad distraktor där ena ledet stämmer och det andra inte.",
}


def main():
    qt = json.loads((OUTD / "question_types.json").read_text())
    gz = json.loads((OUTD / "genres.json").read_text())
    tt = json.loads((OUTD / "trap_tags.json").read_text())
    exps = load_las_explanations()

    qid_genre = {}
    qid_macro = {}
    for row in gz["rows"]:
        for qid in row["qids"]:
            qid_genre[qid] = row["genre"]
            qid_macro[qid] = row["macro_genre"]

    rows = qt["rows"]
    by_type = defaultdict(list)
    for r in rows:
        by_type[r["type"]] = by_type[r["type"]]
        by_type[r["type"]].append(r)

    # cross-tab type x macro-genre
    xtab = defaultdict(Counter)
    for r in rows:
        xtab[r["type"]][qid_macro.get(r["qid"], "?")] += 1

    families = []
    n = len(rows)
    for t, items in sorted(by_type.items(), key=lambda kv: -len(kv[1])):
        genre_dist = Counter(qid_genre.get(i["qid"], "?") for i in items)
        macro_dist = Counter(qid_macro.get(i["qid"], "?") for i in items)
        traps = Counter()
        for i in items:
            for k, v in i["trap_tags"].items():
                traps[k] += v
        total_distr = sum(traps.values()) or 1
        # exemplars: prefer items with a clear pregrade_tactic handle + 3 distractors
        scored = []
        for i in items:
            e = exps.get(i["qid"], {})
            score = (len(e.get("distractors", [])), 1 if e.get("pregrade_tactic") else 0)
            scored.append((score, i))
        scored.sort(key=lambda x: (-x[0][0], -x[0][1]))
        exemplars = []
        for _, i in scored[:3]:
            e = exps.get(i["qid"], {})
            exemplars.append({
                "qid": i["qid"],
                "prompt": i["prompt"],
                "answer": i["answer"],
                "genre": qid_genre.get(i["qid"], "?"),
                "pregrade_handle": (e.get("pregrade_tactic") or {}).get("handle"),
                "trap_tags": i["trap_tags"],
                "distractor_anatomy": [
                    {"letter": d.get("letter"), "why_tempting": d.get("why_tempting"), "why_wrong": d.get("why_wrong")}
                    for d in e.get("distractors", [])
                ],
            })
        families.append({
            "family_id": t,
            "label_sv": TYPE_LABELS.get(t, t),
            "frequency": {"count": len(items), "pct": round(100 * len(items) / n, 1)},
            "genre_distribution": dict(genre_dist.most_common()),
            "macro_genre_distribution": dict(macro_dist.most_common()),
            "trap_profile": [
                {"tag": k, "distractor_instances": v, "share_of_family_traps": round(v / total_distr, 2),
                 "gloss": TRAP_GLOSS.get(k, "")}
                for k, v in traps.most_common()
            ],
            "difficulty_spread": "unknown — no Elo/item_stats in repo (see anti-plagiarism.md note)",
            "exemplar_qids": [e["qid"] for e in exemplars],
            "exemplars": exemplars,
        })

    out = {
        "corpus": {"n_questions": n, "n_passages": gz["n_passages"],
                   "n_options_per_item": 4, "difficulty_data": "absent"},
        "type_x_macrogenre_crosstab": {t: dict(c.most_common()) for t, c in xtab.items()},
        "trap_glossary": TRAP_GLOSS,
        "families": families,
    }
    (BASE / "families.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print("FAMILIES:")
    for f in families:
        top = ", ".join(f"{x['tag']}({x['distractor_instances']})" for x in f["trap_profile"][:3])
        print(f"  {f['frequency']['pct']:4.1f}%  {f['family_id']:24s}  traps: {top}")
    print("\nCROSSTAB type x macro-genre:")
    for t, c in sorted(xtab.items(), key=lambda kv: -sum(kv[1].values())):
        print(f"  {t:24s} {dict(c.most_common())}")


if __name__ == "__main__":
    main()

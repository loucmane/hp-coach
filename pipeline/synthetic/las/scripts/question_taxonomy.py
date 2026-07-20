"""Classify LÄS question stems into TYPE families and mine trap anatomy.

Type taxonomy is derived from Swedish stem lexicalisation (regex over the
question prompt). Trap anatomy is mined from the Layer-2 explanation
`distractors[].why_tempting` fields via keyword tagging.

Outputs:
  outputs/question_types.json   — per-question type label + evidence
  outputs/trap_tags.json        — trap-tag frequencies per type
Run: python3 pipeline/synthetic/las/scripts/question_taxonomy.py
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from common import load_las_explanations, load_las_questions

OUTD = Path(__file__).resolve().parent.parent / "outputs"

# ---- question TYPE rules (checked in priority order; first match wins) ------
# Each rule: (label, compiled regex over lowercased stem)
TYPE_RULES = [
    # 1) explicit word/phrase meaning in context
    ("ordbetydelse_i_kontext", re.compile(r"(vad (menas|avses)|innebär (uttrycket|ordet|begreppet|formuleringen|beteckningen)|betyder (ordet|uttrycket)|liktydigt med|synonymt|med (ordet|uttrycket|formuleringen) .{1,30} men|uttrycket ['\"”]|innebörd (lägger|läggs)|motsvarar bäst ['\"”]|vad (åsyftas|avser (text)?författar\w+ med))")),
    # 2) comparison / two-text relation (check early: 'bäst' can also appear here)
    ("jamforelse_relation", re.compile(r"(skillnad(en|er)?|likhet(en|er)?|gemensam|jämför|båda (texterna|inläggen|dikterna|författarna)|de (två|båda) (texter|inlägg|dikter)|text(författarn?a)? [12]\b|inlägg [12]|i motsats till|till skillnad från|förhållandet mellan|förhåller sig.{0,20}(till|,)|resonerar.{0,20}båda)")),
    # 3) main message / summary / best title
    ("huvudbudskap_syfte", re.compile(r"(huvud(saklig|budskap|tanke|poäng|syfte|tes)|övergripande (syfte|mål|tema|budskap|tanke)|textens (syfte|budskap|tema|huvud|tes|poäng)|sammanfattar (texten|innehållet)? ?bäst|överensstämmer bäst|bäst (med|som).{0,20}(textens|hela|rubrik|sammanfattning)|(alternativ )?rubrik|passar bäst som|vill (text)?författar\w+ (visa|ha sagt|förmedla|framföra)|är det (text)?författar\w+ (främst )?vill|framstår som det (viktig|centrala|huvud)|vad vill.{0,25}(säga|visa|framföra|uppnå))")),
    # 4) author stance / evaluation / criticism (recension idiom is strong here)
    ("forfattarens_hallning", re.compile(r"((text)?författar\w+|skribenten|recensenten|artikelförfattar\w+).{0,45}(anser|tycker|menar|hävdar|inställning|hållning|attityd|ställer sig|syn på|uppfattning|värder|kritik|ser som|framhåller)|vilken kritik|vad (anser|tycker|menar|ser|vill|framhåller).{0,25}(recensenten|(text)?författar|skribenten)|inställning tycks|tycks.{0,20}(anse|mena|tycka)|vilken (inställning|hållning|attityd)")),
    # 5) tone / mood / register (rare)
    ("hallning_stamning_ton", re.compile(r"(ton(en|läge|art)?|stämning(en)?|ironi|ironisk|känslol|förhållningssätt|präglas texten|karaktäriser|stilen i)\b")),
    # 6) inference / drawing a conclusion beyond the literal
    ("inference_slutsats", re.compile(r"(kan man (dra|utifrån|av texten)|slutsats|rimlig(t|en|aste)?|antas|troligt|tyder på|indikerar|innebär (rimligen|sannolikt)|underförstått|förutsätter|utifrån (texten|informationen).{0,20}(dra|sluta|anta|påstå)|vad (talar|tyder|antyder|ligger.{0,15}(bakom|till grund))|tycks ligga till grund|av texten att döma.{0,25}(bakom|grund|orsak|syfte))")),
    # 7) structure / function of a text element (+ whole-text characterisation)
    ("struktur_funktion", re.compile(r"(funktion(en)?|vilken roll|syftet med att (nämna|ta upp|inleda|avsluta|citera)|varför (använder|inleder|avslutar|nämner|tar|citerar|väljer|gör (han|hon|textförfattar))|fungerar (stycket|meningen|exemplet|citatet|inledningen)|disposition|hur (är|förhåller sig) texten (uppbyggd|disponerad)|hur kan texten bäst (karakteriseras|beskrivas))")),
    # 8) explicit detail retrieval — the residual, but require a text-anchor
    ("enligt_texten_detalj", re.compile(r"(enligt (texten|artikeln|(text)?författar\w+|skribenten|studien|forskarna|recensenten)|i texten (framgår|sägs|beskrivs|nämns|anges)|vad (framgår|sägs|beskrivs|anges|var|är|blev|har|kan|ville|gör|orsakar)|vilk\w+.{0,35}(nämns|beskrivs|anges|exempel|orsak|skäl|anledning|påstående|svarsförslag|förklaring|följd|resultat|utfall)|ger texten)")),
]

FALLBACK = "detalj_ospecificerad"

# ---- trap-anatomy keyword tags mined from why_tempting -----------------------
TRAP_TAGS = {
    "surface_lexical_echo": re.compile(r"\b(samma ord|nämns i texten|förekommer i texten|finns i texten|ordagrant|exakt.* formulering|återkommer|orden? .* (finns|står)|känns? igen|dyker upp)", re.I),
    "true_but_irrelevant": re.compile(r"\b(sant|stämmer|korrekt.* men|riktigt i sig|är riktigt|visserligen sant|delvis rätt|inte huvud|men (inte|svarar)|besvarar inte frågan|vid sidan)", re.I),
    "overgeneralisation": re.compile(r"\b(alla|alltid|generaliser|för (starkt|långtgående|kategorisk)|överdri|absolut|helt |aldrig|enbart|endast|bara)\b", re.I),
    "detail_as_main": re.compile(r"\b(delspår|delfråga|detalj|biaspekt|ett av (flera|två)|exempel(et)? |en del av|underordnad|bisak|för (specifik|snäv))", re.I),
    "reversed_causality": re.compile(r"\b(omvänd|inverter|kastar om|fel riktning|orsakspil|tvärtom|motsatt|byter (plats|ordning)|förväxlar orsak)", re.I),
    "plausible_worldknowledge": re.compile(r"\b(rimlig|låter (troligt|logiskt|rätt|klokt)|allmän kunskap|verklig|sunt förnuft|utanför texten|egen (kunskap|erfarenhet)|förväntar sig|intuiti)", re.I),
    "scope_shift": re.compile(r"\b(vidgar|snävar|för (brett|vitt|allmänt)|annat (sammanhang|stycke)|fel (stycke|del)|blandar ihop|förväxlar .* med|ett annat)", re.I),
    "half_right_conjunction": re.compile(r"\b(första (ledet|halvan)|andra (ledet|halvan)|ena delen|ihopkoppl|kombiner|två påståenden|dels|men den andra)", re.I),
}


def classify(stem: str) -> str:
    s = stem.lower()
    for label, rx in TYPE_RULES:
        if rx.search(s):
            return label
    return FALLBACK


def tag_traps(exp: dict) -> Counter:
    c = Counter()
    for d in exp.get("distractors", []) or []:
        blob = " ".join(str(d.get(k, "")) for k in ("why_tempting", "why_wrong"))
        for tag, rx in TRAP_TAGS.items():
            if rx.search(blob):
                c[tag] += 1
    return c


def main():
    qs = load_las_questions()
    exps = load_las_explanations()
    rows = []
    type_counts = Counter()
    trap_by_type = defaultdict(Counter)
    n_with_exp = 0
    global_traps = Counter()
    for q in qs:
        t = classify(q["prompt"])
        type_counts[t] += 1
        exp = exps.get(q["qid"])
        traps = tag_traps(exp) if exp else Counter()
        if exp:
            n_with_exp += 1
            for k, v in traps.items():
                trap_by_type[t][k] += v
                global_traps[k] += v
        rows.append(
            {
                "qid": q["qid"],
                "exam_id": q["exam_id"],
                "type": t,
                "prompt": q["prompt"],
                "n_options": len(q.get("options", [])),
                "answer": q.get("answer"),
                "trap_tags": dict(traps),
                "has_explanation": exp is not None,
            }
        )
    (OUTD / "question_types.json").write_text(
        json.dumps({"n_questions": len(qs), "n_with_explanation": n_with_exp,
                    "type_counts": dict(type_counts.most_common()), "rows": rows},
                   ensure_ascii=False, indent=1))
    (OUTD / "trap_tags.json").write_text(
        json.dumps({"global": dict(global_traps.most_common()),
                    "by_type": {k: dict(v.most_common()) for k, v in trap_by_type.items()}},
                   ensure_ascii=False, indent=1))
    print("TYPE COUNTS (n=%d, %d with explanations):" % (len(qs), n_with_exp))
    for k, v in type_counts.most_common():
        print(f"  {v:4d} {100*v/len(qs):4.1f}%  {k}")
    print("\nGLOBAL TRAP TAGS (distractor-instances):")
    for k, v in global_traps.most_common():
        print(f"  {v:4d}  {k}")
    print("\nn_options distribution:", dict(Counter(r["n_options"] for r in rows)))


if __name__ == "__main__":
    main()

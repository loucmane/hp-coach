#!/usr/bin/env python3
"""Build the ELF item-family taxonomy (families.json).

Joins three sources:
  1. frameworks/elf_taxonomy.json      — Layer 1: 8 cognitive operation types
  2. data/explanations/*.json          — Layer 2: per-item framework_id +
                                          distractor anatomy (why_tempting /
                                          why_wrong), technique, pitfall
  3. out/corpus_stats.json             — block/format map from corpus_stats.py

Adds ELF-CLOZE-001 as a 9th family: the gapped-text format items carry no
framework_id in Layer 2 (they are a format, not a reading-comprehension
cognitive op) but are 25% of every ELF sitting and need their own contract.

Difficulty: no item-level ratings exist in the repo (Elo lives in the
production D1 database, not exported); marked "unknown" per family.

Emits ../families.json. Run corpus_stats.py first.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[3]  # repo root
STATS = json.loads((HERE / "out" / "corpus_stats.json").read_text())
TAXONOMY = json.loads((ROOT / "frameworks" / "elf_taxonomy.json").read_text())
EXPL_DIR = ROOT / "data" / "explanations"
OUT = HERE.parent / "families.json"

# ------------------------------------------------------------------ trap tags

TRAP_TAGS = {
    "wrong_location": r"(another|different|other) (text|paragraph|passage|entity|stycke)|elsewhere in|wrong (paragraph|text)|about a different",
    "quantifier_upgrade": r"\b(all|always|every|never|only|entirely|absolute|universal)\b.*(text|passage|claim)|upgrades?|strengthens? .*(hedge|claim)|too strong|overstat",
    "outside_knowledge": r"(not (in|stated in) the (text|passage))|outside knowledge|general knowledge|common sense|plausible but|sounds (true|reasonable)|real-world",
    "surface_word_match": r"(same|repeats?|echo|recycl|borrow|lifts?) (word|words|phrase|vocabulary)|surface match|keyword",
    "polarity_contrast_miss": r"miss(es|ing)? the (contrast|'?but'?|pivot|however)|contrastive|polarity (flip|shift)|ignores? the ('?(but|however|yet)'?|concession|pivot)|reads? past the|skim.*(but|however|contrast)|opposite of what the (text|writer)",
    "too_literal_or_too_far": r"too (literal|far|close|near)|two-step|literal restatement|already stated (verbatim|literally)|one logical (inch|step)",
    "scope_error": r"too (narrow|broad|specific|general)|only (one|part of|a single) (paragraph|detail|example|text)|sub-?point|covers only",
    "collocation_misfit": r"collocat|does not exist in English|idiom|fixed phrase|wrong preposition|word shape|right shape|sounds vaguely|native-like",
    "role_or_attribution_swap": r"(attribut|swap|confus).{0,40}(author|writer|critic|researcher|speaker|source)|someone else's (view|claim)|the (critic|reviewer|quoted)",
    "tone_misread": r"\b(tone|attitude|stance|irony|ironic|sarcas|humou?r)\b",
}


def tag_trap(text: str) -> list[str]:
    tags = [name for name, pat in TRAP_TAGS.items() if re.search(pat, text, re.I)]
    return tags or ["untagged"]


# ------------------------------------------------------------- load Layer 2

qid_format = {}
for b in STATS["blocks"]:
    for qid in b["qids"]:
        qid_format[qid] = b["format"]

fam_items = defaultdict(list)      # family_id -> [qid]
fam_formats = defaultdict(Counter)  # family_id -> format counter
fam_traps = defaultdict(Counter)   # family_id -> trap tag counter
fam_trap_examples = defaultdict(dict)  # family_id -> tag -> (qid, why_tempting)
fam_techniques = defaultdict(list)

for f in sorted(EXPL_DIR.glob("*.json")):
    if f.name.startswith("_"):
        continue
    data = json.loads(f.read_text())
    for qid, e in data.items():
        if "-ELF-" not in qid:
            continue
        fid = e.get("framework_id")
        if fid is None:
            fid = "ELF-CLOZE-001" if qid_format.get(qid) == "cloze" else "ELF-UNTAGGED"
        fam_items[fid].append(qid)
        fam_formats[fid][qid_format.get(qid, "unknown")] += 1
        if e.get("technique"):
            fam_techniques[fid].append((qid, e["technique"]))
        for d in e.get("distractors", []):
            blob = (d.get("why_tempting", "") + " " + d.get("why_wrong", ""))
            for t in tag_trap(blob):
                fam_traps[fid][t] += 1
                fam_trap_examples[fid].setdefault(t, (qid, d.get("why_tempting", "")[:180]))

# ------------------------------------------------------------- assemble

tax_by_id = {e["id"]: e for e in TAXONOMY["entries"]}

CLOZE_ENTRY = {
    "id": "ELF-CLOZE-001",
    "question_type": "Gapped text (cloze) — banked gap fill",
    "notes": (
        "Format family, not a cognitive-op family: one ~355-word text with 5 "
        "numbered gaps (q31–35 of the second verbal pass in every sitting). "
        "Prompts are empty; each gap has 4 alternatives. Tests collocation, "
        "discourse polarity (but/yet/however), register fit, and referential "
        "cohesion rather than passage comprehension."
    ),
}

families = []
order = sorted(fam_items, key=lambda k: -len(fam_items[k]))
for fid in order:
    items = fam_items[fid]
    tax = tax_by_id.get(fid) or (CLOZE_ENTRY if fid == "ELF-CLOZE-001" else {})
    top_traps = [
        {
            "tag": t,
            "count": n,
            "share": round(n / sum(fam_traps[fid].values()), 2),
            "exemplar_qid": fam_trap_examples[fid][t][0],
            "exemplar_why_tempting": fam_trap_examples[fid][t][1],
        }
        for t, n in fam_traps[fid].most_common(6)
        if t != "untagged"
    ]
    families.append(
        {
            "family_id": fid,
            "name": tax.get("question_type", "(untagged residual)"),
            "layer1_source": "frameworks/elf_taxonomy.json" if fid in tax_by_id else None,
            "corpus_frequency": len(items),
            "share_of_elf": round(len(items) / sum(len(v) for v in fam_items.values()), 3),
            "formats": dict(fam_formats[fid].most_common()),
            "exemplar_qids": sorted(items)[:3],
            "trap_anatomy": top_traps,
            "layer1_distractor_patterns": [
                d["pattern"] for d in tax.get("common_distractors", [])
            ],
            "sample_technique": fam_techniques[fid][0][1] if fam_techniques[fid] else None,
            "difficulty_spread": "unknown (no item-level ratings exported from production DB)",
            "notes": tax.get("notes"),
        }
    )

out = {
    "version": 1,
    "generated_by": "pipeline/synthetic/elf/scripts/build_families.py",
    "item_total": sum(len(v) for v in fam_items.values()),
    "families": families,
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"wrote {OUT} with {len(families)} families over {out['item_total']} items")
for fam in families:
    print(f"  {fam['family_id']:16} {fam['corpus_frequency']:>4}  {fam['name'][:50]}  formats={fam['formats']}")

"""Tag ELF questions with framework_id (ELF-TYPE-001..008).

Conservative rules based on prompt shape. Null when ambiguous.
"""
import json
import re
from pathlib import Path

SRC = Path("/home/loucmane/dev/hpfetcher/audit/_verbal_tagging/untagged_ELF.json")
DST = Path("/home/loucmane/dev/hpfetcher/audit/_verbal_tagging/tagged_ELF.json")


def classify(prompt: str) -> str | None:
    """Return ELF-TYPE-NNN or None. Conservative."""
    p = (prompt or "").strip()
    if not p:
        # Empty prompts in ELF correspond to gap-fill / cloze items
        # (e.g. "Gap 31 sits in..."); none of the 8 reading-comprehension
        # types describe them. Leave null.
        return None

    pl = p.lower()
    # Normalize curly quotes/apostrophes → ASCII so regex possessives match.
    for src, dst in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'), ("`", "'")):
        pl = pl.replace(src, dst)
    pl_norm = re.sub(r"\s+", " ", pl)

    # ----- ELF-TYPE-008: Vocabulary / expression in context -----
    # Citerat uttryck + "meant by" / "best corresponds to" / "word best describes" / "expression best reflects"
    if re.search(r"\bmeant by\b", pl_norm):
        return "ELF-TYPE-008"
    if re.search(r"\b(word|phrase|expression)s?\s+best\s+(describe|reflect|character|correspond)", pl_norm):
        # Distinguish "phrase best characterizes <topic>" — that's main/tone, not vocab.
        # Vocab-in-context typically quotes a specific expression inside the prompt.
        # Use quoted-string presence as a stronger signal.
        if re.search(r"[\"‘’“”'']", p):
            return "ELF-TYPE-008"
        # If there's no quoted expression, fall through to other rules.

    # ----- ELF-TYPE-006: Purpose / why mentioned / reason / caused -----
    if pl_norm.startswith("why") or re.match(r"^why[,\s]", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\bmain reason\b", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\b(is|are|was|were)\s+\w+\s+mentioned\b", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\bwhy is\b.*\bmentioned\b", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\bwhat\b[^?]*\bcaused\b", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\bpurpose\b", pl_norm) and not re.search(r"\bmain purpose\b", pl_norm):
        return "ELF-TYPE-006"
    if re.search(r"\bwhat is the point of (including|introducing|mentioning|adding)\b", pl_norm):
        return "ELF-TYPE-006"

    # ----- ELF-TYPE-007: Statement-text agreement (open frame) -----
    # "which of the following ... in line with / in agreement with / in keeping with / in accordance with / according to the text / true"
    if re.search(r"\bwhich of the following\b", pl_norm):
        if re.search(r"\b(in line with|in agreement with|in keeping with|in accordance with|in accord with)\b", pl_norm):
            return "ELF-TYPE-007"
        if re.search(r"\btrue,?\s+according to the text\b", pl_norm):
            return "ELF-TYPE-007"
        if re.search(r"\bis true\b", pl_norm) and re.search(r"\b(statement|conclusion)s?\b", pl_norm):
            return "ELF-TYPE-007"
        # "which of the following phrases/expressions best characterizes/reflects" — main/tone territory
        if re.search(r"\b(phrase|expression|words?)\s+best\b", pl_norm):
            # tone/attitude signal if it mentions attitude/opinion/impression
            if re.search(r"\b(attitude|opinion|impression|view|stance|tone)\b", pl_norm):
                return "ELF-TYPE-005"
            # "best characterizes X" with X being a topic → main idea
            if re.search(r"\bbest character", pl_norm):
                return "ELF-TYPE-004"
            return None
        # Generic "which of the following statements" with no clear framing → likely type 007
        if re.search(r"\bstatements?\b", pl_norm):
            return "ELF-TYPE-007"
        return None

    # ----- ELF-TYPE-005: Tone / attitude / overall stance / reviewer's opinion -----
    if re.search(r"\b(tone|attitude|stance)\b", pl_norm):
        return "ELF-TYPE-005"
    # writer's/author's/reviewer's "overall" or "main impression/view/opinion/attitude"
    if re.search(r"\b(writer|writers|author|reviewer|reviewer's|writer's|author's|reviewers)\b.*\b(overall|impression|opinion|attitude|reaction|view|stance)\b", pl_norm):
        return "ELF-TYPE-005"
    if re.search(r"\boverall\s+(impression|attitude|view|opinion|reaction)\b", pl_norm):
        return "ELF-TYPE-005"
    if re.search(r"\bhow does\b.*\b(regard|view|see|feel|react)\b", pl_norm):
        return "ELF-TYPE-005"
    if re.search(r"\bhow can\b.*\b(opinion|impression|reaction|view|attitude)\b.*\b(summari[sz]ed|characteri[sz]ed|described)\b", pl_norm):
        return "ELF-TYPE-005"
    # "what is X's opinion / view of ..." — named person's stance
    if re.search(r"\b\w+[’'`]s\s+(opinion|view|stance|attitude|impression|reaction)\b", pl_norm):
        return "ELF-TYPE-005"

    # ----- ELF-TYPE-004: Main idea / main point / main argument / main focus / main claim -----
    if re.search(r"\bmain\s+(point|argument|claim|focus|conclusion|impression|idea|message|contention|theme|subject|aim)\b", pl_norm):
        # main impression already routed to type 005 above if "writer/reviewer" present.
        return "ELF-TYPE-004"
    if re.search(r"\bmain view\b", pl_norm):
        return "ELF-TYPE-005" if re.search(r"\b(author|writer|reviewer)", pl_norm) else "ELF-TYPE-004"
    if re.search(r"\bbasic\s+(point|impression|message|argument|view)\b", pl_norm):
        if re.search(r"\bimpression\b|\bview\b", pl_norm) and re.search(r"\b(writer|author|reviewer)", pl_norm):
            return "ELF-TYPE-005"
        return "ELF-TYPE-004"
    if re.search(r"\bgeneral\s+(point|picture|impression|view)\b", pl_norm):
        if re.search(r"\bimpression\b|\bview\b", pl_norm) and re.search(r"\b(writer|author|reviewer)", pl_norm):
            return "ELF-TYPE-005"
        return "ELF-TYPE-004"

    # ----- ELF-TYPE-003: Logical conclusion / synthesis -----
    # "can be concluded" / "may be concluded" / "conclusion may be drawn" / "general conclusion" / "overall conclusion"
    if re.search(r"\b(can|may|might)\s+be\s+concluded\b", pl_norm):
        return "ELF-TYPE-003"
    if re.search(r"\bconclusion\s+(may|can|might)\s+be\s+drawn\b", pl_norm):
        return "ELF-TYPE-003"
    if re.search(r"\bwhat\s+(overall|general)\s+conclusion\b", pl_norm):
        return "ELF-TYPE-003"
    if re.search(r"\bgeneral conclusion\b", pl_norm):
        return "ELF-TYPE-003"
    if re.search(r"\bwhat is concluded\b", pl_norm):
        return "ELF-TYPE-003"

    # ----- ELF-TYPE-002: Inference / implied -----
    if re.search(r"\b(implied|implies|implication|imply)\b", pl_norm):
        return "ELF-TYPE-002"
    if re.search(r"\bwhat is suggested\b", pl_norm):
        return "ELF-TYPE-002"
    if re.search(r"\b(suggests|hint|hints)\b", pl_norm):
        return "ELF-TYPE-002"

    # ----- ELF-TYPE-001: Direct detail retrieval -----
    # "what is said", "what are we told", "what is stated", "what, according to the text", "what is claimed", "what is argued"
    if re.search(r"\bwhat (is|are) (said|stated|told|claimed|argued)\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat are we told\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat,?\s+according to\b", pl_norm):
        # "What, according to the text/writer/researcher X, ..." — direct retrieval
        return "ELF-TYPE-001"
    if re.search(r"\baccording to the text\b", pl_norm) and pl_norm.startswith("what"):
        return "ELF-TYPE-001"
    if re.search(r"\baccording to\b", pl_norm) and pl_norm.startswith("what") and not re.search(r"\bmain\b|\bimplied\b|\bconcluded\b|\bopinion\b|\battitude\b|\bview\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat is (further\s+)?(said|stated|claimed|argued|told)\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat (does|do)\b.*\b(say|note|tell us|claim|state|argue|report|mention|reveal|show|indicate)\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat (has|have)\s+\w+\s+(found|shown|noted|observed|reported|argued|claimed|stated|said|told)\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat was (shown|found|noted|observed|reported|said|claimed|stated|argued|special|the\b)\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bin what way\b", pl_norm):
        return "ELF-TYPE-001"
    if re.search(r"\bwhat is true\b", pl_norm):
        # "what is true according to the opening paragraph" — direct retrieval of a stated fact
        return "ELF-TYPE-001"
    if re.search(r"\bwhat is the most accurate description\b", pl_norm):
        # asks for a described/stated fact in the text
        return "ELF-TYPE-001"
    if re.search(r"\bwhat did\b", pl_norm):
        # "what did X claim/say/do" — retrieval
        return "ELF-TYPE-001"
    if re.search(r"^how (did|do|does|has|have)\b", pl_norm):
        # how does X relate / how did Y affect — typically retrieval of a stated relation
        # Skip if it actually expresses opinion (already caught above).
        return "ELF-TYPE-001"
    if re.search(r"^how can\b.*\bbest be (described|characteri[sz]ed|summari[sz]ed)\b", pl_norm):
        # "how can the Cacaxtla culture best be characterized" — characterizing a topic = main idea
        return "ELF-TYPE-004"

    # ----- Additional main-idea catches -----
    if re.search(r"\bwhat is this text (mainly )?about\b", pl_norm):
        return "ELF-TYPE-004"
    if re.search(r"\bwhat is the main\b", pl_norm):
        # already caught most via "main + noun" rule, but safety net
        return "ELF-TYPE-004"

    # Fallback: leave null
    return None


def main():
    data = json.loads(SRC.read_text())
    items = data["items"]

    tagged = []
    counts = {}
    for it in items:
        tag = classify(it["prompt"])
        out = {
            "qid": it["qid"],
            "section": "ELF",
            "framework_id": tag,
        }
        tagged.append(out)
        counts[tag] = counts.get(tag, 0) + 1

    out_doc = {"section": "ELF", "items": tagged}
    DST.write_text(json.dumps(out_doc, ensure_ascii=False, indent=2))

    total = len(tagged)
    null_n = counts.get(None, 0)
    tagged_n = total - null_n
    print(f"ELF: tagged {tagged_n} / {total} ({null_n} null)")
    print("Per-type:")
    for k in sorted(counts.keys(), key=lambda x: (x is None, x or "")):
        print(f"  {k}: {counts[k]}")


if __name__ == "__main__":
    main()

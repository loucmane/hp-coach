#!/usr/bin/env python3
"""ELF corpus structural statistics.

Reads the parsed question bank (data/parsed/*.json in the main checkout;
override with HP_PARSED_DIR) and emits:
  - out/corpus_stats.json  (machine-readable, committed)
  - stdout tables          (pasted into ../corpus-analysis.md)

Empirical scope rules (see corpus-analysis.md §1):
  - A context is "real" if it has > 50 words; shorter contexts are parser
    residue (usually just a surviving title) and are excluded from passage
    stats but their questions still count for format/stem stats.
  - host-ver2-2019 duplicates host-ver1-2019's ELF block byte-for-byte and
    is excluded from passage-level stats (kept in per-exam table).

No third-party deps. Python 3.10+.
"""

import json
import os
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

PARSED_DIR = Path(os.environ.get("HP_PARSED_DIR", "/home/loucmane/dev/hpfetcher/data/parsed"))
OUT = Path(__file__).parent / "out" / "corpus_stats.json"
REAL_CONTEXT_MIN_WORDS = 50
DEDUP_EXAMS = {"host-ver2-2019"}  # identical ELF block to host-ver1-2019

CLOZE_MARKER = "there are gaps which indicate"


# ---------------------------------------------------------------- text metrics

VOWELS = "aeiouy"


def count_syllables(word: str) -> int:
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    groups = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee", "ye")) and groups > 1:
        groups -= 1
    return max(1, groups)


def sentences(text: str) -> list[str]:
    # Strip headings (short lines without terminal punctuation) first.
    body = " ".join(
        l.strip()
        for l in text.split("\n")
        if l.strip() and not is_heading(l.strip())
    )
    parts = re.split(r"(?<=[.!?])\s+(?=[\"“‘']?[A-Z0-9])", body)
    return [p for p in parts if len(p.split()) >= 2]


def is_heading(line: str) -> bool:
    return len(line.split()) <= 8 and not re.search(r"[.?!,;:]$", line) and line[:1].isupper()


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z''-]*", text)


def text_metrics(text: str) -> dict:
    sents = sentences(text)
    ws = words(text)
    n_w = len(ws)
    n_s = max(1, len(sents))
    syl = sum(count_syllables(w) for w in ws)
    poly = sum(1 for w in ws if count_syllables(w) >= 3)
    long7 = sum(1 for w in ws if len(w) >= 7)
    latinate = sum(
        1
        for w in ws
        if re.search(r"(tion|sion|ment|ence|ance|ity|ous|ive|ical|ism)s?$", w.lower())
    )
    asl = n_w / n_s
    aspw = syl / max(1, n_w)
    flesch = 206.835 - 1.015 * asl - 84.6 * aspw
    fk_grade = 0.39 * asl + 11.8 * aspw - 15.59
    # SMOG needs 30 sentences; report scaled variant anyway (approximate).
    smog = 1.0430 * (poly * (30 / n_s)) ** 0.5 + 3.1291
    ttr = len({w.lower() for w in ws}) / max(1, n_w)
    sent_lens = [len(words(s)) for s in sents]
    return {
        "words": n_w,
        "sentences": len(sents),
        "avg_sentence_len": round(asl, 1),
        "sentence_len_sd": round(statistics.pstdev(sent_lens), 1) if len(sent_lens) > 1 else 0.0,
        "sentence_len_min": min(sent_lens, default=0),
        "sentence_len_max": max(sent_lens, default=0),
        "flesch_reading_ease": round(flesch, 1),
        "fk_grade": round(fk_grade, 1),
        "smog_approx": round(smog, 1),
        "pct_polysyllabic": round(100 * poly / max(1, n_w), 1),
        "pct_words_7plus_chars": round(100 * long7 / max(1, n_w), 1),
        "pct_latinate_suffix": round(100 * latinate / max(1, n_w), 1),
        "type_token_ratio": round(ttr, 3),
        "paragraphs": len([p for p in re.split(r"\n\s*\n", text) if len(p.split()) > 10]),
    }


# ---------------------------------------------------------------- stem typing

STEM_RULES = [
    ("cloze_gap", lambda p, c: p.strip() == "" or (c and CLOZE_MARKER in c)),
    ("main_idea", lambda p, c: re.search(r"\b(main|mainly|primarily|best (title|summar)|overall)\b", p, re.I)),
    ("attitude_tone", lambda p, c: re.search(r"\b(attitude|tone|feel about|view of|opinion of|stance)\b", p, re.I)),
    ("purpose", lambda p, c: re.search(r"\b(purpose|in order to|why does the (writer|author))\b", p, re.I)),
    ("inference", lambda p, c: re.search(r"\b(implied|imply|implies|suggest(s|ed)?|inferred|can be understood)\b", p, re.I)),
    ("conclusion", lambda p, c: re.search(r"\b(conclu|in line with|in agreement with|in keeping with|consistent with|follows from)\b", p, re.I)),
    ("vocab_in_context", lambda p, c: re.search(r"\b(word|expression|phrase|statement)\b.*\b(mean|meant|refer|closest)\b|\bmeant by\b", p, re.I)),
    ("argument_claim", lambda p, c: re.search(r"\b(argu|claim|basic point|point (made|of))\b", p, re.I)),
    ("main_idea", lambda p, c: re.search(r"\bbest be (described|characteri[sz]ed)\b", p, re.I)),  # second pass
    ("detail_stated", lambda p, c: re.search(r"\b(told|said|stated|according to|learn about|find out|mentioned|shown|does the (text|passage|writer) say)\b", p, re.I)),
    ("detail_specific", lambda p, c: re.search(r"^\s*(what|which|how|why|in what way|when|where|who)\b", p, re.I)),
]


def stem_type(prompt: str, context: str | None) -> str:
    for name, fn in STEM_RULES:
        if fn(prompt or "", context or ""):
            return name
    return "other"


# ---------------------------------------------------------------- block model


def block_format(n_questions: int, ctx_words: int, is_cloze: bool) -> str:
    if is_cloze:
        return "cloze"
    if n_questions >= 4:
        return "long_passage"
    if n_questions in (2, 3):
        return "short_texts_bundle"  # bundle of 1q-per-mini-text items
    return "single_short_text"


def extract_titles(text: str) -> list[str]:
    return [l.strip() for l in text.split("\n") if l.strip() and is_heading(l.strip())]


PUBLICATION_RE = re.compile(
    r"(Scientific American(?: Mind)?|The Economist|History Today|New Scientist|"
    r"Psychology Today|Psychologies Magazine|New Statesman|National Geographic[\w ]*|"
    r"American Scientist|The Guardian[\w ]*|International New York Times|"
    r"The New York Times[\w ]*|Literary Review|New African|Archaeology|Time\b|"
    r"BBC[\w ]*|Financial Times|The Independent|The Observer|The Telegraph|"
    r"Smithsonian[\w ]*|Aeon|Prospect|The Atlantic|Harper's|The Spectator|"
    r"[A-Z][\w ]*(?:Magazine|Review|Journal|Quarterly|Weekly|Monthly))"
)


def extract_publications(text: str) -> list[str]:
    """Publication names from byline/heading lines of a passage."""
    pubs = []
    for line in text.split("\n"):
        line = line.strip()
        if line and len(line.split()) <= 12:
            m = PUBLICATION_RE.search(line)
            if m:
                pubs.append(m.group(1).strip())
    return pubs


def main() -> None:
    files = sorted(PARSED_DIR.glob("*.json"))
    per_exam = []
    blocks = []
    stem_counter = Counter()
    stem_by_format = defaultdict(Counter)
    option_word_lens = []
    cloze_option_word_lens = []
    mainidea_positions = Counter()

    for f in files:
        if f.name == "_index.json":
            continue
        exam = f.stem
        data = json.loads(f.read_text())
        elf = [q for q in data if q.get("section") == "ELF"]
        n_missing = sum(1 for q in elf if not q.get("context"))
        n_tiny = sum(
            1 for q in elf if q.get("context") and len(q["context"].split()) <= REAL_CONTEXT_MIN_WORDS
        )
        per_exam.append(
            {
                "exam_id": exam,
                "elf_questions": len(elf),
                "missing_context": n_missing,
                "tiny_context": n_tiny,
                "trust": "full" if n_missing + n_tiny <= 1 else ("partial" if n_missing + n_tiny <= 3 else "degraded"),
                "dedup_excluded": exam in DEDUP_EXAMS,
            }
        )

        # group into blocks by (provpass, context)
        grouped: dict[tuple, list] = defaultdict(list)
        for q in elf:
            grouped[(q["provpass"], q.get("context") or f"<NONE:{q['qid']}>")].append(q)

        for (pp, ctx), qs in grouped.items():
            qs.sort(key=lambda q: q["number"])
            has_ctx = not ctx.startswith("<NONE:")
            ctx_w = len(ctx.split()) if has_ctx else 0
            is_cloze = has_ctx and CLOZE_MARKER in ctx
            fmt = block_format(len(qs), ctx_w, is_cloze)
            real = has_ctx and ctx_w > REAL_CONTEXT_MIN_WORDS
            b = {
                "exam_id": exam,
                "provpass": pp,
                "q_from": qs[0]["number"],
                "q_to": qs[-1]["number"],
                "n_questions": len(qs),
                "format": fmt,
                "context_words": ctx_w,
                "real_context": real,
                "titles": extract_titles(ctx) if real else [],
                "publications": extract_publications(ctx) if real else [],
                "qids": [q["qid"] for q in qs],
            }
            if real and exam not in DEDUP_EXAMS:
                b["metrics"] = text_metrics(ctx)
                if is_cloze:
                    gaps = re.findall(r"\s(\d{2})\s", ctx)
                    b["cloze_gap_count"] = len([g for g in gaps if 31 <= int(g) <= 40])
            blocks.append(b)

            for i, q in enumerate(qs):
                st = stem_type(q["prompt"], ctx if has_ctx else None)
                stem_counter[st] += 1
                stem_by_format[fmt][st] += 1
                if st == "main_idea" and fmt == "long_passage":
                    mainidea_positions[i + 1] += 1
                for o in q.get("options", []):
                    wl = len(o["text"].split())
                    (cloze_option_word_lens if st == "cloze_gap" else option_word_lens).append(wl)

    # -------- aggregates over real, deduped blocks
    def agg(fmt: str, key: str):
        vals = [
            b["metrics"][key]
            for b in blocks
            if b["format"] == fmt and b.get("metrics")
        ]
        if not vals:
            return None
        return {
            "n": len(vals),
            "mean": round(statistics.mean(vals), 1),
            "median": round(statistics.median(vals), 1),
            "min": round(min(vals), 1),
            "max": round(max(vals), 1),
            "sd": round(statistics.pstdev(vals), 1),
        }

    fmt_counts = Counter(b["format"] for b in blocks if b["exam_id"] not in DEDUP_EXAMS)
    metric_keys = [
        "words", "sentences", "avg_sentence_len", "sentence_len_sd",
        "flesch_reading_ease", "fk_grade", "smog_approx",
        "pct_polysyllabic", "pct_words_7plus_chars", "pct_latinate_suffix",
        "type_token_ratio", "paragraphs",
    ]
    format_stats = {
        fmt: {k: agg(fmt, k) for k in metric_keys} for fmt in sorted(fmt_counts)
    }

    pub_counter = Counter(
        p
        for b in blocks
        if b["exam_id"] not in DEDUP_EXAMS
        for p in b.get("publications", [])
    )

    result = {
        "publication_counts": dict(pub_counter.most_common()),
        "per_exam": per_exam,
        "format_block_counts": dict(fmt_counts),
        "format_stats": format_stats,
        "stem_type_counts": dict(stem_counter.most_common()),
        "stem_by_format": {k: dict(v.most_common()) for k, v in stem_by_format.items()},
        "main_idea_position_in_long_block": dict(sorted(mainidea_positions.items())),
        "option_word_len": {
            "reading": {
                "mean": round(statistics.mean(option_word_lens), 1),
                "median": statistics.median(option_word_lens),
                "max": max(option_word_lens),
            },
            "cloze": {
                "mean": round(statistics.mean(cloze_option_word_lens), 1),
                "median": statistics.median(cloze_option_word_lens),
                "max": max(cloze_option_word_lens),
            },
        },
        "blocks": blocks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1))

    # -------- stdout tables
    print("== per-exam completeness ==")
    print(f"{'exam':16} {'q':>3} {'no-ctx':>6} {'tiny':>5} trust")
    for r in per_exam:
        print(f"{r['exam_id']:16} {r['elf_questions']:>3} {r['missing_context']:>6} {r['tiny_context']:>5} {r['trust']}"
              + ("  (dedup-excluded)" if r["dedup_excluded"] else ""))
    print("\n== block format counts (dedup) ==")
    for k, v in fmt_counts.most_common():
        print(f"  {k:20} {v}")
    print("\n== stem types ==")
    for k, v in stem_counter.most_common():
        print(f"  {k:20} {v}")
    print("\n== format x metric ==")
    for fmt, ms in format_stats.items():
        print(f"  [{fmt}]")
        for k, v in ms.items():
            if v:
                print(f"    {k:24} mean={v['mean']:>7} median={v['median']:>7} sd={v['sd']:>6} range=[{v['min']},{v['max']}] n={v['n']}")
    print("\n== main-idea question position within long 5q block ==")
    print("  ", dict(sorted(mainidea_positions.items())))
    print("\n== attributed publications (all real blocks, dedup) ==")
    for k, v in pub_counter.most_common():
        print(f"  {k:36} {v}")
    print("\n== titles of real long passages (dedup) ==")
    for b in blocks:
        if b["format"] == "long_passage" and b.get("metrics"):
            print(f"  {b['exam_id']:14} {b['provpass']} q{b['q_from']}-{b['q_to']}  {b['metrics']['words']:>4}w  {' / '.join(b['titles'][:2])}")


if __name__ == "__main__":
    sys.exit(main())

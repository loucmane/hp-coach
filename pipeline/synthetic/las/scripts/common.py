"""Shared loaders + text metrics for the LÄS corpus analysis.

Data location: the parsed question bank lives at <repo>/data/parsed/*.json
(one file per exam). This module resolves the repo root by walking up from
this file, and falls back to the canonical checkout path if the current
worktree does not carry data/parsed (it is gitignored in some worktrees).

Passage model: within one (exam_id, provpass), consecutive LÄS questions
share an identical `context` string -> one passage unit with 2 or 4 questions.
"""

from __future__ import annotations

import json
import math
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

FALLBACK_DATA = Path("/home/loucmane/dev/hpfetcher/data/parsed")


def parsed_dir() -> Path:
    here = Path(__file__).resolve()
    for p in here.parents:
        cand = p / "data" / "parsed"
        if cand.is_dir():
            return cand
    if FALLBACK_DATA.is_dir():
        return FALLBACK_DATA
    raise FileNotFoundError("data/parsed not found from cwd or fallback")


def explanations_dir() -> Path:
    here = Path(__file__).resolve()
    for p in here.parents:
        cand = p / "data" / "explanations"
        if cand.is_dir():
            return cand
    raise FileNotFoundError("data/explanations not found")


def load_las_questions() -> list[dict]:
    qs = []
    for f in sorted(parsed_dir().glob("*.json")):
        if f.name.startswith("_"):
            continue
        for q in json.loads(f.read_text()):
            if q.get("section") == "LÄS":
                qs.append(q)
    return qs


def load_las_explanations() -> dict[str, dict]:
    out = {}
    for f in sorted(explanations_dir().glob("*.json")):
        if f.name.startswith("_"):
            continue
        try:
            d = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        if not isinstance(d, dict):
            continue
        for qid, exp in d.items():
            if "-LÄS-" in qid:
                out[qid] = exp
    return out


def group_passages(qs: list[dict]) -> list[dict]:
    """Group LÄS questions into passage units keyed by (exam, provpass, context)."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for q in qs:
        groups[(q["exam_id"], q["provpass"], q["context"])].append(q)
    passages = []
    for (exam, pp, ctx), qlist in groups.items():
        qlist.sort(key=lambda q: q["number"])
        title, body = split_title(ctx)
        passages.append(
            {
                "exam_id": exam,
                "provpass": pp,
                "title": title,
                "text": body,
                "raw": ctx,
                "n_questions": len(qlist),
                "qids": [q["qid"] for q in qlist],
                "questions": qlist,
            }
        )
    passages.sort(key=lambda p: (p["exam_id"], p["provpass"], p["questions"][0]["number"]))
    return passages


TITLE_MAX_WORDS = 12


def split_title(ctx: str) -> tuple[str | None, str]:
    """LÄS passages open with a short title line followed by a blank line."""
    parts = ctx.split("\n\n", 1)
    if len(parts) == 2 and len(parts[0].split()) <= TITLE_MAX_WORDS and not parts[0].rstrip().endswith((".", "?", "!")):
        return parts[0].strip(), parts[1].strip()
    return None, ctx.strip()


# ---------------------------------------------------------------- text metrics

# De-hyphenate PDF line-break artifacts like "undervisningsfor- men".
DEHYPH = re.compile(r"(\w)- (\w)")
WORD_RE = re.compile(r"[A-Za-zÅÄÖåäöÉé]+(?:-[A-Za-zÅÄÖåäöÉé]+)*")
SENT_END = re.compile(r"(?<=[.!?])\s+(?=[A-ZÅÄÖ”\"”])")
ABBREV = ("t.ex.", "bl.a.", "s.k.", "dvs.", "m.m.", "osv.", "etc.", "jfr.", "ca.", "f.d.", "p.g.a.", "t.o.m.", "fr.o.m.")


def clean_text(t: str) -> str:
    t = unicodedata.normalize("NFC", t)
    t = DEHYPH.sub(r"\1\2", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


def paragraphs(t: str) -> list[str]:
    return [p.strip() for p in t.split("\n\n") if p.strip()]


def sentences(t: str) -> list[str]:
    flat = re.sub(r"\s*\n\s*", " ", t)
    # protect common Swedish abbreviations from the naive splitter
    for i, a in enumerate(ABBREV):
        flat = flat.replace(a, a.replace(".", f"\x00{i}\x00"))
    sents = SENT_END.split(flat)
    out = []
    for s in sents:
        for i, a in enumerate(ABBREV):
            s = s.replace(a.replace(".", f"\x00{i}\x00"), a)
        s = s.strip()
        if s:
            out.append(s)
    return out


def words(t: str) -> list[str]:
    return WORD_RE.findall(t)


def lix(t: str) -> float:
    """LIX = words/sentences + 100 * longwords(>6 chars)/words."""
    w = words(t)
    s = sentences(t)
    if not w or not s:
        return 0.0
    long_w = sum(1 for x in w if len(x) > 6)
    return len(w) / len(s) + 100.0 * long_w / len(w)


def type_token_ratio(t: str) -> float:
    w = [x.lower() for x in words(t)]
    return len(set(w)) / len(w) if w else 0.0


def pct(xs, q):
    xs = sorted(xs)
    if not xs:
        return 0.0
    k = (len(xs) - 1) * q
    lo, hi = math.floor(k), math.ceil(k)
    if lo == hi:
        return float(xs[lo])
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def summarize(xs) -> dict:
    xs = list(xs)
    return {
        "n": len(xs),
        "mean": round(sum(xs) / len(xs), 1) if xs else None,
        "min": round(min(xs), 1) if xs else None,
        "p10": round(pct(xs, 0.10), 1),
        "p25": round(pct(xs, 0.25), 1),
        "median": round(pct(xs, 0.50), 1),
        "p75": round(pct(xs, 0.75), 1),
        "p90": round(pct(xs, 0.90), 1),
        "max": round(max(xs), 1) if xs else None,
    }

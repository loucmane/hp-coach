#!/usr/bin/env python3
"""Calibrate pipeline/synthetic/gates/bands.json from the authentic corpus.

Measures passage_words, paragraph_count, mean_sentence_words, prompt_words,
option_words, option_length_ratio over every trustworthy LÄS and ELF passage
in data/parsed/*.json, using mech.py's OWN tokenize()/sentences() functions
(imported, not reimplemented) so calibration and the M-BANDS gate can never
drift into a unit mismatch — that mismatch is the exact failure mode this
script exists to prevent.

Also runs the plagiarism null calibration (authentic-vs-authentic n-gram
overlap) using mech.py's own Corpus/gate_plagiarism machinery, and prints a
positive control against the known byte-identical host-ver1-2019 /
host-ver2-2019 ELF duplicate pair.

Usage:
    python3 calibrate_bands.py [--parsed-dir DIR] [--write] [--tolerance 0.05]

Pure stdlib. Deterministic given the corpus snapshot (only external input).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

GATES_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))
from mech import Corpus, context_key, tokenize, sentences, _ngrams  # noqa: E402

DEFAULT_PARSED_DIR = Path("/home/loucmane/dev/hpfetcher/data/parsed")

# ELF sittings excluded from passage-level text metrics: the 2013-2016 embargo
# losses (both long passages missing/degraded per elf/corpus-analysis.md §1)
# and the byte-identical host-ver2-2019 duplicate of host-ver1-2019.
ELF_DEGRADED_SITTINGS = {
    "host-2013", "host-2014", "host-2015", "host-2016",
    "var-2013", "var-2014", "var-2015",
}
ELF_DEDUP_EXCLUDED = {"host-ver2-2019"}
ELF_REAL_CONTEXT_MIN_WORDS = 50  # elf/scripts/corpus_stats.py REAL_CONTEXT_MIN_WORDS
CLOZE_MARKER = "there are gaps which indicate"  # elf/scripts/corpus_stats.py CLOZE_MARKER

TITLE_MAX_WORDS = 12  # las/scripts/common.py TITLE_MAX_WORDS (structural split, not a text metric)

# Every ELF cloze context in the corpus opens with this EXACT fixed
# instruction paragraph (verified byte-identical across all 18 trustworthy
# cloze blocks) before the title/body. It is exam-format boilerplate, not
# passage content: a generated cloze item legitimately reuses this same
# required instruction, so leaving it in would (a) inflate cloze
# passage_words/paragraph_count by ~40 words of non-content text and (b)
# make every authentic cloze item look like a ~40-gram plagiarism hit
# against every other cloze item in the null calibration below (that is
# exactly what was observed before this strip: 18/271 probes -- precisely
# the cloze count -- plateaued as "shared" out to n=25). Stripped before any
# stat is measured or any text is plagiarism-probed.
CLOZE_INSTRUCTION_PREFIX = (
    "In the following text there are gaps which indicate that something has "
    "been left out. Look at the four alternatives that correspond to each "
    "gap and decide which one best fits the gap. Then mark your choice on "
    "your answer sheet."
)


def strip_cloze_instruction(ctx: str) -> str:
    first, _, rest = ctx.partition("\n\n")
    if first.strip() == CLOZE_INSTRUCTION_PREFIX:
        return rest.strip()
    return ctx

TOLERANCE = 0.05  # +/-5% widening applied to every measured [min, max] band.
# Justification: the calibration corpus (174 LÄS passages, ~140 trustworthy
# ELF blocks) is a finite sample of the true generating population. A future
# authentic passage half a percentile beyond today's observed extreme is not
# a defect. 5% is small enough to still reject genuinely out-of-distribution
# synthetic output (bands.json's own hard hint: LÄS long/short bands barely
# overlap even at p10-p90) but large enough to absorb ordinary sampling
# variance at n~100-200 per class. This mirrors the "central tendency +
# small guard margin" convention already used for option_length_ratio_max.


# ---------------------------------------------------------------- corpus load

def load_exam_files(parsed_dir: Path):
    for f in sorted(parsed_dir.glob("*.json")):
        if f.name.startswith("_"):
            continue
        yield f.stem, json.loads(f.read_text(encoding="utf-8"))


def split_title(ctx: str) -> tuple[str | None, str]:
    """Mirrors las/scripts/common.py:split_title. Structural (title-line vs
    body), not a text-length metric -- reimplemented here (rather than
    imported from the read-only las/ tree) to keep this script self-contained.
    """
    parts = ctx.split("\n\n", 1)
    if len(parts) == 2 and len(parts[0].split()) <= TITLE_MAX_WORDS and not parts[0].rstrip().endswith((".", "?", "!")):
        return parts[0].strip(), parts[1].strip()
    return None, ctx.strip()


def las_passages(parsed_dir: Path) -> list[dict]:
    """Group complete-parsing LÄS questions into passage units. A passage is
    included only if EVERY question sharing its context has parsing_status
    'complete' (otherwise the passage/question text may be unreliable)."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for exam_id, rows in load_exam_files(parsed_dir):
        for q in rows:
            if q.get("section") != "LÄS":
                continue
            groups[(exam_id, q["provpass"], q["context"])].append(q)
    passages = []
    excluded_incomplete = 0
    for (exam_id, pp, ctx), qs in groups.items():
        if not all(q.get("parsing_status") == "complete" for q in qs):
            excluded_incomplete += 1
            continue
        title, body = split_title(ctx)
        n = len(qs)
        cls = {4: "long", 2: "short"}.get(n)
        if cls is None:
            continue  # never 1, never 3 per las/corpus-analysis.md -- guard anyway
        passages.append({"exam_id": exam_id, "provpass": pp, "class": cls,
                          "title": title, "body": body, "raw_context": ctx, "questions": qs})
    print(f"[LÄS] {len(passages)} passages usable "
          f"({excluded_incomplete} excluded: incomplete parsing_status)", file=sys.stderr)
    return passages


def elf_blocks(parsed_dir: Path) -> list[dict]:
    """Group complete-parsing ELF questions into passage blocks, restricted to
    the trustworthy scope from elf/corpus-analysis.md §1: exclude the
    2013-2016 degraded sittings, exclude the host-ver2-2019 byte-identical
    duplicate, keep only 'real' contexts (>50 words, i.e. not parser
    micro-text residue)."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    excluded_sitting = excluded_incomplete = excluded_tiny = 0
    for exam_id, rows in load_exam_files(parsed_dir):
        if exam_id in ELF_DEGRADED_SITTINGS or exam_id in ELF_DEDUP_EXCLUDED:
            continue
        for q in rows:
            if q.get("section") != "ELF":
                continue
            groups[(exam_id, q["provpass"], q.get("context") or f"<NONE:{q['qid']}>")].append(q)
    blocks = []
    for (exam_id, pp, ctx), qs in groups.items():
        if ctx.startswith("<NONE:"):
            continue
        if not all(q.get("parsing_status") == "complete" for q in qs):
            excluded_incomplete += 1
            continue
        if len(ctx.split()) <= ELF_REAL_CONTEXT_MIN_WORDS:
            excluded_tiny += 1
            continue
        is_cloze = CLOZE_MARKER in ctx.lower()
        n = len(qs)
        if is_cloze:
            cls = "cloze"
        elif n >= 4:
            cls = "long_passage"
        else:
            cls = "short_text"
        content_ctx = strip_cloze_instruction(ctx) if is_cloze else ctx
        title, body = split_title(content_ctx)
        blocks.append({"exam_id": exam_id, "provpass": pp, "class": cls,
                        "title": title, "body": body, "raw_context": ctx, "questions": qs})
    print(f"[ELF] {len(blocks)} blocks usable ({excluded_incomplete} excluded: incomplete "
          f"parsing_status, {excluded_tiny} excluded: tiny/residue context, sittings excluded: "
          f"{sorted(ELF_DEGRADED_SITTINGS | ELF_DEDUP_EXCLUDED)})", file=sys.stderr)
    return blocks


# ---------------------------------------------------------------- stats over passages

def passage_stats(passages: list[dict]) -> dict:
    """{stat: {class: [values]}} for passage_words / paragraph_count /
    mean_sentence_words, using mech.tokenize / mech.sentences (the exact
    functions M-BANDS calls). Keyed stat-first to match how bands.json and
    the caller address it (mirrors the bands.json section shape)."""
    out: dict[str, dict[str, list[float]]] = {
        "passage_words": defaultdict(list),
        "paragraph_count": defaultdict(list),
        "mean_sentence_words": defaultdict(list),
    }
    for p in passages:
        body = p["body"]
        words = tokenize(body)
        paras = [x for x in re.split(r"\n\s*\n", body) if x.strip()]
        sents = sentences(body)
        out["passage_words"][p["class"]].append(len(words))
        out["paragraph_count"][p["class"]].append(len(paras))
        if sents:
            out["mean_sentence_words"][p["class"]].append(round(len(words) / len(sents), 1))
    return out


def question_stats(passages: list[dict], prompt_class=lambda p: "any", option_class=lambda p: "any") -> dict:
    """Per-class lists of prompt_words / option_words / option_length_ratio,
    again via mech.tokenize."""
    out: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for p in passages:
        pc = prompt_class(p)
        oc = option_class(p)
        for q in p["questions"]:
            out[pc]["prompt_words"].append(len(tokenize(q.get("prompt") or "")))
            lens = [len(tokenize(o.get("text", ""))) for o in q.get("options") or []]
            for n in lens:
                out[oc]["option_words"].append(n)
            if lens and min(lens) > 0:
                out[oc]["option_length_ratio"].append(round(max(lens) / min(lens), 2))
    return out


def band_from_values(values: list[float], tolerance: float, integer: bool = False) -> dict:
    lo, hi = min(values), max(values)
    lo_w = lo * (1 - tolerance)
    hi_w = hi * (1 + tolerance)
    if integer:
        lo_w = max(0, int(lo_w // 1))
        hi_w = int(hi_w) + (1 if hi_w % 1 else 0)
    else:
        lo_w = round(lo_w, 1)
        hi_w = round(hi_w, 1)
    return {"min": lo_w, "max": hi_w, "_n": len(values), "_observed_min": lo, "_observed_max": hi}


def bands_list(cls_values: dict[str, list[float]], tolerance: float, integer: bool = False) -> list[dict]:
    out = []
    for cls, values in sorted(cls_values.items()):
        if not values:
            continue
        b = band_from_values(values, tolerance, integer=integer)
        b["class"] = cls
        out.append(b)
    # keep declared order stable: class first
    return [{"class": b["class"], "min": b["min"], "max": b["max"],
              "_n": b["_n"], "_observed_min": b["_observed_min"], "_observed_max": b["_observed_max"]}
             for b in out]


def strip_debug(bands_list_: list[dict]) -> list[dict]:
    return [{"class": b["class"], "min": b["min"], "max": b["max"]} for b in bands_list_]


# ---------------------------------------------------------------- plagiarism null

def probe_text(p: dict) -> str:
    parts = [p.get("title") or "", p["body"]]
    for q in p["questions"]:
        parts.append(q.get("prompt") or "")
        parts.extend(o.get("text", "") for o in q.get("options") or [])
    return " ".join(parts)


def pct(xs, q):
    xs = sorted(xs)
    if not xs:
        return 0.0
    k = (len(xs) - 1) * q
    lo, hi = int(k), -(-int(k) // 1)
    hi = min(hi, len(xs) - 1)
    if lo == hi:
        return xs[lo]
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def build_multi_ngram_index(corpus: Corpus, n_values: range) -> dict:
    """{n: {gram: set(ctx_keys)}} for every n in n_values, built once over
    corpus.token_streams. mech.Corpus itself only precomputes this for its
    single base_n (8); the null calibration needs a sweep across n, and
    recomputing corpus-side n-grams per probe (as mech.Corpus.longest_shared_
    run does, fine for one-off gate calls) is O(probes * n_values * corpus)
    and too slow for a ~270-probe null run -- so we invert it: index once,
    then each probe does O(n_values * probe_len) hash lookups."""
    idx: dict[int, dict[tuple, set]] = {n: {} for n in n_values}
    for ctx_key, _qid, toks in corpus.token_streams:
        for n in n_values:
            for g in _ngrams(toks, n):
                idx[n].setdefault(g, set()).add(ctx_key)
    return idx


def plagiarism_null(passages: list[dict], corpus: Corpus, idx: dict, n_values: range) -> dict:
    """Authentic-vs-rest-of-corpus null distribution. For every passage,
    excludes its own context (which also transitively excludes any
    byte-identical sibling, since context_key is text-derived, not
    exam-derived -- see mech.Corpus docstring), then measures 8-gram
    containment (via corpus.gram_ctxkeys, precomputed) and, via the swept
    multi-n index, the longest exact shared run and which n's have zero
    false positives."""
    containments = []
    longest_runs = []
    n_with_match = defaultdict(int)  # n-gram length -> count of passages with >=1 shared gram of that length
    for p in passages:
        toks = tokenize(probe_text(p))
        if len(toks) < corpus.base_n:
            continue
        # exclude_ctx must match how mech.Corpus indexes context (the RAW
        # q["context"], title included) -- excluding context_key(body) alone
        # would never match a real corpus entry and defeat the exclusion.
        exclude_ctx = context_key(p["raw_context"])
        grams = list(_ngrams(toks, corpus.base_n))
        shared = [g for g in grams if corpus.is_shared(g, exclude_ctx)]
        containment = round(len(shared) / len(grams), 4) if grams else 0.0
        containments.append(containment)

        run = 0
        for n in sorted(n_values, reverse=True):
            if n > len(toks):
                continue
            cand_grams = set(_ngrams(toks, n))
            if any((idx[n].get(g) or set()) - {exclude_ctx} for g in cand_grams):
                run = n
                break
        longest_runs.append(run)
        for n in n_values:
            if n <= run:
                n_with_match[n] += 1
    return {
        "containments": containments,
        "longest_runs": longest_runs,
        "n_with_match": dict(n_with_match),
        "n_probes": len(containments),
    }


def positive_control(corpus: Corpus, parsed_dir: Path) -> dict:
    """host-ver1-2019 vs host-ver2-2019 ELF are byte-identical (see
    elf/corpus-analysis.md §1). Deliberately probe WITHOUT excluding any
    context (exclude_ctx=None, matching mech.Corpus.is_shared's semantics for
    'nothing excluded') so the duplicate cannot be filtered out, and confirm
    the detector saturates -- this proves the exact-match path actually works
    before we trust the null distribution's exclusions."""
    ver1 = json.loads((parsed_dir / "host-ver1-2019.json").read_text(encoding="utf-8"))
    elf = [q for q in ver1 if q.get("section") == "ELF" and q.get("context")]
    # first ELF context block for host-ver1-2019
    ctx = elf[0]["context"]
    toks = tokenize(ctx)
    grams = list(_ngrams(toks, corpus.base_n))
    shared = [g for g in grams if corpus.is_shared(g, None)]
    containment = round(len(shared) / len(grams), 4) if grams else 0.0
    run, src = corpus.longest_shared_run(toks, corpus.base_n, min(len(toks), 60), None)
    return {"probe_qid": elf[0]["qid"], "containment": containment, "longest_run": run, "run_source": src,
            "n_grams_total": len(grams)}


N_VALUES = range(8, 26)  # ngram_kill sweep range; 8 = corpus.base_n (mech.py default)


# ---------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--parsed-dir", type=Path, default=DEFAULT_PARSED_DIR)
    ap.add_argument("--tolerance", type=float, default=TOLERANCE)
    ap.add_argument("--write", action="store_true", help="write pipeline/synthetic/gates/bands.json")
    args = ap.parse_args(argv)

    las = las_passages(args.parsed_dir)
    elf = elf_blocks(args.parsed_dir)

    las_pass_stats = passage_stats(las)
    elf_pass_stats = passage_stats(elf)

    las_q_stats = question_stats(las)  # single "any" class for LÄS question-level stats
    elf_q_stats = question_stats(
        elf,
        prompt_class=lambda p: "cloze" if p["class"] == "cloze" else "reading",
        option_class=lambda p: "cloze" if p["class"] == "cloze" else "reading",
    )

    print("\n=== LÄS passage-level bands (raw, pre-widen) ===")
    for stat, cls_values in las_pass_stats.items():
        for cls, values in sorted(cls_values.items()):
            print(f"  {stat:22} {cls:10} n={len(values):3} min={min(values)} max={max(values)}")
    print("=== LÄS question-level bands (raw, pre-widen) ===")
    for stat, cls_values in las_q_stats.items():
        for cls, values in sorted(cls_values.items()):
            print(f"  {stat:22} {cls:10} n={len(values):3} min={min(values)} max={max(values)}")

    print("\n=== ELF passage-level bands (raw, pre-widen) ===")
    for stat, cls_values in elf_pass_stats.items():
        for cls, values in sorted(cls_values.items()):
            print(f"  {stat:22} {cls:10} n={len(values):3} min={min(values)} max={max(values)}")
    print("=== ELF question-level bands (raw, pre-widen) ===")
    for stat, cls_values in elf_q_stats.items():
        for cls, values in sorted(cls_values.items()):
            print(f"  {stat:22} {cls:10} n={len(values):3} min={min(values)} max={max(values)}")

    tol = args.tolerance

    las_block = {
        "passage_words": bands_list(las_pass_stats["passage_words"], tol, integer=True),
        "paragraph_count": bands_list(las_pass_stats["paragraph_count"], tol, integer=True),
        "mean_sentence_words": bands_list(las_pass_stats["mean_sentence_words"], tol),
        "prompt_words": bands_list(las_q_stats["any"] and {"any": las_q_stats["any"]["prompt_words"]} or {}, tol, integer=True),
        "option_words": bands_list({"any": las_q_stats["any"]["option_words"]}, tol, integer=True),
    }
    las_ratio_values = las_q_stats["any"]["option_length_ratio"]
    las_block["option_length_ratio_max"] = {
        "value": round(max(las_ratio_values) * (1 + tol), 2),
        "_observed_max": max(las_ratio_values), "_n": len(las_ratio_values),
    }

    elf_block = {
        "passage_words": bands_list(elf_pass_stats["passage_words"], tol, integer=True),
        "paragraph_count": bands_list(elf_pass_stats["paragraph_count"], tol, integer=True),
        "mean_sentence_words": bands_list(elf_pass_stats["mean_sentence_words"], tol),
        "prompt_words": bands_list({"reading": elf_q_stats["reading"]["prompt_words"]}, tol, integer=True),
        "option_words": bands_list(
            {"cloze": elf_q_stats["cloze"]["option_words"], "reading": elf_q_stats["reading"]["option_words"]},
            tol, integer=True),
    }
    # cloze prompts are structurally EMPTY in the authentic corpus (the
    # "question" is the numbered gap; see elf/corpus-analysis.md §5) but the
    # candidate schema requires prompt minLength>=1 (schemas/candidate-item.
    # schema.json), so a generated cloze item must carry SOME short
    # instructional prompt text (e.g. "Choose the word that best fits gap
    # 33."). There is no authentic-corpus value to measure here -- this band
    # is a documented manual judgment call, not a calibration, sized to a
    # short single-sentence instruction with margin.
    elf_block["prompt_words"].append({"class": "cloze", "min": 1, "max": 15,
                                       "_note": "manual: cloze prompts are empty in the authentic corpus; "
                                                "schema requires non-empty text for a generated instruction line"})
    elf_ratio_values = elf_q_stats["cloze"]["option_length_ratio"] + elf_q_stats["reading"]["option_length_ratio"]
    elf_block["option_length_ratio_max"] = {
        "value": round(max(elf_ratio_values) * (1 + tol), 2),
        "_observed_max": max(elf_ratio_values), "_n": len(elf_ratio_values),
    }

    print("\n=== LÄS calibrated bands (post-widen, tolerance={:.0%}) ===".format(tol))
    print(json.dumps(las_block, ensure_ascii=False, indent=2))
    print("\n=== ELF calibrated bands (post-widen, tolerance={:.0%}) ===".format(tol))
    print(json.dumps(elf_block, ensure_ascii=False, indent=2))

    # -------------------------------------------------------- plagiarism null
    print("\n=== plagiarism null calibration ===")
    corpus = Corpus(args.parsed_dir)  # full corpus (LÄS + ELF, all sittings) as the "rest of corpus"
    print(f"building multi-n index over n={N_VALUES.start}..{N_VALUES.stop - 1} "
          f"({len(corpus.token_streams)} corpus token streams)...", file=sys.stderr)
    idx = build_multi_ngram_index(corpus, N_VALUES)
    null_las = plagiarism_null(las, corpus, idx, N_VALUES)
    null_elf = plagiarism_null(elf, corpus, idx, N_VALUES)
    all_containments = null_las["containments"] + null_elf["containments"]
    all_runs = null_las["longest_runs"] + null_elf["longest_runs"]
    n_with_match = defaultdict(int)
    for d in (null_las["n_with_match"], null_elf["n_with_match"]):
        for n, c in d.items():
            n_with_match[n] += c
    total_probes = null_las["n_probes"] + null_elf["n_probes"]

    print(f"probes: LÄS={null_las['n_probes']} ELF={null_elf['n_probes']} total={total_probes}")
    print("containment distribution (8-gram, authentic-vs-rest-excl-own-context):")
    for q in (0.50, 0.90, 0.95, 0.99, 0.995, 1.0):
        print(f"  p{q*100:5.1f} = {pct(all_containments, q):.4f}")
    print(f"  max = {max(all_containments):.4f}  mean = {sum(all_containments)/len(all_containments):.4f}")
    print("\nlongest exact shared n-gram run distribution:")
    for q in (0.50, 0.90, 0.95, 0.99, 1.0):
        print(f"  p{q*100:5.1f} = {pct(all_runs, q):.1f}")
    print(f"  max = {max(all_runs)}")
    print(f"\nshare of authentic passages with >=1 shared exact n-gram, by n "
          f"(n={N_VALUES.start}..{N_VALUES.stop - 1}; should fall to ~0 quickly):")
    for n in N_VALUES:
        c = n_with_match.get(n, 0)
        print(f"  n={n:2}  {c}/{total_probes} ({c/total_probes:.1%})")

    ngram_kill = None
    for n in N_VALUES:
        if n_with_match.get(n, 0) == 0:
            ngram_kill = n
            break
    if ngram_kill is None:
        ngram_kill = N_VALUES.stop - 1
        print(f"WARNING: no n up to {ngram_kill} reached zero false positives in the null; "
              f"falling back to the sweep ceiling. Widen N_VALUES and rerun.", file=sys.stderr)
    containment_flag = round(pct(all_containments, 0.995), 4)
    print(f"\nchosen ngram_kill = {ngram_kill} (shortest exact n-gram length with zero authentic-vs-authentic "
          f"false positives in the null)")
    print(f"chosen containment_flag = {containment_flag} (p99.5 of the authentic-vs-authentic containment null)")

    print("\n=== positive control: host-ver1-2019 vs host-ver2-2019 (byte-identical ELF) ===")
    pc = positive_control(corpus, args.parsed_dir)
    print(json.dumps(pc, ensure_ascii=False, indent=2))
    if pc["containment"] < 0.99 or pc["longest_run"] < ngram_kill:
        print("WARNING: positive control did not saturate the detector -- investigate before trusting the null.",
              file=sys.stderr)
    else:
        print("OK: positive control saturates containment and clears ngram_kill -- exact-duplicate detection works.")

    # -------------------------------------------------------------- assemble
    if args.write:
        from datetime import date
        bands_path = GATES_DIR / "bands.json"
        out = {
            "_contract": (
                "Interface between the LÄS/ELF generation analysts and the M-BANDS mechanical "
                "gate. Calibrated from data/parsed/*.json (parsing_status=complete). Stats with "
                "multiple documented format classes (see las/corpus-analysis.md, "
                "elf/corpus-analysis.md) are lists of per-class [min,max] bands; a candidate value "
                "passes a stat if it falls within AT LEAST ONE listed class band (union check) -- "
                "this lets M-BANDS apply the right regime without needing to classify a candidate's "
                "format itself. Bands are the observed [min,max] widened by "
                f"{tol:.0%} on each side (see calibrate_bands.py TOLERANCE comment)."
            ),
            "_units": (
                "word counts are mech.py:tokenize() token counts over the raw text (lowercase, "
                "diacritics kept, punctuation stripped -- NOT a literal str.split()); sentence "
                "length is words per sentence split via mech.py:sentences() ([.!?] followed by "
                "space+uppercase); all bands are inclusive [min, max]. Calibration imports these "
                "exact functions from mech.py so calibration and the gate can never diverge on units."
            ),
            "_band_semantics": (
                "For a stat given as a list of {class,min,max} bands, PASS if value is within ANY "
                "listed band (union across classes). option_length_ratio_max stays a single scalar "
                "cap (not class-split): it guards against a longest-option-stands-out length tell, "
                "which is a monotonic 'not too skewed' property independent of passage format."
            ),
            "calibrated": True,
            "provenance": {
                "measured_by": "pipeline/synthetic/gates/scripts/calibrate_bands.py",
                "measured_at": date.today().isoformat(),
                "corpus_snapshot": (
                    f"data/parsed/*.json, parsing_status=complete. LÄS: all 27 sittings, "
                    f"{len(las)} passages (long+short). ELF: 27 sittings minus 7 degraded "
                    f"(2013-2016 embargo losses: host-2013..2016, var-2013..2015, both long "
                    f"passages missing/tiny) minus host-ver2-2019 (byte-identical duplicate of "
                    f"host-ver1-2019), contexts >50 words only; {len(elf)} blocks "
                    f"(long_passage+cloze+short_text)."
                ),
                "script": "pipeline/synthetic/gates/scripts/calibrate_bands.py",
                "tolerance": tol,
            },
            "LÄS": {k: strip_debug(v) if isinstance(v, list) else v for k, v in las_block.items()},
            "ELF": {k: strip_debug(v) if isinstance(v, list) else v for k, v in elf_block.items()},
            "plagiarism": {
                "_contract": (
                    "Consumed by M-PLAGIARISM. ngram_kill: any exact token n-gram of this length "
                    "shared with the authentic corpus kills (verbatim lift). containment_flag: "
                    "fraction of the candidate's 8-grams found in the corpus above which the "
                    "candidate is flagged. Calibrated against the authentic-vs-authentic null "
                    "(every passage vs the rest of the corpus, excluding its own source context and "
                    "-- transitively, since context matching is text-based -- the byte-identical "
                    "host-ver1-2019/host-ver2-2019 duplicate pair). See calibrate_bands.py stdout "
                    "for the full distribution and the positive-control check."
                ),
                "ngram_kill": {"value": ngram_kill,
                               "_null_max_run": max(all_runs), "_null_probes": total_probes},
                "containment_flag": {"value": containment_flag,
                                      "_null_p99.5": containment_flag, "_null_max": max(all_containments)},
            },
        }
        bands_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\nwrote {bands_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

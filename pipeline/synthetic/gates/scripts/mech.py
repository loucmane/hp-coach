"""Mechanical gates for synthetic LÄS/ELF candidates.

Deterministic checks that need no LLM: schema validity (M-SCHEMA),
length/statistic bands (M-BANDS), and n-gram anti-plagiarism against the
authentic corpus (M-PLAGIARISM). Pure stdlib; no app dependencies.

Verdict semantics match schemas/verdict.schema.json. While bands.json has
calibrated=false, M-BANDS downgrades kills to flags (placeholder numbers
must never kill a candidate).
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

GATES_DIR = Path(__file__).resolve().parent.parent
EXECUTOR = "mech.py/1"

VALID_LETTERS = ("A", "B", "C", "D")


# ---------------------------------------------------------------- helpers

def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _verdict(candidate_id, gate, target, verdict, findings):
    return {
        "candidate_id": candidate_id,
        "gate": gate,
        "target": target,
        "verdict": verdict,
        "findings": findings,
        "executed_by": EXECUTOR,
        "executed_at": _now(),
    }


def _finding(severity, quote, note):
    return {"severity": severity, "quote": quote, "note": note}


def tokenize(text: str) -> list[str]:
    """Lowercase word tokens, punctuation stripped, diacritics kept."""
    text = unicodedata.normalize("NFC", text.lower())
    return re.findall(r"[a-zåäöéü0-9]+", text)


def context_key(context: str) -> str:
    """Normalized identity of a source passage: the joined token stream. Two
    corpus rows with the same passage (sibling questions) share a key; a novel
    synthetic passage produces a key that matches nothing in the corpus."""
    return " ".join(tokenize(context or ""))


def sentences(text: str) -> list[str]:
    """Crude but deterministic sentence split (matches bands.json _units)."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÅÄÖ])", text.strip())
    return [p for p in parts if p.strip()]


# ---------------------------------------------------------------- M-SCHEMA

def gate_schema(cand: dict) -> dict:
    """Structural validity: required fields, 4 unique options A-D, exactly one
    key that names an existing option, no duplicate option texts, q_index
    uniqueness. This is the mechanical half of 'exactly one answerable key';
    the semantic half is G-KEY/G-DISTRACTOR."""
    cid = cand.get("candidate_id", "<missing candidate_id>")
    f = []

    for field in ("candidate_id", "section", "family", "title", "passage", "questions"):
        if not cand.get(field):
            f.append(_finding("lethal", field, f"required field '{field}' missing or empty"))
    if cand.get("section") not in ("LÄS", "ELF"):
        f.append(_finding("lethal", str(cand.get("section")), "section must be LÄS or ELF"))
    cid_val = cand.get("candidate_id")
    # "PLACEHOLDER" is the accepted pre-assignment sentinel: generators emit it
    # and the orchestrator renumbers into candidates/ (BATCH-RUNBOOK Stage 2), so
    # a generator self-checking with mech before renumber gets a clean run.
    if cid_val and cid_val != "PLACEHOLDER" and not re.fullmatch(r"(las|elf)-b\d+-\d{3}", cid_val):
        f.append(_finding("major", cid_val, "candidate_id does not match (las|elf)-b<batch>-<nnn>"))

    questions = cand.get("questions") or []
    # ELF long-passage and cloze blocks are invariantly 5 questions/gaps
    # (corpus-analysis format inventory); the old cap of 4 was an artifact
    # of the single-question eval seeds and killed authentic-format units.
    if not isinstance(questions, list) or not 1 <= len(questions) <= 5:
        f.append(_finding("lethal", f"{len(questions)} questions", "must have 1-4 questions"))
        questions = questions if isinstance(questions, list) else []

    seen_idx = set()
    for q in questions:
        qi = q.get("q_index")
        label = f"q_index={qi}"
        if qi in seen_idx:
            f.append(_finding("lethal", label, "duplicate q_index"))
        seen_idx.add(qi)
        if not q.get("prompt"):
            f.append(_finding("lethal", label, "empty prompt"))
        opts = q.get("options") or []
        letters = [o.get("letter") for o in opts]
        if len(opts) != 4 or sorted(filter(None, letters)) != list(VALID_LETTERS):
            f.append(_finding("lethal", f"{label} letters={letters}", "options must be exactly A, B, C, D"))
        texts = [(o.get("text") or "").strip() for o in opts]
        if any(not t for t in texts):
            f.append(_finding("lethal", label, "empty option text"))
        lowered = [t.lower() for t in texts if t]
        if len(set(lowered)) != len(lowered):
            f.append(_finding("lethal", label, "duplicate option texts"))
        key = q.get("key")
        if key not in VALID_LETTERS:
            f.append(_finding("lethal", f"{label} key={key!r}", "key must be exactly one of A-D"))
        elif key not in letters:
            f.append(_finding("lethal", f"{label} key={key}", "key letter has no matching option"))

    verdict = "kill" if any(x["severity"] == "lethal" for x in f) else ("flag" if f else "pass")
    return _verdict(cid, "M-SCHEMA", "passage", verdict, f)


# ---------------------------------------------------------------- M-BANDS

def _load_bands(bands_path: Path | None = None) -> dict:
    return json.loads((bands_path or GATES_DIR / "bands.json").read_text(encoding="utf-8"))


def _band_check(f, name, value, bands):
    """bands is a list of {class, min, max} (see bands.json _band_semantics):
    PASS if value falls within ANY listed class band (union across the
    documented format classes) -- this lets one stat cover e.g. LÄS long vs
    short, or ELF long_passage vs cloze vs short_text, without the gate
    needing to classify the candidate's format itself. Legacy single-dict
    {min,max} bands (no class list) are still accepted for callers that pass
    a bespoke fixture."""
    if isinstance(bands, dict):
        bands = [{"class": "any", "min": bands["min"], "max": bands["max"]}]
    for b in bands:
        if b["min"] <= value <= b["max"]:
            return
    ranges = "; ".join(f"{b['class']}=[{b['min']}, {b['max']}]" for b in bands)
    f.append(_finding("major", f"{name}={value}", f"outside all bands ({ranges})"))


def gate_bands(cand: dict, bands_path: Path | None = None) -> dict:
    """Length/statistic bands from bands.json (analyst-calibrated contract).
    Out-of-band => kill when calibrated=true, flag while placeholder."""
    bands = _load_bands(bands_path)
    cid = cand.get("candidate_id", "?")
    sec = bands.get(cand.get("section"), {})
    f = []

    passage = cand.get("passage", "")
    words = tokenize(passage)
    _band_check(f, "passage_words", len(words), sec["passage_words"])
    paras = [p for p in re.split(r"\n\s*\n", passage) if p.strip()]
    _band_check(f, "paragraph_count", len(paras), sec["paragraph_count"])
    sents = sentences(passage)
    if sents:
        mean_len = round(len(words) / len(sents), 1)
        _band_check(f, "mean_sentence_words", mean_len, sec["mean_sentence_words"])

    for q in cand.get("questions", []):
        qi = q.get("q_index")
        _band_check(f, f"q{qi}_prompt_words", len(tokenize(q.get("prompt", ""))), sec["prompt_words"])
        lens = [len(tokenize(o.get("text", ""))) for o in q.get("options", [])]
        for o, n in zip(q.get("options", []), lens):
            _band_check(f, f"q{qi}_option_{o.get('letter')}_words", n, sec["option_words"])
        if lens and min(lens) > 0:
            ratio = round(max(lens) / min(lens), 2)
            cap = sec["option_length_ratio_max"]["value"]
            if ratio > cap:
                f.append(_finding("major", f"q{qi}_option_length_ratio={ratio}",
                                  f"longest/shortest option ratio exceeds {cap} (length-tell risk)"))

    if f and not bands.get("calibrated", False):
        verdict = "flag"
        f.append(_finding("minor", "calibrated=false",
                          "bands.json is placeholder; out-of-band downgraded from kill to flag"))
    else:
        verdict = "kill" if f else "pass"
    return _verdict(cid, "M-BANDS", "passage", verdict, f)


# ---------------------------------------------------------------- M-PLAGIARISM

def _candidate_text(cand: dict) -> str:
    parts = [cand.get("title", ""), cand.get("passage", "")]
    for q in cand.get("questions", []):
        parts.append(q.get("prompt", ""))
        parts.extend(o.get("text", "") for o in q.get("options", []))
    return " ".join(parts)


def _ngrams(tokens: list[str], n: int):
    return (tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1))


class Corpus:
    """N-gram index over the authentic corpus (data/parsed/*.json).

    Indexes context + prompt + option texts for the given sections.
    Built once per batch run; ~500 passages, fits comfortably in memory.
    """

    def __init__(self, parsed_dir: Path, sections=("LÄS", "ELF"), base_n: int = 8):
        self.base_n = base_n
        # Overlap is excluded by SOURCE PASSAGE, not by qid: authentic passages
        # carry several sibling questions that share one context, so an authentic
        # eval item would otherwise match its own passage via a sibling. Each gram
        # records the set of context-keys (normalized passage identity) it came
        # from; a candidate excludes its own context-key. Synthetic candidates have
        # a novel passage, so their key matches nothing and nothing is excluded.
        self.gram_ctxkeys: dict[tuple, set] = {}
        self.token_streams: list[tuple[str, str, list[str]]] = []  # (ctx_key, qid, tokens)
        for path in sorted(parsed_dir.glob("*.json")):
            if path.name.startswith("_"):
                continue
            for q in json.loads(path.read_text(encoding="utf-8")):
                if q.get("section") not in sections:
                    continue
                qid = q.get("qid", path.stem)
                ctx_key = context_key(q.get("context") or "")
                blob = " ".join(filter(None, [
                    q.get("context") or "", q.get("prompt") or "",
                    " ".join(o.get("text", "") for o in q.get("options") or []),
                ]))
                toks = tokenize(blob)
                if toks:
                    self.token_streams.append((ctx_key, qid, toks))
                    for g in _ngrams(toks, base_n):
                        self.gram_ctxkeys.setdefault(g, set()).add(ctx_key)

    def is_shared(self, gram: tuple, exclude_ctx: str | None) -> bool:
        keys = self.gram_ctxkeys.get(gram)
        if not keys:
            return False
        if exclude_ctx is None:
            return True
        return bool(keys - {exclude_ctx})

    def longest_shared_run(self, cand_tokens, probe_from, probe_to, exclude_ctx=None) -> tuple[int, str]:
        """Longest exact shared n-gram run in [probe_from, probe_to], with source qid,
        ignoring overlap that comes ONLY from the excluded context. Simple scan;
        corpus is small."""
        for n in range(probe_to, probe_from - 1, -1):
            if n > len(cand_tokens):
                continue
            cand_set = set(_ngrams(cand_tokens, n))
            if not cand_set:
                continue
            for ctx_key, qid, toks in self.token_streams:
                if ctx_key == exclude_ctx:
                    continue
                if any(g in cand_set for g in _ngrams(toks, n)):
                    return n, qid
        return 0, ""


def gate_plagiarism(cand: dict, corpus: Corpus, bands_path: Path | None = None) -> dict:
    """Verbatim-lift detection: kill on any exact shared n-gram >= ngram_kill
    tokens; flag when 8-gram containment exceeds containment_flag. Thresholds
    live in bands.json (plagiarism block, analyst-calibrated)."""
    bands = _load_bands(bands_path)["plagiarism"]
    kill_n = bands["ngram_kill"]["value"]
    flag_frac = bands["containment_flag"]["value"]
    cid = cand.get("candidate_id", "?")
    # Authentic eval items live in the corpus; exclude their own SOURCE PASSAGE
    # (by context key) so an item is never flagged for matching itself or a
    # passage-sibling. A synthetic candidate's passage matches nothing -> no
    # exclusion.
    exclude_ctx = context_key(cand.get("passage", ""))
    toks = tokenize(_candidate_text(cand))
    f = []

    grams = list(_ngrams(toks, corpus.base_n))
    shared = [g for g in grams if corpus.is_shared(g, exclude_ctx)]
    containment = round(len(shared) / len(grams), 4) if grams else 0.0

    verdict = "pass"
    if shared:
        run, src = corpus.longest_shared_run(toks, corpus.base_n, min(len(toks), kill_n + 12), exclude_ctx)
        example = " ".join(shared[0])
        if run >= kill_n:
            verdict = "kill"
            f.append(_finding("lethal", example,
                              f"verbatim lift: shared exact {run}-gram with authentic corpus (source {src}, kill threshold {kill_n})"))
        elif containment > flag_frac:
            verdict = "flag"
            f.append(_finding("major", example,
                              f"8-gram containment {containment} exceeds flag threshold {flag_frac} ({len(shared)}/{len(grams)} grams shared)"))
    return _verdict(cid, "M-PLAGIARISM", "passage", verdict, f)


# ---------------------------------------------------------------- runner

def run_all(cand: dict, corpus: Corpus | None, bands_path: Path | None = None) -> list[dict]:
    """M-SCHEMA -> (stop on kill) -> M-BANDS -> M-PLAGIARISM."""
    out = [gate_schema(cand)]
    if out[0]["verdict"] == "kill":
        return out
    out.append(gate_bands(cand, bands_path))
    if corpus is not None:
        out.append(gate_plagiarism(cand, corpus, bands_path))
    return out

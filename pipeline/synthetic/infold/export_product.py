#!/usr/bin/env python3
"""Export approved P5 units as a learner bank of whitelisted fields (preview only).

docs/p5-infold-design.md §C (data path, identity, retirement), §F (export
gates) and §4 rows 1–2; beads hpf-535m, hpf-no7l and hpf-gcrh. Inputs: the
ratified roster (approval-roster.json, from build_roster.py), RETIRED.json, the
exact candidate bytes the roster pins, the Layer-1 catalogs frameworks/*.json
and, with --explanations, the release's Layer 2 shard
data/explanations/p5-<release>.json. Output: p5-bank-<release>.json, the
validated shard p5-<release>.json when one is included, and the internal
_export-manifest.json, written only under pipeline/synthetic/infold/preview/.
Nothing is written to the app, R2 or app/public.

Every exported question row carries exactly ROW_FIELDS:
  qid               p5-<unit>-r<revision>-<SECTION>-<nnn>, nnn = q_index in
                    three digits; built only if it matches QID and fits the
                    60 UTF-16 units of worker/src/routes/attempts.ts:40
  exam_id           p5-<unit>-r<revision>: a synthetic namespace, never an
                    authentic sitting
  provpass          null
  section           LÄS | ELF, the app's Section literal
  number            q_index
  title, context    the unit's title and passage, unchanged (byline, glossary
                    and ___(n)___ cloze markers included)
  prompt, options   as authored, options in their A–D order
  answer            the key
  source            "synthetic"
  unit_id, revision from the roster; a revision is a plain integer from 1
                    to build_roster.MAX_REVISION (99)
  explanation_shard explanations/p5-<release>.json, the content key of the
                    Layer 2 shard this export validated and wrote beside the
                    bank; null when the export carries no explanations, so a
                    bank never names a shard that was not checked with it
and nothing else: no generator_meta, rationale, family or question-family map,
repair log, audit note or other candidate field.

<SECTION> is the literal "LÄS", where the design's example spells "LAS":
worker/src/lib/section.ts:11 accepts both, but app/src/lib/dueBySection.ts:25
and the LIKE '%-<section>-%' filters at worker/src/routes/mistakes.ts:218 and
worker/src/routes/fit.ts:55 only match the literal that all 27 authentic exam
files use.

The export refuses, writing nothing, on:
  - a roster row with a missing or mistyped field, or a revision that is not
    an integer from 1 to 99 (0, a negative, a bool, a float, a string or
    nested data);
  - candidate bytes that no longer match the roster's sha256 (or a content
    digest that disagrees with it);
  - a retired id: RETIRED.json is read here and wins over the roster, and a
    roster that disagrees with it in either direction is stale;
  - a unit without approval, unless --include-pending is given: that stamps
    the bank PREVIEW and needs a release name starting with "preview";
  - candidate fields outside the authoring contract (GENERATION.md "Output
    format"; options exactly A–D), or a cloze unit whose "Gap (n)" questions
    and ___(n)___ markers disagree;
  - a qid outside the documented pattern or over 60 characters;
  - a duplicate qid, a bank or row field missing or extra, a denylisted or
    _-prefixed key anywhere, or rationale text inside any bank string;
  - an internal id or label in an exported title, passage, prompt or option
    (Internal labels, below);
  - both members of an exclusion pair inside a --single-session export;
  - a default-mode learner-output lint finding (gates/scripts/
    lint_learner_output.py) in an exported title, passage, prompt or option;
  - a bank that is not exactly BANK_SHAPE, checked last over the whole
    output: no object or array where a scalar belongs, no bool for a number;
  - rows whose explanation_shard is not the release's key exactly when a
    shard is included, and null otherwise;
  - output that differs between two builds from the same inputs.

--explanations reads data/explanations/p5-<release>.json, the file the bank's
explanation_shard key names, and also refuses on (design §D):
  - a shard that is missing, a symlink or not a regular file, empty, not UTF-8
    or not JSON, that repeats a key or holds NaN or Infinity, or that is not a
    non-empty object keyed by qid;
  - a missing entry for an exported qid, or an entry for any other key;
  - an entry with fields other than solution_path, steps, distractors,
    technique, pitfall and an optional framework_id; steps other than
    {n, title, text, tier} objects numbered 1 to k in order with tier
    essential or detail; distractors other than {letter, why_tempting,
    why_wrong} objects for exactly the wrong options, in letter order, never
    the key; an empty or non-string text (pitfall may be null); unbalanced
    MathText math delimiters;
  - a framework_id that is null or not a Layer-1 entry of the question's own
    section in frameworks/*.json (a generation family is not one; omit the
    field when no entry fits);
  - an internal id or label in any learner field (Internal labels, below);
  - rationale text: a rationale, paragraph or sentence of 40+ characters that
    is not the unit's own student text;
  - a default-mode learner-output lint finding in any string of the shard;
  - a shard that is not byte for byte its canonical rendering: entries in
    bank order, fields in the order above, two-space JSON, UTF-8 without
    ASCII escapes, one final newline. The shipped p5-<release>.json is that
    rendering, so the reviewed bytes are the bytes that ship.
The manifest binds the shard, and every framework file the export read, by
sha256.

Internal labels. Learner text (the bank's titles, passages, prompts and
options; with --explanations every explanation field but framework_id) may
not carry an internal id or label. The ids are derived, not listed: each
Layer-1 entry id in frameworks/*.json and each unit id in the roster stands
for its whole series, its section prefix kept and its letters, digits and
separators generalized (internal_ids): LAS-TYPE-001 stands for every
LAS-<letters>-<digits> (LAS-TYPE-99 too), ELF-TYPE-001 also for the generation
family ELF-CLOZE-001, and las-b19-002 for every LÄS unit id and so for every
qid. A new catalog or roster row is covered once it exists. The labels are each
exported unit's family and question-family labels. Text is read as stored and
as a learner sees it, in the learner-output lint's own rendered views:
invisible characters dropped, right-to-left overrides undone, compatibility
characters in NFKC form, KaTeX groups between MathText's delimiters joined;
case, accents and every dash and minus sign are then folded. An id counts
wherever it stands, also run into a word. framework_id and the bank's qid,
exam_id, unit_id and explanation_shard are metadata the app keys on, not text
it shows, and may hold an id.

Writing resolves the preview root once and reaches the output directory from
it one component at a time with O_NOFOLLOW. A path spelled outside the root
or through '..', a symlink at any level below the root, and an output file
that is a symlink or not a regular file are all refused before anything is
written. Each file then goes to a fresh temporary file beside it and is
renamed over the old one: nothing is written through a link, and no mode is
changed. --check reads the same way.

Exclusion pairs: a bank may hold both members of a pair; the session pickers
keep them apart (design §A, PR 4), and the bank lists the complete pairs it
holds. An export that stands for one session's content (--single-session)
must not hold both members of any pair.

  python3 pipeline/synthetic/infold/export_product.py                    # approved units
  python3 pipeline/synthetic/infold/export_product.py --include-pending  # + pending, PREVIEW
  python3 pipeline/synthetic/infold/export_product.py --sample [--check] # committed sample
  python3 pipeline/synthetic/infold/export_product.py --pilot [--check]  # Layer 2 pilot + shard
"""
from __future__ import annotations

import argparse
import contextlib
import importlib.util
import json
import os
import re
import secrets
import stat
import sys
import unicodedata
from collections import Counter
from pathlib import Path

from build_roster import (APPROVED, FORMAT as ROSTER_FORMAT, INFOLD_DIR, MAX_REVISION, PENDING, REPO_ROOT, RETIRED,
                          RETIRED_REL, ROSTER_PATH, content_digest, is_revision, load_retired, sha256_bytes)

EXPORTER_REL = "pipeline/synthetic/infold/export_product.py"
LINT_REL = "pipeline/synthetic/gates/scripts/lint_learner_output.py"
EXPLANATIONS_REL = "data/explanations"
FRAMEWORKS_REL = "frameworks"
PREVIEW_REL = "pipeline/synthetic/infold/preview"
PREVIEW_DIR = INFOLD_DIR / "preview"
SAMPLE_DIR = PREVIEW_DIR / "sample"
SAMPLE_RELEASE = "sample"
# Two LÄS (long and short) and two ELF (cloze and short) approved units.
SAMPLE_UNITS = ("las-b14-002", "las-b19-002", "elf-b18-002", "elf-b19-003")
PILOT_DIR = PREVIEW_DIR / "pilot"
PILOT_RELEASE = "pilot"
# The Layer 2 pilot (bead hpf-no7l), in roster order: the sample plus an ELF
# long passage and a legacy LÄS unit at revision 2.
PILOT_UNITS = ("las-b7-002", "las-b14-002", "elf-b18-001", "elf-b18-002", "elf-b19-003", "las-b19-002")
MANIFEST_NAME = "_export-manifest.json"
BANK_FORMAT = "p5-bank-v1"
MANIFEST_FORMAT = "p5-export-manifest-v1"
PREVIEW_STAMP = "PREVIEW: includes units pending owner ratification; not releasable"

# The bank's documented shape: an object is its exact fields in order, [x] an
# array of x, a scalar its exact JSON type(s): a bool is never a number, and no
# field holds an object or array where a scalar belongs.
OPTION_SHAPE = {"letter": str, "text": str}
ROW_SHAPE = {"qid": str, "exam_id": str, "provpass": type(None), "section": str, "number": int, "title": str,
             "context": str, "prompt": str, "options": [OPTION_SHAPE], "answer": str, "source": str,
             "unit_id": str, "revision": int, "explanation_shard": (str, type(None))}
BANK_SHAPE = {"format": str, "release": str, "preview": bool, "stamp": (str, type(None)), "source": str,
              "exclusion_pairs": [[str]], "questions": [ROW_SHAPE]}
ROW_FIELDS, OPTION_FIELDS, BANK_FIELDS = tuple(ROW_SHAPE), tuple(OPTION_SHAPE), tuple(BANK_SHAPE)
# Roster row fields the exporter reads, with their exact JSON types.
ROSTER_ROW = {"unit_id": str, "section": str, "source": str, "sha256": str, "content_sha256": str,
              "question_count": int, "revision": int, "approval": str, "retired": bool}
# Candidate and roster fields that must never appear in a bank, at any depth;
# any _-prefixed key is refused as well (no hidden _meta in shipped JSON).
DENYLIST = frozenset({
    "generator_meta", "rationale", "rationales", "family", "families", "question_families", "repair_log",
    "audit", "audits", "notes", "originality_note", "verdicts", "flags", "key", "q_index", "passage",
    "candidate_id", "sha256", "content_sha256", "approval", "approval_basis", "evidence", "meta",
})
CANDIDATE_REQUIRED = ("candidate_id", "section", "family", "title", "passage", "questions")
CANDIDATE_OPTIONAL = ("generator_meta", "repair_log")
QUESTION_FIELDS = ("q_index", "prompt", "options", "key", "rationale")
LETTERS = ("A", "B", "C", "D")
GAP_PROMPT = re.compile(r"Gap \((\d+)\)")
GAP_MARKER = re.compile(r"___\((\d+)\)___")
RELEASE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
# The documented qid: a build_roster unit id, r<revision> without a leading
# zero, the section literal of the unit's prefix and q_index in three digits,
# ASCII digits only. QID_MAX is the questionId limit in UTF-16 code units
# (worker/src/routes/attempts.ts:40).
QID = re.compile(r"p5-(?:las-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-LÄS|elf-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-ELF)-[0-9]{3}")
QID_MAX = 60
LEAK_MIN_CHARS = 40
GATES = ("roster-format", "retired-registry", "approval", "candidate-sha256", "candidate-fields",
         "cloze-numbering", "qid-format", "duplicate-qid", "bank-whitelist", "internal-metadata",
         "bank-internal-label", "exclusion-pairs", "learner-lint", "bank-schema", "deterministic-rerun")
# A Layer 2 entry: the app's Explanation fields (app/src/data/explanations.ts)
# that the P5 contract ships, in their canonical order. framework_id is the
# only optional field; _meta and pregrade_tactic are not part of the contract.
EXPLANATION_FIELDS = ("solution_path", "steps", "distractors", "technique", "pitfall", "framework_id")
EXPLANATION_REQUIRED = EXPLANATION_FIELDS[:-1]
STEP_FIELDS = ("n", "title", "text", "tier")
DISTRACTOR_FIELDS = ("letter", "why_tempting", "why_wrong")
TIERS = ("essential", "detail")
EXPLANATION_GATES = ("explanation-shard", "explanation-coverage", "explanation-schema", "distractor-coverage",
                     "framework-id", "internal-label", "rationale-leak", "explanation-lint", "explanation-canonical")
# MathText's math delimiters (app/src/components/MathText.tsx).
MATH_OPEN, MATH_CLOSE = chr(0xE000), chr(0xE001)
# Minus signs, which render like the hyphen in an id but are symbols; dashes
# (general category Pd: U+2010–U+2015, U+FE63, U+FF0D, …) are folded by category.
MINUS_SIGNS = frozenset("\N{MINUS SIGN}\N{HEAVY MINUS SIGN}\N{MODIFIER LETTER MINUS SIGN}\N{HYPHEN BULLET}")
# An id's runs: letters, digits, or any single other character.
ID_RUN = re.compile(r"(?P<letters>[^\W\d_]+)|(?P<digits>\d+)|(?P<other>.)", re.DOTALL)
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")
LABEL_MIN_CHARS = 6


def _load_lint():
    # A private instance: default mode regardless of what other code does
    # to the shared module's --strict switch.
    spec = importlib.util.spec_from_file_location("p5_infold_learner_lint", REPO_ROOT / LINT_REL)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LINT = _load_lint()


class ExportError(Exception):
    """The export is refused; nothing is written."""


def exam_id(unit_id: str, revision: int) -> str:
    return f"p5-{unit_id}-r{revision}"


def make_qid(unit_id: str, revision: int, section: str, number: int) -> str:
    """The documented qid, or ExportError: never a malformed or over-long one."""
    if not is_revision(revision) or type(number) is not int or not 1 <= number <= 999:
        raise ExportError(f"{unit_id}: no qid for revision {revision!r}, number {number!r}: a revision is an "
                          f"integer from 1 to {MAX_REVISION}, a number from 1 to 999")
    qid = f"{exam_id(unit_id, revision)}-{section}-{number:03d}"
    if not QID.fullmatch(qid):
        raise ExportError(f"qid {qid!r} does not match p5-<unit>-r<revision>-<LÄS|ELF>-<nnn>")
    if len(qid.encode("utf-16-le")) // 2 > QID_MAX:
        raise ExportError(f"qid {qid!r} is longer than the API's {QID_MAX} characters")
    return qid


def render_json(obj) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def _load_roster(raw: bytes) -> dict:
    try:
        roster = json.loads(raw)
    except ValueError as exc:  # malformed JSON, or an integer past Python's digit limit
        raise ExportError(f"roster is not readable JSON: {exc}") from None
    form = roster.get("format") if type(roster) is dict else None
    if form != ROSTER_FORMAT:
        raise ExportError(f"roster format {form!r} is not {ROSTER_FORMAT!r}")
    units = roster.get("units")
    if type(units) is not list or any(type(u) is not dict for u in units):
        raise ExportError("roster units must be an array of objects")
    mistyped = [f"{u.get('unit_id')}.{field}" for u in units for field, kind in ROSTER_ROW.items()
                if type(u.get(field)) is not kind]
    if mistyped:
        raise ExportError(f"roster rows with a missing or mistyped field: {mistyped}")
    revisions = [f"{u['unit_id']} r{u['revision']}" for u in units if not is_revision(u["revision"])]
    if revisions:
        raise ExportError(f"roster revisions outside 1 to {MAX_REVISION}: {revisions}")
    dups = sorted(uid for uid, n in Counter(u["unit_id"] for u in units).items() if n > 1)
    if dups:
        raise ExportError(f"duplicate roster rows: {dups}")
    return roster


def _check_retirement(roster: dict, registry: dict) -> None:
    stale = [u["unit_id"] for u in roster["units"]
             if not ((u["unit_id"] in registry) == bool(u["retired"]) == (u["approval"] == RETIRED))]
    if stale:
        raise ExportError(f"roster disagrees with RETIRED.json for {stale}: rebuild the roster with "
                          "build_roster.py; a retirement is never lifted silently")


def select_units(roster: dict, registry: dict, *, units=None, include_pending: bool = False):
    entries = roster["units"]
    allowed = {APPROVED, PENDING} if include_pending else {APPROVED}
    excluded = {RETIRED: [], PENDING: []}
    if units is not None:
        wanted = set(units)
        unknown = sorted(wanted - {u["unit_id"] for u in entries})
        if unknown:
            raise ExportError(f"unknown unit ids: {unknown}")
        chosen = [u for u in entries if u["unit_id"] in wanted]
        retired = [u["unit_id"] for u in chosen if u["unit_id"] in registry]
        if retired:
            raise ExportError(f"retired ids requested: {retired} (RETIRED.json); retired units are never exported")
        refused = [f"{u['unit_id']} ({u['approval']})" for u in chosen if u["approval"] not in allowed]
        if refused:
            raise ExportError(f"units not approved: {refused}; {PENDING} units need --include-pending")
    else:
        chosen = []
        for unit in entries:
            uid, approval = unit["unit_id"], unit["approval"]
            if uid in registry:
                excluded[RETIRED].append(uid)
            elif approval in allowed:
                chosen.append(unit)
            elif approval == PENDING:
                excluded[PENDING].append(uid)
            else:
                raise ExportError(f"{uid}: unknown approval value {approval!r}")
    if not chosen:
        raise ExportError("no units selected: nothing in the roster is eligible for this export")
    return chosen, excluded


def _check_candidate_fields(uid: str, unit: dict, entry: dict) -> None:
    problems = []
    missing = [k for k in CANDIDATE_REQUIRED if k not in unit]
    extra = sorted(set(unit) - set(CANDIDATE_REQUIRED) - set(CANDIDATE_OPTIONAL))
    if missing:
        problems.append(f"missing fields {missing}")
    if extra:
        problems.append(f"unexpected fields {extra}")
    if unit.get("candidate_id") != uid:
        problems.append(f"candidate_id {unit.get('candidate_id')!r}")
    if unit.get("section") != entry["section"]:
        problems.append(f"section {unit.get('section')!r} (roster: {entry['section']!r})")
    for field in ("title", "passage"):
        if field in unit and (not isinstance(unit[field], str) or not unit[field].strip()):
            problems.append(f"empty {field}")
    questions = unit.get("questions")
    if not isinstance(questions, list) or len(questions) != entry["question_count"]:
        problems.append(f"questions do not match the roster's count {entry['question_count']}")
        questions = questions if isinstance(questions, list) else []
    for n, q in enumerate(questions, 1):
        where = f"question {n}"
        if not isinstance(q, dict) or set(q) != set(QUESTION_FIELDS):
            got = sorted(q) if isinstance(q, dict) else type(q).__name__
            problems.append(f"{where}: fields {got}, expected {sorted(QUESTION_FIELDS)}")
            continue
        if type(q["q_index"]) is not int or q["q_index"] != n:
            problems.append(f"{where}: q_index {q['q_index']!r}")
        if not isinstance(q["prompt"], str) or not q["prompt"].strip():
            problems.append(f"{where}: empty prompt")
        if q["key"] not in LETTERS:
            problems.append(f"{where}: key {q['key']!r}")
        options = q["options"]
        if (not isinstance(options, list) or len(options) != len(LETTERS)
                or any(not isinstance(o, dict) or set(o) != set(OPTION_FIELDS) for o in options)):
            problems.append(f"{where}: options must be four {{letter, text}} objects")
        elif [o["letter"] for o in options] != list(LETTERS):
            problems.append(f"{where}: option letters {[o['letter'] for o in options]}")
        elif any(not isinstance(o["text"], str) or not o["text"].strip() for o in options):
            problems.append(f"{where}: empty option text")
    if problems:
        raise ExportError(f"{uid}: candidate fields outside the authoring contract: " + "; ".join(problems))


def _check_cloze(uid: str, unit: dict) -> None:
    gaps = [GAP_PROMPT.fullmatch(q["prompt"]) for q in unit["questions"]]
    markers = [int(n) for n in GAP_MARKER.findall(unit["passage"])]
    if any(gaps):
        numbers = [int(m.group(1)) if m else None for m in gaps]
        if numbers != [q["q_index"] for q in unit["questions"]]:
            raise ExportError(f"{uid}: cloze gap questions {numbers} must be 'Gap (n)' with n = q_index")
        if markers != numbers:
            raise ExportError(f"{uid}: cloze gap markers {markers} in the passage do not match its gap "
                              f"questions {numbers}")
    elif markers:
        raise ExportError(f"{uid}: gap markers {markers} in a unit without gap questions")


def load_candidate(root: Path, entry: dict) -> dict:
    uid = entry["unit_id"]
    raw = (root / entry["source"]).read_bytes()
    got = sha256_bytes(raw)
    if got != entry["sha256"]:
        raise ExportError(f"{uid}: candidate sha256 {got[:12]}… does not match the roster's "
                          f"{entry['sha256'][:12]}… ({entry['source']}); changed bytes need a rebuilt roster "
                          "and renewed review")
    unit = json.loads(raw)
    _check_candidate_fields(uid, unit, entry)
    if content_digest(unit) != entry["content_sha256"]:
        raise ExportError(f"{uid}: content digest disagrees with the roster")
    _check_cloze(uid, unit)
    return unit


def shard_name(release: str) -> str:
    return f"p5-{release}.json"


def shard_key(release: str) -> str:
    """The content key of a release's Layer 2 shard: a flat key the worker's
    content whitelist accepts, served from data/explanations/<name>."""
    return f"explanations/{shard_name(release)}"


def build_rows(entry: dict, unit: dict, explanation_shard: str | None) -> list[dict]:
    uid, revision, section = entry["unit_id"], entry["revision"], unit["section"]
    return [{
        "qid": make_qid(uid, revision, section, q["q_index"]),
        "exam_id": exam_id(uid, revision),
        "provpass": None,
        "section": section,
        "number": q["q_index"],
        "title": unit["title"],
        "context": unit["passage"],
        "prompt": q["prompt"],
        "options": [{"letter": o["letter"], "text": o["text"]} for o in q["options"]],
        "answer": q["key"],
        "source": "synthetic",
        "unit_id": uid,
        "revision": revision,
        "explanation_shard": explanation_shard,
    } for q in unit["questions"]]


def check_unique_qids(rows: list[dict]) -> None:
    seen, dups = set(), set()
    for row in rows:
        (dups if row["qid"] in seen else seen).add(row["qid"])
    if dups:
        raise ExportError(f"duplicate qid(s): {sorted(dups)}")


def _keys(node):
    if isinstance(node, dict):
        for key, value in node.items():
            yield key
            yield from _keys(value)
    elif isinstance(node, list):
        for value in node:
            yield from _keys(value)


def _strings(node):
    if isinstance(node, dict):
        for value in node.values():
            yield from _strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from _strings(value)
    elif isinstance(node, str):
        yield node


def check_bank(bank: dict, candidates: dict[str, dict]) -> None:
    """The whitelist, the denylist and the rationale-leak check on a bank."""
    problems = []
    if list(bank) != list(BANK_FIELDS):
        problems.append(f"bank fields {list(bank)}, expected {list(BANK_FIELDS)}")
    for row in bank.get("questions", []):
        qid = row.get("qid", "?")
        if list(row) != list(ROW_FIELDS):
            problems.append(f"{qid}: missing {sorted(set(ROW_FIELDS) - set(row))}, "
                            f"extra {sorted(set(row) - set(ROW_FIELDS))}")
        options = row.get("options")
        if not isinstance(options, list) or any(not isinstance(o, dict) or list(o) != list(OPTION_FIELDS)
                                                for o in options):
            problems.append(f"{qid}: option fields")
        if row.get("provpass", 0) is not None or row.get("source") != "synthetic":
            problems.append(f"{qid}: provpass must be null and source 'synthetic'")
    leaked = sorted({k for k in _keys(bank) if k in DENYLIST or k.startswith("_")})
    if leaked:
        problems.append(f"internal keys {leaked}")
    text = "\n".join(sorted(set(_strings(bank))))
    for uid, unit in candidates.items():
        for q in unit["questions"]:
            pieces = {q["rationale"].strip(), *(p.strip() for p in q["rationale"].split("\n\n"))}
            if any(len(p) >= LEAK_MIN_CHARS and p in text for p in pieces):
                problems.append(f"{uid} question {q['q_index']}: rationale text in the bank")
    if problems:
        raise ExportError("bank contract: " + "; ".join(problems))


def _shape_problems(value, shape, where: str) -> list[str]:
    if isinstance(shape, dict):
        if type(value) is not dict or list(value) != list(shape):
            return [f"{where} is not an object with fields {list(shape)}"]
        return [p for key, inner in shape.items() for p in _shape_problems(value[key], inner, f"{where}.{key}")]
    if isinstance(shape, list):
        if type(value) is not list:
            return [f"{where} is not an array"]
        return [p for n, item in enumerate(value) for p in _shape_problems(item, shape[0], f"{where}[{n}]")]
    kinds = shape if isinstance(shape, tuple) else (shape,)
    if type(value) not in kinds:
        return [f"{where} is {type(value).__name__}, not {' or '.join(k.__name__ for k in kinds)}"]
    return []


def check_schema(bank) -> None:
    """The final whole-output check: the bank is exactly BANK_SHAPE, each
    row's qid and exam_id are the documented ones for its unit, revision,
    section and number, and every row names the same explanation shard: the
    release's key, or none."""
    problems = _shape_problems(bank, BANK_SHAPE, "bank")
    if not problems:
        if bank["format"] != BANK_FORMAT or bank["source"] != "synthetic" or not RELEASE.fullmatch(bank["release"]):
            problems.append("bank format, source or release")
        if bank["stamp"] != (PREVIEW_STAMP if bank["preview"] else None):
            problems.append("bank stamp disagrees with preview")
        problems += [f"exclusion pair {pair} is not two unit ids" for pair in bank["exclusion_pairs"] if len(pair) != 2]
        shard = shard_key(bank["release"])
        references = sorted({str(row["explanation_shard"]) for row in bank["questions"]})
        if len(references) > 1:
            problems.append(f"rows disagree on explanation_shard: {references}")
        for n, row in enumerate(bank["questions"]):
            where = f"bank.questions[{n}]"
            try:
                qid = make_qid(row["unit_id"], row["revision"], row["section"], row["number"])
            except ExportError as exc:
                problems.append(f"{where}: {exc}")
                continue
            if row["qid"] != qid or row["exam_id"] != exam_id(row["unit_id"], row["revision"]):
                problems.append(f"{where}: qid {row['qid']!r} / exam_id {row['exam_id']!r}, expected {qid!r}")
            if row["answer"] not in LETTERS or [o["letter"] for o in row["options"]] != list(LETTERS):
                problems.append(f"{where}: options and answer must use the letters A–D")
            if row["source"] != "synthetic" or row["explanation_shard"] not in (None, shard):
                problems.append(f"{where}: source or explanation_shard")
    if problems:
        raise ExportError(f"bank schema: {len(problems)} problem(s): " + "; ".join(problems[:10]))


def check_exclusion_pairs(roster: dict, unit_ids, single_session: bool) -> list[list[str]]:
    held = sorted(list(p["units"]) for p in roster["exclusion_pairs"] if set(p["units"]) <= set(unit_ids))
    if single_session and held:
        raise ExportError(f"single-session export holds both members of exclusion pair(s) {held}")
    return held


def _bank_strings(rows: list[dict]) -> list[tuple[str, str, str]]:
    """Every exported student string as (unit_id, field, text): each unit's
    title and passage once, every prompt and option."""
    strings, seen_units = [], set()
    for row in rows:
        if row["unit_id"] not in seen_units:
            seen_units.add(row["unit_id"])
            strings += [(row["unit_id"], "title", row["title"]), (row["unit_id"], "context", row["context"])]
        strings.append((row["unit_id"], f"{row['qid']} prompt", row["prompt"]))
        strings += [(row["unit_id"], f"{row['qid']} option {o['letter']}", o["text"]) for o in row["options"]]
    return strings


def lint_rows(rows: list[dict]) -> tuple[int, list[dict]]:
    """Default-mode learner-output lint over every exported student string:
    each unit's title and passage once, every prompt and option."""
    strings = _bank_strings(rows)
    findings = [{"unit_id": uid, "field": field, "rule": rule, "excerpt": excerpt}
                for uid, field, text in strings for rule, excerpt in LINT.scan_text(text)]
    return len(strings), findings


# ---------------------------------------- internal labels in learner text

def fold(text: str) -> str:
    """text as the internal-label gate compares it: compatibility characters
    decomposed (NFKD: a full-width or mathematical letter is the plain one),
    accents, other combining marks and invisible format characters dropped,
    every dash or minus sign a hyphen, and case folded on both sides of the
    decomposition, as the learner-output lint folds it."""
    decomposed = unicodedata.normalize("NFKD", unicodedata.normalize("NFKD", text.casefold()).casefold())
    return "".join("-" if unicodedata.category(c) == "Pd" or c in MINUS_SIGNS else c
                   for c in decomposed if unicodedata.category(c) not in ("Mn", "Me", "Cf"))


def internal_ids(catalog: dict[str, str], unit_ids) -> re.Pattern:
    """The ids learner text may not carry, as a pattern over fold()ed text,
    derived from the ids in use rather than listed by hand. Every Layer-1
    entry id in the catalogs and every unit id in the roster stands for its
    series: the id's first run (its section prefix) as it is, any letters for
    each later run of letters, any digits for each run of digits, a hyphen or
    an underscore for each separator. So LAS-TYPE-001 also stands for
    LAS-TYPE-99, ELF-TYPE-001 for the generation family ELF-CLOZE-001, and
    las-b19-002 for every unit id of its section and so for every qid. An id
    counts wherever it stands, also run into the words around it."""
    shapes = set()
    for identifier in [*catalog, *unit_ids]:
        runs = list(ID_RUN.finditer(fold(identifier)))
        if not runs:
            continue
        shape = [re.escape(runs[0].group())]
        for run in runs[1:]:
            kind, text = run.lastgroup, run.group()
            shape.append(r"[^\W\d_]+" if kind == "letters" else r"\d+" if kind == "digits"
                         else "[-_]" if text in "-_" else re.escape(text))
        shapes.add("".join(shape))
    if not shapes:
        raise ExportError("no Layer-1 entry id and no unit id to derive the internal-label gate's id series from")
    return re.compile("|".join(sorted(shapes)))


def _internal_labels(units: list[dict]) -> list[str]:
    """Each exported unit's family label and its parts, and its question-family
    labels, fold()ed."""
    labels = set()
    for unit in units:
        family = unit["family"] if isinstance(unit.get("family"), str) else ""
        labels.update([family, *(part.strip() for part in family.split("/"))])
        meta = unit.get("generator_meta")
        families = meta.get("question_families") if isinstance(meta, dict) else None
        if isinstance(families, dict):
            labels.update(label for label in families.values() if isinstance(label, str))
    return sorted({fold(label) for label in labels if len(label) >= LABEL_MIN_CHARS})


def learner_views(text: str) -> list[str]:
    """text as stored and as a learner sees it, each fold()ed: the
    learner-output lint's rendered views (invisible characters dropped,
    right-to-left overrides undone, NFKC, KaTeX markup between MathText's
    delimiters interpreted, so that \\text{LAS-TY}\\text{PE-001} reads
    LAS-TYPE-001, and Markdown and HTML markup interpreted as defense in
    depth). The views are the lint's own, so both gates read one rendering."""
    text = unicodedata.normalize("NFC", text)
    return list(dict.fromkeys(fold(view) for view in (text, *(v.text for v in LINT._views(text)))))


def internal_labels_in(text: str, ids: re.Pattern, labels: list[str]) -> list[str]:
    """The internal ids and labels that text carries in any of its views, fold()ed."""
    found = set()
    for view in learner_views(text):
        found.update(m.group() for m in ids.finditer(view))
        found.update(label for label in labels if label in view)
    return sorted(found)


def check_bank_labels(rows: list[dict], ids: re.Pattern, labels: list[str]) -> None:
    """No title, passage, prompt or option carries an internal id or label, as
    stored or as rendered. qid, exam_id, unit_id and explanation_shard hold a
    unit id by design: they are keys the app reads, not text it shows."""
    problems = [f"{uid} {field} carries an internal label {found}"
                for uid, field, text in _bank_strings(rows) if (found := internal_labels_in(text, ids, labels))]
    if problems:
        raise ExportError(f"bank text: {len(problems)} problem(s): " + "; ".join(problems[:12]))


# -------------------------------------------------------- Layer 2 shard

def _type(value) -> str:
    return "null" if value is None else type(value).__name__


def load_frameworks(root: Path) -> tuple[dict[str, str], list[dict]]:
    """Every Layer-1 entry id in frameworks/*.json with its section, and the
    files read as {path, sha256}; a missing or unreadable catalog is refused."""
    folder = root / FRAMEWORKS_REL
    paths = sorted(folder.glob("*.json")) if folder.is_dir() else []
    if not paths:
        raise ExportError(f"no Layer-1 framework file under {FRAMEWORKS_REL}/: framework ids cannot be checked")
    catalog: dict[str, str] = {}
    files = []
    for path in paths:
        shown = f"{FRAMEWORKS_REL}/{path.name}"
        raw = path.read_bytes()
        try:
            doc = json.loads(raw)
            section, ids = doc["section"], [entry["id"] for entry in doc["entries"]]
        except (ValueError, KeyError, TypeError) as exc:
            raise ExportError(f"framework file {shown} is not readable: {exc!r}") from None
        if type(section) is not str or any(type(i) is not str for i in ids):
            raise ExportError(f"framework file {shown}: its section and entry ids must be strings")
        repeated = sorted({i for i in ids if ids.count(i) > 1 or i in catalog})
        if repeated:
            raise ExportError(f"framework file {shown} repeats the entry id(s) {repeated}")
        catalog.update(dict.fromkeys(ids, section))
        files.append({"path": shown, "sha256": sha256_bytes(raw)})
    return catalog, files


def read_shard(path: Path, release: str) -> tuple[bytes, dict]:
    """The shard's exact bytes and its entries, read without following a
    symlink; anything but a non-empty JSON object of unique keys is refused."""
    shown = f"{EXPLANATIONS_REL}/{path.name}"
    try:
        st = os.lstat(path)
    except FileNotFoundError:
        raise ExportError(f"explanation shard {shown} does not exist: --explanations pairs release {release!r} "
                          "with exactly that file") from None
    except OSError as exc:
        raise ExportError(f"explanation shard {shown} cannot be read: {exc.strerror}") from None
    if stat.S_ISLNK(st.st_mode):
        raise ExportError(f"explanation shard {shown} is a symlink")
    if not stat.S_ISREG(st.st_mode):
        raise ExportError(f"explanation shard {shown} is not a regular file")
    try:
        with open(os.open(path, os.O_RDONLY | os.O_NOFOLLOW), "rb") as handle:
            raw = handle.read()
    except OSError as exc:
        raise ExportError(f"explanation shard {shown} cannot be read: {exc.strerror}") from None
    if not raw.strip():
        raise ExportError(f"explanation shard {shown} is empty")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ExportError(f"explanation shard {shown} is not UTF-8: {exc}") from None

    def unique(pairs):
        keys = [key for key, _ in pairs]
        repeated = sorted({key for key in keys if keys.count(key) > 1})
        if repeated:
            raise ExportError(f"explanation shard {shown} repeats the key(s) {repeated}")
        return dict(pairs)

    def finite(name):
        raise ExportError(f"explanation shard {shown} holds the non-finite number {name}")

    try:
        shard = json.loads(text, object_pairs_hook=unique, parse_constant=finite)
    except ValueError as exc:  # malformed JSON, a byte-order mark, an integer past the digit limit
        raise ExportError(f"explanation shard {shown} is not readable JSON: {exc}") from None
    if type(shard) is not dict:
        raise ExportError(f"explanation shard {shown} must be an object keyed by qid, not {_type(shard)}")
    if not shard:
        raise ExportError(f"explanation shard {shown} holds no explanations")
    return raw, shard


def _entry_problems(qid: str, entry, row: dict, catalog: dict[str, str]) -> list[str]:
    """One entry's shape, distractor coverage and framework id."""
    if type(entry) is not dict:
        return [f"{qid}: the explanation is {_type(entry)}, not an object"]
    if not set(EXPLANATION_REQUIRED) <= set(entry) <= set(EXPLANATION_FIELDS):
        return [f"{qid}: the explanation has fields {sorted(entry)}; expected {list(EXPLANATION_REQUIRED)} "
                "and optionally framework_id"]
    problems = []

    def text(where: str, value, nullable: bool = False) -> None:
        if value is None and nullable:
            return
        if type(value) is not str:
            problems.append(f"{qid}: {where} is {_type(value)}, not a string{' or null' if nullable else ''}")
        elif not value.strip():
            problems.append(f"{qid}: {where} is empty")

    text("solution_path", entry["solution_path"])
    steps = entry["steps"]
    if type(steps) is not list or not steps:
        problems.append(f"{qid}: steps is {'empty' if steps == [] else _type(steps)}; it must be a non-empty array")
    else:
        numbers = []
        for i, step in enumerate(steps):
            where = f"steps[{i}]"
            if type(step) is not dict:
                problems.append(f"{qid}: {where} is {_type(step)}, not an object")
            elif set(step) != set(STEP_FIELDS):
                problems.append(f"{qid}: {where} has fields {sorted(step)}; expected {list(STEP_FIELDS)}")
            else:
                if type(step["n"]) is int:
                    numbers.append(step["n"])
                else:
                    problems.append(f"{qid}: {where}.n is {_type(step['n'])}, not an integer")
                text(f"{where}.title", step["title"])
                text(f"{where}.text", step["text"])
                if type(step["tier"]) is not str or step["tier"] not in TIERS:
                    problems.append(f"{qid}: {where}.tier is {step['tier']!r}, not {' or '.join(TIERS)}")
        if len(numbers) == len(steps) and numbers != list(range(1, len(steps) + 1)):
            problems.append(f"{qid}: steps are numbered {numbers}; expected 1 to {len(steps)} in order")
    distractors = entry["distractors"]
    if type(distractors) is not list:
        problems.append(f"{qid}: distractors is {_type(distractors)}, not an array")
    else:
        letters = []
        for i, distractor in enumerate(distractors):
            where = f"distractors[{i}]"
            if type(distractor) is not dict:
                problems.append(f"{qid}: {where} is {_type(distractor)}, not an object")
            elif set(distractor) != set(DISTRACTOR_FIELDS):
                problems.append(f"{qid}: {where} has fields {sorted(distractor)}; expected {list(DISTRACTOR_FIELDS)}")
            else:
                for field in DISTRACTOR_FIELDS:
                    text(f"{where}.{field}", distractor[field])
                letters.append(distractor["letter"])
        wrong = [letter for letter in LETTERS if letter != row["answer"]]
        if len(letters) == len(distractors) and letters != wrong:
            problems.append(f"{qid}: distractor letters {letters}; expected {wrong}: each wrong option once, in "
                            f"letter order, and never the key {row['answer']}")
    text("technique", entry["technique"])
    text("pitfall", entry["pitfall"], nullable=True)
    if "framework_id" in entry:
        framework_id = entry["framework_id"]
        if framework_id is None:
            problems.append(f"{qid}: framework_id is null; omit the field when no Layer-1 entry fits")
        elif type(framework_id) is not str:
            problems.append(f"{qid}: framework_id is {_type(framework_id)}, not a string")
        elif catalog.get(framework_id) != row["section"]:
            found = (f"an entry of section {catalog[framework_id]}" if framework_id in catalog
                     else f"not a Layer-1 entry id in {FRAMEWORKS_REL}/*.json")
            problems.append(f"{qid}: framework_id {framework_id!r} is {found}; a {row['section']} question takes "
                            f"a {row['section']} entry or no framework_id")
    return problems


def _entry_strings(entry: dict) -> list[tuple[str, str]]:
    """A well-formed entry's learner text, as (field, text)."""
    strings = [("solution_path", entry["solution_path"])]
    for i, step in enumerate(entry["steps"]):
        strings += [(f"steps[{i}].title", step["title"]), (f"steps[{i}].text", step["text"])]
    for i, distractor in enumerate(entry["distractors"]):
        strings += [(f"distractors[{i}].why_tempting", distractor["why_tempting"]),
                    (f"distractors[{i}].why_wrong", distractor["why_wrong"])]
    strings.append(("technique", entry["technique"]))
    if entry["pitfall"] is not None:
        strings.append(("pitfall", entry["pitfall"]))
    return strings


def _all_strings(entry: dict) -> list[tuple[str, str]]:
    """Every string value of a well-formed entry, as the lint CLI walks it."""
    strings = _entry_strings(entry)
    strings += [(f"distractors[{i}].letter", d["letter"]) for i, d in enumerate(entry["distractors"])]
    if "framework_id" in entry:
        strings.append(("framework_id", entry["framework_id"]))
    return strings


def _balanced(text: str) -> bool:
    """MathText typesets what lies between U+E000 and the next U+E001: every
    delimiter must pair, without nesting."""
    inside = False
    for char in text:
        if char == MATH_OPEN:
            if inside:
                return False
            inside = True
        elif char == MATH_CLOSE:
            if not inside:
                return False
            inside = False
    return not inside


def _rationale_pieces(units: list[dict]) -> list[tuple[str, int, str]]:
    """Each rationale, paragraph and sentence of LEAK_MIN_CHARS or more that is
    not the unit's own student text, which an explanation may quote."""
    pieces: dict[str, tuple[str, int]] = {}
    for unit in units:
        student = "\n".join([unit["title"], unit["passage"], *(q["prompt"] for q in unit["questions"]),
                             *(o["text"] for q in unit["questions"] for o in q["options"])])
        for q in unit["questions"]:
            for paragraph in [q["rationale"], *re.split(r"\n\s*\n", q["rationale"])]:
                for piece in [paragraph, *SENTENCE_END.split(paragraph)]:
                    piece = piece.strip()
                    if len(piece) >= LEAK_MIN_CHARS and piece not in student:
                        pieces.setdefault(piece, (unit["candidate_id"], q["q_index"]))
    return [(uid, n, piece) for piece, (uid, n) in pieces.items()]


def _text_problems(qid: str, entry: dict, ids: re.Pattern, labels: list[str], pieces) -> list[str]:
    """Internal ids and labels, unbalanced math and rationale text in one entry's learner text."""
    problems = []
    for where, value in _entry_strings(entry):
        found = internal_labels_in(value, ids, labels)
        if found:
            problems.append(f"{qid}: {where} carries an internal label {found}")
        if not _balanced(value):
            problems.append(f"{qid}: {where} has unbalanced math delimiters (U+E000 opens, U+E001 closes)")
        copied = sorted({f"{uid} question {n}" for uid, n, piece in pieces if piece in value})
        if copied:
            problems.append(f"{qid}: {where} repeats rationale text of {', '.join(copied)}")
    return problems


def _canonical(entry: dict) -> dict:
    canonical = {
        "solution_path": entry["solution_path"],
        "steps": [{field: step[field] for field in STEP_FIELDS} for step in entry["steps"]],
        "distractors": [{field: d[field] for field in DISTRACTOR_FIELDS} for d in entry["distractors"]],
        "technique": entry["technique"],
        "pitfall": entry["pitfall"],
    }
    if "framework_id" in entry:
        canonical["framework_id"] = entry["framework_id"]
    return canonical


def check_explanations(shard: dict, rows: list[dict], units: list[dict], catalog: dict[str, str],
                       ids: re.Pattern, labels: list[str]) -> tuple[dict, int]:
    """The shard's entries in canonical form and bank order, and the number of
    strings linted; ExportError on any gate (design §D)."""
    qids = [row["qid"] for row in rows]
    missing = [qid for qid in qids if qid not in shard]
    if missing:
        raise ExportError(f"explanations: no explanation for {len(missing)} exported qid(s): {missing}")
    extra = sorted(set(shard) - set(qids))
    if extra:
        raise ExportError(f"explanations: entries for key(s) not in this export: {extra}")
    problems = [p for row in rows for p in _entry_problems(row["qid"], shard[row["qid"]], row, catalog)]
    if not problems:
        pieces = _rationale_pieces(units)
        problems = [p for row in rows for p in _text_problems(row["qid"], shard[row["qid"]], ids, labels, pieces)]
    if problems:
        raise ExportError(f"explanations: {len(problems)} problem(s): " + "; ".join(problems[:12]))
    strings = [(qid, where, text) for qid in qids for where, text in _all_strings(shard[qid])]
    findings = [f"{rule} {qid} {where}: …{excerpt}…"
                for qid, where, text in strings for rule, excerpt in LINT.scan_text(text)]
    if findings:
        raise ExportError(f"learner-output lint on explanations: {len(findings)} finding(s): " + "; ".join(findings))
    return {qid: _canonical(shard[qid]) for qid in qids}, len(strings)


def _first_difference(one: bytes, two: bytes) -> int:
    lines_one, lines_two = one.splitlines(), two.splitlines()
    for number, (a, b) in enumerate(zip(lines_one, lines_two), 1):
        if a != b:
            return number
    return min(len(lines_one), len(lines_two)) + 1


def _rel(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.name


def _explain(root: Path, release: str, rows: list[dict], units: list[dict], catalog: dict[str, str],
             ids: re.Pattern, labels: list[str]) -> tuple[bytes, dict]:
    """The release's shard, validated against the rows and in canonical bytes,
    and its manifest block."""
    path = root / EXPLANATIONS_REL / shard_name(release)
    raw, shard = read_shard(path, release)
    canonical, linted = check_explanations(shard, rows, units, catalog, ids, labels)
    rendered = render_json(canonical)
    if rendered != raw:
        raise ExportError(f"explanation shard {EXPLANATIONS_REL}/{path.name} is not in canonical form (first "
                          f"difference at line {_first_difference(raw, rendered)}): write it as the exporter "
                          f"renders it, entries in bank order with the fields {list(EXPLANATION_FIELDS)}, steps "
                          f"{list(STEP_FIELDS)} and distractors {list(DISTRACTOR_FIELDS)} in that order, two-space "
                          "JSON, UTF-8 without ASCII escapes and one final newline")
    block = {"path": shard_name(release), "key": shard_key(release), "source": _rel(path, root),
             "sha256": sha256_bytes(rendered), "entries": len(canonical),
             "lint": {"tool": LINT_REL, "mode": "default", "strings_checked": linted, "findings": []}}
    return rendered, block


def _build(root: Path, roster_path: Path, *, release: str, include_pending: bool, units, single_session: bool,
           explanations: bool):
    if not RELEASE.fullmatch(release) or len(release) > 40:
        raise ExportError(f"release {release!r}: use lowercase letters, digits and single hyphens (at most 40), "
                          "so the bank key fits the worker's content whitelist")
    if include_pending and not release.startswith("preview"):
        raise ExportError("--include-pending makes a PREVIEW export: its release name must start with 'preview'")
    roster_bytes = roster_path.read_bytes()
    roster = _load_roster(roster_bytes)
    registry = load_retired(root)
    _check_retirement(roster, registry)
    chosen, excluded = select_units(roster, registry, units=units, include_pending=include_pending)
    loaded = [(entry, load_candidate(root, entry)) for entry in chosen]
    catalog, frameworks = load_frameworks(root)
    ids = internal_ids(catalog, [entry["unit_id"] for entry in roster["units"]])
    labels = _internal_labels([unit for _, unit in loaded])
    key = shard_key(release) if explanations else None
    rows = [row for entry, unit in loaded for row in build_rows(entry, unit, key)]
    check_unique_qids(rows)
    held = check_exclusion_pairs(roster, [entry["unit_id"] for entry, _ in loaded], single_session)
    bank = {"format": BANK_FORMAT, "release": release, "preview": include_pending,
            "stamp": PREVIEW_STAMP if include_pending else None, "source": "synthetic",
            "exclusion_pairs": held, "questions": rows}
    check_bank(bank, {entry["unit_id"]: unit for entry, unit in loaded})
    check_bank_labels(rows, ids, labels)
    checked, findings = lint_rows(rows)
    if findings:
        listed = "; ".join(f"{f['rule']} {f['unit_id']} {f['field']}: …{f['excerpt']}…" for f in findings)
        raise ExportError(f"learner-output lint: {len(findings)} finding(s): {listed}")
    check_schema(bank)
    references = {row["explanation_shard"] for row in rows}
    if references != {key}:
        raise ExportError(f"rows reference explanation shard(s) {sorted(map(str, references))}, but this export "
                          + (f"includes {key}" if explanations else "includes no explanation shard"))
    bank_name = f"p5-bank-{release}.json"
    bank_bytes = render_json(bank)
    files = {bank_name: bank_bytes}
    explained = None
    if explanations:
        files[shard_name(release)], explained = _explain(root, release, rows, [unit for _, unit in loaded],
                                                         catalog, ids, labels)
    manifest = {
        "format": MANIFEST_FORMAT,
        "release": release,
        "preview": include_pending,
        "bank": {"path": bank_name, "sha256": sha256_bytes(bank_bytes)},
        "roster": {"path": _rel(roster_path, root), "sha256": sha256_bytes(roster_bytes)},
        "retired_registry": {"path": RETIRED_REL, "sha256": sha256_bytes((root / RETIRED_REL).read_bytes())},
        "frameworks": frameworks,
        "exporter": {"path": EXPORTER_REL, "sha256": sha256_bytes(Path(__file__).read_bytes())},
        "selection": {"include_pending": include_pending, "single_session": single_session,
                      "requested_units": sorted(units) if units is not None else None},
        "units": [{"unit_id": e["unit_id"], "revision": e["revision"], "approval": e["approval"],
                   "section": e["section"], "question_count": e["question_count"], "source": e["source"],
                   "sha256": e["sha256"], "content_sha256": e["content_sha256"]} for e, _ in loaded],
        "excluded": excluded,
        "exclusion_pairs": held,
        "gates": list(GATES) + (list(EXPLANATION_GATES) if explanations else []),
        "lint": {"tool": LINT_REL, "mode": "default", "strings_checked": checked, "findings": findings},
        "explanations": explained,
    }
    files[MANIFEST_NAME] = render_json(manifest)
    return files


def export_bank(root: Path, roster_path: Path, *, release: str = "preview", include_pending: bool = False,
                units=None, single_session: bool = False, explanations: bool = False) -> dict[str, bytes]:
    """Build the bank, and with explanations=True the release's validated
    Layer 2 shard, twice from the inputs on disk and return {name: bytes} only
    when every gate passes and both builds agree byte for byte."""
    options = dict(release=release, include_pending=include_pending,
                   units=list(units) if units is not None else None, single_session=single_session,
                   explanations=explanations)
    first = _build(root, roster_path, **options)
    second = _build(root, roster_path, **options)
    if first != second:
        differing = sorted(n for n in set(first) | set(second) if first.get(n) != second.get(n))
        raise ExportError(f"non-deterministic output: two builds from the same inputs differ in {differing}")
    return first


def check_out_dir(out_dir: Path) -> tuple[Path, tuple[str, ...]]:
    """The preview root, resolved once, and out_dir's components below it:
    out_dir must be spelled inside the root, without '..'."""
    root = PREVIEW_DIR.resolve()
    try:
        parts = out_dir.absolute().relative_to(root).parts
    except ValueError:
        parts = ()
    if not parts or ".." in parts:
        raise ExportError(f"output must be a directory inside {PREVIEW_REL}/, got {out_dir}")
    return root, parts


def _lstat(dir_fd: int, name: str):
    try:
        return os.stat(name, dir_fd=dir_fd, follow_symlinks=False)
    except FileNotFoundError:
        return None


def _require(path: Path, st, is_kind, kind: str) -> None:
    if stat.S_ISLNK(st.st_mode):
        raise ExportError(f"{path} is a symlink; no export path below {PREVIEW_REL}/ may be one")
    if not is_kind(st.st_mode):
        raise ExportError(f"{path} is not a {kind}")


def _open_out_dir(out_dir: Path, *, create: bool) -> int | None:
    """A descriptor for out_dir, reached from the preview root one component
    at a time with O_NOFOLLOW; missing directories are created when asked,
    otherwise None is returned."""
    root, parts = check_out_dir(out_dir)
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    try:
        fd = os.open(root, flags)
    except OSError as exc:
        raise ExportError(f"cannot open the preview root {root}: {exc.strerror}") from None
    try:
        path = root
        for part in parts:
            path /= part
            st = _lstat(fd, part)
            if st is None and not create:
                os.close(fd)
                return None
            if st is None:
                os.mkdir(part, dir_fd=fd)
            else:
                _require(path, st, stat.S_ISDIR, "directory")
            child = os.open(part, flags, dir_fd=fd)  # O_NOFOLLOW: a link swapped in since the lstat fails here
            os.close(fd)
            fd = child
    except BaseException:
        os.close(fd)
        raise
    return fd


def _replace(dir_fd: int, name: str, data: bytes) -> None:
    """Write data to a fresh temporary file beside name, then rename it over
    name: the old entry, a hard link included, is replaced, never written to."""
    tmp = f".{name}.{secrets.token_hex(8)}.tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o666, dir_fd=dir_fd)
    try:
        with open(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, name, src_dir_fd=dir_fd, dst_dir_fd=dir_fd)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp, dir_fd=dir_fd)
        raise


def write_export(files: dict[str, bytes], out_dir: Path) -> None:
    """Write files into out_dir below the preview root, checking every path
    before anything is written."""
    if any(name in ("", ".", "..") or "/" in name for name in files):
        raise ExportError(f"export file names must be plain names, got {sorted(files)}")
    fd = _open_out_dir(out_dir, create=True)
    try:
        stray = sorted(set(os.listdir(fd)) - set(files))
        if stray:
            raise ExportError(f"{out_dir} holds other files {stray}; export into an empty or dedicated directory")
        for name in files:
            st = _lstat(fd, name)
            if st is not None:
                _require(out_dir / name, st, stat.S_ISREG, "regular file")
        for name, data in files.items():
            _replace(fd, name, data)
    finally:
        os.close(fd)


def read_export(out_dir: Path) -> dict[str, bytes]:
    """The files in out_dir, read without following any symlink; {} when
    out_dir does not exist yet."""
    fd = _open_out_dir(out_dir, create=False)
    if fd is None:
        return {}
    try:
        found = {}
        for name in sorted(os.listdir(fd)):
            _require(out_dir / name, os.stat(name, dir_fd=fd, follow_symlinks=False), stat.S_ISREG, "regular file")
            with open(os.open(name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=fd), "rb") as handle:
                found[name] = handle.read()
        return found
    finally:
        os.close(fd)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, help=f"output directory inside {PREVIEW_REL}/ (default: {PREVIEW_REL}/full)")
    ap.add_argument("--release", help="release name for p5-bank-<release>.json (default: preview)")
    ap.add_argument("--include-pending", action="store_true",
                    help="also export pending-owner-ratification units; stamps the bank PREVIEW")
    ap.add_argument("--units", help="comma-separated unit ids (default: every eligible unit)")
    ap.add_argument("--single-session", action="store_true",
                    help="the export is one session's content: refuse complete exclusion pairs")
    ap.add_argument("--explanations", action="store_true",
                    help=f"validate {EXPLANATIONS_REL}/p5-<release>.json against the exported rows and pair it "
                         "with the bank")
    ap.add_argument("--sample", action="store_true",
                    help=f"export the committed sample ({', '.join(SAMPLE_UNITS)}) to {PREVIEW_REL}/sample")
    ap.add_argument("--pilot", action="store_true",
                    help=f"export the Layer 2 pilot ({', '.join(PILOT_UNITS)}) with "
                         f"{EXPLANATIONS_REL}/{shard_name(PILOT_RELEASE)} to {PREVIEW_REL}/pilot")
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 when the output directory's files differ from a fresh export")
    ap.add_argument("--roster", type=Path, default=ROSTER_PATH, help="approval roster (default: %(default)s)")
    args = ap.parse_args(argv)
    if args.sample or args.pilot:
        preset = "--sample" if args.sample else "--pilot"
        if (args.sample and args.pilot) or args.out or args.release or args.units or args.include_pending \
                or args.single_session or args.explanations:
            ap.error(f"{preset} takes no other selection or output option")
        if args.sample:
            out, release, units, explanations = SAMPLE_DIR, SAMPLE_RELEASE, list(SAMPLE_UNITS), False
        else:
            out, release, units, explanations = PILOT_DIR, PILOT_RELEASE, list(PILOT_UNITS), True
    else:
        out, release = args.out or PREVIEW_DIR / "full", args.release or "preview"
        units = [u.strip() for u in args.units.split(",") if u.strip()] if args.units else None
        explanations = args.explanations
    try:
        check_out_dir(out)
        files = export_bank(REPO_ROOT, args.roster, release=release, include_pending=args.include_pending,
                            units=units, single_session=args.single_session, explanations=explanations)
        if args.check:
            current = read_export(out)
            stale = [n for n, data in files.items() if current.get(n) != data]
            stray = sorted(set(current) - set(files))
            if stale or stray:
                print(f"STALE {_rel(out, REPO_ROOT)}: differs in {stale}, unexpected {stray}; rerun without --check")
                return 1
        else:
            write_export(files, out)
    except ExportError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    bank = json.loads(files[f"p5-bank-{release}.json"])
    manifest = json.loads(files[MANIFEST_NAME])
    rows = bank["questions"]
    explained = manifest["explanations"]
    paired = (f"; {explained['entries']} explanations in {explained['path']}, lint clean "
              f"({explained['lint']['strings_checked']} strings)" if explained else "")
    print(f"{'checked' if args.check else 'exported'} {len(manifest['units'])} units / {len(rows)} questions"
          f"{' [PREVIEW]' if bank['preview'] else ''} -> {_rel(out, REPO_ROOT)}/p5-bank-{release}.json; "
          f"learner lint clean ({manifest['lint']['strings_checked']} strings){paired}; excluded "
          f"{len(manifest['excluded'][RETIRED])} retired, {len(manifest['excluded'][PENDING])} pending")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

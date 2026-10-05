#!/usr/bin/env python3
"""Learner-output lint: enforce the Layer-2 rendering contract.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 6). The P5 bank's
rationale fields legitimately carry (1) snake_case taxonomy labels
(112/114 units), (2) the anglicism *hedgat* (30/114), and (3) gate-internal
meta-commentary. None of that may reach learner-facing prose. The rendered
store (data/explanations/) is clean today — this lint makes that property
enforced instead of accidental. Run it on RENDERED learner text only;
it must NOT be pointed at the bank's internal adjudication metadata.

Checks, per JSON string value (or raw text line):
  L2-SNAKE   snake_case token carrying a pipeline taxonomy stem or label,
             compared with case, diacritics and underscores folded
             (WORLD_KNOWLEDGE, tone_misread, författarens_hållning); with
             --strict also any formula-style snake_case token (värde_B)
  L2-HEDGAT  hedgat/hedgad/hedgar/hedgade/hedgning (any case)
  L2-GATEREF gate-internal references: mech.py, M-FORM/M-ECHO/M-TELL/
             M-SCHEMA/M-BANDS/M-PLAGIARISM, G-KEY/G-STEM/G-SPRAK/G-SPRÅK/
             G-DISTRACTOR/G-REGISTER/G-ENG, absolutiser/absolutizer list,
             "round-N version" / "runda N-versionen" pipeline talk

Inputs fail closed (PR #370 round 2, bead hpf-oy2w): a path that does not
exist, a directory holding no lintable file (.json/.md/.txt, not _-prefixed),
a file that is not UTF-8, and a .json file that does not parse are input
failures, printed "INPUT-FAIL <path>: reason" — never scanned as raw text,
never reported clean. Zero files examined is an input failure too.

Exit 0 = clean. Exit 1 = findings, printed "L2-<RULE> <file>:<jsonpath-or-line>: excerpt".
Exit 2 = any input failure (findings, if any, are printed as well).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

# L2-SNAKE — hardened per the 2026-08-31 GC review: case-insensitive,
# digits allowed inside segments, and the length gate is on the WHOLE
# token (>=5 chars, >=2 segments, at least one segment with >=2 letters)
# so scope_x / scope_2_shift / Scope_shift / SCOPE_SHIFT are all caught
# while math subscript notation stays protected by the store's
# math-preservation contract: v_r, a_n, b_m (total < 5) and K_2007 /
# a_1 (no segment with two letters) never flag.
_SNAKE_TOKEN = re.compile(r"\b[0-9A-Za-zÅÄÖåäö]+(?:_[0-9A-Za-zÅÄÖåäö]+)+\b")


def _fold(s: str) -> str:
    """Case, diacritics and underscores removed (PR #370 round 5, bead
    hpf-6fkm): WORLD_KNOWLEDGE folds onto the stem worldknowledge, and
    författarens_hållning onto the label forfattarens_hallning."""
    return "".join(c for c in unicodedata.normalize("NFKD", s.casefold())
                   if c != "_" and not unicodedata.combining(c))


# Tier 1 vocabulary: a snake token flags when its folded form contains the
# folded form of any entry below. Never add a bare common word: `trap` would
# hit the store's formula name A_trap, and `stance` a name like total_distance.
#
# The pipeline's trap-taxonomy vocabulary, as STEMS so case/digit/truncation
# evasions (scope_x, scope_2_shift, Scope_shift, SCOPE_SHIFT) are caught.
# Extend with any new taxonomy family; never remove without a store run.
_TAXONOMY_STEMS = ("scope", "shift", "causal", "worldknowledge",
                   "conjunction", "overgeneral", "generalis", "attribution",
                   "swap", "detail_as", "tempting", "hedg", "planted_trap", "trap_label",
                   "distractor", "misdirect", "as_main")
# Every snake_case label the pipeline's label sources use (survey 2026-10-05,
# docs/worklog/hpf-6fkm.md). Taxonomy labels, classes and statuses are listed
# in full; a bank label is listed only when no entry above already catches
# it. tests/test_verdict_enum_and_label_vocabulary_round5.py scans the same
# sources and fails on any label the default mode lets through.
_TAXONOMY_LABELS = (
    # LÄS trap tags (las/scripts/question_taxonomy.py TRAP_TAGS)
    "detail_as_main", "half_right_conjunction", "plausible_worldknowledge",
    "reversed_causality", "scope_shift", "surface_lexical_echo", "true_but_irrelevant",
    # LÄS question types (question_taxonomy.py TYPE_RULES, FALLBACK)
    "detalj_ospecificerad", "enligt_texten_detalj", "forfattarens_hallning",
    "hallning_stamning_ton", "huvudbudskap_syfte", "inference_slutsats",
    "jamforelse_relation", "ordbetydelse_i_kontext", "struktur_funktion",
    # LÄS genres (las/scripts/genre_classify.py PRIORITY, MACRO)
    "debatt_opinion", "facktext_larobok", "intervju_reportage", "juridik_myndighet",
    # ELF trap tags (elf/scripts/build_families.py TRAP_TAGS)
    "collocation_misfit", "outside_knowledge", "polarity_contrast_miss",
    "quantifier_upgrade", "role_or_attribution_swap", "scope_error", "surface_word_match",
    "tone_misread", "too_literal_or_too_far", "wrong_location",
    # gate classes (verdict schema, G-KEY/G-STEM prompts, blind_classification
    # and solver_answer in verdict files) and aggregation statuses
    "MULTIPLE_DEFENSIBLE", "NONE_DEFENSIBLE", "NOT_ANSWERABLE", "PARTIALLY_ANSWERABLE",
    "RECALL_ONLY", "STRUCTURAL_LEAK", "WORLD_KNOWLEDGE", "SURVIVED_CLEAN", "SURVIVED_FLAGGED",
    # review, sweep, audit, V-FINAL and adjudication statuses (BATCH-RUNBOOK,
    # run-batch.workflow.js, vfinal_fold.py, batch adjudication notes and
    # records, the law-16 originality sweep)
    "BEARER_SAME_DOMAIN", "BEARER_UNRELATED_FIELD", "BLOCKED_SHIP", "CONFIRMED_NOTES",
    "GODKANN_NOTED", "MINOR_EDITS", "MINOR_FIXES", "MINOR_NOTES", "NEEDS_REDESIGN",
    "NEEDS_WORK", "NO_BEARER", "PUBLISH_READY", "REJECT_LANGUAGE",
    "RESOLVED_WITH_REGRESSION", "UNRESOLVED_MITIGATED", "VERIFIED_NOTES",
    # bank labels (candidates' trap/family/genre/format fields and question
    # rationales) that no entry above catches
    "absence_of_evidence", "clone_avoidance", "cloze_5gap", "concession_overread",
    "craft_reportage", "detail_transplant_ort", "detalj_direct_detail",
    "essa_kulturhistoria", "essa_kulturhistorisk", "explicitly_refuted_criterion",
    "false_premise_kvantitet", "finding_or_ruling", "hallning_stance_tone",
    "history_essay", "huvudbudskap_main_idea", "inferens_inference", "key_derivation",
    "long_passage_5q", "magnitude_overclaim", "method_or_case", "negated_target_restated",
    "nuance_or_caveat", "one_inch_inference", "paraphrase_one_sentence",
    "polarity_mirror", "quantifier_downgrade", "reversed_comparison",
    "reversed_direction", "science_journalism", "self_blind_solve", "sense_misfit",
    "short_text_1q", "society_commentary", "stance_inversion", "stem_lexis_note",
    "too_far", "too_literal", "true_but_distorted", "two_step_leap", "umbrella_decoy",
    "whole_text_gist", "wrong_logic", "wrong_transfer", "zero_sum_displacement",
)
_TIER1 = frozenset(_fold(x) for x in _TAXONOMY_STEMS + _TAXONOMY_LABELS)


class _Snake:
    """Two-tier snake_case detector.

    Tier 1 (always fails): snake tokens whose folded form (_fold: case,
    diacritics and underscores removed) contains a taxonomy stem or label —
    these are internal join keys and must never reach learner prose.
    Tier 2 (only with --strict): any other snake token of length >= 5 with
    a >=2-letter segment — improvised formula variable names (värde_B,
    antal_A, K_diff). Those are a bounded STYLE debt (bead hpf-gyo5,
    non-blocking, inspect-before-replace), not gate-internal leakage, and
    the store's math-preservation contract protects them from blind
    rewriting. Pure subscript notation (v_r, a_n, K_2007) never flags in
    either tier.
    """

    def __init__(self, strict: bool = False):
        self.strict = strict

    def search(self, text):
        fallback = None
        for m in _SNAKE_TOKEN.finditer(text):
            tok = m.group(0)
            folded = _fold(tok)
            if any(entry in folded for entry in _TIER1):
                return m
            if (self.strict and fallback is None and len(tok) >= 5
                    and any(sum(c.isalpha() for c in seg) >= 2
                            for seg in tok.split("_"))):
                fallback = m
        return fallback


SNAKE = _Snake()
HEDGAT = re.compile(r"\bhedg(?:at|ad|ar|ade|ning)\b", re.IGNORECASE)
# Gate names — hardened per the 2026-08-31 GC review: case-INSENSITIVE for
# G-* gates and mech.py (no Swedish collision), and for M-* gates with a
# guard that exempts math prose like "k-m-form" / "kx + m-form" (a gate
# name preceded by <alnum>- or by "+ "/"= " is arithmetic, not a gate).
GATEREF_GATES = re.compile(
    r"mech\.py"
    r"|(?<![0-9A-Za-z-])(?<![+=] )[mM]-(?:form|echo|tell|schema|bands|plagiarism)\b"
    r"|\b[gG]-(?:key|stem|sprak|språk|distractor|register|eng)\b",
    re.IGNORECASE,
)
GATEREF_PHRASES = re.compile(
    r"absoluti[sz]er|round[- ]\d+\s+version|runda[- ]\d+[- ]?version\w*"
    r"|version(?:en)? från runda \d+",
    re.IGNORECASE,
)


class _GateRef:
    def search(self, text):
        return GATEREF_GATES.search(text) or GATEREF_PHRASES.search(text)


GATEREF = _GateRef()
RULES = (("L2-SNAKE", SNAKE), ("L2-HEDGAT", HEDGAT), ("L2-GATEREF", GATEREF))


def scan_text(text: str) -> list[tuple[str, str]]:
    hits = []
    for name, rx in RULES:
        m = rx.search(text)
        if m:
            start = max(0, m.start() - 30)
            hits.append((name, text[start:m.end() + 30].replace("\n", " ")))
    return hits


def walk_json(obj, path, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.startswith("_"):
                # _-prefixed keys are in-file bookkeeping (audit metadata),
                # never rendered to learners — same convention as _-files.
                continue
            walk_json(v, f"{path}.{k}", out)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk_json(v, f"{path}[{i}]", out)
    elif isinstance(obj, str):
        for rule, excerpt in scan_text(obj):
            out.append((rule, path, excerpt))


LINTABLE = (".json", ".md", ".txt")


def collect(paths: list[Path]) -> tuple[list[Path], list[str]]:
    """Files to lint, plus an INPUT-FAIL line for every path that yields none."""
    files: list[Path] = []
    failures: list[str] = []
    for p in paths:
        if p.is_dir():
            # underscore-prefixed files are pipeline bookkeeping (audit notes,
            # skip ledgers) by store convention — never learner-facing.
            found = sorted(q for q in p.rglob("*")
                           if q.is_file() and q.suffix.lower() in LINTABLE
                           and not q.name.startswith("_"))
            if not found:
                failures.append(f"INPUT-FAIL {p}: no lintable file in this directory "
                                f"({'/'.join(LINTABLE)}, not _-prefixed) — nothing to check")
            files.extend(found)
        elif p.is_file():
            files.append(p)
        else:
            failures.append(f"INPUT-FAIL {p}: path does not exist (or is not a file "
                            f"or directory)")
    return files, failures


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("paths", nargs="+", type=Path,
                    help="rendered learner-output files or directories (json/md/txt)")
    ap.add_argument("--strict", action="store_true",
                    help="also fail on generic snake_case style tokens "
                         "(formula variable names), not only taxonomy stems")
    args = ap.parse_args()
    SNAKE.strict = args.strict
    files, failures = collect(args.paths)
    for line in failures:
        print(line)
    findings = examined = 0
    for fp in files:
        try:
            text = fp.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            failures.append(f"INPUT-FAIL {fp}: not readable as UTF-8 text ({exc})")
            print(failures[-1])
            continue
        out: list[tuple[str, str, str]] = []
        if fp.suffix.lower() == ".json":
            try:
                doc = json.loads(text)
            except json.JSONDecodeError as exc:
                # never fall back to a raw-text scan: a broken store file is
                # an input failure, not a clean file (bead hpf-oy2w)
                failures.append(f"INPUT-FAIL {fp}: not valid JSON ({exc})")
                print(failures[-1])
                continue
            walk_json(doc, "$", out)
        else:
            for r, e in scan_text(text):
                out.append((r, "-", e))
        examined += 1
        for rule, path, excerpt in out:
            print(f"{rule} {fp}:{path}: …{excerpt}…")
            findings += 1
    if not examined and not failures:
        failures.append("INPUT-FAIL -: zero files examined")
        print(failures[-1])
    if failures:
        print(f"learner-output lint: FAILED — {len(failures)} input failure(s), "
              f"{findings} finding(s) in {examined} file(s) examined")
        return 2
    if findings:
        print(f"learner-output lint: {findings} finding(s) in {examined} file(s)")
        return 1
    print(f"learner-output lint: clean — {examined} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

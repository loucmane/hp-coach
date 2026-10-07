#!/usr/bin/env python3
"""Export approved P5 units as a learner bank of whitelisted fields (preview only).

docs/p5-infold-design.md §C (data path, identity, retirement), §F (export
gates) and §4 row 1; bead hpf-535m. Inputs: the ratified roster
(approval-roster.json, from build_roster.py), RETIRED.json and the exact
candidate bytes the roster pins. Output: p5-bank-<release>.json plus the
internal _export-manifest.json, written only under
pipeline/synthetic/infold/preview/. PR 1 ships nothing to the app, R2,
app/public or data/explanations.

Every exported question row carries exactly ROW_FIELDS:
  qid               p5-<unit>-r<revision>-<SECTION>-<nnn>, nnn = q_index
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
  unit_id, revision from the roster
  explanation_shard explanations/p5-<release>.json, the Layer 2 shard paired
                    with this release (PR 2 / PR 5)
and nothing else: no generator_meta, rationale, family or question-family map,
repair log, audit note or other candidate field.

<SECTION> is the literal "LÄS", where the design's example spells "LAS":
worker/src/lib/section.ts:11 accepts both, but app/src/lib/dueBySection.ts:25
and the LIKE '%-<section>-%' filters at worker/src/routes/mistakes.ts:218 and
worker/src/routes/fit.ts:55 only match the literal that all 27 authentic exam
files use.

The export refuses, writing nothing, on:
  - candidate bytes that no longer match the roster's sha256 (or a content
    digest that disagrees with it);
  - a retired id: RETIRED.json is read here and wins over the roster, and a
    roster that disagrees with it in either direction is stale;
  - a unit without approval, unless --include-pending is given: that stamps
    the bank PREVIEW and needs a release name starting with "preview";
  - candidate fields outside the authoring contract (GENERATION.md "Output
    format"; options exactly A–D), or a cloze unit whose "Gap (n)" questions
    and ___(n)___ markers disagree;
  - a duplicate qid, a bank or row field missing or extra, a denylisted or
    _-prefixed key anywhere, or rationale text inside any bank string;
  - both members of an exclusion pair inside a --single-session export;
  - a default-mode learner-output lint finding (gates/scripts/
    lint_learner_output.py) in an exported title, passage, prompt or option;
  - output that differs between two builds from the same inputs.

Exclusion pairs: a bank may hold both members of a pair; the session pickers
keep them apart (design §A, PR 4), and the bank lists the complete pairs it
holds. An export that stands for one session's content (--single-session)
must not hold both members of any pair.

  python3 pipeline/synthetic/infold/export_product.py                    # approved units
  python3 pipeline/synthetic/infold/export_product.py --include-pending  # + pending, PREVIEW
  python3 pipeline/synthetic/infold/export_product.py --sample [--check] # committed sample
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

from build_roster import (APPROVED, FORMAT as ROSTER_FORMAT, INFOLD_DIR, PENDING, REPO_ROOT, RETIRED,
                          RETIRED_REL, ROSTER_PATH, content_digest, load_retired, sha256_bytes)

EXPORTER_REL = "pipeline/synthetic/infold/export_product.py"
LINT_REL = "pipeline/synthetic/gates/scripts/lint_learner_output.py"
PREVIEW_REL = "pipeline/synthetic/infold/preview"
PREVIEW_DIR = INFOLD_DIR / "preview"
SAMPLE_DIR = PREVIEW_DIR / "sample"
SAMPLE_RELEASE = "sample"
# Two LÄS (long and short) and two ELF (cloze and short) approved units.
SAMPLE_UNITS = ("las-b14-002", "las-b19-002", "elf-b18-002", "elf-b19-003")
MANIFEST_NAME = "_export-manifest.json"
BANK_FORMAT = "p5-bank-v1"
MANIFEST_FORMAT = "p5-export-manifest-v1"
PREVIEW_STAMP = "PREVIEW: includes units pending owner ratification; not releasable"

ROW_FIELDS = ("qid", "exam_id", "provpass", "section", "number", "title", "context", "prompt", "options",
              "answer", "source", "unit_id", "revision", "explanation_shard")
OPTION_FIELDS = ("letter", "text")
BANK_FIELDS = ("format", "release", "preview", "stamp", "source", "exclusion_pairs", "questions")
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
LEAK_MIN_CHARS = 40
GATES = ("roster-format", "retired-registry", "approval", "candidate-sha256", "candidate-fields",
         "cloze-numbering", "duplicate-qid", "bank-whitelist", "internal-metadata", "exclusion-pairs",
         "learner-lint", "deterministic-rerun")


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
    return f"{exam_id(unit_id, revision)}-{section}-{number:03d}"


def render_json(obj) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def _load_roster(raw: bytes) -> dict:
    roster = json.loads(raw)
    if roster.get("format") != ROSTER_FORMAT:
        raise ExportError(f"roster format {roster.get('format')!r} is not {ROSTER_FORMAT!r}")
    dups = sorted(uid for uid, n in Counter(u["unit_id"] for u in roster["units"]).items() if n > 1)
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
        if q["q_index"] != n:
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


def build_rows(entry: dict, unit: dict, release: str) -> list[dict]:
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
        "explanation_shard": f"explanations/p5-{release}.json",
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


def check_exclusion_pairs(roster: dict, unit_ids, single_session: bool) -> list[list[str]]:
    held = sorted(list(p["units"]) for p in roster["exclusion_pairs"] if set(p["units"]) <= set(unit_ids))
    if single_session and held:
        raise ExportError(f"single-session export holds both members of exclusion pair(s) {held}")
    return held


def lint_rows(rows: list[dict]) -> tuple[int, list[dict]]:
    """Default-mode learner-output lint over every exported student string:
    each unit's title and passage once, every prompt and option."""
    strings, seen_units = [], set()
    for row in rows:
        if row["unit_id"] not in seen_units:
            seen_units.add(row["unit_id"])
            strings += [(row["unit_id"], "title", row["title"]), (row["unit_id"], "context", row["context"])]
        strings.append((row["unit_id"], f"{row['qid']} prompt", row["prompt"]))
        strings += [(row["unit_id"], f"{row['qid']} option {o['letter']}", o["text"]) for o in row["options"]]
    findings = [{"unit_id": uid, "field": field, "rule": rule, "excerpt": excerpt}
                for uid, field, text in strings for rule, excerpt in LINT.scan_text(text)]
    return len(strings), findings


def _rel(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.name


def _build(root: Path, roster_path: Path, *, release: str, include_pending: bool, units, single_session: bool):
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
    rows = [row for entry, unit in loaded for row in build_rows(entry, unit, release)]
    check_unique_qids(rows)
    held = check_exclusion_pairs(roster, [entry["unit_id"] for entry, _ in loaded], single_session)
    bank = {"format": BANK_FORMAT, "release": release, "preview": include_pending,
            "stamp": PREVIEW_STAMP if include_pending else None, "source": "synthetic",
            "exclusion_pairs": held, "questions": rows}
    check_bank(bank, {entry["unit_id"]: unit for entry, unit in loaded})
    checked, findings = lint_rows(rows)
    if findings:
        listed = "; ".join(f"{f['rule']} {f['unit_id']} {f['field']}: …{f['excerpt']}…" for f in findings)
        raise ExportError(f"learner-output lint: {len(findings)} finding(s): {listed}")
    bank_name = f"p5-bank-{release}.json"
    bank_bytes = render_json(bank)
    manifest = {
        "format": MANIFEST_FORMAT,
        "release": release,
        "preview": include_pending,
        "bank": {"path": bank_name, "sha256": sha256_bytes(bank_bytes)},
        "roster": {"path": _rel(roster_path, root), "sha256": sha256_bytes(roster_bytes)},
        "retired_registry": {"path": RETIRED_REL, "sha256": sha256_bytes((root / RETIRED_REL).read_bytes())},
        "exporter": {"path": EXPORTER_REL, "sha256": sha256_bytes(Path(__file__).read_bytes())},
        "selection": {"include_pending": include_pending, "single_session": single_session,
                      "requested_units": sorted(units) if units is not None else None},
        "units": [{"unit_id": e["unit_id"], "revision": e["revision"], "approval": e["approval"],
                   "section": e["section"], "question_count": e["question_count"], "source": e["source"],
                   "sha256": e["sha256"], "content_sha256": e["content_sha256"]} for e, _ in loaded],
        "excluded": excluded,
        "exclusion_pairs": held,
        "gates": list(GATES),
        "lint": {"tool": LINT_REL, "mode": "default", "strings_checked": checked, "findings": findings},
    }
    return {bank_name: bank_bytes, MANIFEST_NAME: render_json(manifest)}


def export_bank(root: Path, roster_path: Path, *, release: str = "preview", include_pending: bool = False,
                units=None, single_session: bool = False) -> dict[str, bytes]:
    """Build the bank twice from the inputs on disk and return {name: bytes}
    only when every gate passes and both builds agree byte for byte."""
    options = dict(release=release, include_pending=include_pending,
                   units=list(units) if units is not None else None, single_session=single_session)
    first = _build(root, roster_path, **options)
    second = _build(root, roster_path, **options)
    if first != second:
        differing = sorted(n for n in set(first) | set(second) if first.get(n) != second.get(n))
        raise ExportError(f"non-deterministic output: two builds from the same inputs differ in {differing}")
    return first


def check_out_dir(out_dir: Path) -> None:
    if PREVIEW_DIR.resolve() not in out_dir.resolve().parents:
        raise ExportError(f"output must be a directory inside {PREVIEW_REL}/, got {out_dir}")


def write_export(files: dict[str, bytes], out_dir: Path) -> None:
    check_out_dir(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stray = sorted(p.name for p in out_dir.iterdir() if p.name not in files)
    if stray:
        raise ExportError(f"{out_dir} holds other files {stray}; export into an empty or dedicated directory")
    for name, data in files.items():
        (out_dir / name).write_bytes(data)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, help=f"output directory inside {PREVIEW_REL}/ (default: {PREVIEW_REL}/full)")
    ap.add_argument("--release", help="release name for p5-bank-<release>.json (default: preview)")
    ap.add_argument("--include-pending", action="store_true",
                    help="also export pending-owner-ratification units; stamps the bank PREVIEW")
    ap.add_argument("--units", help="comma-separated unit ids (default: every eligible unit)")
    ap.add_argument("--single-session", action="store_true",
                    help="the export is one session's content: refuse complete exclusion pairs")
    ap.add_argument("--sample", action="store_true",
                    help=f"export the committed sample ({', '.join(SAMPLE_UNITS)}) to {PREVIEW_REL}/sample")
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 when the output directory's files differ from a fresh export")
    ap.add_argument("--roster", type=Path, default=ROSTER_PATH, help="approval roster (default: %(default)s)")
    args = ap.parse_args(argv)
    if args.sample:
        if args.out or args.release or args.units or args.include_pending or args.single_session:
            ap.error("--sample takes no selection or output options")
        out, release, units = SAMPLE_DIR, SAMPLE_RELEASE, list(SAMPLE_UNITS)
    else:
        out, release = args.out or PREVIEW_DIR / "full", args.release or "preview"
        units = [u.strip() for u in args.units.split(",") if u.strip()] if args.units else None
    try:
        check_out_dir(out)
        files = export_bank(REPO_ROOT, args.roster, release=release, include_pending=args.include_pending,
                            units=units, single_session=args.single_session)
        if args.check:
            stale = [n for n, data in files.items() if not (out / n).is_file() or (out / n).read_bytes() != data]
            stray = sorted(p.name for p in out.iterdir() if p.name not in files) if out.is_dir() else []
            if stale or stray:
                print(f"STALE {_rel(out, REPO_ROOT)}: differs in {stale}, unexpected {stray}; rerun without --check")
                return 1
        else:
            write_export(files, out)
    except ExportError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    bank = json.loads(next(data for name, data in files.items() if name != MANIFEST_NAME))
    manifest = json.loads(files[MANIFEST_NAME])
    rows = bank["questions"]
    print(f"{'checked' if args.check else 'exported'} {len(manifest['units'])} units / {len(rows)} questions"
          f"{' [PREVIEW]' if bank['preview'] else ''} -> {_rel(out, REPO_ROOT)}/p5-bank-{release}.json; "
          f"learner lint clean ({manifest['lint']['strings_checked']} strings); excluded "
          f"{len(manifest['excluded'][RETIRED])} retired, {len(manifest['excluded'][PENDING])} pending")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

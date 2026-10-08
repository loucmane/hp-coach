#!/usr/bin/env python3
"""Partition, check and assemble the P5 Layer 2 explanation batches.

docs/p5-infold-design.md §4 row 2b (Amendment 1) and §D; beads hpf-c5tb and
hpf-c5tb.1. Every exported P5 question needs a reviewed Layer 2 explanation
before LÄS and ELF switch to P5. The pilot (data/explanations/p5-pilot.json,
bead hpf-no7l) is batch x0-pilot. The other 321 questions are written and
reviewed in seven batch files, one PR each, and are combined into the release
shard data/explanations/p5-<release>.json only when every batch is in.

The partition, BATCHES.json beside the batch files: the eligible units are the
roster's approved, unretired units, selected the way export_product selects
them (120 units / 340 questions). The pilot's units are batch x0-pilot. Each
section's other units, sorted by (batch number, unit id), are cut into
contiguous chunks, LÄS into three (x1–x3) and ELF into four (x4–x7): a new
chunk starts once the running question total reaches k × (section total /
chunks). The partition must equal EXPECTED, or the build fails. Each batch
records its units and the qids they export.

A batch file, x<N>-<las|elf>.json, holds one entry per qid of its batch, in
exactly the shard's entry format and canonical bytes; the pilot's file is the
pilot shard. --check-batch reads a batch file as the shard of an export of the
batch's units (export_bank's shard_path). Every explanation gate of
export_product therefore runs on it against exactly that batch's qids, no more
and no less, and no gate is re-implemented here: coverage, schema, distractor
letters, framework ids, internal labels, rationale text, learner lint and
canonical bytes, besides every gate of the bank itself.

--assemble combines the pilot and every batch file into the release shard, in
bank order and canonical bytes. It refuses, writing nothing, on a unit, qid or
file listed twice in the manifest, a qid in more than one batch file, a missing
batch file or an eligible qid in no batch (a gap), any gate of a batch, and any
gate of the combined shard against every eligible row. The last also catches
what shows only across batches, such as one unit's rationale text in another
unit's explanation. --partial checks the batch files that exist against exactly
their qids and never writes: a partial set is not a release. The release shard
goes to a fresh temporary file renamed over the old one, never through a
symlink, and a release whose shard would overwrite a batch file (the pilot's)
is refused.

  python3 pipeline/synthetic/infold/explanation_batches.py                    # write BATCHES.json
  python3 pipeline/synthetic/infold/explanation_batches.py --check            # exit 1 when stale
  python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x1   # one batch's gates
  python3 pipeline/synthetic/infold/explanation_batches.py --assemble <release> --partial
  python3 pipeline/synthetic/infold/explanation_batches.py --assemble <release> [--check]
"""
from __future__ import annotations

import argparse
import json
import os
import stat
import sys
import tempfile
from collections import Counter
from pathlib import Path

import export_product
from build_roster import INFOLD_DIR, REPO_ROOT, ROSTER_PATH, UNIT_ID, load_retired, sha256_bytes
from export_product import (EXPLANATIONS_REL, MANIFEST_NAME, PILOT_RELEASE, PILOT_UNITS, ExportError, export_bank,
                            make_qid, read_shard, render_json, shard_name)

SCRIPT_REL = "pipeline/synthetic/infold/explanation_batches.py"
BATCH_DIR_REL = "pipeline/synthetic/infold/explanations"
MANIFEST_REL = f"{BATCH_DIR_REL}/BATCHES.json"
MANIFEST_PATH = INFOLD_DIR / "explanations" / "BATCHES.json"
MANIFEST_FORMAT = "p5-explanation-batches-v1"
SPEC = "docs/p5-infold-design.md §4 row 2b (Amendment 1) and §D"
PILOT_BATCH = "x0-pilot"
PILOT_FILE = f"{EXPLANATIONS_REL}/{shard_name(PILOT_RELEASE)}"
# Per section, in batch-number order: its number of chunks and the batch files' suffix.
CHUNKS = (("LÄS", 3, "las"), ("ELF", 4, "elf"))
RULE = ("Eligible: the roster's approved, unretired units. The pilot's units are batch x0-pilot. Each section's "
        "other units, sorted by (batch number, unit id), are cut into contiguous chunks, LÄS into 3 (x1–x3) and "
        "ELF into 4 (x4–x7): a new chunk starts once the running question total reaches k × (section total / "
        "chunks).")
# The partition on the ratified roster (bead hpf-c5tb.1): batch -> (first
# unit, last unit, units, questions). build_manifest fails when it differs.
EXPECTED = {
    PILOT_BATCH: ("las-b7-002", "las-b19-002", 6, 19),
    "x1": ("las-b1-001", "las-b8-002", 18, 44),
    "x2": ("las-b8-003", "las-b14-001", 16, 42),
    "x3": ("las-b14-003", "las-b19-003", 15, 42),
    "x4": ("elf-b1-001", "elf-b5-002", 16, 52),
    "x5": ("elf-b5-003", "elf-b10-002", 17, 45),
    "x6": ("elf-b10-003", "elf-b14-003", 16, 48),
    "x7": ("elf-b15-001", "elf-b19-002", 16, 48),
}


class BatchError(ExportError):
    """A batch, the partition or an assembly is refused; nothing is written."""


def _shown(path: Path) -> str:
    return export_product._shown(path, REPO_ROOT)


def _read(path: Path, what: str) -> bytes:
    try:
        return path.read_bytes()
    except OSError as exc:
        raise BatchError(f"{what} {_shown(path)} cannot be read: {exc.strerror}") from None


# ------------------------------------------------------------ the partition

def _batch_number(unit_id: str) -> int:
    match = UNIT_ID.fullmatch(unit_id)
    if match is None:
        raise BatchError(f"{unit_id!r} is not a P5 unit id")
    return int(match.group(2))


def eligible_units(root: Path, roster_path: Path) -> list[dict]:
    """The roster's approved, unretired units in roster order, selected the way
    the exporter selects them, after its roster and RETIRED.json checks."""
    roster = export_product._load_roster(_read(roster_path, "the roster"))
    registry = load_retired(root)
    export_product._check_retirement(roster, registry)
    chosen, _ = export_product.select_units(roster, registry)
    return chosen


def unit_qids(entry: dict) -> list[str]:
    """The qids a roster entry's unit exports, in q_index order."""
    return [make_qid(entry["unit_id"], entry["revision"], entry["section"], n)
            for n in range(1, entry["question_count"] + 1)]


def cut(units: list[dict], chunks: int) -> list[list[dict]]:
    """units, in order, cut into `chunks` contiguous chunks: chunk k closes on
    the unit that takes the running question total to k × total / chunks."""
    total = sum(unit["question_count"] for unit in units)
    parts: list[list[dict]] = []
    part: list[dict] = []
    running = 0
    for unit in units:
        part.append(unit)
        running += unit["question_count"]
        k = len(parts) + 1
        if k < chunks and running * chunks >= k * total:
            parts.append(part)
            part = []
    if part:
        parts.append(part)
    if len(parts) != chunks:
        raise BatchError(f"{len(units)} units / {total} questions do not cut into {chunks} non-empty chunks")
    return parts


def _batch(name: str, units: list[dict], file: str) -> dict:
    qids = [qid for unit in units for qid in unit_qids(unit)]
    return {"batch": name,
            "sections": [section for section, _, _ in CHUNKS if any(u["section"] == section for u in units)],
            "file": file, "first": units[0]["unit_id"], "last": units[-1]["unit_id"], "unit_count": len(units),
            "question_count": len(qids), "units": [unit["unit_id"] for unit in units], "qids": qids}


def partition(units: list[dict]) -> list[dict]:
    """The batches of the eligible units (in roster order): the pilot, then
    each section's chunks."""
    ids = [unit["unit_id"] for unit in units]
    absent = [uid for uid in PILOT_UNITS if uid not in ids]
    if absent:
        raise BatchError(f"pilot units that are not eligible for export: {absent}")
    batches = [_batch(PILOT_BATCH, [u for u in units if u["unit_id"] in PILOT_UNITS], PILOT_FILE)]
    for section, chunks, suffix in CHUNKS:
        rest = sorted((u for u in units if u["section"] == section and u["unit_id"] not in PILOT_UNITS),
                      key=lambda u: (_batch_number(u["unit_id"]), u["unit_id"]))
        for part in cut(rest, chunks):
            name = f"x{len(batches)}"
            batches.append(_batch(name, part, f"{BATCH_DIR_REL}/{name}-{suffix}.json"))
    placed = [uid for batch in batches for uid in batch["units"]]
    if sorted(placed) != sorted(ids):
        raise BatchError("the batches do not hold every eligible unit exactly once: "
                         f"{sorted(set(ids) ^ set(placed)) or 'a unit is placed twice'}")
    return batches


def build_manifest(root: Path = REPO_ROOT, roster_path: Path = ROSTER_PATH, *, expected=EXPECTED) -> dict:
    """The partition of the roster's eligible units; BatchError when it differs
    from `expected` (None skips that comparison)."""
    units = eligible_units(root, roster_path)
    batches = partition(units)
    if expected is not None:
        got = {b["batch"]: (b["first"], b["last"], b["unit_count"], b["question_count"]) for b in batches}
        problems = [f"{name} is {got.get(name)}, expected {tuple(want)}" for name, want in expected.items()
                    if got.get(name) != tuple(want)]
        problems += [f"{name} is not expected" for name in got if name not in expected]
        if problems:
            raise BatchError("the partition differs from the expected table (bead hpf-c5tb.1): " + "; ".join(problems))
    return {
        "format": MANIFEST_FORMAT,
        "generated_by": SCRIPT_REL,
        "spec": SPEC,
        "rule": RULE,
        "eligible": {"units": len(units), "questions": sum(unit["question_count"] for unit in units)},
        "batches": batches,
    }


def current_manifest(root: Path | None = None, roster_path: Path | None = None, path: Path | None = None) -> dict:
    """BATCHES.json, refused unless it is byte for byte the partition of the
    roster as it stands."""
    root = REPO_ROOT if root is None else root
    roster_path = ROSTER_PATH if roster_path is None else roster_path
    path = MANIFEST_PATH if path is None else path
    raw = _read(path, "the batch manifest")
    manifest = build_manifest(root, roster_path)
    if raw != render_json(manifest):
        raise BatchError(f"{_shown(path)} is stale: rerun {SCRIPT_REL} and review the diff")
    return manifest


def batch_entry(manifest: dict, name: str) -> dict:
    found = [batch for batch in manifest["batches"] if batch["batch"] == name]
    if len(found) != 1:
        names = [batch["batch"] for batch in manifest["batches"]]
        raise BatchError(f"no batch {name!r} in the manifest (batches: {', '.join(names)})" if not found
                         else f"batch {name!r} is listed {len(found)} times in the manifest")
    return found[0]


# ---------------------------------------------------------- the batch check

def check_batch(root: Path, roster_path: Path, manifest: dict, name: str) -> tuple[bytes, dict]:
    """Every gate of an export of the batch's units, with the batch file read as
    its shard: every explanation gate against exactly the batch's qids.
    Returns the file's bytes, which are canonical, and a summary."""
    batch = batch_entry(manifest, name)
    roster = export_product._load_roster(_read(roster_path, "the roster"))
    by_id = {unit["unit_id"]: unit for unit in roster["units"]}
    unknown = [uid for uid in batch["units"] if uid not in by_id]
    if unknown:
        raise BatchError(f"batch {name}: units not in the roster: {unknown}")
    if [qid for uid in batch["units"] for qid in unit_qids(by_id[uid])] != batch["qids"]:
        raise BatchError(f"batch {name}: the manifest's qids are not its units' qids at their current revisions; "
                         f"rebuild {MANIFEST_REL} with {SCRIPT_REL}")
    path = root / batch["file"]
    if not os.path.lexists(path):
        raise BatchError(f"batch {name}: {batch['file']} does not exist")
    release = f"check-{name}"
    try:
        files = export_bank(root, roster_path, release=release, units=batch["units"], explanations=True,
                            shard_path=path)
    except BatchError:
        raise
    except ExportError as exc:
        raise BatchError(f"batch {name} ({batch['file']}): {exc}") from None
    rows = json.loads(files[f"p5-bank-{release}.json"])["questions"]
    if [row["qid"] for row in rows] != batch["qids"]:
        raise BatchError(f"batch {name}: the export's qids are not the manifest's, in bank order; rebuild "
                         f"{MANIFEST_REL} with {SCRIPT_REL}")
    explained = json.loads(files[MANIFEST_NAME])["explanations"]
    return files[shard_name(release)], {"batch": name, "file": batch["file"], "units": len(batch["units"]),
                                        "questions": len(rows), "strings": explained["lint"]["strings_checked"],
                                        "sha256": explained["sha256"]}


# ------------------------------------------------------------ the assembler

def _repeated(values) -> list:
    return sorted(value for value, n in Counter(values).items() if n > 1)


def assemble(root: Path, roster_path: Path, manifest: dict, *, release: str,
             partial: bool = False) -> tuple[bytes, dict]:
    """The release shard: every batch's entries in bank order and canonical
    bytes, after the gates of every batch and of the combined shard against
    every eligible row. partial=True checks the batch files that exist against
    exactly their qids instead; its bytes are never a release."""
    export_product.check_release(release)
    output = f"{EXPLANATIONS_REL}/{shard_name(release)}"
    batches = manifest["batches"]
    if output in {batch["file"] for batch in batches}:
        raise BatchError(f"release {release!r} would write {output}, which is an input batch file")
    for label, values in (("batch", [b["batch"] for b in batches]), ("file", [b["file"] for b in batches]),
                          ("unit", [u for b in batches for u in b["units"]]),
                          ("qid", [q for b in batches for q in b["qids"]])):
        repeated = _repeated(values)
        if repeated:
            raise BatchError(f"the manifest lists a duplicate {label}: {repeated[:10]}")
    present = [batch for batch in batches if os.path.lexists(root / batch["file"])]
    missing = [batch for batch in batches if batch not in present]
    eligible = [qid for unit in eligible_units(root, roster_path) for qid in unit_qids(unit)]
    listed = {qid for batch in batches for qid in batch["qids"]}
    outside = sorted(listed - set(eligible))
    if outside:
        raise BatchError(f"the manifest lists qid(s) that are not eligible for export: {outside[:10]}")
    unbatched = [qid for qid in eligible if qid not in listed]
    if not partial and (missing or unbatched):
        gaps = len(unbatched) + sum(len(batch["qids"]) for batch in missing)
        where = []
        if missing:
            where.append("missing batch files " + ", ".join(f"{b['batch']} ({b['file']})" for b in missing))
        if unbatched:
            where.append(f"{len(unbatched)} eligible qid(s) in no batch, e.g. {unbatched[:3]}")
        raise BatchError(f"release {release!r}: {gaps} of {len(eligible)} eligible qids have no explanation (gaps): "
                         + "; ".join(where) + ". A partial set is not a release; --partial checks the batches "
                         "that exist")
    if not present:
        raise BatchError("no batch file exists: there is nothing to assemble")
    holders: dict[str, list[str]] = {}
    for batch in present:
        _, entries = read_shard(root / batch["file"], release, batch["file"])
        for qid in entries:
            holders.setdefault(qid, []).append(batch["batch"])
    twice = {qid: names for qid, names in holders.items() if len(names) > 1}
    if twice:
        raise BatchError(f"qid(s) explained in more than one batch file: {dict(list(twice.items())[:10])}")
    merged: dict[str, dict] = {}
    for batch in present:
        data, _ = check_batch(root, roster_path, manifest, batch["batch"])
        merged.update(json.loads(data))
    held = {qid for batch in present for qid in batch["qids"]}
    target = [qid for qid in eligible if not partial or qid in held]
    gaps, extra = [qid for qid in target if qid not in merged], sorted(set(merged) - set(target))
    if gaps or extra:  # the batch checks rule this out; fail closed all the same
        raise BatchError(f"release {release!r}: no explanation for {gaps[:10]}; outside the target {extra[:10]}")
    data = render_json({qid: merged[qid] for qid in target})
    units = [uid for batch in present for uid in batch["units"]] if partial else None
    with tempfile.TemporaryDirectory(prefix="p5-assembled-") as tmp:
        candidate = Path(tmp) / shard_name(release)
        candidate.write_bytes(data)
        try:
            files = export_bank(root, roster_path, release=release, units=units, explanations=True,
                                shard_path=candidate)
        except ExportError as exc:
            raise BatchError(f"the assembled shard of release {release!r}: {exc}") from None
    explained = json.loads(files[MANIFEST_NAME])["explanations"]
    return data, {"release": release, "partial": partial, "entries": len(target),
                  "batches": [batch["batch"] for batch in present], "missing": [batch["batch"] for batch in missing],
                  "sha256": sha256_bytes(data), "strings": explained["lint"]["strings_checked"]}


def write_release_shard(root: Path, release: str, data: bytes) -> Path:
    """Write data/explanations/p5-<release>.json under root. Each directory is
    entered with O_NOFOLLOW, a symlink or other non-regular file at the target
    is refused, and the bytes go to a fresh temporary file renamed over the old
    one (export_product._replace): nothing is written through a link."""
    export_product.check_release(release)
    name = shard_name(release)
    shown = f"{EXPLANATIONS_REL}/{name}"
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    try:
        fd = os.open(root, flags)
    except OSError as exc:
        raise BatchError(f"cannot open {root}: {exc.strerror}") from None
    try:
        for part in Path(EXPLANATIONS_REL).parts:
            try:
                child = os.open(part, flags, dir_fd=fd)
            except OSError as exc:
                raise BatchError(f"cannot enter {EXPLANATIONS_REL} without following a link: {exc.strerror}") from None
            os.close(fd)
            fd = child
        st = export_product._lstat(fd, name)
        if st is not None and not stat.S_ISREG(st.st_mode):
            kind = "a symlink" if stat.S_ISLNK(st.st_mode) else "not a regular file"
            raise BatchError(f"{shown} is {kind}; a release shard is only ever written as a regular file")
        export_product._replace(fd, name, data)
    finally:
        os.close(fd)
    return root / EXPLANATIONS_REL / name


# ------------------------------------------------------------------ the CLI

def _print_partition(manifest: dict, root: Path) -> None:
    for batch in manifest["batches"]:
        state = "present" if os.path.lexists(root / batch["file"]) else "missing"
        print(f"  {batch['batch']:<9}{batch['first']} … {batch['last']}: {batch['unit_count']} units / "
              f"{batch['question_count']} questions, {batch['file']} ({state})")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true",
                    help=f"write nothing; exit 1 when {MANIFEST_REL}, or with --assemble the release shard, is stale")
    ap.add_argument("--check-batch", metavar="BATCH",
                    help="run every explanation gate on one batch file against exactly its qids (x0-pilot, x1 … x7)")
    ap.add_argument("--assemble", metavar="RELEASE",
                    help=f"combine the pilot and every batch into {EXPLANATIONS_REL}/p5-RELEASE.json")
    ap.add_argument("--partial", action="store_true",
                    help="with --assemble: check the batch files that exist against exactly their qids; write nothing")
    args = ap.parse_args(argv)
    if args.check_batch and (args.assemble or args.partial or args.check):
        ap.error("--check-batch takes no other option")
    if args.partial and (not args.assemble or args.check):
        ap.error("--partial goes with --assemble, and without --check")
    root, roster_path = REPO_ROOT, ROSTER_PATH
    try:
        if args.check_batch:
            _, summary = check_batch(root, roster_path, current_manifest(), args.check_batch)
            print(f"batch {summary['batch']}: {summary['units']} units / {summary['questions']} questions in "
                  f"{summary['file']}; every explanation gate passed, learner lint clean ({summary['strings']} "
                  f"strings)")
            return 0
        if args.assemble:
            data, summary = assemble(root, roster_path, current_manifest(), release=args.assemble,
                                     partial=args.partial)
            shown = f"{EXPLANATIONS_REL}/{shard_name(args.assemble)}"
            if args.partial:
                print(f"partial: {summary['entries']} explanations from {', '.join(summary['batches'])} pass every "
                      f"gate; missing: {', '.join(summary['missing']) or 'none'}. Nothing written: a partial set "
                      "is not a release")
                return 0
            if args.check:
                target = root / EXPLANATIONS_REL / shard_name(args.assemble)
                current = target.read_bytes() if target.is_file() and not target.is_symlink() else None
                if current != data:
                    print(f"STALE {shown}: rerun without --check")
                    return 1
                print(f"checked {summary['entries']} explanations -> {shown}")
                return 0
            write_release_shard(root, args.assemble, data)
            print(f"assembled {summary['entries']} explanations from {len(summary['batches'])} batches -> {shown} "
                  f"(sha256 {summary['sha256']})")
            return 0
        manifest = build_manifest(root, roster_path)
        data = render_json(manifest)
        if args.check:
            current = MANIFEST_PATH.read_bytes() if MANIFEST_PATH.is_file() else None
            if current != data:
                print(f"STALE {MANIFEST_REL}: rerun {SCRIPT_REL} and review the diff")
                return 1
        else:
            MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
            MANIFEST_PATH.write_bytes(data)
    except ExportError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    print(f"{'checked' if args.check else 'wrote'} {MANIFEST_REL}: {len(manifest['batches'])} batches, "
          f"{manifest['eligible']['units']} units / {manifest['eligible']['questions']} questions")
    _print_partition(manifest, root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

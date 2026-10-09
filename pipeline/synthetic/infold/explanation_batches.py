#!/usr/bin/env python3
"""Partition, check and assemble the P5 Layer 2 explanation batches.

docs/p5-infold-design.md §4 row 2b (Amendment 1) and §D; beads hpf-c5tb,
hpf-c5tb.1 and hpf-c5tb.4. Every exported P5 question needs a reviewed Layer 2
explanation before LÄS and ELF switch to P5. The pilot
(data/explanations/p5-pilot.json, bead hpf-no7l) is batch x0-pilot. The other
282 questions are written and reviewed in seven batch files, one PR each, and
are combined into the release shard data/explanations/p5-<release>.json only
when every batch is in.

The partition, BATCHES.json beside the batch files, is pinned (bead
hpf-c5tb.4): the committed file is the record of which batch holds which unit,
and nothing re-derives it. The generator reads each batch's name, file and
units from it, keeps every batch's units, in roster order, drops each unit
that has been retired (RETIRED.json) from its batch, and records each batch's
qids at its units' current revisions. A shipped or in-flight batch therefore
never gains a unit and no unit moves between batches: retirement only
removes. The eligible units are the roster's approved, unretired units,
selected the way export_product selects them (111 units / 301 questions since
the owner retired las-b3-001 and las-b5-001 on 2026-10-08, bead hpf-c5tb.2,
six ELF units on 2026-10-09, bead hpf-c5tb.13, and elf-b12-001 the same day,
bead hpf-c5tb.17).
The generator refuses, writing nothing, an eligible unit in no batch, a unit
in two batches, a listed unit that is not eligible for a reason other than
retirement (not in the roster, or pending owner ratification), a batch with
no unit left, a batch whose name or file is not its own, and a first batch
that is not the exporter's pilot; --check, the batch check and the assembler
also refuse a file that still lists a retired unit, and name it. A new unit
(batches 20+) is never assigned automatically: it is refused until it is
added by hand to a new batch in BATCHES.json (its name, file and units) and
in EXPECTED. The table must equal EXPECTED, or the build fails, so a
retirement also needs EXPECTED changed by hand. Each batch records its units
and the qids they export.

The initial cut (bead hpf-c5tb.1, on the roster at 1cbbb84: 120 units / 340
questions) is the assignment's provenance, kept as initial_cut() and tested
against that roster's eligible units; nothing else runs it. The pilot's units
were batch x0-pilot. Each section's other units, sorted by (batch number,
unit id), were cut into contiguous chunks, LÄS into three (x1–x3) and ELF into
four (x4–x7): a new chunk started once the running question total reached
k × (section total / chunks). Re-run after a retirement, that rule moves units
between batches (it would have moved las-b8-003 and las-b9-001, which have no
explanation, into the merged x1), which is why the generator never runs it.

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

  python3 pipeline/synthetic/infold/explanation_batches.py                    # rewrite BATCHES.json
  python3 pipeline/synthetic/infold/explanation_batches.py --check            # exit 1 when stale
  python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x1   # one batch's gates
  python3 pipeline/synthetic/infold/explanation_batches.py --assemble <release> --partial
  python3 pipeline/synthetic/infold/explanation_batches.py --assemble <release> [--check]
"""
from __future__ import annotations

import argparse
import json
import os
import re
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
# Per section, in batch-number order: its number of chunks in the initial cut
# and the batch files' suffix.
CHUNKS = (("LÄS", 3, "las"), ("ELF", 4, "elf"))
SUFFIX = {section: suffix for section, _, suffix in CHUNKS}
BATCH_NAME = re.compile(r"x[1-9][0-9]*")
RULE = ("Pinned (bead hpf-c5tb.4): this file records which batch holds which unit, and it is never re-cut. Each "
        "batch keeps its units, in roster order; a retired unit (RETIRED.json) leaves its batch; no unit moves "
        "between batches and no batch gains one. Eligible: the roster's approved, unretired units. Refused: an "
        "eligible unit in no batch (a new unit waits for an explicit assignment, to a new batch), a unit in two "
        "batches, a listed unit that is not eligible for a reason other than retirement, a batch with no unit "
        "left, a retired unit still listed. Provenance, the initial cut (bead hpf-c5tb.1, on the roster at "
        "1cbbb84: 120 units / 340 questions): the pilot's units are batch x0-pilot; each section's other units, "
        "sorted by (batch number, unit id), were cut into contiguous chunks, LÄS into 3 (x1–x3) and ELF into 4 "
        "(x4–x7), a new chunk starting once the running question total reached k × (section total / chunks).")
# The pinned partition (bead hpf-c5tb.4): the initial cut of bead hpf-c5tb.1
# less las-b3-001 and las-b5-001, which the owner retired from x1 on
# 2026-10-08 (bead hpf-c5tb.2; x1 was 18 units / 44 questions), less
# elf-b1-002, elf-b3-004, elf-b4-001 and elf-b5-002 from x4 and elf-b7-002
# and elf-b8-002 from x5, retired on 2026-10-09 (bead hpf-c5tb.13; x4 was 16
# units / 52 questions, x5 17 / 45), and less elf-b12-001 from x6, retired the
# same day (bead hpf-c5tb.17; x6 was 16 / 48): batch -> (first unit, last unit,
# units, questions). build_manifest fails when it differs.
EXPECTED = {
    PILOT_BATCH: ("las-b7-002", "las-b19-002", 6, 19),
    "x1": ("las-b1-001", "las-b8-002", 16, 36),
    "x2": ("las-b8-003", "las-b14-001", 16, 42),
    "x3": ("las-b14-003", "las-b19-003", 15, 42),
    "x4": ("elf-b1-001", "elf-b5-001", 12, 36),
    "x5": ("elf-b5-003", "elf-b10-002", 15, 35),
    "x6": ("elf-b10-003", "elf-b14-003", 15, 43),
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


def _repeated(values) -> list:
    return sorted(value for value, n in Counter(values).items() if n > 1)


# ------------------------------------------------------------ the partition

def _batch_number(unit_id: str) -> int:
    match = UNIT_ID.fullmatch(unit_id)
    if match is None:
        raise BatchError(f"{unit_id!r} is not a P5 unit id")
    return int(match.group(2))


def _roster_and_registry(root: Path, roster_path: Path) -> tuple[dict, dict]:
    """The roster and RETIRED.json's entries, after the exporter's roster and
    retirement checks."""
    roster = export_product._load_roster(_read(roster_path, "the roster"))
    registry = load_retired(root)
    export_product._check_retirement(roster, registry)
    return roster, registry


def eligible_units(root: Path, roster_path: Path) -> list[dict]:
    """The roster's approved, unretired units in roster order, selected the way
    the exporter selects them, after its roster and RETIRED.json checks."""
    roster, registry = _roster_and_registry(root, roster_path)
    chosen, _ = export_product.select_units(roster, registry)
    return chosen


def unit_qids(entry: dict) -> list[str]:
    """The qids a roster entry's unit exports, in q_index order."""
    return [make_qid(entry["unit_id"], entry["revision"], entry["section"], n)
            for n in range(1, entry["question_count"] + 1)]


def cut(units: list[dict], chunks: int) -> list[list[dict]]:
    """units, in order, cut into `chunks` contiguous chunks: chunk k closes on
    the unit that takes the running question total to k × total / chunks. The
    rule of the initial cut (initial_cut)."""
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


def initial_cut(units: list[dict]) -> list[dict]:
    """The initial cut (bead hpf-c5tb.1) of the eligible units, in roster
    order: the pilot, then each section's chunks. It is the provenance of the
    pinned partition, not its source: on the roster at 1cbbb84 (120 units / 340
    questions) it gives the batches that BATCHES.json pins, and only its test
    runs it. Re-run after a retirement, it moves units between batches."""
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


def read_pin(path: Path) -> list[dict]:
    """The pinned partition as BATCHES.json records it: each batch's name, file
    and units, in file order. The file's other fields are derived from these
    and the roster, and the generator rebuilds them."""
    shown = _shown(path)
    try:
        data = json.loads(_read(path, "the batch manifest"))
    except ValueError as exc:
        raise BatchError(f"{shown} is not readable JSON: {exc}") from None
    form = data.get("format") if type(data) is dict else None
    if form != MANIFEST_FORMAT:
        raise BatchError(f"{shown}: format {form!r} is not {MANIFEST_FORMAT!r}")
    if type(data.get("batches")) is not list or not data["batches"]:
        raise BatchError(f"{shown} lists no batch")
    pin = []
    for batch in data["batches"]:
        batch = batch if type(batch) is dict else {}
        name, file, units = batch.get("batch"), batch.get("file"), batch.get("units")
        if (type(name) is not str or type(file) is not str or type(units) is not list
                or any(type(uid) is not str for uid in units)):
            raise BatchError(f"{shown}: batch {name!r} needs a name, a file and a list of unit ids")
        pin.append({"batch": name, "file": file, "units": list(units)})
    return pin


def assign(pin: list[dict], roster: dict, registry: dict) -> tuple[list[dict], dict[str, list[str]]]:
    """The pinned batches on this roster and RETIRED.json: each batch keeps the
    units it lists, in roster order, less the retired ones, with their qids at
    their current revisions. Returns the batches and, by batch, the retired
    units it dropped. Nothing is ever re-cut: BatchError when the pin lists a
    batch, file or unit twice, a unit that is not in the roster or is not
    eligible for a reason other than retirement, a batch left with no unit, a
    batch whose name or file is not its own or a first batch that is not the
    exporter's pilot, and when an eligible unit is in no batch."""
    eligible, _ = export_product.select_units(roster, registry)
    by_id = {unit["unit_id"]: unit for unit in roster["units"]}
    order = {uid: n for n, uid in enumerate(by_id)}
    for label in ("batch", "file"):
        repeated = _repeated(batch[label] for batch in pin)
        if repeated:
            raise BatchError(f"the pinned partition lists a {label} more than once: {repeated}")
    holders: dict[str, list[str]] = {}
    for batch in pin:
        for uid in batch["units"]:
            holders.setdefault(uid, []).append(batch["batch"])
    twice = {uid: names for uid, names in holders.items() if len(names) > 1}
    if twice:
        raise BatchError(f"unit(s) in more than one batch: {twice}; a unit belongs to one batch only")
    unknown = [uid for uid in holders if uid not in by_id]
    if unknown:
        raise BatchError(f"the pinned partition lists unit(s) that are not in the roster: {unknown}")
    chosen = {unit["unit_id"] for unit in eligible}
    barred = [f"{uid} ({by_id[uid]['approval']})" for uid in holders if uid not in chosen and uid not in registry]
    if barred:
        raise BatchError(f"the pinned partition lists unit(s) that are not eligible for export: {barred}; only a "
                         "retirement (RETIRED.json) takes a unit out of its batch")
    unassigned = [unit["unit_id"] for unit in eligible if unit["unit_id"] not in holders]
    if unassigned:
        raise BatchError(f"eligible unit(s) in no batch: {unassigned}. The partition is pinned and never re-cut: "
                         f"assign a new unit by hand, to a new batch in {MANIFEST_REL} and in EXPECTED; a shipped "
                         "or in-flight batch never gains a unit")
    batches: list[dict] = []
    removed: dict[str, list[str]] = {}
    for pinned in pin:
        name, file = pinned["batch"], pinned["file"]
        listed = sorted(pinned["units"], key=order.__getitem__)
        kept = [uid for uid in listed if uid not in registry]
        if len(kept) < len(listed):
            removed[name] = [uid for uid in listed if uid in registry]
        if not kept:
            raise BatchError(f"batch {name} has no unit left: {listed or 'it lists none'}")
        batch = _batch(name, [by_id[uid] for uid in kept], file)
        if not batches:
            pilot = [uid for uid in PILOT_UNITS if uid not in registry]
            if (name, file, kept) != (PILOT_BATCH, PILOT_FILE, pilot):
                raise BatchError(f"the first batch must be {PILOT_BATCH}, the exporter's pilot {pilot} in "
                                 f"{PILOT_FILE}; the pin has {name} {kept} in {file}")
        else:
            sections = batch["sections"]
            own = f"{BATCH_DIR_REL}/{name}-{SUFFIX[sections[0]]}.json" if len(sections) == 1 else None
            if not BATCH_NAME.fullmatch(name) or file != own:
                raise BatchError(f"batch {name!r} ({file}): a batch after the pilot is named x<N>, holds one "
                                 f"section's units and is the file {BATCH_DIR_REL}/x<N>-<las|elf>.json")
        batches.append(batch)
    return batches, removed


def _named(removed: dict[str, list[str]]) -> str:
    return "; ".join(f"{name}: {', '.join(units)}" for name, units in removed.items())


def _build(root: Path, roster_path: Path, pin_path: Path, expected) -> tuple[dict, dict[str, list[str]]]:
    """build_manifest, and the retired units it dropped from the pin, by batch."""
    roster, registry = _roster_and_registry(root, roster_path)
    batches, removed = assign(read_pin(pin_path), roster, registry)
    if expected is not None:
        got = {b["batch"]: (b["first"], b["last"], b["unit_count"], b["question_count"]) for b in batches}
        problems = [f"{name} is {got.get(name)}, expected {tuple(want)}" for name, want in expected.items()
                    if got.get(name) != tuple(want)]
        problems += [f"{name} is not expected" for name in got if name not in expected]
        if problems:
            raise BatchError("the partition differs from the expected table (beads hpf-c5tb.1, hpf-c5tb.4): "
                             + "; ".join(problems))
    # assign() puts every eligible unit in exactly one batch, and no other unit.
    return {
        "format": MANIFEST_FORMAT,
        "generated_by": SCRIPT_REL,
        "spec": SPEC,
        "rule": RULE,
        "eligible": {"units": sum(b["unit_count"] for b in batches),
                     "questions": sum(b["question_count"] for b in batches)},
        "batches": batches,
    }, removed


def build_manifest(root: Path = REPO_ROOT, roster_path: Path = ROSTER_PATH, *, pin_path: Path = MANIFEST_PATH,
                   expected=EXPECTED) -> dict:
    """The pinned partition (pin_path, BATCHES.json) on the roster as it
    stands; BatchError when assign() refuses it or the table differs from
    `expected` (None skips that comparison)."""
    return _build(root, roster_path, pin_path, expected)[0]


def current_manifest(root: Path | None = None, roster_path: Path | None = None, path: Path | None = None) -> dict:
    """BATCHES.json, refused unless it is byte for byte the pinned partition on
    the roster as it stands; a retired unit it still lists is named."""
    root = REPO_ROOT if root is None else root
    roster_path = ROSTER_PATH if roster_path is None else roster_path
    path = MANIFEST_PATH if path is None else path
    raw = _read(path, "the batch manifest")
    manifest, removed = _build(root, roster_path, path, EXPECTED)
    if removed:
        raise BatchError(f"{_shown(path)} still lists retired unit(s) ({_named(removed)}): rerun {SCRIPT_REL} to "
                         "drop them from their batch")
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
        manifest, removed = _build(root, roster_path, MANIFEST_PATH, EXPECTED)
        data = render_json(manifest)
        if args.check:
            current = MANIFEST_PATH.read_bytes() if MANIFEST_PATH.is_file() else None
            if current != data:
                listed = f"it still lists retired unit(s) ({_named(removed)}); " if removed else ""
                print(f"STALE {MANIFEST_REL}: {listed}rerun {SCRIPT_REL} and review the diff")
                return 1
        else:
            MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
            MANIFEST_PATH.write_bytes(data)
            if removed:
                print(f"dropped retired unit(s) from their batch: {_named(removed)}")
    except ExportError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    print(f"{'checked' if args.check else 'wrote'} {MANIFEST_REL}: {len(manifest['batches'])} batches, "
          f"{manifest['eligible']['units']} units / {manifest['eligible']['questions']} questions")
    _print_partition(manifest, root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

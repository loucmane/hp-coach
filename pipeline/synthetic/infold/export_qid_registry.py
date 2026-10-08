#!/usr/bin/env python3
"""Export the P5 qid registry the worker bundles to classify attempts server-side.

docs/p5-infold-design.md Amendment 1 E (PR 3); bead hpf-94i5. The worker decides
every answered question's provenance from its qid (worker/src/lib/provenance.ts):
a qid in this registry is synthetic. A synthetic answer counts toward section
scores, the weekly trend, ability, item stats, Provpass scoring and the HP-scale
projection, and every number it feeds is marked uncalibrated. A qid that is
neither authentic nor registered is unknown, stored but never assessed.

The registry is the qid list of the approved export: export_product.export_bank
over the roster's approved units, with every export gate (roster format,
RETIRED.json, approval, candidate sha256, candidate fields, cloze numbering,
qid format, duplicate qids, whitelist, internal metadata and labels, learner
lint, bank schema, deterministic rerun). A qid is listed exactly when an
approved release would ship it. Retired and pending units, and every revision
but a unit's current one, are absent, so the worker classifies an attempt on
such a qid as unknown and it fails closed.

framework_ids maps a registered qid to the Layer-1 framework_id of its reviewed
Layer 2 explanation, for the questions whose explanation names one. The worker
lets a synthetic answer move mastery and framework_progress only under that id
(Amendment 1 E). Every P5 explanation shard, data/explanations/p5-<release>.json,
is read: its release name must be one the exporter accepts, every key must be a
registered qid, and the shard must pass the export's explanation gate for
exactly its units (export_bank with explanations=True: coverage, schema,
distractors, framework ids of the question's own section, internal labels,
rationale leaks, learner lint, canonical bytes). Two shards that give one qid
different framework ids are refused.

Output: worker/data/p5-qid-registry.json, outside worker/src so biome's
formatter (it checks src/) leaves this rendering alone. It holds the format,
the roster and RETIRED.json the export read (path and sha256, from the export
manifest), the explanation shards read (path, sha256, entries), the counts, one
row per unit in roster order (unit_id, revision, section and its qids in
q_index order) and framework_ids in registry order. Rendered as the exporter
renders JSON: two-space, UTF-8 without ASCII escapes, one final newline. The
export refuses, writing nothing, whenever any of its gates does.

  python3 pipeline/synthetic/infold/export_qid_registry.py          # write
  python3 pipeline/synthetic/infold/export_qid_registry.py --check  # exit 1 when stale
"""
from __future__ import annotations

import argparse
import contextlib
import json
import os
import sys
import tempfile
from pathlib import Path

from build_roster import REPO_ROOT, ROSTER_PATH, sha256_bytes
from export_product import (EXPLANATIONS_REL, MANIFEST_NAME, RELEASE as RELEASE_NAME, ExportError, export_bank,
                            read_shard, render_json, shard_name)

REGISTRY_REL = "worker/data/p5-qid-registry.json"
REGISTRY_PATH = REPO_ROOT / REGISTRY_REL
REGISTRY_FORMAT = "p5-qid-registry-v1"
GENERATED_BY = "pipeline/synthetic/infold/export_qid_registry.py"
SPEC = "docs/p5-infold-design.md Amendment 1 E, PR 3"
# The release name of the bank the registry is read from; it reaches no qid.
RELEASE = "registry"
SHARD_PREFIX, SHARD_SUFFIX = "p5-", ".json"


def _shard_release(name: str) -> str:
    release = name[len(SHARD_PREFIX):-len(SHARD_SUFFIX)]
    if not RELEASE_NAME.fullmatch(release) or len(release) > 40:
        raise ExportError(f"explanation shard {EXPLANATIONS_REL}/{name}: {release!r} is not a release name the "
                          "exporter accepts (lowercase letters, digits and single hyphens, at most 40)")
    return release


def _framework_ids(root: Path, roster_path: Path, units_of: dict[str, str]) -> tuple[dict[str, str], list[dict]]:
    """qid -> framework_id from every P5 explanation shard under root, each
    validated by the export's explanation gate, and the shards read."""
    folder = root / EXPLANATIONS_REL
    paths = sorted(folder.glob(f"{SHARD_PREFIX}*{SHARD_SUFFIX}")) if folder.is_dir() else []
    found: dict[str, tuple[str, str]] = {}
    shards = []
    for path in paths:
        release = _shard_release(path.name)
        raw, shard = read_shard(path, release)
        outside = [qid for qid in shard if qid not in units_of]
        if outside:
            raise ExportError(f"explanation shard {EXPLANATIONS_REL}/{path.name} explains qid(s) outside the "
                              f"approved registry: {outside}")
        units = sorted({units_of[qid] for qid in shard})
        checked = export_bank(root, roster_path, release=release, units=units, explanations=True)
        entries = json.loads(checked[shard_name(release)])
        for qid, entry in entries.items():
            if "framework_id" not in entry:
                continue
            framework_id = entry["framework_id"]
            earlier = found.get(qid)
            if earlier is not None and earlier[0] != framework_id:
                raise ExportError(f"explanation shards {earlier[1]} and {path.name} disagree on the framework_id "
                                  f"of {qid}: {earlier[0]!r} vs {framework_id!r}")
            found[qid] = (framework_id, path.name)
        shards.append({"path": f"{EXPLANATIONS_REL}/{path.name}", "sha256": sha256_bytes(raw),
                       "entries": len(entries)})
    return {qid: framework_id for qid, (framework_id, _) in found.items()}, shards


def build_registry(root: Path, roster_path: Path) -> bytes:
    """The registry's bytes for the approved export of root's roster and its
    P5 explanation shards, or ExportError from the export's gates."""
    files = export_bank(root, roster_path, release=RELEASE)
    rows = json.loads(files[f"p5-bank-{RELEASE}.json"])["questions"]
    manifest = json.loads(files[MANIFEST_NAME])
    units: list[dict] = []
    for row in rows:
        if not units or units[-1]["unit_id"] != row["unit_id"]:
            units.append({"unit_id": row["unit_id"], "revision": row["revision"], "section": row["section"],
                          "qids": []})
        units[-1]["qids"].append(row["qid"])
    if len({unit["unit_id"] for unit in units}) != len(units):
        raise ExportError("registry: a unit's rows are not contiguous in the bank")
    found, shards = _framework_ids(root, roster_path, {row["qid"]: row["unit_id"] for row in rows})
    framework_ids = {row["qid"]: found[row["qid"]] for row in rows if row["qid"] in found}
    registry = {
        "format": REGISTRY_FORMAT,
        "generated_by": GENERATED_BY,
        "spec": SPEC,
        "roster": manifest["roster"],
        "retired_registry": manifest["retired_registry"],
        "explanations": shards,
        "unit_count": len(units),
        "qid_count": len(rows),
        "framework_id_count": len(framework_ids),
        "units": units,
        "framework_ids": framework_ids,
    }
    return render_json(registry)


def write_registry(data: bytes, out: Path) -> None:
    """Write data to a fresh temporary file beside out, then rename it over out."""
    out.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=f".{out.name}.", suffix=".tmp", dir=out.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, out)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp)
        raise


def _shown(path: Path) -> str:
    try:
        return path.resolve().relative_to(REPO_ROOT.resolve()).as_posix()
    except ValueError:
        return str(path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=REGISTRY_PATH, help=f"registry path (default: {REGISTRY_REL})")
    ap.add_argument("--roster", type=Path, default=ROSTER_PATH, help="approval roster (default: %(default)s)")
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 when the registry differs from a fresh export")
    args = ap.parse_args(argv)
    try:
        data = build_registry(REPO_ROOT, args.roster)
    except ExportError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    registry = json.loads(data)
    summary = (f"{registry['unit_count']} units / {registry['qid_count']} qids / "
               f"{registry['framework_id_count']} framework ids")
    if args.check:
        current = args.out.read_bytes() if args.out.is_file() else None
        if current != data:
            print(f"STALE {_shown(args.out)}: rerun without --check")
            return 1
        print(f"checked {summary} -> {_shown(args.out)}")
        return 0
    write_registry(data, args.out)
    print(f"exported {summary} -> {_shown(args.out)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

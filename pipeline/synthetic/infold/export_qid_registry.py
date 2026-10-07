#!/usr/bin/env python3
"""Export the P5 qid registry the worker bundles to classify attempts server-side.

docs/p5-infold-design.md §E and §4 row 3; bead hpf-94i5. The worker decides
every answered question's provenance from its qid (worker/src/lib/provenance.ts):
a qid in this registry is synthetic P5 practice. It counts as practice effort
and its accuracy is reported apart, but it never moves an authentic section
score, trend, ability, item fit, normering or Provpass number.

The registry is the qid list of the approved export: export_product.export_bank
over the roster's approved units, with every export gate (roster format,
RETIRED.json, approval, candidate sha256, candidate fields, cloze numbering,
qid format, duplicate qids, whitelist, internal metadata and labels, learner
lint, bank schema, deterministic rerun). A qid is listed exactly when an
approved release would ship it. Retired and pending units, and every revision
but a unit's current one, are absent, so the worker classifies an attempt on
such a qid as unknown and it fails closed.

Output: worker/data/p5-qid-registry.json, outside worker/src so biome's
formatter (it checks src/) leaves this rendering alone. It holds the format,
the roster and RETIRED.json the export read (path and sha256, from the export
manifest), the counts, and one row per unit in roster order: unit_id, revision,
section and its qids in q_index order. Rendered as the exporter renders JSON:
two-space, UTF-8 without ASCII escapes, one final newline. The export refuses,
writing nothing, whenever any of its gates does.

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

from build_roster import REPO_ROOT, ROSTER_PATH
from export_product import MANIFEST_NAME, ExportError, export_bank, render_json

REGISTRY_REL = "worker/data/p5-qid-registry.json"
REGISTRY_PATH = REPO_ROOT / REGISTRY_REL
REGISTRY_FORMAT = "p5-qid-registry-v1"
GENERATED_BY = "pipeline/synthetic/infold/export_qid_registry.py"
SPEC = "docs/p5-infold-design.md §E, §4 row 3"
# The release name of the bank the registry is read from; it reaches no qid.
RELEASE = "registry"


def build_registry(root: Path, roster_path: Path) -> bytes:
    """The registry's bytes for the approved export of root's roster, or
    ExportError from the export's gates."""
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
    registry = {
        "format": REGISTRY_FORMAT,
        "generated_by": GENERATED_BY,
        "spec": SPEC,
        "roster": manifest["roster"],
        "retired_registry": manifest["retired_registry"],
        "unit_count": len(units),
        "qid_count": len(rows),
        "units": units,
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
    summary = f"{registry['unit_count']} units / {registry['qid_count']} qids"
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

#!/usr/bin/env python3
"""Ingest digest-bound EXTERNAL review evidence into the adjudication flags file.

This is the tracked entry path for non-gate reviewer evidence (e.g. an
independent Sol lane report) into the existing stage-11 flags/fold pipeline.
It writes ONLY the batch's adjudication-flags.json; adjudicate_fold.py remains
the sole writer of reviews/adjudication.jsonl. Reviewer evidence never carries
an owner verdict: entries record provenance and findings, and the fold's own
documented rules decide the recommendation class.

Contract per ingested record (JSON file passed via --evidence):
  {
    "schema": "hpfetcher-external-evidence.v1",
    "source": "<reviewer identity, e.g. sol-adversarial-audit>",
    "source_finding_id": "<stable id in the source report>",
    "subject_commit": "<full sha the evidence was produced against>",
    "candidate_id": "<unit>",
    "severity": "<verbatim reviewer severity>",
    "finding": "<verbatim finding text>",
    "report_sha256": "<sha256 of the immutable report file>",
    "report_path": "<absolute immutable evidence path>",
    "comparison_sha256": "<sha256 of the run comparison, optional>",
    "role": "finding" | "counterevidence"
  }

Idempotence: an entry is identified by (source, source_finding_id,
report_sha256); re-ingesting an identical record is a no-op, and ingesting a
conflicting record under the same identity fails closed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

REQUIRED = {
    "schema", "source", "source_finding_id", "subject_commit", "candidate_id",
    "severity", "finding", "report_sha256", "report_path", "role",
}
SCHEMA = "hpfetcher-external-evidence.v1"


class IngestError(RuntimeError):
    pass


def _load(path: Path, label: str) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise IngestError(f"{label} unreadable: {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise IngestError(f"{label} must be a JSON object: {path}")
    return value


def _identity(rec: dict) -> str:
    return f"{rec['source']}:{rec['source_finding_id']}:{rec['report_sha256']}"


def _flag_entry(rec: dict) -> dict:
    provenance = {
        "external": True,
        "schema": rec["schema"],
        "identity": _identity(rec),
        "subject_commit": rec["subject_commit"],
        "report_path": rec["report_path"],
        "report_sha256": rec["report_sha256"],
        "role": rec["role"],
    }
    if rec.get("comparison_sha256"):
        provenance["comparison_sha256"] = rec["comparison_sha256"]
    return {
        "source": f"external:{rec['source']}",
        "severity": rec["severity"] if rec["role"] == "finding" else "info",
        "note": rec["finding"][:400],
        "provenance": provenance,
    }


def ingest(evidence_path: Path, flags_path: Path) -> str:
    rec = _load(evidence_path, "evidence record")
    missing = REQUIRED - set(rec)
    if missing:
        raise IngestError(f"evidence record lacks required fields: {sorted(missing)}")
    if rec["schema"] != SCHEMA:
        raise IngestError(f"unsupported evidence schema: {rec['schema']}")
    if rec["role"] not in ("finding", "counterevidence"):
        raise IngestError(f"unsupported role: {rec['role']}")
    report = Path(rec["report_path"])
    if not report.is_file():
        raise IngestError(f"immutable report path missing: {report}")
    actual = hashlib.sha256(report.read_bytes()).hexdigest()
    if actual != rec["report_sha256"]:
        raise IngestError(
            f"report digest mismatch: recorded {rec['report_sha256']}, actual {actual}"
        )
    flags = _load(flags_path, "flags file")
    entries = flags.setdefault(rec["candidate_id"], [])
    new = _flag_entry(rec)
    for existing in entries:
        prov = existing.get("provenance") or {}
        if prov.get("identity") == new["provenance"]["identity"]:
            if existing == new:
                return "duplicate (no-op)"
            raise IngestError(
                "conflicting record under existing identity "
                + new["provenance"]["identity"]
            )
    entries.append(new)
    flags_path.write_text(
        json.dumps(flags, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    return "ingested"


RESOLUTION_REQUIRED = {
    "schema", "identity", "ruling", "ruling_source", "repair_commit",
    "repaired_report_sha256", "resolution_note",
}
RESOLUTION_SCHEMA = "hpfetcher-external-evidence-resolution.v1"


def resolve(resolution_path: Path, flags_path: Path) -> str:
    """Re-class an ingested external finding after an owner ruling + repair.

    The original entry is preserved verbatim inside `resolved.original`; only
    the live severity is downgraded to "note" so the deterministic fold stops
    escalating a finding whose subject bytes the owner has since ruled on and
    repaired. Idempotent: resolving an already-resolved entry with the same
    resolution record is a no-op; a conflicting resolution fails closed.
    """
    rec = _load(resolution_path, "resolution record")
    missing = RESOLUTION_REQUIRED - set(rec)
    if missing:
        raise IngestError(f"resolution record lacks required fields: {sorted(missing)}")
    if rec["schema"] != RESOLUTION_SCHEMA:
        raise IngestError(f"unsupported resolution schema: {rec['schema']}")
    flags = _load(flags_path, "flags file")
    for entries in flags.values():
        for entry in entries:
            prov = entry.get("provenance") or {}
            if prov.get("identity") != rec["identity"]:
                continue
            existing = entry.get("resolved")
            resolution = {k: rec[k] for k in sorted(RESOLUTION_REQUIRED)}
            if existing is not None:
                if existing.get("resolution") == resolution:
                    return "already resolved (no-op)"
                raise IngestError(
                    f"conflicting resolution for identity {rec['identity']}"
                )
            entry["resolved"] = {
                "original": {"severity": entry["severity"], "note": entry["note"]},
                "resolution": resolution,
            }
            entry["severity"] = "note"
            entry["note"] = (
                f"RESOLVED by owner ruling ({rec['ruling']}): {rec['resolution_note']}"
            )[:400]
            flags_path.write_text(
                json.dumps(flags, ensure_ascii=False, indent=1) + "\n",
                encoding="utf-8",
            )
            return "resolved"
    raise IngestError(f"no ingested entry carries identity {rec['identity']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--evidence", type=Path)
    group.add_argument("--resolve", type=Path)
    parser.add_argument("--flags-file", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        if args.evidence:
            outcome = ingest(args.evidence, args.flags_file)
        else:
            outcome = resolve(args.resolve, args.flags_file)
    except IngestError as exc:
        print(f"ingest-external-evidence: REFUSED: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({"ok": True, "outcome": outcome}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

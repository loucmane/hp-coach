#!/usr/bin/env python3
"""Deterministically build a closed, key-blind HPFetcher batch bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any, Mapping


class BundleError(RuntimeError):
    """The requested bundle cannot be built without weakening its contract."""


LANES: Mapping[str, Mapping[str, str]] = {
    "blind-solver": {
        "prompt": "pipeline/synthetic/evidence/prompts/blind-solver.md",
        "rubric": "pipeline/synthetic/evidence/rubrics/blind-solver.md",
        "schema": "pipeline/synthetic/evidence/schemas/blind-solver-report.schema.json",
    },
    "adversarial-audit": {
        "prompt": "pipeline/synthetic/evidence/prompts/adversarial-audit.md",
        "rubric": "pipeline/synthetic/evidence/rubrics/adversarial-audit.md",
        "schema": "pipeline/synthetic/evidence/schemas/adversarial-audit-report.schema.json",
    },
}

FORBIDDEN_KEYS = {"key", "rationale", "generator_meta", "family"}

SUBJECT_STAGES = ("adjudicated", "pre_owner_adjudication")

_PROMOTE_RESULT = re.compile(r"\b(\d+)/(\d+) promote PASS\b")


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha256_file(path: Path) -> str:
    return _sha256_bytes(path.read_bytes())


def _stage_markers(subject_stage: str) -> tuple[str, ...]:
    if subject_stage == "adjudicated":
        return ("STATUS.md", "ADJUDICATION.md", "report.json")
    return ("STATUS.md", "ADJUDICATION.md", "report-final.json")


def _check_stage_status(subject_stage: str, status_text: str, status_line: str) -> None:
    if subject_stage == "adjudicated":
        if "status: COMPLETE" not in status_text or "promote CLEAN" not in status_text:
            raise BundleError("batch status is not COMPLETE with promote CLEAN")
        return
    if "status: PIPELINE COMPLETE" not in status_line:
        raise BundleError(
            "pre_owner_adjudication requires 'status: PIPELINE COMPLETE' in the status line"
        )
    if "awaiting owner adjudication" not in status_line:
        raise BundleError(
            "pre_owner_adjudication requires 'awaiting owner adjudication' in the status line"
        )
    if "HOLD" in status_line:
        raise BundleError("pre_owner_adjudication rejects a status line carrying HOLD")
    match = _PROMOTE_RESULT.search(status_line)
    if not match:
        raise BundleError(
            "pre_owner_adjudication requires an explicit N/N promote PASS result"
        )
    passed, total = int(match.group(1)), int(match.group(2))
    if passed != total or total == 0:
        raise BundleError(
            f"pre_owner_adjudication requires a complete promote PASS; saw {passed}/{total}"
        )


def _load_object(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise BundleError(f"{label} is not readable canonical JSON: {path}") from exc
    if not isinstance(value, dict):
        raise BundleError(f"{label} must be a JSON object: {path}")
    return value


def _safe_batch_id(value: str) -> str:
    if not value.startswith("batch") or not value[5:].isdigit():
        raise BundleError("batch id must match batch<digits>")
    return value


def _strip_candidate(value: dict[str, Any], source: Path) -> dict[str, Any]:
    candidate_id = value.get("candidate_id")
    if not isinstance(candidate_id, str) or not candidate_id:
        raise BundleError(f"candidate_id is missing: {source}")
    required = {"candidate_id", "section", "title", "passage", "questions"}
    missing = required - set(value)
    if missing:
        raise BundleError(f"candidate lacks required fields {sorted(missing)}: {source}")
    questions = value.get("questions")
    if not isinstance(questions, list) or not questions:
        raise BundleError(f"candidate questions must be a non-empty list: {source}")
    stripped_questions: list[dict[str, Any]] = []
    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise BundleError(f"question {index} is not an object: {source}")
        required_question = {"q_index", "prompt", "options"}
        missing_question = required_question - set(question)
        if missing_question:
            raise BundleError(
                f"question {index} lacks fields {sorted(missing_question)}: {source}"
            )
        stripped_questions.append(
            {
                "options": question["options"],
                "prompt": question["prompt"],
                "q_index": question["q_index"],
            }
        )
    return {
        "candidate_id": candidate_id,
        "passage": value["passage"],
        "questions": stripped_questions,
        "section": value["section"],
        "title": value["title"],
    }


def _assert_key_blind(value: Any, location: str = "<root>") -> None:
    if isinstance(value, dict):
        hits = FORBIDDEN_KEYS & set(value)
        if hits:
            raise BundleError(f"decision-bearing keys remain at {location}: {sorted(hits)}")
        for key, child in value.items():
            _assert_key_blind(child, f"{location}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _assert_key_blind(child, f"{location}[{index}]")


def _write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def build_bundle(
    subject_root: Path,
    batch_id: str,
    output_dir: Path,
    lane_id: str,
    subject_stage: str = "adjudicated",
    assets_root: Path | None = None,
) -> dict[str, Any]:
    subject = subject_root.resolve()
    output = output_dir.resolve()
    batch = _safe_batch_id(batch_id)
    if subject_stage not in SUBJECT_STAGES:
        raise BundleError(f"unknown subject_stage: {subject_stage}")
    if lane_id not in LANES:
        raise BundleError(f"unknown lane: {lane_id}")
    if not (subject / ".git").exists():
        raise BundleError(f"subject root is not a Git worktree: {subject}")
    batch_root = subject / "pipeline" / "synthetic" / "batches" / batch
    if not batch_root.is_dir() or batch_root.is_symlink():
        raise BundleError(f"batch directory is missing or unsafe: {batch_root}")
    for marker in _stage_markers(subject_stage):
        path = batch_root / marker
        if not path.is_file() or path.is_symlink():
            raise BundleError(
                f"batch is not adjudication-frozen for stage {subject_stage}; "
                f"missing safe {marker}"
            )
    status = (batch_root / "STATUS.md").read_text(encoding="utf-8")
    status_line = status.split("\n", 1)[0]
    _check_stage_status(subject_stage, status, status_line)
    final_report_path = batch_root / _stage_markers(subject_stage)[2]
    final_report_sha256 = _sha256_file(final_report_path)
    candidate_root = batch_root / "candidates-final"
    candidate_paths = sorted(candidate_root.glob("*.json"))
    if not candidate_paths:
        raise BundleError("batch has no final candidates")
    candidates = [_strip_candidate(_load_object(path, "candidate"), path) for path in candidate_paths]
    candidate_ids = [item["candidate_id"] for item in candidates]
    if len(candidate_ids) != len(set(candidate_ids)):
        raise BundleError("candidate ids are not unique")
    if candidate_ids != sorted(candidate_ids):
        raise BundleError("candidate inventory is not deterministic")
    candidate_inventory = [
        {"candidate_id": item["candidate_id"], "sha256": _sha256_file(path)}
        for item, path in zip(candidates, candidate_paths)
    ]
    if subject_stage == "pre_owner_adjudication":
        final_report = _load_object(final_report_path, "final report")
        if set(final_report) != set(candidate_ids):
            raise BundleError(
                "candidate drift: report-final.json units do not match candidates-final"
            )
    payload = {
        "batch_id": batch,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "schema": "hpfetcher-blind-batch.v1",
    }
    _assert_key_blind(payload)

    assets_base = (assets_root or subject_root).resolve()
    if assets_root is not None and not assets_base.is_dir():
        raise BundleError(f"assets root is not a directory: {assets_base}")
    lane = LANES[lane_id]
    prompt = assets_base / lane["prompt"]
    rubric = assets_base / lane["rubric"]
    report_schema = assets_base / lane["schema"]
    for asset in (prompt, rubric, report_schema):
        if not asset.is_file() or asset.is_symlink():
            raise BundleError(f"lane asset is missing or unsafe: {asset}")
    if output.exists() or output.is_symlink():
        raise BundleError(f"output directory already exists: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{output.name}.", dir=output.parent))
    try:
        _write_json(temporary / "candidates.json", payload)
        instructions = (
            f"# Frozen report-only lane: {lane_id}\n\n"
            + prompt.read_text(encoding="utf-8").rstrip()
            + "\n\n## Rubric\n\n"
            + rubric.read_text(encoding="utf-8").rstrip()
            + "\n"
        )
        (temporary / "instructions.md").write_text(instructions, encoding="utf-8")
        shutil.copyfile(report_schema, temporary / "report.schema.json")
        os.rename(temporary, output)
    except BaseException:
        shutil.rmtree(temporary, ignore_errors=True)
        raise
    return {
        "assets_root": assets_base.as_posix(),
        "batch_id": batch,
        "candidate_ids": candidate_ids,
        "candidate_inventory": candidate_inventory,
        "final_report": {
            "path": final_report_path.as_posix(),
            "sha256": final_report_sha256,
        },
        "lane_id": lane_id,
        "output_dir": output.as_posix(),
        "status_line": status_line,
        "status_line_sha256": _sha256_bytes(status_line.encode("utf-8")),
        "subject_stage": subject_stage,
    }


def run_lane(lane_id: str, argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--subject-root", required=True, type=Path)
    parser.add_argument("--batch-id", required=True)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument(
        "--subject-stage", choices=SUBJECT_STAGES, default="adjudicated"
    )
    parser.add_argument("--assets-root", type=Path, default=None)
    args = parser.parse_args(argv)
    try:
        result = build_bundle(
            args.subject_root,
            args.batch_id,
            args.output_dir,
            lane_id,
            subject_stage=args.subject_stage,
            assets_root=args.assets_root,
        )
    except (BundleError, OSError, UnicodeError, ValueError) as exc:
        print(f"hpfetcher-evidence-bundle: REFUSED: {exc}", file=__import__("sys").stderr)
        return 2
    print(json.dumps({"ok": True, **result}, sort_keys=True))
    return 0

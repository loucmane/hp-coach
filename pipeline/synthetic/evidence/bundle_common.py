#!/usr/bin/env python3
"""Deterministically build a closed, key-blind HPFetcher batch bundle."""

from __future__ import annotations

import argparse
import json
import os
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


def build_bundle(subject_root: Path, batch_id: str, output_dir: Path, lane_id: str) -> dict[str, Any]:
    subject = subject_root.resolve()
    output = output_dir.resolve()
    batch = _safe_batch_id(batch_id)
    if lane_id not in LANES:
        raise BundleError(f"unknown lane: {lane_id}")
    if not (subject / ".git").exists():
        raise BundleError(f"subject root is not a Git worktree: {subject}")
    batch_root = subject / "pipeline" / "synthetic" / "batches" / batch
    if not batch_root.is_dir() or batch_root.is_symlink():
        raise BundleError(f"batch directory is missing or unsafe: {batch_root}")
    for marker in ("STATUS.md", "ADJUDICATION.md", "report.json"):
        path = batch_root / marker
        if not path.is_file() or path.is_symlink():
            raise BundleError(f"batch is not adjudication-frozen; missing safe {marker}")
    status = (batch_root / "STATUS.md").read_text(encoding="utf-8")
    if "status: COMPLETE" not in status or "promote CLEAN" not in status:
        raise BundleError("batch status is not COMPLETE with promote CLEAN")
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
    payload = {
        "batch_id": batch,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "schema": "hpfetcher-blind-batch.v1",
    }
    _assert_key_blind(payload)

    lane = LANES[lane_id]
    prompt = subject / lane["prompt"]
    rubric = subject / lane["rubric"]
    report_schema = subject / lane["schema"]
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
        "batch_id": batch,
        "candidate_ids": candidate_ids,
        "lane_id": lane_id,
        "output_dir": output.as_posix(),
    }


def run_lane(lane_id: str, argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--subject-root", required=True, type=Path)
    parser.add_argument("--batch-id", required=True)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        result = build_bundle(args.subject_root, args.batch_id, args.output_dir, lane_id)
    except (BundleError, OSError, UnicodeError, ValueError) as exc:
        print(f"hpfetcher-evidence-bundle: REFUSED: {exc}", file=__import__("sys").stderr)
        return 2
    print(json.dumps({"ok": True, **result}, sort_keys=True))
    return 0

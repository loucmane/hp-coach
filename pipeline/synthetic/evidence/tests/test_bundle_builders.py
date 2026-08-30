from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[4]
MODULE_PATH = ROOT / "pipeline" / "synthetic" / "evidence" / "bundle_common.py"
SPEC = importlib.util.spec_from_file_location("hpfetcher_bundle_common", MODULE_PATH)
assert SPEC and SPEC.loader
bundle_common = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bundle_common)


@pytest.mark.parametrize("lane", ["blind-solver", "adversarial-audit"])
def test_batch13_bundle_is_closed_deterministic_and_key_blind(tmp_path: Path, lane: str) -> None:
    first = tmp_path / f"{lane}-first"
    second = tmp_path / f"{lane}-second"
    one = bundle_common.build_bundle(ROOT, "batch13", first, lane)
    two = bundle_common.build_bundle(ROOT, "batch13", second, lane)

    assert one["candidate_ids"] == two["candidate_ids"]
    assert sorted(path.name for path in first.iterdir()) == [
        "candidates.json",
        "instructions.md",
        "report.schema.json",
    ]
    for name in ("candidates.json", "instructions.md", "report.schema.json"):
        assert (first / name).read_bytes() == (second / name).read_bytes()

    payload = json.loads((first / "candidates.json").read_text(encoding="utf-8"))
    assert payload["batch_id"] == "batch13"
    assert payload["candidate_count"] == 7
    serialized = (first / "candidates.json").read_text(encoding="utf-8").casefold()
    for forbidden in ('"key"', '"rationale"', '"generator_meta"', '"family"'):
        assert forbidden not in serialized


def test_builder_refuses_existing_output_and_unadjudicated_batch(tmp_path: Path) -> None:
    output = tmp_path / "existing"
    output.mkdir()
    with pytest.raises(bundle_common.BundleError, match="already exists"):
        bundle_common.build_bundle(ROOT, "batch13", output, "blind-solver")
    with pytest.raises(bundle_common.BundleError, match="adjudication-frozen"):
        bundle_common.build_bundle(ROOT, "batch14", tmp_path / "batch14", "blind-solver")


@pytest.mark.parametrize("batch", ["13", "batch../13", "batch-13", "batch13/other"])
def test_builder_refuses_unsafe_batch_identity(tmp_path: Path, batch: str) -> None:
    with pytest.raises(bundle_common.BundleError, match="batch id"):
        bundle_common.build_bundle(ROOT, batch, tmp_path / "output", "blind-solver")


def _make_pre_adjudication_subject(
    tmp_path: Path,
    *,
    status_line: str | None = None,
    units: tuple[str, ...] = ("elf-b99-001", "las-b99-001"),
    report_units: tuple[str, ...] | None = None,
    with_report_final: bool = True,
    symlink_report_final: bool = False,
    with_round_one_report: bool = False,
) -> Path:
    subject = tmp_path / "subject"
    (subject / ".git").mkdir(parents=True)
    batch = subject / "pipeline" / "synthetic" / "batches" / "batch99"
    (batch / "candidates-final").mkdir(parents=True)
    line = status_line or (
        "# Batch 99 — status: PIPELINE COMPLETE — 2/2 promote PASS "
        "2026-08-30 (round 1), awaiting owner adjudication"
    )
    (batch / "STATUS.md").write_text(line + "\n\nhistory: round 1 had 1 hold.\n", encoding="utf-8")
    (batch / "ADJUDICATION.md").write_text("# Adjudication package\n", encoding="utf-8")
    for unit in units:
        (batch / "candidates-final" / f"{unit}.json").write_text(
            json.dumps(
                {
                    "candidate_id": unit,
                    "section": "LÄS" if unit.startswith("las") else "ELF",
                    "title": f"Title {unit}",
                    "passage": f"Passage body for {unit}.",
                    "questions": [
                        {
                            "q_index": 1,
                            "prompt": f"Prompt for {unit}?",
                            "options": [
                                {"letter": "A", "text": "First"},
                                {"letter": "B", "text": "Second"},
                                {"letter": "C", "text": "Third"},
                                {"letter": "D", "text": "Fourth"},
                            ],
                        }
                    ],
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
    if with_report_final:
        payload = {u: {"status": "SURVIVED_FLAGGED"} for u in (report_units or units)}
        target = batch / "report-final.json"
        if symlink_report_final:
            real = tmp_path / "elsewhere-report-final.json"
            real.write_text(json.dumps(payload), encoding="utf-8")
            target.symlink_to(real)
        else:
            target.write_text(json.dumps(payload), encoding="utf-8")
    if with_round_one_report:
        (batch / "report.json").write_text(json.dumps({}), encoding="utf-8")
    return subject


def test_adjudicated_default_behavior_unchanged(tmp_path: Path) -> None:
    default_out = tmp_path / "default"
    explicit_out = tmp_path / "explicit"
    default_result = bundle_common.build_bundle(ROOT, "batch13", default_out, "blind-solver")
    explicit_result = bundle_common.build_bundle(
        ROOT, "batch13", explicit_out, "blind-solver", subject_stage="adjudicated"
    )
    for name in ("candidates.json", "instructions.md", "report.schema.json"):
        assert (default_out / name).read_bytes() == (explicit_out / name).read_bytes()
    assert default_result["subject_stage"] == "adjudicated"
    assert default_result["final_report"]["path"].endswith("batch13/report.json")
    assert default_result["candidate_ids"] == explicit_result["candidate_ids"]


def test_pre_adjudication_status_rejected_without_explicit_stage(tmp_path: Path) -> None:
    subject = _make_pre_adjudication_subject(tmp_path)
    with pytest.raises(bundle_common.BundleError, match="adjudication-frozen"):
        bundle_common.build_bundle(subject, "batch99", tmp_path / "o1", "blind-solver")
    subject_with_round_one = _make_pre_adjudication_subject(
        tmp_path / "second", with_round_one_report=True
    )
    with pytest.raises(bundle_common.BundleError, match="COMPLETE with promote CLEAN"):
        bundle_common.build_bundle(
            subject_with_round_one, "batch99", tmp_path / "o2", "blind-solver"
        )


def test_pre_adjudication_accepts_completed_awaiting_combination(tmp_path: Path) -> None:
    subject = _make_pre_adjudication_subject(tmp_path)
    result = bundle_common.build_bundle(
        subject,
        "batch99",
        tmp_path / "bundle",
        "blind-solver",
        subject_stage="pre_owner_adjudication",
        assets_root=ROOT,
    )
    assert result["subject_stage"] == "pre_owner_adjudication"
    assert result["final_report"]["path"].endswith("batch99/report-final.json")
    import hashlib

    report_path = subject / "pipeline/synthetic/batches/batch99/report-final.json"
    assert result["final_report"]["sha256"] == hashlib.sha256(report_path.read_bytes()).hexdigest()
    status_line = (
        subject / "pipeline/synthetic/batches/batch99/STATUS.md"
    ).read_text(encoding="utf-8").split("\n", 1)[0]
    assert result["status_line"] == status_line
    assert result["status_line_sha256"] == hashlib.sha256(status_line.encode()).hexdigest()
    assert [e["candidate_id"] for e in result["candidate_inventory"]] == list(result["candidate_ids"])


@pytest.mark.parametrize(
    ("mutation", "message"),
    [
        ({"status_line": "# Batch 99 — status: PIPELINE COMPLETE — 2/2 promote PASS, 1 HOLD, awaiting owner adjudication"}, "HOLD"),
        ({"status_line": "# Batch 99 — status: PIPELINE COMPLETE — 1/2 promote PASS, awaiting owner adjudication"}, "complete promote PASS"),
        ({"status_line": "# Batch 99 — status: PIPELINE COMPLETE — 0/0 promote PASS, awaiting owner adjudication"}, "complete promote PASS"),
        ({"status_line": "# Batch 99 — status: PIPELINE COMPLETE — 2/2 promote PASS (round 1)"}, "awaiting owner adjudication"),
        ({"status_line": "# Batch 99 — status: COMPLETE — 2/2 promote PASS, awaiting owner adjudication"}, "PIPELINE COMPLETE"),
        ({"with_report_final": False}, "missing safe report-final.json"),
        ({"symlink_report_final": True}, "missing safe report-final.json"),
        ({"report_units": ("elf-b99-001",)}, "candidate drift"),
    ],
)
def test_pre_adjudication_fail_closed(tmp_path: Path, mutation: dict, message: str) -> None:
    subject = _make_pre_adjudication_subject(tmp_path, **mutation)
    with pytest.raises(bundle_common.BundleError, match=message):
        bundle_common.build_bundle(
            subject,
            "batch99",
            tmp_path / "bundle",
            "blind-solver",
            subject_stage="pre_owner_adjudication",
            assets_root=ROOT,
        )


def test_pre_adjudication_bundle_binds_inventory_and_is_deterministic(tmp_path: Path) -> None:
    subject = _make_pre_adjudication_subject(tmp_path)
    first = tmp_path / "first"
    second = tmp_path / "second"
    one = bundle_common.build_bundle(
        subject, "batch99", first, "adversarial-audit",
        subject_stage="pre_owner_adjudication", assets_root=ROOT,
    )
    two = bundle_common.build_bundle(
        subject, "batch99", second, "adversarial-audit",
        subject_stage="pre_owner_adjudication", assets_root=ROOT,
    )
    for name in ("candidates.json", "instructions.md", "report.schema.json"):
        assert (first / name).read_bytes() == (second / name).read_bytes()
    assert {k: v for k, v in one.items() if k != "output_dir"} == {
        k: v for k, v in two.items() if k != "output_dir"
    }
    payload = json.loads((first / "candidates.json").read_text(encoding="utf-8"))
    assert [c["candidate_id"] for c in payload["candidates"]] == [
        e["candidate_id"] for e in one["candidate_inventory"]
    ]
    import hashlib

    for entry in one["candidate_inventory"]:
        path = subject / "pipeline/synthetic/batches/batch99/candidates-final" / (
            entry["candidate_id"] + ".json"
        )
        assert entry["sha256"] == hashlib.sha256(path.read_bytes()).hexdigest()
    serialized = (first / "candidates.json").read_text(encoding="utf-8").casefold()
    for forbidden in ('"key"', '"rationale"', '"generator_meta"', '"family"'):
        assert forbidden not in serialized

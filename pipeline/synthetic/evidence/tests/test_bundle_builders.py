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

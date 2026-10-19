"""Offline contract for the generated lesson-leverage asset."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "framework_leverage", ROOT / "pipeline/frameworks/leverage.py"
)
leverage = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(leverage)


def test_committed_asset_is_fresh_and_deterministic():
    expected = leverage.render(leverage.generate(ROOT))
    assert expected == leverage.render(leverage.generate(ROOT))
    assert (ROOT / "app/public/leverage/framework_leverage.json").read_text("utf-8") == expected
    assert leverage.main(["--check"]) == 0


def test_every_catalog_entry_has_exactly_one_leverage_record():
    ids = {
        entry["id"]
        for path in (ROOT / "frameworks").glob("*.json")
        for entry in json.loads(path.read_text("utf-8")).get("entries", [])
    }
    asset = json.loads((ROOT / leverage.ASSET).read_text("utf-8"))
    assert set(asset["entries"]) == ids
    assert list(asset["entries"]) == sorted(ids)


def test_distinct_authentic_questions_position_ord_and_zero_coverage(monkeypatch):
    # In-memory source files exercise generation without fixture directories.
    files = {
        "frameworks/nog_traps.json": {
            "section": "NOG", "entries": [{"id": "NOG-A"}, {"id": "NOG-B"}],
        },
        "frameworks/ord_roots.json": {
            "section": "ORD", "entries": [{"id": "ORD-A", "corpus_frequency": 17}],
        },
        "frameworks/framework_prereqs.json": {"version": 1, "edges": []},
        "data/explanations/host-2020.json": {
            "host-2020-kvant1-NOG-003": {"framework_id": "NOG-A"},
            "host-2020-kvant1-NOG-007": {"framework_id": "NOG-A"},
            "host-2020-verb1-ORD-001": {"framework_id": "ORD-A"},
            "host-2020-kvant1-NOG-009": {},
            "host-2020-kvant1-NOG-010": {"framework_id": "unknown"},
            "p5-unit-r1-NOG-001": {"framework_id": "NOG-A"},
        },
        "data/explanations/host-2021.json": {
            "host-2020-kvant1-NOG-003": {"framework_id": "NOG-A"},
        },
        "data/explanations/p5-pilot.json": {
            "host-2020-kvant1-NOG-011": {"framework_id": "NOG-A"},
        },
        "data/explanations/_index.json": {
            "host-2020-kvant1-NOG-012": {"framework_id": "NOG-A"},
        },
    }
    root = Path("/virtual-leverage")
    monkeypatch.setattr(
        Path, "glob",
        lambda self, pattern: iter(
            root / name for name in reversed(files) if (root / name).parent == self
        ),
    )
    monkeypatch.setattr(
        Path, "read_text",
        lambda self, *args, **kwargs: json.dumps(files[str(self.relative_to(root))]),
    )
    result = leverage.generate(root)
    assert result["entries"] == {
        "NOG-A": {"coverage": 2, "position": 5.0},
        "NOG-B": {"coverage": 0, "position": None},
        "ORD-A": {"coverage": 17, "position": None},
    }


def test_check_rejects_stale_asset_without_writing(monkeypatch):
    original = Path.read_text
    monkeypatch.setattr(
        Path, "read_text",
        lambda self, *args, **kwargs: (
            "{}\n" if self.name == "framework_leverage.json"
            else original(self, *args, **kwargs)
        ),
    )

    def no_write(*args, **kwargs):
        raise AssertionError("--check must not write")

    monkeypatch.setattr(Path, "write_text", no_write)
    assert leverage.main(["--check"]) == 1


def test_check_rejects_missing_asset(monkeypatch):
    original = Path.exists
    monkeypatch.setattr(
        Path, "exists",
        lambda self: False if self.name == "framework_leverage.json" else original(self),
    )
    assert leverage.main(["--check"]) == 1

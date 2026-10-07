"""Shared fixtures for the P5 infold export-contract tests (bead hpf-535m).

The two scripts under test live one directory up and are imported as
top-level modules, the way gates/scripts/tests import their scripts.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import pytest

INFOLD = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(INFOLD))

import build_roster  # noqa: E402
import export_product  # noqa: E402

REPO_ROOT = build_roster.REPO_ROOT


@pytest.fixture(scope="session")
def committed_roster() -> dict:
    return json.loads(build_roster.ROSTER_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def built_roster() -> dict:
    return build_roster.build_roster()


def _write_roster(path: Path, roster: dict) -> None:
    path.write_text(json.dumps(roster, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _rehash(root: Path, roster_path: Path, unit_id: str) -> None:
    """Re-pin one unit's digests after a test edited its candidate copy, so a
    later gate (not the hash gate) is the one that has to catch the edit."""
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    for entry in roster["units"]:
        if entry["unit_id"] == unit_id:
            raw = (root / entry["source"]).read_bytes()
            entry["sha256"] = build_roster.sha256_bytes(raw)
            try:
                entry["content_sha256"] = build_roster.content_digest(json.loads(raw))
            except (KeyError, TypeError):
                pass  # the edit removed a field the digest reads; the field gate runs first
    _write_roster(roster_path, roster)


@pytest.fixture
def save_roster():
    return _write_roster


@pytest.fixture
def rehash():
    return _rehash


@pytest.fixture
def make_tree(tmp_path, committed_roster):
    """A throwaway repo root holding copies of the named units' candidate
    files, RETIRED.json, the Layer-1 frameworks (the internal-label gate
    derives its id series from them) and a roster restricted to those units."""

    def _make(unit_ids, *, retired=None):
        entries = [dict(e) for e in committed_roster["units"] if e["unit_id"] in unit_ids]
        assert sorted(e["unit_id"] for e in entries) == sorted(unit_ids)
        root = tmp_path / "repo"
        for entry in entries:
            target = root / entry["source"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(REPO_ROOT / entry["source"], target)
        shutil.copytree(REPO_ROOT / export_product.FRAMEWORKS_REL, root / export_product.FRAMEWORKS_REL)
        registry = root / build_roster.RETIRED_REL
        registry.parent.mkdir(parents=True, exist_ok=True)
        if retired is None:
            shutil.copyfile(REPO_ROOT / build_roster.RETIRED_REL, registry)
        else:
            registry.write_text(json.dumps({"retired": retired}), encoding="utf-8")
        roster = dict(committed_roster, units=entries)
        roster_path = root / "roster.json"
        _write_roster(roster_path, roster)
        return root, roster_path

    return _make

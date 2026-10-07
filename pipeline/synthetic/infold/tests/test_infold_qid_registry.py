"""The P5 qid registry the worker bundles (docs/p5-infold-design.md §E, §4 row 3; bead hpf-94i5).

export_qid_registry.py lists exactly the qids an approved export ships, so the
worker can classify an answered P5 question as synthetic practice on the server
(worker/src/lib/provenance.ts) and keep it out of every authentic assessment
number. Everything else in the p5- namespace (a retired unit, a revision that
is no longer current, a pending unit) is absent, so the worker classifies it
unknown and it fails closed.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import pytest

import build_roster
import export_product
import export_qid_registry

REPO_ROOT = build_roster.REPO_ROOT
ROSTER = build_roster.ROSTER_PATH
SCRIPT = export_qid_registry.__file__
ExportError = export_product.ExportError
B19 = "pipeline/synthetic/batches/batch19/candidates/las-b19-002.json"


@pytest.fixture(scope="session")
def built() -> bytes:
    return export_qid_registry.build_registry(REPO_ROOT, ROSTER)


@pytest.fixture(scope="session")
def registry(built) -> dict:
    return json.loads(built)


def _qids(registry: dict) -> list[str]:
    return [qid for unit in registry["units"] for qid in unit["qids"]]


def _authentic_bank_qids() -> set[str]:
    folder = REPO_ROOT / "app/public/data"
    return {row["qid"] for path in sorted(folder.glob("*.json")) if not path.name.startswith("_")
            for row in json.loads(path.read_text(encoding="utf-8"))}


def test_the_committed_registry_is_the_current_build(built):
    # The worker bundles this file: a roster change that is not re-exported fails here.
    assert export_qid_registry.REGISTRY_PATH.read_bytes() == built, (
        "worker/data/p5-qid-registry.json is stale: rerun python3 pipeline/synthetic/infold/export_qid_registry.py")


def test_the_registry_lives_where_the_worker_imports_it():
    assert export_qid_registry.REGISTRY_PATH == REPO_ROOT / "worker/data/p5-qid-registry.json"
    source = (REPO_ROOT / "worker/src/lib/provenance.ts").read_text(encoding="utf-8")
    assert "from '../../data/p5-qid-registry.json'" in source


def test_the_registry_lists_exactly_the_approved_exports_qids(registry):
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="preview")
    rows = json.loads(files["p5-bank-preview.json"])["questions"]
    assert _qids(registry) == [row["qid"] for row in rows]
    units = {}
    for row in rows:
        units.setdefault(row["unit_id"], row)
    assert [(u["unit_id"], u["revision"], u["section"]) for u in registry["units"]] == [
        (uid, row["revision"], row["section"]) for uid, row in units.items()]
    # The census of the approved roster (docs/p5-infold-design.md §2; owner ratification 2026-10-07).
    assert registry["unit_count"] == len(registry["units"]) == 120
    assert registry["qid_count"] == len(rows) == 340
    assert sum(len(u["qids"]) for u in registry["units"] if u["section"] == "LÄS") == 136
    assert sum(len(u["qids"]) for u in registry["units"] if u["section"] == "ELF") == 204


def test_the_registry_binds_the_roster_and_the_retired_registry(registry):
    assert list(registry) == ["format", "generated_by", "spec", "roster", "retired_registry", "unit_count",
                              "qid_count", "units"]
    assert registry["format"] == "p5-qid-registry-v1"
    assert registry["generated_by"] == "pipeline/synthetic/infold/export_qid_registry.py"
    assert registry["roster"] == {"path": "pipeline/synthetic/infold/approval-roster.json",
                                  "sha256": build_roster.sha256_bytes(ROSTER.read_bytes())}
    assert registry["retired_registry"] == {
        "path": build_roster.RETIRED_REL,
        "sha256": build_roster.sha256_bytes((REPO_ROOT / build_roster.RETIRED_REL).read_bytes())}
    for unit in registry["units"]:
        assert list(unit) == ["unit_id", "revision", "section", "qids"]


def test_retired_units_and_superseded_revisions_are_absent(registry):
    qids = set(_qids(registry))
    retired = json.loads((REPO_ROOT / build_roster.RETIRED_REL).read_text(encoding="utf-8"))["retired"]
    assert len(retired) == 8
    assert not {u["unit_id"] for u in registry["units"]} & set(retired)
    assert not [qid for qid in qids for uid in retired if qid.startswith(f"p5-{uid}-")]
    # las-b7-002 is at revision 2 (roster), so its revision-1 qids are revoked.
    assert "p5-las-b7-002-r2-LÄS-001" in qids
    assert not [qid for qid in qids if qid.startswith("p5-las-b7-002-r1-")]


def test_every_qid_is_a_documented_p5_qid_and_never_an_authentic_one(registry):
    authentic = _authentic_bank_qids()
    assert len(authentic) == 4320
    seen = set()
    for unit in registry["units"]:
        assert unit["section"] in ("LÄS", "ELF")
        for number, qid in enumerate(unit["qids"], 1):
            assert qid == export_product.make_qid(unit["unit_id"], unit["revision"], unit["section"], number)
            assert export_product.QID.fullmatch(qid)
            assert len(qid.encode("utf-16-le")) // 2 <= export_product.QID_MAX
            assert qid not in authentic and qid not in seen
            seen.add(qid)


def test_the_committed_sample_qids_are_registered(registry):
    sample = json.loads((export_product.SAMPLE_DIR / "p5-bank-sample.json").read_text(encoding="utf-8"))
    assert {row["qid"] for row in sample["questions"]} <= set(_qids(registry))


def test_a_pending_unit_is_absent(make_tree, save_roster):
    root, roster_path = make_tree(["las-b2-003", "las-b19-002"])
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    for row in roster["units"]:
        if row["unit_id"] == "las-b2-003":
            row["approval"] = "pending-owner-ratification"
    save_roster(roster_path, roster)
    built = json.loads(export_qid_registry.build_registry(root, roster_path))
    assert [u["unit_id"] for u in built["units"]] == ["las-b19-002"]
    assert _qids(built) == ["p5-las-b19-002-r1-LÄS-001", "p5-las-b19-002-r1-LÄS-002"]
    assert built["roster"]["path"] == "roster.json"


def test_a_refused_export_builds_no_registry(make_tree):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(ExportError, match="sha256"):
        export_qid_registry.build_registry(root, roster_path)


def test_the_cli_checks_and_writes(tmp_path, built):
    out = tmp_path / "registry.json"
    run = [sys.executable, SCRIPT, "--out", str(out)]
    stale = subprocess.run([*run, "--check"], capture_output=True, text=True)
    assert stale.returncode == 1 and "STALE" in stale.stdout
    assert not out.exists()
    written = subprocess.run(run, capture_output=True, text=True)
    assert written.returncode == 0, written.stderr
    assert out.read_bytes() == built
    assert "120 units / 340 qids" in written.stdout
    out.write_bytes(built.replace(b'"p5-las-b19-002-r1-L', b'"p5-las-b19-002-r2-L', 1))
    assert subprocess.run([*run, "--check"], capture_output=True, text=True).returncode == 1


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_committed_registry_checks_clean_under_any_hash_seed(seed):
    env = dict(os.environ, PYTHONHASHSEED=seed)
    done = subprocess.run([sys.executable, SCRIPT, "--check"], capture_output=True, text=True, env=env)
    assert done.returncode == 0, done.stdout + done.stderr

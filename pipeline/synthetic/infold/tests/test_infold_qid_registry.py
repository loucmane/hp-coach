"""The P5 qid registry the worker bundles (docs/p5-infold-design.md Amendment 1 E, PR 3; bead hpf-94i5).

export_qid_registry.py lists exactly the qids an approved export ships, so the
worker can classify an answered P5 question as synthetic on the server
(worker/src/lib/provenance.ts): it then counts toward the assessment, marked
uncalibrated. Everything else in the p5- namespace (a retired unit, a revision
that is no longer current, a pending unit) is absent, so the worker classifies
it unknown and it fails closed. Each qid's framework_id comes from a P5
explanation shard that passes the export's explanation gate; the worker lets a
synthetic answer move mastery only under that id.
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
PILOT_SHARD = REPO_ROOT / "data/explanations/p5-pilot.json"
B19_QIDS = ["p5-las-b19-002-r1-LÄS-001", "p5-las-b19-002-r1-LÄS-002"]


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


def _pilot() -> dict:
    return json.loads(PILOT_SHARD.read_text(encoding="utf-8"))


@pytest.fixture
def b19_tree(make_tree):
    """A throwaway repo root with las-b19-002 (approved, two questions) and,
    when given, explanation shards under data/explanations/."""

    def _make(shards: dict[str, dict] | None = None):
        root, roster_path = make_tree(["las-b19-002"])
        folder = root / export_product.EXPLANATIONS_REL
        folder.mkdir(parents=True, exist_ok=True)
        for name, entries in (shards or {}).items():
            (folder / name).write_bytes(export_product.render_json(entries))
        return root, roster_path

    return _make


def _b19_entries() -> dict:
    pilot = _pilot()
    return {qid: pilot[qid] for qid in B19_QIDS}


def test_the_committed_registry_is_the_current_build(built):
    # The worker bundles this file: a roster or shard change that is not re-exported fails here.
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
    # The census of the approved roster (docs/p5-infold-design.md §2; owner ratification 2026-10-07,
    # less las-b3-001 and las-b5-001, retired by the owner 2026-10-08).
    assert registry["unit_count"] == len(registry["units"]) == 118
    assert registry["qid_count"] == len(rows) == 332
    assert sum(len(u["qids"]) for u in registry["units"] if u["section"] == "LÄS") == 128
    assert sum(len(u["qids"]) for u in registry["units"] if u["section"] == "ELF") == 204


def test_the_registry_binds_its_inputs(registry):
    assert list(registry) == ["format", "generated_by", "spec", "roster", "retired_registry", "explanations",
                              "unit_count", "qid_count", "framework_id_count", "units", "framework_ids"]
    assert registry["format"] == "p5-qid-registry-v1"
    assert registry["generated_by"] == "pipeline/synthetic/infold/export_qid_registry.py"
    assert registry["roster"] == {"path": "pipeline/synthetic/infold/approval-roster.json",
                                  "sha256": build_roster.sha256_bytes(ROSTER.read_bytes())}
    assert registry["retired_registry"] == {
        "path": build_roster.RETIRED_REL,
        "sha256": build_roster.sha256_bytes((REPO_ROOT / build_roster.RETIRED_REL).read_bytes())}
    assert registry["explanations"] == [{"path": "data/explanations/p5-pilot.json",
                                         "sha256": build_roster.sha256_bytes(PILOT_SHARD.read_bytes()),
                                         "entries": 19}]
    for unit in registry["units"]:
        assert list(unit) == ["unit_id", "revision", "section", "qids"]


def test_retired_units_and_superseded_revisions_are_absent(registry):
    qids = set(_qids(registry))
    retired = json.loads((REPO_ROOT / build_roster.RETIRED_REL).read_text(encoding="utf-8"))["retired"]
    assert len(retired) == 10
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


def test_framework_ids_are_the_pilot_shards_own(registry):
    pilot = _pilot()
    expected = {qid: entry["framework_id"] for qid, entry in pilot.items() if "framework_id" in entry}
    assert len(expected) == 14
    assert registry["framework_ids"] == expected
    assert registry["framework_id_count"] == 14
    # Keyed in registry order, and only by registry qids.
    order = _qids(registry)
    assert list(registry["framework_ids"]) == [qid for qid in order if qid in expected]
    # The ELF cloze unit's gap questions carry no framework id in the shard, so none here.
    assert not [qid for qid in registry["framework_ids"] if qid.startswith("p5-elf-b18-002-")]


def test_every_framework_id_is_a_layer1_entry_of_its_questions_section(registry):
    catalog, _ = export_product.load_frameworks(REPO_ROOT)
    section_of = {qid: unit["section"] for unit in registry["units"] for qid in unit["qids"]}
    for qid, framework_id in registry["framework_ids"].items():
        assert catalog[framework_id] == section_of[qid]


def test_a_pending_unit_is_absent(make_tree, save_roster):
    root, roster_path = make_tree(["las-b2-003", "las-b19-002"])
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    for row in roster["units"]:
        if row["unit_id"] == "las-b2-003":
            row["approval"] = "pending-owner-ratification"
    save_roster(roster_path, roster)
    built = json.loads(export_qid_registry.build_registry(root, roster_path))
    assert [u["unit_id"] for u in built["units"]] == ["las-b19-002"]
    assert _qids(built) == B19_QIDS
    assert built["roster"]["path"] == "roster.json"
    assert built["explanations"] == [] and built["framework_ids"] == {}


def test_a_refused_export_builds_no_registry(make_tree):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(ExportError, match="sha256"):
        export_qid_registry.build_registry(root, roster_path)


def test_framework_ids_come_from_a_shard_that_passes_the_explanation_gate(b19_tree):
    root, roster_path = b19_tree({"p5-b19.json": _b19_entries()})
    built = json.loads(export_qid_registry.build_registry(root, roster_path))
    assert built["framework_ids"] == {"p5-las-b19-002-r1-LÄS-001": "LAS-TYPE-003",
                                      "p5-las-b19-002-r1-LÄS-002": "LAS-TYPE-001"}
    assert [e["path"] for e in built["explanations"]] == ["data/explanations/p5-b19.json"]


@pytest.mark.parametrize("framework_id", ["ELF-TYPE-001", "LAS-TYPE-999", "LAS-CLOZE-001"])
def test_a_shard_with_an_invalid_framework_id_builds_no_registry(b19_tree, framework_id):
    entries = _b19_entries()
    entries[B19_QIDS[0]]["framework_id"] = framework_id
    root, roster_path = b19_tree({"p5-b19.json": entries})
    with pytest.raises(ExportError, match="framework_id"):
        export_qid_registry.build_registry(root, roster_path)


def test_a_shard_that_does_not_cover_its_units_builds_no_registry(b19_tree):
    entries = _b19_entries()
    del entries[B19_QIDS[1]]
    root, roster_path = b19_tree({"p5-b19.json": entries})
    with pytest.raises(ExportError, match="no explanation"):
        export_qid_registry.build_registry(root, roster_path)


@pytest.mark.parametrize("qid", ["p5-las-b7-002-r1-LÄS-001", "p5-elf-b14-002-r1-ELF-001", "q1"])
def test_a_shard_explaining_a_qid_outside_the_registry_builds_no_registry(b19_tree, qid):
    entries = _b19_entries()
    entries[qid] = entries[B19_QIDS[0]]
    root, roster_path = b19_tree({"p5-b19.json": entries})
    with pytest.raises(ExportError, match="outside the approved registry"):
        export_qid_registry.build_registry(root, roster_path)


def test_two_shards_that_disagree_on_a_framework_id_build_no_registry(b19_tree):
    other = _b19_entries()
    other[B19_QIDS[1]]["framework_id"] = "LAS-TYPE-004"
    root, roster_path = b19_tree({"p5-b19.json": _b19_entries(), "p5-b19-again.json": other})
    with pytest.raises(ExportError, match="disagree"):
        export_qid_registry.build_registry(root, roster_path)


def test_two_shards_that_agree_are_both_bound(b19_tree):
    root, roster_path = b19_tree({"p5-b19.json": _b19_entries(), "p5-b19-again.json": _b19_entries()})
    built = json.loads(export_qid_registry.build_registry(root, roster_path))
    assert [e["path"] for e in built["explanations"]] == ["data/explanations/p5-b19-again.json",
                                                          "data/explanations/p5-b19.json"]
    assert built["framework_id_count"] == 2


def test_a_shard_whose_name_is_not_a_release_builds_no_registry(b19_tree):
    root, roster_path = b19_tree({"p5-B19.json": _b19_entries()})
    with pytest.raises(ExportError, match="release"):
        export_qid_registry.build_registry(root, roster_path)


def test_a_symlinked_shard_builds_no_registry(b19_tree, tmp_path):
    root, roster_path = b19_tree()
    real = tmp_path / "real.json"
    real.write_bytes(export_product.render_json(_b19_entries()))
    (root / export_product.EXPLANATIONS_REL / "p5-b19.json").symlink_to(real)
    with pytest.raises(ExportError, match="symlink"):
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
    assert "118 units / 332 qids / 14 framework ids" in written.stdout
    out.write_bytes(built.replace(b'"p5-las-b19-002-r1-L', b'"p5-las-b19-002-r2-L', 1))
    assert subprocess.run([*run, "--check"], capture_output=True, text=True).returncode == 1


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_committed_registry_checks_clean_under_any_hash_seed(seed):
    env = dict(os.environ, PYTHONHASHSEED=seed)
    done = subprocess.run([sys.executable, SCRIPT, "--check"], capture_output=True, text=True, env=env)
    assert done.returncode == 0, done.stdout + done.stderr

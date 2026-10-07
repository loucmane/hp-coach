"""Approval-roster contract (docs/p5-infold-design.md §2, §4 row 1; bead hpf-535m).

The roster is the export's single source of truth: one row per candidate unit
in batches 1–19, the SHA-256 of its exact bytes, its approval status with the
file:line evidence behind it, its RETIRED.json flag and its exclusion pairs.
It must reproduce the design's census exactly and be regenerable byte for byte.
"""
from __future__ import annotations

import copy
import json
import re
from pathlib import Path

import pytest

import build_roster

REPO_ROOT = build_roster.REPO_ROOT
DESIGN_ROW = re.compile(r"^\| (\d+) \| (\d+) / (\d+) \| (\d+) / (\d+) \| (\d+) / (\d+) \|$")
DESIGN_TOTAL = re.compile(
    r"^\| \*\*Total\*\* \| \*\*(\d+) / (\d+)\*\* \| \*\*(\d+) / (\d+)\*\* \| \*\*(\d+) / (\d+)\*\* \|$")


def _design_table() -> tuple[dict, tuple]:
    rows, total = {}, None
    for line in (REPO_ROOT / build_roster.DESIGN_DOC_REL).read_text(encoding="utf-8").splitlines():
        if m := DESIGN_ROW.match(line):
            n = [int(x) for x in m.groups()]
            rows[n[0]] = {"LÄS": (n[1], n[2]), "ELF": (n[3], n[4]), "retired": (n[5], n[6])}
        elif m := DESIGN_TOTAL.match(line):
            total = tuple(int(x) for x in m.groups())
    return rows, total


def _sum(units) -> tuple[int, int]:
    return len(units), sum(u["question_count"] for u in units)


# ------------------------------------------------------------------ census

def test_census_reproduces_the_design_doc(built_roster):
    rows, total = _design_table()
    assert sorted(rows) == list(range(1, 20)), "design table parse failed"
    assert build_roster.EXPECTED_CENSUS == rows
    census = built_roster["census"]
    got = {b["batch"]: {k: tuple(b[k]) for k in ("LÄS", "ELF", "retired")} for b in census["batches"]}
    assert got == rows
    assert tuple(census["LÄS"]) + tuple(census["ELF"]) + tuple(census["retired"]) == total
    assert tuple(census["retained"]) == (120, 340)
    assert tuple(census["selected"]) == (128, 373)
    assert (tuple(census["LÄS"]), tuple(census["ELF"]), tuple(census["retired"])) == (
        (52, 136), (68, 204), (8, 33))


def test_census_drift_fails_loudly():
    drifted = copy.deepcopy(build_roster.EXPECTED_CENSUS)
    drifted[19]["ELF"] = (4, 12)  # batch19 before elf-b19-004's retirement
    with pytest.raises(build_roster.RosterError, match=r"census.*batch 19"):
        build_roster.build_roster(expected_census=drifted)


def test_one_row_per_selected_candidate_file(built_roster):
    rows = built_roster["units"]
    ids = [u["unit_id"] for u in rows]
    assert len(ids) == len(set(ids)) == 128
    for batch in range(1, 20):
        folder = "candidates" if batch in (18, 19) else "candidates-final"
        files = sorted((REPO_ROOT / f"pipeline/synthetic/batches/batch{batch}/{folder}").glob("*.json"))
        expected = [f"pipeline/synthetic/batches/batch{batch}/{folder}/{f.name}" for f in files]
        assert [u["source"] for u in rows if u["batch"] == batch] == expected


# ------------------------------------------------------- reproducibility

def test_committed_roster_and_summary_are_reproducible(built_roster):
    assert build_roster.ROSTER_PATH.read_text(encoding="utf-8") == build_roster.render_roster_json(built_roster), (
        "approval-roster.json is stale: run pipeline/synthetic/infold/build_roster.py and review the diff")
    assert build_roster.ROSTER_MD_PATH.read_text(encoding="utf-8") == build_roster.render_roster_md(built_roster), (
        "ROSTER.md is stale: run pipeline/synthetic/infold/build_roster.py and review the diff")


def test_check_mode_reports_a_current_roster(capsys):
    assert build_roster.main(["--check"]) == 0


def test_hashes_bind_the_exact_candidate_bytes(committed_roster):
    for unit in committed_roster["units"]:
        raw = (REPO_ROOT / unit["source"]).read_bytes()
        assert unit["sha256"] == build_roster.sha256_bytes(raw), unit["unit_id"]
        assert unit["content_sha256"] == build_roster.content_digest(json.loads(raw)), unit["unit_id"]


def test_content_digest_ignores_internal_metadata_but_not_student_bytes():
    path = REPO_ROOT / "pipeline/synthetic/batches/batch19/candidates/las-b19-002.json"
    unit = json.loads(path.read_text(encoding="utf-8"))
    base = build_roster.content_digest(unit)
    meta_only = copy.deepcopy(unit)
    meta_only["generator_meta"]["note"] = "an internal edit"
    meta_only["questions"][0]["rationale"] += " More."
    assert build_roster.content_digest(meta_only) == base
    for mutate in (lambda u: u.update(passage=u["passage"] + " "),
                   lambda u: u["questions"][0].update(key="A"),
                   lambda u: u["questions"][1]["options"][0].update(text="x"),
                   lambda u: u.update(title=u["title"].upper())):
        changed = copy.deepcopy(unit)
        mutate(changed)
        assert build_roster.content_digest(changed) != base


# ------------------------------------------------------------- approval

def test_approval_statuses_follow_the_recorded_rulings(built_roster):
    retired_ids = set(json.loads((REPO_ROOT / build_roster.RETIRED_REL).read_text(encoding="utf-8"))["retired"])
    units = built_roster["units"]
    approved = [u for u in units if u["approval"] == "approved"]
    pending = [u for u in units if u["approval"] == "pending-owner-ratification"]
    retired = [u for u in units if u["approval"] == "retired"]
    assert len(approved) + len(pending) + len(retired) == len(units)
    assert {u["unit_id"] for u in retired} == retired_ids
    assert all(u["retired"] for u in retired) and not any(u["retired"] for u in approved + pending)
    assert {u["batch"] for u in approved} == set(range(14, 20))
    assert {u["batch"] for u in pending} == set(range(1, 14))
    assert _sum(approved) == (39, 121)
    assert _sum(pending) == (81, 219)
    assert _sum(retired) == (8, 33)
    # Retirement wins over the batch14 ruling text that lists elf-b14-002 as approved.
    b14 = next(u for u in units if u["unit_id"] == "elf-b14-002")
    assert b14["approval"] == "retired"
    assert any("ADJUDICATION.md" in e["ref"] for e in b14["evidence"])


def test_every_evidence_reference_resolves_to_the_quoted_line(built_roster):
    for unit in built_roster["units"]:
        assert unit["evidence"], unit["unit_id"]
        for item in unit["evidence"]:
            path, _, line = item["ref"].rpartition(":")
            lines = (REPO_ROOT / path).read_text(encoding="utf-8").splitlines()
            assert 1 <= int(line) <= len(lines), item["ref"]
            assert item["quote"] in lines[int(line) - 1], item["ref"]


def test_evidence_kinds_match_the_approval(built_roster):
    for unit in built_roster["units"]:
        refs = [e["ref"] for e in unit["evidence"]]
        if unit["approval"] == "approved":
            batch_dir = f"pipeline/synthetic/batches/batch{unit['batch']}/"
            assert any(r.startswith(batch_dir) for r in refs), unit["unit_id"]
        elif unit["approval"] == "pending-owner-ratification":
            assert any(r.startswith("pipeline/synthetic/ADJUDICATION-MASTER.md:") for r in refs), unit["unit_id"]
            assert any(r.startswith(f"pipeline/synthetic/batches/batch{unit['batch']}/") for r in refs)
        else:
            assert any(r.startswith(build_roster.RETIRED_REL + ":") for r in refs), unit["unit_id"]


def test_exclusion_pairs_are_recorded_symmetrically(built_roster):
    pairs = {tuple(p["units"]) for p in built_roster["exclusion_pairs"]}
    assert pairs == {("las-b18-001", "las-b19-001"), ("elf-b3-002", "las-b3-002")}
    by_id = {u["unit_id"]: u for u in built_roster["units"]}
    for a, b in pairs:
        assert by_id[a]["exclusion_pairs"] == [b] and by_id[b]["exclusion_pairs"] == [a]
    for pair in built_roster["exclusion_pairs"]:
        assert pair["rule"] and pair["evidence"]


# ------------------------------------------------------------ revisions

def test_changed_student_content_requires_a_revision_bump(committed_roster):
    previous = copy.deepcopy(committed_roster)
    previous["units"][5]["content_sha256"] = "0" * 64
    with pytest.raises(build_roster.RosterError, match="bump"):
        build_roster.check_revision_continuity(previous, committed_roster)


def test_metadata_only_change_keeps_the_revision(committed_roster):
    previous = copy.deepcopy(committed_roster)
    previous["units"][5]["sha256"] = "0" * 64
    build_roster.check_revision_continuity(previous, committed_roster)


def test_revisions_never_go_backwards(committed_roster):
    previous = copy.deepcopy(committed_roster)
    previous["units"][5]["revision"] = 2
    with pytest.raises(build_roster.RosterError, match="revision"):
        build_roster.check_revision_continuity(previous, committed_roster)


def test_a_bumped_revision_does_not_inherit_the_old_approval():
    roster = build_roster.build_roster(revisions={"las-b19-002": 2})
    unit = next(u for u in roster["units"] if u["unit_id"] == "las-b19-002")
    assert unit["revision"] == 2
    assert unit["approval"] == "pending-owner-ratification"


@pytest.mark.parametrize("revision", [0, -1, True, 1.0, "2", None, {"r": 2}, 100], ids=repr)
def test_a_malformed_revision_fails_the_build(revision):
    with pytest.raises(build_roster.RosterError, match="revision"):
        build_roster.build_roster(revisions={"las-b19-002": revision})


@pytest.mark.parametrize("revision", [True, 0, "1", {"r": 1}], ids=repr)
def test_revision_continuity_refuses_a_malformed_revision(committed_roster, revision):
    previous = copy.deepcopy(committed_roster)
    previous["units"][5]["revision"] = revision
    with pytest.raises(build_roster.RosterError, match="revision"):
        build_roster.check_revision_continuity(previous, committed_roster)

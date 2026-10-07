"""Approval-roster contract (docs/p5-infold-design.md §2, §4 row 1; beads hpf-535m, hpf-jsnf).

The roster is the export's single source of truth: one row per candidate unit
in batches 1–19, the SHA-256 of its exact bytes, its approval status with the
file:line evidence behind it, its RETIRED.json flag and its exclusion pairs.
It must reproduce the design's census exactly and be regenerable byte for byte.
Batches 1–13 are approved through the owner's ratification record of
2026-10-07, which pins each unit's revision and student-facing content.
"""
from __future__ import annotations

import copy
import json
import re
from collections import Counter
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
    # Batches 14–19 by owner rulings, batches 1–13 by the owner's ratification of 2026-10-07.
    assert {u["batch"] for u in approved} == set(range(1, 20))
    assert pending == []
    assert _sum(approved) == (120, 340)
    assert _sum([u for u in approved if u["batch"] >= 14]) == (39, 121)
    assert _sum([u for u in approved if u["batch"] <= 13]) == (81, 219)
    assert _sum(retired) == (8, 33)
    assert all((u["ratified_by"] == "owner 2026-10-07") == (u["batch"] <= 13) for u in approved)
    assert all(u["ratified_by"] is None and u["ratification_note"] is None for u in retired)
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
            if unit["batch"] <= 13:  # shipped record, master row, re-audit row and ratification entry
                for source in (build_roster.MASTER_REL, build_roster.AUDIT_REL, build_roster.RATIFICATION_REL):
                    assert any(r.startswith(source + ":") for r in refs), (unit["unit_id"], source)
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
    roster = build_roster.build_roster(revisions={**build_roster.REVISIONS, "las-b19-002": 2})
    unit = next(u for u in roster["units"] if u["unit_id"] == "las-b19-002")
    assert unit["revision"] == 2
    assert unit["approval"] == "pending-owner-ratification"


@pytest.mark.parametrize("revision", [0, -1, True, 1.0, "2", None, {"r": 2}, 100], ids=repr)
def test_a_malformed_revision_fails_the_build(revision):
    with pytest.raises(build_roster.RosterError, match="las-b19-002: revision"):
        build_roster.build_roster(revisions={**build_roster.REVISIONS, "las-b19-002": revision})


@pytest.mark.parametrize("revision", [True, 0, "1", {"r": 1}], ids=repr)
def test_revision_continuity_refuses_a_malformed_revision(committed_roster, revision):
    previous = copy.deepcopy(committed_roster)
    previous["units"][5]["revision"] = revision
    with pytest.raises(build_roster.RosterError, match="revision"):
        build_roster.check_revision_continuity(previous, committed_roster)


# --------------------------------------------------------- ratification

@pytest.fixture
def record() -> dict:
    return build_roster.load_ratification(REPO_ROOT)


def _entry(record: dict, unit_id: str) -> dict:
    return next(e for e in record["units"] if e["unit_id"] == unit_id)


def _changed(record: dict, edit) -> dict:
    changed = copy.deepcopy(record)
    edit(changed)
    return changed


def test_the_ratification_covers_every_kept_legacy_unit(built_roster, record):
    legacy = [u for u in built_roster["units"] if u["batch"] <= 13 and not u["retired"]]
    assert _sum(legacy) == (81, 219)
    assert [e["unit_id"] for e in record["units"]] == [u["unit_id"] for u in legacy]  # roster order
    # AUDIT-batches-1-13.md: 48 pass, 32 ratify-with-note (two conditional), one fix.
    assert Counter(e["recommendation"] for e in record["units"]) == {"ratify": 48, "ratify-with-note": 32, "fix": 1}
    assert built_roster["ratification"]["recommendations"]["fix"] == ["las-b7-002"]
    for unit in legacy:
        entry = _entry(record, unit["unit_id"])
        assert unit["approval"] == "approved" and unit["ratified_by"] == record["ratified_by"]
        assert (entry["revision"], entry["content_sha256"]) == (unit["revision"], unit["content_sha256"])
        assert unit["ratification_note"] == entry["note"]
        assert entry["note"] or entry["recommendation"] == "ratify", unit["unit_id"]
    for uid in ("las-b4-002", "las-b6-003"):  # the re-audit's two conditions, both met
        assert _entry(record, uid)["note"].startswith("Conditional ratify-with-note; condition met.")


def test_the_one_fix_is_ratified_at_its_new_revision(built_roster):
    assert build_roster.REVISIONS == {"las-b7-002": 2}
    unit = next(u for u in built_roster["units"] if u["unit_id"] == "las-b7-002")
    assert (unit["revision"], unit["approval"]) == (2, "approved")
    assert any(e["ref"].startswith("pipeline/synthetic/batches/batch7/ADJUDICATION.md:") for e in unit["evidence"])
    candidate = json.loads((REPO_ROOT / unit["source"]).read_text(encoding="utf-8"))
    student = [candidate["title"], candidate["passage"]] + [
        text for q in candidate["questions"] for text in [q["prompt"], *(o["text"] for o in q["options"])]]
    assert not any("Sundqvist" in text for text in student)  # law 13: las-b4-002's Ellen Sundqvist
    assert "Frida Ullbrink" in candidate["passage"] and "Frida Ullbrinks" in candidate["questions"][0]["prompt"]


def test_a_later_revision_is_pending_until_a_ruling_covers_it():
    roster = build_roster.build_roster(revisions={**build_roster.REVISIONS, "las-b2-003": 2})
    unit = next(u for u in roster["units"] if u["unit_id"] == "las-b2-003")
    assert (unit["revision"], unit["approval"], unit["ratified_by"]) == (2, "pending-owner-ratification", None)
    assert unit["approval_basis"] == "revision 2: no ruling recorded for this revision"


def test_a_record_ahead_of_the_unit_fails_the_build():
    with pytest.raises(build_roster.RosterError, match="las-b7-002: ratified at r2, but the unit is r1"):
        build_roster.build_roster(revisions={})


def test_retirement_wins_over_a_ratification(record):
    source = REPO_ROOT / "pipeline/synthetic/batches/batch6/candidates-final/elf-b6-001.json"
    digest = build_roster.content_digest(json.loads(source.read_text(encoding="utf-8")))
    entry = {"unit_id": "elf-b6-001", "revision": 1, "content_sha256": digest, "recommendation": "ratify",
             "note": None}
    roster = build_roster.build_roster(ratification=_changed(record, lambda r: r["units"].append(entry)))
    unit = next(u for u in roster["units"] if u["unit_id"] == "elf-b6-001")
    assert (unit["approval"], unit["ratified_by"]) == ("retired", None)


B19_ENTRY = {"unit_id": "las-b19-002", "revision": 1, "content_sha256": "0" * 64, "recommendation": "ratify",
             "note": None}


@pytest.mark.parametrize("edit,match", [
    (lambda r: r.update(format="p5-ratification-v0"), "format 'p5-ratification-v0' is not"),
    (lambda r: r.pop("ruling"), r"fields \['format'"),
    (lambda r: r.update(approved_by="owner"), r"fields \['format'"),
    (lambda r: r.update(ratified_by=" "), "ratified_by must be a non-empty string"),
    (lambda r: r.update(audit="pipeline/synthetic/infold/OTHER.md"), "audit 'pipeline/synthetic/infold/OTHER.md'"),
    (lambda r: r.update(audited_roster_sha256="9ccfe9a4"), "audited_roster_sha256 is not"),
    (lambda r: r.update(units=[]), "units must be a non-empty array"),
    (lambda r: r["units"].append(dict(r["units"][0])), "elf-b1-001: listed twice"),
    (lambda r: r["units"][0].update(unit_id="las-b99-001"), "not a selected candidate"),
    (lambda r: r["units"].append(dict(B19_ENTRY)), "las-b19-002: batch 19"),
    (lambda r: r["units"][0].update(content_sha256="0" * 64), "changed content needs a new revision"),
    (lambda r: r["units"][0].update(content_sha256="sha256"), "not a SHA-256"),
    (lambda r: r["units"][0].update(revision=2), "ratified at r2, but the unit is r1"),
    (lambda r: r["units"][0].update(revision=True), "elf-b1-001: revision True"),
    (lambda r: r["units"][0].update(recommendation="approve"), "recommendation 'approve'"),
    (lambda r: r["units"][0].update(note=None), "elf-b1-001: a ratify-with-note entry needs a note"),
    (lambda r: r["units"][4].update(note=" "), "las-b1-001: note must be"),
    (lambda r: r["units"][0].pop("note"), r"units\[0\]: fields must be"),
])
def test_a_bad_ratification_record_fails_the_build(record, edit, match):
    with pytest.raises(build_roster.RosterError, match=match):
        build_roster.build_roster(ratification=_changed(record, edit))

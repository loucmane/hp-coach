"""PR #370 fix round 1 (bead hpf-qo10): repair supersession in the verdict
merge and block/sentence scoping of assembly "disposition owed" markers.

Red-first: every test in this file failed on head 0294fd9 (evidence in
docs/worklog/hpf-qo10.md).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from aggregate import aggregate  # noqa: E402
from merge_verdicts import MergeContractError, merge  # noqa: E402

CID = "elf-b99-001"
CAND = {CID: {"candidate_id": CID, "section": "ELF", "questions": [{"q_index": 1}]}}


def _rec(gate, target, *, vote=None, verdict="pass", by=None, just=None, run=None, cid=CID):
    d = {"candidate_id": cid, "gate": gate, "target": target, "verdict": verdict,
         "findings": [], "executed_by": by or f"model/{gate}"}
    if just is not None:
        d["justification"] = just
    if vote is not None:
        d["vote"] = vote
    if run is not None:
        d["run"] = run
    return d


def _write(tmp_path, name, records):
    p = tmp_path / name
    p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records),
                 encoding="utf-8")
    return p


def _complete_unit():
    """Every record aggregate.py requires for a one-question ELF unit, all pass."""
    recs = [_rec(g, "passage") for g in ("M-SCHEMA", "M-BANDS", "M-PLAGIARISM", "G-REGISTER")]
    recs += [_rec("G-ENG", "passage", vote=n, by=f"model/G-ENG-{n}") for n in (1, 2, 3)]
    recs += [_rec("G-KEY", "q:1", vote=n, by=f"model/G-KEY-{n}") for n in (1, 2)]
    recs += [_rec("G-STEM", "q:1"), _rec("G-DISTRACTOR", "q:1")]
    return recs


def _status(records):
    return aggregate(records, CAND)[CID]["status"]


def _counts(stats):
    """The merge accounting as (superseded, duplicates, twins)."""
    return tuple(getattr(stats, k, None) for k in ("superseded", "duplicates", "twins"))


def _run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                          capture_output=True, text=True)


# ------------------------------------------------- merge: repair supersession
def test_repair_supersedes_obsolete_kill_despite_new_executor_and_justification(tmp_path):
    base = [r for r in _complete_unit() if not (r["gate"] == "G-KEY" and r.get("vote") == 1)]
    base.append(_rec("G-KEY", "q:1", vote=1, verdict="kill", by="worker/a",
                     just="solver committed to B; key is A"))
    regate = [_rec("G-KEY", "q:1", vote=1, by="worker/b",
                   just="re-solved on the repaired sheet: A")]
    records, stats = merge([_write(tmp_path, "verdicts.jsonl", base),
                            _write(tmp_path, "regate.jsonl", regate)])
    gkey1 = [(r["verdict"], r["executed_by"]) for r in records
             if r["gate"] == "G-KEY" and r.get("vote") == 1]
    assert gkey1 == [("pass", "worker/b")]
    assert _status(records) == "SURVIVED_CLEAN"
    assert _counts(stats) == (1, 0, 0)


def test_superseding_record_takes_the_superseded_slot(tmp_path):
    base = _write(tmp_path, "base.jsonl", [
        _rec("G-STEM", "q:1"),
        _rec("G-STEM", "q:2", verdict="kill", by="model/G-STEM-r1"),
        _rec("G-STEM", "q:3")])
    regate = _write(tmp_path, "regate.jsonl", [_rec("G-STEM", "q:2", by="model/G-STEM-r2")])
    records, _ = merge([base, regate])
    assert [(r["target"], r["executed_by"]) for r in records] == [
        ("q:1", "model/G-STEM"), ("q:2", "model/G-STEM-r2"), ("q:3", "model/G-STEM")]


def test_twin_collapse_still_holds_under_repair_supersession(tmp_path):
    base = _write(tmp_path, "verdicts.jsonl", [
        _rec("G-KEY", "q:1", vote=2, verdict="kill", by="model/G-KEY-2")])
    leg = _rec("G-KEY", "q:1", by="model/G-KEY", just="re-solved after the repair: A")
    raw = _write(tmp_path, "gkey-2.jsonl", [leg])                  # unstamped leg
    stamped = _write(tmp_path, "gkey-2v.jsonl", [dict(leg, vote=2)])  # same leg, vote applied
    for order in ([base, raw, stamped], [base, stamped, raw]):
        records, stats = merge(order)
        assert records == [dict(leg, vote=2)]
        assert _counts(stats) == (1, 0, 1)


def test_later_run_set_supersedes_earlier_run_set(tmp_path):
    # batch17 shape: the second ägardom round re-ran G-SPRAK x3 on the unit
    first = _write(tmp_path, "agardom.jsonl", [
        _rec("G-SPRAK", "unit", run=n, verdict="flag", by="claude-opus-5/G-SPRAK")
        for n in (1, 2, 3)])
    second = _write(tmp_path, "agardom2.jsonl", [
        _rec("G-SPRAK", "unit", run=n, by="claude-fable-5/G-SPRAK") for n in (1, 2, 3)])
    records, stats = merge([first, second])
    assert [(r["run"], r["verdict"], r["executed_by"]) for r in records] == [
        (n, "pass", "claude-fable-5/G-SPRAK") for n in (1, 2, 3)]
    assert _counts(stats) == (3, 0, 0)


def test_rerun_sets_replace_in_place_keeping_interleaving(tmp_path):
    # batch16 verdicts.jsonl:152-157 shape: two units' unit-level runs interleave
    def run_rec(cid, n, verdict, by):
        return _rec("G-SPRAK", "unit", run=n, verdict=verdict, by=by, cid=cid)
    base = _write(tmp_path, "verdicts.jsonl", [
        _rec("G-STEM", "q:1"),
        run_rec("las-b99-001", 1, "flag", "m/old"), run_rec("las-b99-002", 1, "flag", "m/old"),
        run_rec("las-b99-001", 2, "flag", "m/old"), run_rec("las-b99-002", 2, "flag", "m/old"),
        _rec("G-DISTRACTOR", "q:1")])
    regate = _write(tmp_path, "regate.jsonl", [
        run_rec("las-b99-001", 1, "pass", "m/new"), run_rec("las-b99-001", 2, "pass", "m/new"),
        run_rec("las-b99-002", 1, "pass", "m/new"), run_rec("las-b99-002", 2, "pass", "m/new")])
    records, stats = merge([base, regate])
    assert [(r["candidate_id"], r.get("run"), r["executed_by"]) for r in records] == [
        (CID, None, "model/G-STEM"),
        ("las-b99-001", 1, "m/new"), ("las-b99-002", 1, "m/new"),
        ("las-b99-001", 2, "m/new"), ("las-b99-002", 2, "m/new"),
        (CID, None, "model/G-DISTRACTOR")]
    assert _counts(stats) == (4, 0, 0)


def test_identical_regate_is_counted_as_duplicate_not_superseded(tmp_path):
    rec = _rec("G-KEY", "q:1", vote=1, by="worker/b", just="A")
    records, stats = merge([_write(tmp_path, "a.jsonl", [rec]),
                            _write(tmp_path, "b.jsonl", [rec])])
    assert records == [rec]
    assert _counts(stats) == (0, 1, 0)


def test_cli_summary_reports_superseded_apart_from_duplicates(tmp_path):
    base = _write(tmp_path, "base.jsonl", [
        _rec("G-KEY", "q:1", vote=1, verdict="kill", by="worker/a", just="old"),
        _rec("G-STEM", "q:1")])
    regate = _write(tmp_path, "regate.jsonl", [
        _rec("G-KEY", "q:1", vote=1, by="worker/b", just="new"),
        _rec("G-STEM", "q:1")])                     # byte-identical: a no-op
    out = tmp_path / "merged.jsonl"
    r = _run("merge_verdicts.py", base, regate, "--out", out)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "1 superseded" in r.stdout
    assert "1 exact duplicate" in r.stdout
    assert "0 unstamped twin" in r.stdout


# ------------------------------------------------- merge: same-file collisions
def test_same_file_unnumbered_collision_fails_closed(tmp_path):
    # two G-KEY legs without vote stamps in one file: indistinguishable from an
    # appended re-gate, so neither "keep both" nor "last wins" is safe
    legs = _write(tmp_path, "gkey-resolved.jsonl", [
        _rec("G-KEY", "q:1", by="model/G-KEY", just="leg 1: A"),
        _rec("G-KEY", "q:1", by="model/G-KEY", just="leg 2: A")])
    with pytest.raises(MergeContractError, match="same file"):
        merge([legs])


def test_same_file_appended_regate_fails_closed_and_split_files_supersede(tmp_path):
    kill = _rec("G-REGISTER", "passage", verdict="kill", by="model/G-REGISTER")
    regate = _rec("G-REGISTER", "passage", by="model/G-REGISTER-regate0724")
    with pytest.raises(MergeContractError, match="same file"):
        merge([_write(tmp_path, "gregister.jsonl", [kill, regate])])
    records, _ = merge([_write(tmp_path, "gregister-r1.jsonl", [kill]),
                        _write(tmp_path, "gregister-r2.jsonl", [regate])])
    assert records == [regate]


@pytest.mark.parametrize("runs", [(1, 1), (1, None), (None, None)])
def test_same_file_collision_needs_distinct_run_numbers(tmp_path, runs):
    f = _write(tmp_path, "gsprak.jsonl", [
        _rec("G-SPRAK", "unit", run=runs[0], by="model/a"),
        _rec("G-SPRAK", "unit", run=runs[1], by="model/b")])
    with pytest.raises(MergeContractError, match="same file"):
        merge([f])


def test_same_file_unstamped_legs_resolved_by_their_stamped_twins(tmp_path):
    # the same two-leg file is fine once the vote-stamped copies are merged too
    leg1 = _rec("G-KEY", "q:1", by="model/G-KEY", just="leg 1: A")
    leg2 = _rec("G-KEY", "q:1", by="model/G-KEY", just="leg 2: A")
    raw = _write(tmp_path, "gkey-resolved.jsonl", [leg1, leg2])
    stamped = _write(tmp_path, "gkey-resolved-v.jsonl", [dict(leg1, vote=1), dict(leg2, vote=2)])
    records, stats = merge([raw, stamped])
    assert records == [dict(leg1, vote=1), dict(leg2, vote=2)]
    assert _counts(stats) == (0, 0, 2)


def test_merge_rejects_non_integer_run(tmp_path):
    for run in ("1", 0, True):
        bad = _write(tmp_path, "bad.jsonl", [_rec("G-SPRAK", "unit", run=run)])
        with pytest.raises(MergeContractError):
            merge([bad])


# ------------------------------------------- assembly: marker attribution scope
def _asm(tmp_path, text, verdicts=()):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text(text, encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text("".join(json.dumps(v) + "\n" for v in verdicts), encoding="utf-8")
    return _run("check_assembly_dispositions.py", asm, vf)


def _disposed(unit):
    return {"candidate_id": unit, "gate": "G-REGISTER", "verdict": "pass", "findings": [],
            "disposition": "different roles, different batches, no same-test collision"}


def _owed(stdout):
    return [line for line in stdout.splitlines() if line.startswith("DISPOSITION-OWED")]


def test_marker_item_without_unit_is_not_lent_a_sibling_unit(tmp_path):
    r = _asm(tmp_path,
             "- elf-b16-003's generator rejected the surname on a live collision.\n"
             "- Cross-batch cloze echo vs the batch15 noticeboard, disposition owed.\n"
             "- elf-b16-004 is clean.\n")
    assert r.returncode == 1
    owed = _owed(r.stdout)
    assert len(owed) == 1 and owed[0].startswith("DISPOSITION-OWED <no unit named>")


def test_marker_unit_on_wrapped_continuation_line_is_attributed(tmp_path):
    # batch16 ASSEMBLY.md:26-34 shape: a sibling item two lines up names
    # another unit; the marker's own item names its units on wrapped lines
    text = ("- elf-b16-003's generator rejected the surname on a live collision.\n"
            "- **Cross-batch near-pair (register echo, disposition owed, no rename)**:\n"
            "  batch15's elf-b15-002 now ships *Verity Quennerby* (post-approval\n"
            "  law-16 rename), one letter apart from the surname that\n"
            "  elf-b16-001 ships, both invented.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b15-002"), _disposed("elf-b16-001")])
    assert r.returncode == 0, r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b15-002")])
    assert r2.returncode == 1
    assert [o.split(":")[0] for o in _owed(r2.stdout)] == ["DISPOSITION-OWED elf-b16-001"]


def test_marker_not_attributed_to_following_item(tmp_path):
    text = ("2. Also cross-batch: landmark-directions cloze vs batch15 noticeboard\n"
            "   (both village-communication; disposition owed).\n"
            "3. **Declared shortfalls (elf-b16-003)**: fk_grade 8.7 vs blueprint 11.0.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1
    owed = _owed(r.stdout)
    assert len(owed) == 1 and owed[0].startswith("DISPOSITION-OWED <no unit named>")


# batch16 ASSEMBLY.md:46-51, verbatim: one list item carrying two obligations
BATCH16_ITEM2 = (
    "2. **Same-batch material adjacency**: las-b16-001 (brickworks history, SV)\n"
    "   and elf-b16-003 (cavity-wall drainage physics, EN) — disjoint mechanism,\n"
    "   cross-language; one written disposition owed per the 2026-08-26 process\n"
    "   rule. Also cross-batch: landmark-directions cloze vs batch15 noticeboard\n"
    "   (both village-communication—distinct mechanism; disposition owed).\n"
    "3. **Declared shortfalls (elf-b16-003)**: fk_grade 8.7 vs blueprint 11.0–15.0\n")


def test_unnamed_second_obligation_is_not_masked_by_the_named_first(tmp_path):
    r = _asm(tmp_path, BATCH16_ITEM2, [_disposed("las-b16-001"), _disposed("elf-b16-003")])
    assert r.returncode == 1
    owed = _owed(r.stdout)
    assert len(owed) == 1 and owed[0].startswith("DISPOSITION-OWED <no unit named>")
    assert "line 5" in owed[0]


def test_named_first_obligation_still_requires_its_units(tmp_path):
    r = _asm(tmp_path, BATCH16_ITEM2)
    assert r.returncode == 1
    assert [o.split(":")[0] for o in _owed(r.stdout)] == [
        "DISPOSITION-OWED las-b16-001", "DISPOSITION-OWED elf-b16-003",
        "DISPOSITION-OWED <no unit named>"]


def test_marker_scope_stops_at_heading_and_blank_line(tmp_path):
    text = ("## elf-b16-001 notes\n"
            "Cross-batch echo with the batch15 cloze, disposition owed.\n"
            "\n"
            "elf-b16-002 is clean.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b16-002")])
    assert r.returncode == 1
    owed = _owed(r.stdout)
    assert len(owed) == 1 and owed[0].startswith("DISPOSITION-OWED <no unit named>")


def test_marker_wrapped_inside_list_item_keeps_its_line_and_scope(tmp_path):
    text = ("- elf-b16-003 is clean.\n"
            "- Name proximity with the batch15 cloze, disposition\n"
            "  owed: elf-b16-001 vs elf-b15-002.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b15-002")])
    assert r.returncode == 1
    owed = _owed(r.stdout)
    assert [o.split(": line")[0] for o in owed] == ["DISPOSITION-OWED elf-b16-001"]
    assert "line 2:" in owed[0]


def test_unit_beyond_the_old_two_line_window_is_attributed(tmp_path):
    text = ("- Cross-batch near-pair (register echo, disposition owed): the batch15\n"
            "  unit that now ships the post-approval rename, one letter away from\n"
            "  the surname this batch's long unit carries, both invented, bank\n"
            "  precedent tolerating closer pairs, namely elf-b15-002 versus\n"
            "  elf-b16-001.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b15-002"), _disposed("elf-b16-001")])
    assert r.returncode == 0, r.stdout

"""Layer-2 explanations for every exported P5 question, in batches
(docs/p5-infold-design.md §4 row 2b and §D; beads hpf-c5tb, hpf-c5tb.1 and
hpf-c5tb.4).

explanation_batches.py keeps the 332 eligible questions in pinned batches
(BATCHES.json): the Layer-2 pilot is batch x0-pilot, LÄS x1–x3 and ELF x4–x7,
each holding the units of the initial cut less those retired since. No unit
ever moves between batches, and a new unit waits for an explicit assignment.
A batch file holds one reviewed entry per qid of its batch, in the shard's
entry format and canonical bytes. The batch check runs every explanation gate
of export_product on one batch file against exactly that batch's qids. The
assembler combines the pilot and every batch into the release shard
data/explanations/p5-<release>.json and refuses duplicates, gaps, any gate
failure and a partial set; a partial set is only ever validated, never written.
"""
from __future__ import annotations

import copy
import json
import os
import re
import shutil
import subprocess
import sys

import pytest

import build_roster
import explanation_batches as batches
import export_product

REPO_ROOT = build_roster.REPO_ROOT
ROSTER = build_roster.ROSTER_PATH
ExportError = export_product.ExportError
PILOT = export_product.PILOT_UNITS
PILOT_REL = "data/explanations/p5-pilot.json"
X1_REL = "pipeline/synthetic/infold/explanations/x1-las.json"
X1_FILE = REPO_ROOT / X1_REL
SCRIPT = build_roster.INFOLD_DIR / "explanation_batches.py"
LINTER = REPO_ROOT / "pipeline/synthetic/gates/scripts/lint_learner_output.py"
# The pinned partition (bead hpf-c5tb.4): the initial cut of bead hpf-c5tb.1
# less las-b3-001 and las-b5-001, which the owner retired from x1 on
# 2026-10-08 (bead hpf-c5tb.2). Batch, first unit, last unit, units, questions.
EXPECTED_TABLE = [
    ("x0-pilot", "las-b7-002", "las-b19-002", 6, 19),
    ("x1", "las-b1-001", "las-b8-002", 16, 36),
    ("x2", "las-b8-003", "las-b14-001", 16, 42),
    ("x3", "las-b14-003", "las-b19-003", 15, 42),
    ("x4", "elf-b1-001", "elf-b5-002", 16, 52),
    ("x5", "elf-b5-003", "elf-b10-002", 17, 45),
    ("x6", "elf-b10-003", "elf-b14-003", 16, 48),
    ("x7", "elf-b15-001", "elf-b19-002", 16, 48),
]
# The initial cut, the provenance of the pin: the rule of bead hpf-c5tb.1 on
# the roster at 1cbbb84 (120 units / 340 questions), which still held the
# units retired since.
INITIAL_TABLE = [
    ("x0-pilot", "las-b7-002", "las-b19-002", 6, 19),
    ("x1", "las-b1-001", "las-b8-002", 18, 44),
    ("x2", "las-b8-003", "las-b14-001", 16, 42),
    ("x3", "las-b14-003", "las-b19-003", 15, 42),
    ("x4", "elf-b1-001", "elf-b5-002", 16, 52),
    ("x5", "elf-b5-003", "elf-b10-002", 17, 45),
    ("x6", "elf-b10-003", "elf-b14-003", 16, 48),
    ("x7", "elf-b15-001", "elf-b19-002", 16, 48),
]
RETIRED_SINCE_THE_CUT = ("las-b3-001", "las-b5-001")
# A sentence of a pilot unit's rationale (las-b19-002 question 1), not student text.
PILOT_RATIONALE_SENTENCE = "Den uttalade alternativa finansieringen är driftsbudgeten."


def _entry(manifest: dict, name: str) -> dict:
    return next(b for b in manifest["batches"] if b["batch"] == name)


def _subset(manifest: dict, *names: str) -> dict:
    """The manifest with only the named batches."""
    return dict(manifest, batches=[b for b in manifest["batches"] if b["batch"] in names])


def _x1() -> dict:
    return json.loads(X1_FILE.read_text(encoding="utf-8"))


def _pilot() -> dict:
    return json.loads((REPO_ROOT / PILOT_REL).read_text(encoding="utf-8"))


def _first_edited(edit) -> dict:
    shard = _x1()
    edit(shard[next(iter(shard))])
    return shard


@pytest.fixture(scope="module")
def manifest() -> dict:
    return batches.build_manifest()


@pytest.fixture(scope="module")
def approved_rows() -> list[dict]:
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="preview")
    return json.loads(files["p5-bank-preview.json"])["questions"]


@pytest.fixture(scope="module")
def x1_rows(manifest) -> list[dict]:
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="x1", units=_entry(manifest, "x1")["units"])
    return json.loads(files["p5-bank-x1.json"])["questions"]


@pytest.fixture
def batch_tree(make_tree, manifest):
    """A throwaway repo root with the pilot and X1 units, the pilot shard and an
    X1 batch file: the committed one, the given entries rendered the way the
    exporter renders them, or raw bytes. Its roster holds only those units, so
    there the pilot and X1 are every eligible question."""

    def _make(shard=None, *, raw=None):
        root, roster_path = make_tree(list(PILOT) + _entry(manifest, "x1")["units"])
        pilot = root / PILOT_REL
        pilot.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(REPO_ROOT / PILOT_REL, pilot)
        target = root / X1_REL
        target.parent.mkdir(parents=True, exist_ok=True)
        if raw is None:
            raw = export_product.render_json(_x1() if shard is None else shard)
        target.write_bytes(raw)
        return root, roster_path, target

    return _make


def _check_x1(root, roster_path, manifest):
    return batches.check_batch(root, roster_path, manifest, "x1")


# ------------------------------------------------------------- the partition

def _table(manifest: dict) -> list[tuple]:
    return [(b["batch"], b["first"], b["last"], b["unit_count"], b["question_count"]) for b in manifest["batches"]]


def test_the_partition_reproduces_the_expected_table(manifest):
    assert _table(manifest) == EXPECTED_TABLE
    assert manifest["eligible"] == {"units": 118, "questions": 332}
    assert sum(b["question_count"] for b in manifest["batches"][1:]) == 313
    for b in manifest["batches"]:
        assert b["unit_count"] == len(b["units"]) and b["question_count"] == len(b["qids"]), b["batch"]
        assert (b["first"], b["last"]) == (b["units"][0], b["units"][-1]), b["batch"]


def test_the_committed_manifest_is_the_pinned_partition_on_the_roster(manifest):
    assert batches.MANIFEST_PATH.read_bytes() == export_product.render_json(manifest)
    assert batches.main(["--check"]) == 0


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_manifest_is_reproduced_in_another_process(seed):
    done = subprocess.run([sys.executable, str(SCRIPT), "--check"], env={**os.environ, "PYTHONHASHSEED": seed},
                          capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr


def test_every_eligible_qid_is_in_exactly_one_batch(manifest, approved_rows):
    qids = [q for b in manifest["batches"] for q in b["qids"]]
    assert len(qids) == len(set(qids)) == 332
    assert sorted(qids) == sorted(row["qid"] for row in approved_rows)
    units = [u for b in manifest["batches"] for u in b["units"]]
    assert len(units) == len(set(units)) == 118


def test_each_batch_records_the_qids_its_units_export(manifest, approved_rows):
    by_unit: dict[str, list[str]] = {}
    for row in approved_rows:
        by_unit.setdefault(row["unit_id"], []).append(row["qid"])
    for b in manifest["batches"]:
        assert b["qids"] == [q for u in b["units"] for q in by_unit[u]], b["batch"]
    pilot = _entry(manifest, "x0-pilot")
    assert pilot["units"] == list(PILOT) and pilot["file"] == PILOT_REL
    assert pilot["qids"] == list(_pilot())


def test_each_section_is_held_in_order_by_contiguous_batches(manifest, committed_roster):
    # Retirement only removes units, so the initial cut's chunks stay
    # contiguous. Its boundary rule held on the roster it cut, and is checked
    # there (test_the_initial_cut_is_its_rule_on_the_roster_at_1cbbb84).
    def order(unit_id):
        return int(unit_id.split("-")[1][1:]), unit_id

    eligible = [u for u in committed_roster["units"] if u["approval"] == "approved" and not u["retired"]]
    for section, names, suffix in (("LÄS", ("x1", "x2", "x3"), "las"), ("ELF", ("x4", "x5", "x6", "x7"), "elf")):
        rest = sorted((u["unit_id"] for u in eligible if u["section"] == section and u["unit_id"] not in PILOT),
                      key=order)
        chunks = [_entry(manifest, name) for name in names]
        assert [u for chunk in chunks for u in chunk["units"]] == rest
        for chunk in chunks:
            assert chunk["sections"] == [section], chunk["batch"]
            assert chunk["file"] == f"pipeline/synthetic/infold/explanations/{chunk['batch']}-{suffix}.json"


def _eligible_at_the_cut(roster: dict) -> list[dict]:
    """The eligible units of the roster at 1cbbb84, in roster order: today's,
    and the units retired since the initial cut."""
    return [u for u in roster["units"]
            if (u["approval"] == "approved" and not u["retired"]) or u["unit_id"] in RETIRED_SINCE_THE_CUT]


def test_the_initial_cut_is_its_rule_on_the_roster_at_1cbbb84(committed_roster):
    assert set(RETIRED_SINCE_THE_CUT) <= {u["unit_id"] for u in committed_roster["units"] if u["retired"]}
    units = _eligible_at_the_cut(committed_roster)
    assert (len(units), sum(u["question_count"] for u in units)) == (120, 340)
    initial = batches.initial_cut(units)
    assert _table({"batches": initial}) == INITIAL_TABLE
    count = {u["unit_id"]: u["question_count"] for u in units}
    for names in (("x1", "x2", "x3"), ("x4", "x5", "x6", "x7")):
        chunks = [b for b in initial if b["batch"] in names]
        total, running = sum(count[u] for chunk in chunks for u in chunk["units"]), 0
        for k, chunk in enumerate(chunks, 1):
            before_last = running + sum(count[u] for u in chunk["units"][:-1])
            running += sum(count[u] for u in chunk["units"])
            if k < len(chunks):
                # The chunk closes on the unit that takes the running total to k / chunks of the section.
                assert running * len(chunks) >= k * total > before_last * len(chunks), chunk["batch"]


def test_the_pinned_partition_is_the_initial_cut_less_the_units_retired_since(manifest, committed_roster):
    initial = batches.initial_cut(_eligible_at_the_cut(committed_roster))
    assert [(b["batch"], b["file"]) for b in manifest["batches"]] == [(b["batch"], b["file"]) for b in initial]
    for pinned, cut in zip(manifest["batches"], initial):
        assert pinned["units"] == [u for u in cut["units"] if u not in RETIRED_SINCE_THE_CUT], cut["batch"]


def test_the_merged_cut_read_as_the_pin_gives_the_committed_manifest(tmp_path, committed_roster):
    # BATCHES.json as merged in 1cbbb84 held the initial cut. Read as the pin
    # on today's roster, it loses las-b3-001 and las-b5-001 from x1 and nothing
    # else changes: the result is the committed file, byte for byte. As a
    # manifest it is refused, and the retired units are named.
    pin = tmp_path / "BATCHES.json"
    initial = batches.initial_cut(_eligible_at_the_cut(committed_roster))
    pin.write_bytes(export_product.render_json({"format": batches.MANIFEST_FORMAT, "batches": initial}))
    assert export_product.render_json(batches.build_manifest(pin_path=pin)) == batches.MANIFEST_PATH.read_bytes()
    with pytest.raises(ExportError, match=r"still lists retired unit\(s\) \(x1: las-b3-001, las-b5-001\)"):
        batches.current_manifest(path=pin)


def _retired(roster: dict, registry: dict, unit_ids) -> tuple[dict, dict]:
    """The roster and RETIRED.json's entries with these units retired too, the
    way build_roster records a retirement."""
    roster = copy.deepcopy(roster)
    for unit in roster["units"]:
        if unit["unit_id"] in unit_ids:
            unit.update(approval=build_roster.RETIRED, retired=True)
    return roster, {**registry, **{uid: {"reason": "a test retirement"} for uid in unit_ids}}


def test_retiring_a_unit_from_a_batch_never_moves_another_unit_between_batches(manifest, committed_roster):
    pin, registry = batches.read_pin(batches.MANIFEST_PATH), build_roster.load_retired(REPO_ROOT)
    home = [(b["batch"], b["file"]) for b in manifest["batches"]]
    cases = [{uid} for b in manifest["batches"] for uid in b["units"]]  # every unit on its own, the pilot's too
    cases += [{"las-b1-001", "las-b8-002"}, {"las-b8-003", "las-b14-001", "las-b14-003"},
              {"elf-b5-002", "elf-b5-003", "elf-b19-002"}, {"las-b7-002", "elf-b18-002", "las-b7-001"}]
    for retire in cases:
        roster, retired = _retired(committed_roster, registry, retire)
        got, removed = batches.assign(pin, roster, retired)
        assert [(b["batch"], b["file"]) for b in got] == home, sorted(retire)
        for before, after in zip(manifest["batches"], got):
            assert after["units"] == [u for u in before["units"] if u not in retire], (sorted(retire), before["batch"])
        assert removed == {b["batch"]: [u for u in b["units"] if u in retire]
                           for b in manifest["batches"] if retire & set(b["units"])}, sorted(retire)
    # The initial cut's rule, re-run on today's roster, would move units: it
    # puts las-b8-003 and las-b9-001, which have no explanation, into the merged x1.
    recut = {b["batch"]: b["units"] for b in batches.initial_cut(batches.eligible_units(REPO_ROOT, ROSTER))}
    assert recut["x1"] == _entry(manifest, "x1")["units"] + ["las-b8-003", "las-b9-001"]


def _tree(tmp_path, roster: dict, save_roster, retire=frozenset()):
    """A throwaway repo root with a roster file and RETIRED.json: the given
    roster and the committed registry, with these units retired too."""
    root = tmp_path / "repo"
    registry = json.loads((REPO_ROOT / build_roster.RETIRED_REL).read_text(encoding="utf-8"))
    roster, registry["retired"] = _retired(roster, registry["retired"], retire)
    target = root / build_roster.RETIRED_REL
    target.parent.mkdir(parents=True)
    target.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    save_roster(root / "roster.json", roster)
    return root, root / "roster.json"


def test_a_new_retirement_drops_the_unit_from_its_batch_and_nothing_else(tmp_path, manifest, committed_roster,
                                                                        save_roster, monkeypatch, capsys):
    root, roster_path = _tree(tmp_path, committed_roster, save_roster, retire={"las-b7-001"})
    got = batches.build_manifest(root, roster_path, expected=None)
    assert [b["units"] for b in got["batches"]] == [[u for u in b["units"] if u != "las-b7-001"]
                                                    for b in manifest["batches"]]
    assert _table(got) == [EXPECTED_TABLE[0], ("x1", "las-b1-001", "las-b8-002", 15, 32), *EXPECTED_TABLE[2:]]
    with pytest.raises(ExportError, match="expected table"):  # the table is changed by hand, as for any retirement
        batches.build_manifest(root, roster_path)
    monkeypatch.setattr(batches, "EXPECTED", dict(batches.EXPECTED, x1=("las-b1-001", "las-b8-002", 15, 32)))
    with pytest.raises(ExportError, match=r"still lists retired unit\(s\) \(x1: las-b7-001\)"):
        batches.current_manifest(root, roster_path)
    pin = tmp_path / "BATCHES.json"
    pin.write_bytes(batches.MANIFEST_PATH.read_bytes())
    for name, value in (("REPO_ROOT", root), ("ROSTER_PATH", roster_path), ("MANIFEST_PATH", pin)):
        monkeypatch.setattr(batches, name, value)
    assert batches.main(["--check"]) == 1
    assert "it still lists retired unit(s) (x1: las-b7-001)" in capsys.readouterr().out
    assert batches.main([]) == 0
    assert "dropped retired unit(s) from their batch: x1: las-b7-001" in capsys.readouterr().out
    assert pin.read_bytes() == export_product.render_json(got)
    assert batches.main(["--check"]) == 0


def _pin(tmp_path, manifest: dict, edit):
    """BATCHES.json, edited by hand, as a pin file."""
    data = copy.deepcopy(manifest)
    edit(data)
    path = tmp_path / "BATCHES.json"
    path.write_bytes(export_product.render_json(data))
    return path


def _move(unit_id: str, source: str, target: str | None):
    """An edit of the pin: the unit leaves one batch and, unless target is None, joins another."""

    def edit(data):
        _entry(data, source)["units"].remove(unit_id)
        if target is not None:
            _entry(data, target)["units"].append(unit_id)

    return edit


def test_a_partition_that_differs_from_the_expected_table_fails_loudly(tmp_path, manifest):
    # A unit moved by hand from x2 to x1 is not a retirement: the table refuses it.
    moved = _pin(tmp_path, manifest, _move("las-b8-003", "x2", "x1"))
    with pytest.raises(ExportError, match="expected table"):
        batches.build_manifest(pin_path=moved)
    loose = batches.build_manifest(pin_path=moved, expected=None)  # the pin is kept as it is written
    assert _table(loose)[1:3] == [("x1", "las-b1-001", "las-b8-003", 17, 38), ("x2", "las-b9-001", "las-b14-001", 15, 40)]
    changed = dict(batches.EXPECTED, x1=("las-b1-001", "las-b8-002", 16, 37))
    with pytest.raises(ExportError, match="expected table"):
        batches.build_manifest(expected=changed)


def test_an_eligible_unit_in_no_batch_is_refused_and_never_assigned(tmp_path, manifest, committed_roster, save_roster):
    dropped = _pin(tmp_path, manifest, _move("las-b8-003", "x2", None))
    with pytest.raises(ExportError, match=r"in no batch: \['las-b8-003'\]"):
        batches.build_manifest(pin_path=dropped, expected=None)
    # A new unit (batches 20+) waits for an explicit assignment, to a new batch.
    new = dict(next(u for u in committed_roster["units"] if u["unit_id"] == "las-b19-003"), unit_id="las-b20-001",
               batch=20)
    root, roster_path = _tree(tmp_path, dict(committed_roster, units=[*committed_roster["units"], new]), save_roster)
    with pytest.raises(ExportError, match=r"in no batch: \['las-b20-001'\]\. The partition is pinned"):
        batches.build_manifest(root, roster_path, expected=None)


def test_a_unit_pinned_in_two_batches_is_refused(tmp_path, manifest):
    twice = _pin(tmp_path, manifest, lambda data: _entry(data, "x1")["units"].append("las-b8-003"))
    with pytest.raises(ExportError, match=r"more than one batch: \{'las-b8-003': \['x1', 'x2'\]\}"):
        batches.build_manifest(pin_path=twice, expected=None)


@pytest.mark.parametrize("case", ["pending", "not-in-roster"])
def test_a_listed_unit_that_is_not_eligible_for_a_reason_other_than_retirement_is_refused(
        tmp_path, committed_roster, save_roster, case):
    if case == "pending":
        units = [dict(u, approval=build_roster.PENDING) if u["unit_id"] == "las-b8-003" else u
                 for u in committed_roster["units"]]
        message = r"not eligible for export: \['las-b8-003 \(pending-owner-ratification\)'\]"
    else:
        units = [u for u in committed_roster["units"] if u["unit_id"] != "las-b1-002"]
        message = r"not in the roster: \['las-b1-002'\]"
    root, roster_path = _tree(tmp_path, dict(committed_roster, units=units), save_roster)
    with pytest.raises(ExportError, match=message):
        batches.build_manifest(root, roster_path, expected=None)


def test_a_batch_left_with_no_unit_is_refused(tmp_path, manifest, committed_roster, save_roster):
    root, roster_path = _tree(tmp_path, committed_roster, save_roster, retire=set(_entry(manifest, "x1")["units"]))
    with pytest.raises(ExportError, match="batch x1 has no unit left"):
        batches.build_manifest(root, roster_path, expected=None)


@pytest.mark.parametrize("edit,message", [
    (_move("las-b7-002", "x0-pilot", "x1"), "the first batch must be x0-pilot, the exporter's pilot"),
    (lambda data: data["batches"].append(data["batches"].pop(0)), "the first batch must be x0-pilot"),
    (lambda data: _entry(data, "x1").update(file="pipeline/synthetic/infold/explanations/x2-las.json"),
     "lists a file more than once"),
    (lambda data: _entry(data, "x1").update(file="pipeline/synthetic/infold/explanations/x1-elf.json"),
     "holds one section's units"),
    (lambda data: _entry(data, "x2").update(batch="x2b", file="pipeline/synthetic/infold/explanations/x2b-las.json"),
     "is named x<N>"),
    (_move("elf-b5-003", "x5", "x1"), "holds one section's units"),
    (lambda data: data["batches"].append(copy.deepcopy(_entry(data, "x7"))), "lists a batch more than once"),
], ids=["pilot-unit-moved", "pilot-not-first", "file-twice", "wrong-file", "bad-name", "two-sections", "batch-twice"])
def test_a_pin_whose_batches_are_not_their_own_is_refused(tmp_path, manifest, edit, message):
    with pytest.raises(ExportError, match=re.escape(message)):
        batches.build_manifest(pin_path=_pin(tmp_path, manifest, edit), expected=None)


@pytest.mark.parametrize("raw,message", [
    (b"{", "is not readable JSON"),
    (b'{"format": "p5-explanation-batches-v0", "batches": []}\n', "format 'p5-explanation-batches-v0'"),
    (b'{"format": "p5-explanation-batches-v1", "batches": []}\n', "lists no batch"),
    (b'{"format": "p5-explanation-batches-v1", "batches": [{"batch": "x0-pilot", "file": "f"}]}\n',
     "a list of unit ids"),
    (b'{"format": "p5-explanation-batches-v1", "batches": [{"batch": "x1", "file": "f", "units": [1]}]}\n',
     "a list of unit ids"),
], ids=["json", "format", "empty", "no-units", "unit-not-a-string"])
def test_a_malformed_pin_is_refused(tmp_path, raw, message):
    path = tmp_path / "BATCHES.json"
    path.write_bytes(raw)
    with pytest.raises(ExportError, match=re.escape(message)):
        batches.read_pin(path)


def test_the_cut_needs_a_unit_for_every_chunk():
    units = [{"unit_id": "las-b1-001", "question_count": 4}, {"unit_id": "las-b1-002", "question_count": 2}]
    assert [[u["unit_id"] for u in chunk] for chunk in batches.cut(units, 2)] == [["las-b1-001"], ["las-b1-002"]]
    with pytest.raises(ExportError, match="chunks"):
        batches.cut(units, 3)


def test_a_stale_manifest_is_refused(tmp_path, manifest):
    stale = copy.deepcopy(manifest)
    _entry(stale, "x1")["units"].reverse()
    path = tmp_path / "BATCHES.json"
    path.write_bytes(export_product.render_json(stale))
    with pytest.raises(ExportError, match="stale"):
        batches.current_manifest(path=path)
    path.unlink()
    with pytest.raises(ExportError, match="BATCHES.json"):
        batches.current_manifest(path=path)


# ------------------------------------------------------------ the batch check

def test_the_pilot_is_batch_x0_and_passes_the_batch_check(manifest):
    data, summary = batches.check_batch(REPO_ROOT, ROSTER, manifest, "x0-pilot")
    assert data == (REPO_ROOT / PILOT_REL).read_bytes()
    assert (summary["units"], summary["questions"]) == (6, 19)


def test_x1_passes_every_explanation_gate(manifest):
    data, summary = batches.check_batch(REPO_ROOT, ROSTER, manifest, "x1")
    assert data == X1_FILE.read_bytes()  # the reviewed bytes are the canonical bytes
    assert list(json.loads(data)) == _entry(manifest, "x1")["qids"]
    assert (summary["units"], summary["questions"]) == (16, 36)
    assert summary["strings"] > 36 * 10


def test_the_batch_check_cli(capsys):
    assert batches.main(["--check-batch", "x1"]) == 0
    out = capsys.readouterr().out
    assert "x1" in out and "36 questions" in out
    assert batches.main(["--check-batch", "x9"]) == 1
    assert "REFUSED" in capsys.readouterr().err


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_x1_batch_check_passes_in_another_process(seed):
    done = subprocess.run([sys.executable, str(SCRIPT), "--check-batch", "x1"],
                          env={**os.environ, "PYTHONHASHSEED": seed}, capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr


def test_a_missing_qid_is_refused(batch_tree, manifest):
    shard = _x1()
    del shard[next(iter(shard))]
    root, roster_path, _ = batch_tree(shard)
    with pytest.raises(ExportError, match="no explanation for"):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("qid", [
    "p5-las-b1-001-r1-LÄS-005",   # a question the unit does not have
    "p5-las-b1-001-r2-LÄS-001",   # another revision of an X1 unit
    "p5-las-b14-002-r1-LÄS-001",  # the pilot's: batch x0-pilot
    "p5-las-b8-003-r1-LÄS-001",   # the first question of batch x2
    "p5-elf-b1-001-r1-ELF-001",   # the first question of batch x4
    "p5-las-b3-001-r1-LÄS-001",   # a unit retired from x1
    "host-2025-verb1-LÄS-011",    # an authentic qid
    "_meta",                      # bookkeeping beside the entries
], ids=["no-such-question", "other-revision", "pilot", "x2", "x4", "retired", "authentic", "meta"])
def test_an_entry_for_a_qid_outside_the_batch_is_refused(batch_tree, manifest, qid):
    shard = _x1()
    shard[qid] = copy.deepcopy(next(iter(shard.values())))
    root, roster_path, _ = batch_tree(shard)
    with pytest.raises(ExportError, match="not in this export"):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("edit", [
    lambda e: e["distractors"].pop(),
    lambda e: e["distractors"].append(copy.deepcopy(e["distractors"][0])),
    lambda e: e["distractors"][2].update(letter="E"),
    lambda e: e["distractors"][1].update(letter=e["distractors"][1]["letter"].lower()),
    lambda e: e["distractors"].reverse(),
    lambda e: e.update(distractors=[]),
], ids=["missing", "duplicate", "E", "lowercase", "order", "none"])
def test_bad_distractor_letters_are_refused(batch_tree, manifest, edit):
    root, roster_path, _ = batch_tree(_first_edited(edit))
    with pytest.raises(ExportError, match="distractor letters"):
        _check_x1(root, roster_path, manifest)


def test_explaining_the_key_as_a_wrong_option_is_refused(batch_tree, manifest, x1_rows):
    first = x1_rows[0]
    root, roster_path, _ = batch_tree(_first_edited(lambda e: e["distractors"][0].update(letter=first["answer"])))
    with pytest.raises(ExportError, match="distractor letters"):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("value", ["LAS-TYPE-099", "ELF-TYPE-001", "XYZ-TRAP-001", "las-type-001", "ELF-CLOZE-001",
                                   None, 1, ""],
                         ids=["unknown", "other-section", "quant", "case", "generation-family", "null", "int", "empty"])
def test_an_invalid_framework_id_is_refused(batch_tree, manifest, value):
    root, roster_path, _ = batch_tree(_first_edited(lambda e: e.update(framework_id=value)))
    with pytest.raises(ExportError, match="framework_id"):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("edit", [
    lambda e: e.update(technique="Jämför med las-b1-001."),
    lambda e: e.update(technique="Se LAS-TYPE-002."),
    lambda e: e["steps"][0].update(title="las-b8-003"),
    lambda e: e.update(pitfall="Samma mönster som p5-las-b2-002-r1-LÄS-001."),
    lambda e: e["steps"][1].update(text=e["steps"][1]["text"] + " Familj: popularvetenskap-ekologi-lang."),
], ids=["unit-id", "framework-id", "unit-of-another-batch", "qid", "family-label"])
def test_a_leaked_internal_label_is_refused(batch_tree, manifest, edit):
    root, roster_path, _ = batch_tree(_first_edited(edit))
    with pytest.raises(ExportError, match="internal label"):
        _check_x1(root, roster_path, manifest)


def test_rationale_text_copied_into_a_batch_entry_is_refused(batch_tree, manifest, committed_roster):
    entry = next(u for u in committed_roster["units"] if u["unit_id"] == "las-b1-001")
    rationale = json.loads((REPO_ROOT / entry["source"]).read_text(encoding="utf-8"))["questions"][0]["rationale"]
    sentence = "It keeps the passage's hedge and its scope."
    assert sentence in rationale
    root, roster_path, _ = batch_tree(_first_edited(lambda e: e["steps"][1].update(text=sentence)))
    with pytest.raises(ExportError, match="rationale"):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("edit,message", [
    (lambda e: e["distractors"][0].update(why_wrong=e["distractors"][0]["why_wrong"] + " (scope_shift)"),
     "L2-SNAKE"),
    (lambda e: e.update(solution_path="Ett hedgat påstående. " + e["solution_path"]), "L2-HEDGAT"),
    (lambda e: e.update(pitfall="Enligt G-STEM är detta en fälla."), "L2-GATEREF"),
], ids=["snake", "hedgat", "gate"])
def test_a_learner_lint_finding_is_refused(batch_tree, manifest, edit, message):
    root, roster_path, _ = batch_tree(_first_edited(edit))
    with pytest.raises(ExportError, match=message):
        _check_x1(root, roster_path, manifest)


@pytest.mark.parametrize("render", [
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=1) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=True, indent=2) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=2),
    lambda shard: json.dumps(dict(reversed(list(shard.items()))), ensure_ascii=False, indent=2) + "\n",
], ids=["indent", "sorted-keys", "ascii-escapes", "no-newline", "entry-order"])
def test_a_batch_file_not_in_canonical_bytes_is_refused(batch_tree, manifest, render):
    root, roster_path, _ = batch_tree(raw=render(_x1()).encode())
    with pytest.raises(ExportError, match="canonical form"):
        _check_x1(root, roster_path, manifest)


def test_a_missing_or_symlinked_batch_file_is_refused(batch_tree, manifest, tmp_path):
    root, roster_path, target = batch_tree()
    twin = tmp_path / "twin.json"
    twin.write_bytes(target.read_bytes())
    target.unlink()
    with pytest.raises(ExportError, match="does not exist"):
        _check_x1(root, roster_path, manifest)
    target.symlink_to(twin)
    with pytest.raises(ExportError, match="symlink"):
        _check_x1(root, roster_path, manifest)


def test_an_unknown_batch_is_refused(manifest):
    with pytest.raises(ExportError, match="no batch 'x9'"):
        batches.check_batch(REPO_ROOT, ROSTER, manifest, "x9")


def test_a_manifest_whose_qids_are_not_its_units_qids_is_refused(manifest):
    stale = copy.deepcopy(manifest)
    _entry(stale, "x1")["qids"][0] = "p5-las-b1-001-r2-LÄS-001"
    with pytest.raises(ExportError, match="manifest"):
        batches.check_batch(REPO_ROOT, ROSTER, stale, "x1")


def test_a_revision_bump_makes_the_manifest_stale_before_any_gate_runs(batch_tree, manifest, save_roster):
    # A new revision means changed answer-bearing bytes: the batch's qids move
    # and its entries need renewed review. The batch check names the stale
    # manifest instead of reporting the new qids as unexplained.
    root, roster_path, _ = batch_tree()
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    next(u for u in roster["units"] if u["unit_id"] == "las-b1-001")["revision"] = 2
    save_roster(roster_path, roster)
    with pytest.raises(ExportError, match="current revisions"):
        _check_x1(root, roster_path, manifest)


def test_a_shard_path_needs_explanations():
    with pytest.raises(ExportError, match="shard_path"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="x", units=list(PILOT),
                                   shard_path=REPO_ROOT / PILOT_REL)


# ------------------------------------------------------------- the X1 content

@pytest.mark.parametrize("strict", [False, True], ids=["default", "strict"])
def test_x1_is_clean_under_the_learner_lint_cli(strict):
    done = subprocess.run([sys.executable, str(LINTER), *(["--strict"] if strict else []), str(X1_FILE)],
                          capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr
    assert "clean — 1 file(s)" in done.stdout


def test_every_x1_explanation_states_its_key_and_explains_every_wrong_option(x1_rows):
    shard = _x1()
    for row in x1_rows:
        entry, key = shard[row["qid"]], row["answer"]
        verdict = f"Svaret är {key}."
        assert entry["solution_path"].endswith(verdict), row["qid"]
        assert entry["steps"][-1]["text"].endswith(verdict), row["qid"]
        wrong = [letter for letter in "ABCD" if letter != key]
        assert [d["letter"] for d in entry["distractors"]] == wrong, row["qid"]
        blob = json.dumps(entry, ensure_ascii=False)
        for letter in wrong:
            assert f"Svaret är {letter}" not in blob, row["qid"]
        assert 3 <= len(entry["steps"]) <= 6, row["qid"]
        assert entry["steps"][0]["tier"] == entry["steps"][-1]["tier"] == "essential", row["qid"]


QUOTED = re.compile(r"[“”]([^“”]+)”")


def _plain(text: str) -> str:
    return " ".join(text.replace("’", "'").replace("‘", "'").split())


def test_every_x1_explanation_quotes_its_passage(x1_rows):
    shard = _x1()
    for row in x1_rows:
        entry = shard[row["qid"]]
        passage = _plain(row["context"])
        quotes = [_plain(m.group(1)).rstrip(".,") for text in
                  [entry["solution_path"], *(step["text"] for step in entry["steps"])]
                  for m in QUOTED.finditer(text)]
        assert [q for q in quotes if len(q) >= 15 and q in passage], f"{row['qid']}: no verbatim passage quote"


# A quotation is the unit's own words (review finding B1 on PR #379, bead
# hpf-c5tb.3). Only its first letter's case may change to fit the sentence, and
# "…" marks left-out words: the pieces around it stand in that order within one
# sentence of the unit's student text.
SENTENCE = re.compile(r"(?<=[.!?])\s+|\n+")


def _in_order(pieces: list[str], sentence: str) -> bool:
    at = 0
    for piece in pieces:
        at = sentence.find(piece, at)
        if at < 0:
            return False
        at += len(piece)
    return True


def _verbatim(quote: str, student: str) -> bool:
    for variant in (quote, quote[:1].swapcase() + quote[1:]):
        if "…" not in variant:
            if variant in student:
                return True
            continue
        pieces = [piece.strip() for piece in variant.split("…") if piece.strip()]
        if pieces and any(_in_order(pieces, sentence) for sentence in SENTENCE.split(student)):
            return True
    return False


def test_a_quotation_may_change_only_its_first_letter_case_and_mark_left_out_words():
    text = "På branta sträckor spelar trycket större roll. Det var inte bara räls som bar posten, utan en granne."
    assert _verbatim("spelar trycket större roll", text) and _verbatim("på branta sträckor", text)
    assert _verbatim("inte bara … utan en granne", text) and _verbatim("det var … som", text)
    assert not _verbatim("spelar större roll", text)  # B1: a word left out without "…"
    assert not _verbatim("SPELAR trycket", text) and not _verbatim("trycket … granne", text)


def test_every_las_quotation_is_verbatim_from_its_unit(manifest, approved_rows):
    # ELF is left out: its cloze explanations quote fixed expressions and wrong
    # collocations that are not in the text by design ("take its toll on").
    student: dict[str, list[str]] = {}
    for row in approved_rows:
        student.setdefault(row["unit_id"], [row["title"], row["context"]])
        student[row["unit_id"]] += [row["prompt"], *(o["text"] for o in row["options"])]
    rows = {row["qid"]: row for row in approved_rows}
    checked, bad = 0, []
    for batch in manifest["batches"]:
        path = REPO_ROOT / batch["file"]
        if not path.exists():
            continue
        shard = json.loads(path.read_text(encoding="utf-8"))
        for qid in (q for q in batch["qids"] if rows[q]["section"] == "LÄS"):
            entry, text = shard[qid], "\n".join(student[rows[qid]["unit_id"]])
            parts = [entry["solution_path"], entry["technique"], entry["pitfall"] or ""]
            parts += [value for s in entry["steps"] for value in (s["title"], s["text"])]
            parts += [value for d in entry["distractors"] for value in (d["why_tempting"], d["why_wrong"])]
            for part in parts:
                if {"“", "”"} & set(QUOTED.sub("", part)):
                    bad.append(f"{qid}: an unpaired quotation mark in {part!r}")
                for match in QUOTED.finditer(part):
                    checked += 1
                    if not _verbatim(match.group(1), text):
                        bad.append(f"{qid}: ”{match.group(1)}” is not the unit's text")
    assert not bad, bad
    assert checked > 100


SWEDISH = (" och ", " att ", " det ", " är ", " inte ", " som ")
ENGLISH = (" the ", " and ", " is ", " of ", " to ", " that ")


def test_x1_explanations_are_swedish(x1_rows):
    shard = _x1()
    for row in x1_rows:
        entry = shard[row["qid"]]
        parts = [entry["solution_path"], entry["technique"], entry["pitfall"] or ""]
        parts += [f"{s['title']} {s['text']}" for s in entry["steps"]]
        parts += [f"{d['why_tempting']} {d['why_wrong']}" for d in entry["distractors"]]
        blob = f" {' '.join(parts).lower()} "
        swedish = sum(blob.count(w) for w in SWEDISH)
        english = sum(blob.count(w) for w in ENGLISH)
        assert swedish > 5 * max(english, 1), row["qid"]


def test_x1_framework_ids_are_las_entries(x1_rows):
    catalog, _ = export_product.load_frameworks(REPO_ROOT)
    shard = _x1()
    for row in x1_rows:
        framework_id = shard[row["qid"]].get("framework_id")
        assert framework_id is None or catalog[framework_id] == "LÄS", row["qid"]


# ------------------------------------------------------------- the assembler

def test_pilot_and_x1_assemble_cleanly_only_as_a_partial(manifest):
    both = _subset(manifest, "x0-pilot", "x1")
    data, summary = batches.assemble(REPO_ROOT, ROSTER, both, release="x1-partial", partial=True)
    shard, pilot, x1 = json.loads(data), _pilot(), _x1()
    assert len(shard) == 55 and set(shard) == set(pilot) | set(x1)
    assert all(shard[q] == pilot[q] for q in pilot) and all(shard[q] == x1[q] for q in x1)
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="o", units=list(PILOT) + _entry(manifest, "x1")["units"])
    assert list(shard) == [row["qid"] for row in json.loads(files["p5-bank-o.json"])["questions"]]  # bank order
    assert data == export_product.render_json(shard)
    assert summary["partial"] is True and summary["entries"] == 55
    with pytest.raises(ExportError, match="gap"):
        batches.assemble(REPO_ROOT, ROSTER, both, release="x1-partial")


def test_a_complete_set_assembles_into_a_release_shard_that_pairs_with_the_bank(batch_tree, manifest):
    root, roster_path, _ = batch_tree()  # in this tree the pilot and X1 are every eligible question
    both = _subset(manifest, "x0-pilot", "x1")
    data, summary = batches.assemble(root, roster_path, both, release="x1test")
    assert summary["partial"] is False and summary["entries"] == 55
    assert batches.assemble(root, roster_path, both, release="x1test")[0] == data  # reruns are byte-identical
    batches.write_release_shard(root, "x1test", data)
    assert (root / "data/explanations/p5-x1test.json").read_bytes() == data
    files = export_product.export_bank(root, roster_path, release="x1test", explanations=True)
    assert files["p5-x1test.json"] == data


def test_a_qid_in_two_batch_files_is_refused(batch_tree, manifest):
    shard, pilot = _x1(), _pilot()
    qid = next(iter(pilot))
    shard[qid] = pilot[qid]
    root, roster_path, _ = batch_tree(shard)
    for partial in (False, True):
        with pytest.raises(ExportError, match="more than one batch"):
            batches.assemble(root, roster_path, _subset(manifest, "x0-pilot", "x1"), release="x1test",
                             partial=partial)


def test_a_unit_in_two_batches_is_refused(manifest):
    doubled = copy.deepcopy(_subset(manifest, "x0-pilot", "x1"))
    doubled["batches"].append(dict(copy.deepcopy(_entry(doubled, "x1")), batch="x9",
                                   file="pipeline/synthetic/infold/explanations/x9-las.json"))
    with pytest.raises(ExportError, match="duplicate"):
        batches.assemble(REPO_ROOT, ROSTER, doubled, release="x1-partial", partial=True)


def test_a_missing_batch_file_is_a_gap(batch_tree, manifest):
    root, roster_path, target = batch_tree()
    target.unlink()
    both = _subset(manifest, "x0-pilot", "x1")
    with pytest.raises(ExportError, match="gap"):
        batches.assemble(root, roster_path, both, release="x1test")
    data, summary = batches.assemble(root, roster_path, both, release="x1test", partial=True)
    assert list(json.loads(data)) == list(_pilot()) and summary["missing"] == ["x1"]


def test_an_eligible_qid_in_no_batch_is_a_gap(batch_tree, manifest):
    root, roster_path, _ = batch_tree()
    with pytest.raises(ExportError, match="gap"):
        batches.assemble(root, roster_path, _subset(manifest, "x0-pilot"), release="x1test")


def test_a_gate_that_fails_only_across_batches_refuses_the_assembly(batch_tree, manifest):
    # X1's own check passes: the sentence is not from an X1 unit's rationale.
    # The assembled shard is checked against every unit's rationales.
    shard = _first_edited(lambda e: e.update(technique=PILOT_RATIONALE_SENTENCE))
    root, roster_path, _ = batch_tree(shard)
    batches.check_batch(root, roster_path, manifest, "x1")
    with pytest.raises(ExportError, match="rationale"):
        batches.assemble(root, roster_path, _subset(manifest, "x0-pilot", "x1"), release="x1test", partial=True)


@pytest.mark.parametrize("release,message", [("pilot", "input"), ("Bad_Name", "release"), ("x" * 41, "release")],
                         ids=["the-pilot-input", "malformed", "too-long"])
def test_a_bad_release_name_is_refused(manifest, release, message):
    with pytest.raises(ExportError, match=message):
        batches.assemble(REPO_ROOT, ROSTER, _subset(manifest, "x0-pilot", "x1"), release=release, partial=True)


def test_the_release_shard_is_never_written_through_a_symlink(batch_tree, tmp_path):
    root, _, _ = batch_tree()
    target = root / "data/explanations/p5-x1test.json"
    elsewhere = tmp_path / "elsewhere.json"
    elsewhere.write_text("{}\n", encoding="utf-8")
    target.symlink_to(elsewhere)
    with pytest.raises(ExportError, match="symlink"):
        batches.write_release_shard(root, "x1test", b"{}\n")
    assert elsewhere.read_text(encoding="utf-8") == "{}\n"


def test_the_assemble_cli_never_writes_a_partial(capsys):
    target = REPO_ROOT / "data/explanations/p5-cli-partial-check.json"
    assert not target.exists()
    assert batches.main(["--assemble", "cli-partial-check", "--partial"]) == 0
    assert "partial" in capsys.readouterr().out
    assert not target.exists()


def test_the_assemble_cli_writes_only_a_complete_release(batch_tree, manifest, monkeypatch, capsys):
    root, roster_path, _ = batch_tree()
    monkeypatch.setattr(batches, "REPO_ROOT", root)
    monkeypatch.setattr(batches, "ROSTER_PATH", roster_path)
    monkeypatch.setattr(batches, "current_manifest", lambda: _subset(manifest, "x0-pilot", "x1"))
    written = root / "data/explanations/p5-x1test.json"
    assert batches.main(["--assemble", "x1test", "--check"]) == 1 and not written.exists()
    assert batches.main(["--assemble", "x1test"]) == 0
    assert batches.main(["--assemble", "x1test", "--check"]) == 0
    assert json.loads(written.read_text(encoding="utf-8")).keys() == set(_pilot()) | set(_x1())
    capsys.readouterr()
    monkeypatch.setattr(batches, "current_manifest", lambda: _subset(manifest, "x0-pilot"))
    written.unlink()
    assert batches.main(["--assemble", "x1test"]) == 1 and not written.exists()
    assert "gap" in capsys.readouterr().err


@pytest.mark.parametrize("argv", [["--partial"], ["--check-batch", "x1", "--partial"],
                                  ["--assemble", "r", "--partial", "--check"], ["--check-batch", "x1", "--check"],
                                  ["--check-batch", "x1", "--assemble", "r"]])
def test_the_cli_refuses_conflicting_options(argv):
    with pytest.raises(SystemExit):
        batches.main(argv)

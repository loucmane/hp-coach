"""Export contract (docs/p5-infold-design.md §C, §F; bead hpf-535m).

export_product.py turns ratified roster rows plus their exact candidate bytes
into a learner bank of whitelisted fields only. It refuses — never repairs —
on a changed candidate hash, a retired id, a unit without approval, candidate
field drift, a duplicate qid, any internal metadata in the output, an
exclusion pair inside a single-session set, a learner-output lint finding, or
output that differs between reruns.
"""
from __future__ import annotations

import copy
import itertools
import json
import os
import re
import stat
import subprocess
import sys

import pytest

import build_roster
import export_product

REPO_ROOT = build_roster.REPO_ROOT
ROSTER = build_roster.ROSTER_PATH
ExportError = export_product.ExportError
B19 = "pipeline/synthetic/batches/batch19/candidates/las-b19-002.json"
B18_CLOZE = "pipeline/synthetic/batches/batch18/candidates/elf-b18-002.json"


def _bank(files: dict, release: str = "preview") -> dict:
    return json.loads(files[f"p5-bank-{release}.json"])


def _manifest(files: dict) -> dict:
    return json.loads(files[export_product.MANIFEST_NAME])


def _candidate(roster_entry: dict) -> dict:
    return json.loads((REPO_ROOT / roster_entry["source"]).read_text(encoding="utf-8"))


def _ts(rel: str) -> str:
    return (REPO_ROOT / rel).read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def approved_export() -> dict:
    return export_product.export_bank(REPO_ROOT, ROSTER, release="preview")


@pytest.fixture(scope="session")
def pending_export() -> dict:
    return export_product.export_bank(REPO_ROOT, ROSTER, release="preview", include_pending=True)


# -------------------------------------------------------------- selection

def test_default_export_holds_only_approved_units(approved_export, committed_roster):
    bank = _bank(approved_export)
    approved = [u for u in committed_roster["units"] if u["approval"] == "approved"]
    assert sorted({r["unit_id"] for r in bank["questions"]}) == sorted(u["unit_id"] for u in approved)
    # Every kept unit since the owner's ratification of batches 1–13 (2026-10-07), less the
    # two units the owner retired on 2026-10-08 and the six retired on 2026-10-09.
    assert len(approved) == 112
    assert len(bank["questions"]) == sum(u["question_count"] for u in approved) == 306
    assert bank["preview"] is False and bank["stamp"] is None
    excluded = _manifest(approved_export)["excluded"]
    assert excluded["pending-owner-ratification"] == []
    assert sorted(excluded["retired"]) == sorted(
        json.loads((REPO_ROOT / build_roster.RETIRED_REL).read_text(encoding="utf-8"))["retired"])


def test_a_bumped_revision_reaches_the_qids(approved_export):
    rows = [r for r in _bank(approved_export)["questions"] if r["unit_id"] == "las-b7-002"]
    assert [r["qid"] for r in rows] == ["p5-las-b7-002-r2-LÄS-001", "p5-las-b7-002-r2-LÄS-002"]
    assert all(r["revision"] == 2 and r["exam_id"] == "p5-las-b7-002-r2" for r in rows)


def test_include_pending_is_stamped_as_preview(pending_export):
    bank = _bank(pending_export)
    assert bank["preview"] is True and "PREVIEW" in bank["stamp"]
    rows = bank["questions"]
    assert len({r["unit_id"] for r in rows}) == 112 and len(rows) == 306
    assert sum(r["section"] == "LÄS" for r in rows) == 128
    assert sum(r["section"] == "ELF" for r in rows) == 178


def test_include_pending_requires_a_preview_release_name():
    with pytest.raises(ExportError, match="preview"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="pilot1", include_pending=True)


def test_a_pending_unit_is_refused_without_the_preview_flag(make_tree, save_roster):
    root, roster_path = make_tree(["las-b2-003"])
    _edit_roster_row(roster_path, save_roster, lambda row: row.update(approval="pending-owner-ratification"))
    with pytest.raises(ExportError, match="pending-owner-ratification"):
        export_product.export_bank(root, roster_path, units=["las-b2-003"])


def test_an_empty_selection_is_refused(make_tree, save_roster):
    root, roster_path = make_tree(["las-b2-003"])
    _edit_roster_row(roster_path, save_roster, lambda row: row.update(approval="pending-owner-ratification"))
    with pytest.raises(ExportError, match="no units"):
        export_product.export_bank(root, roster_path)


# ------------------------------------------------------- hashes, retirement

@pytest.mark.parametrize("edit", [
    lambda raw: raw.replace("Bengta".encode(), "Bengte".encode()),  # a student-facing byte
    lambda raw: raw + b"\n",                                         # a trailing byte only
])
def test_a_candidate_hash_mismatch_is_refused(make_tree, edit):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    path.write_bytes(edit(path.read_bytes()))
    with pytest.raises(ExportError, match="sha256"):
        export_product.export_bank(root, roster_path)


def test_retired_units_are_skipped_and_refused_on_request(make_tree):
    root, roster_path = make_tree(["las-b19-002", "elf-b19-004"])
    files = export_product.export_bank(root, roster_path)
    assert {r["unit_id"] for r in _bank(files)["questions"]} == {"las-b19-002"}
    assert _manifest(files)["excluded"]["retired"] == ["elf-b19-004"]
    for include_pending in (False, True):
        with pytest.raises(ExportError, match="retired"):
            export_product.export_bank(root, roster_path, release="preview", units=["elf-b19-004"],
                                       include_pending=include_pending)


def test_a_roster_that_disagrees_with_retired_json_is_refused(make_tree, save_roster):
    root, roster_path = make_tree(["las-b19-002", "elf-b19-004"])
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    stale = next(u for u in roster["units"] if u["unit_id"] == "elf-b19-004")
    stale.update(retired=False, approval="approved")
    save_roster(roster_path, roster)
    with pytest.raises(ExportError, match="RETIRED.json"):
        export_product.export_bank(root, roster_path)


def test_a_new_retirement_overrides_a_stale_approval(make_tree):
    root, roster_path = make_tree(["las-b19-002", "las-b19-003"],
                                  retired={"las-b19-002": {"reason": "test"}})
    with pytest.raises(ExportError, match="RETIRED.json"):
        export_product.export_bank(root, roster_path)


def test_a_roster_retirement_missing_from_retired_json_is_refused(make_tree):
    root, roster_path = make_tree(["las-b19-002", "elf-b19-004"], retired={})
    with pytest.raises(ExportError, match="RETIRED.json"):
        export_product.export_bank(root, roster_path)


# ------------------------------------------------------------ duplicates

def test_duplicate_roster_rows_are_refused(make_tree, save_roster):
    root, roster_path = make_tree(["las-b19-002"])
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    roster["units"].append(dict(roster["units"][0]))
    save_roster(roster_path, roster)
    with pytest.raises(ExportError, match="duplicate"):
        export_product.export_bank(root, roster_path)


def test_duplicate_qids_are_refused(approved_export):
    rows = _bank(approved_export)["questions"]
    with pytest.raises(ExportError, match="duplicate qid"):
        export_product.check_unique_qids(rows + [rows[3]])


# ------------------------------------------------- candidate field drift

@pytest.mark.parametrize("mutate", [
    lambda u: u.update(notes="internal"),                        # extra top-level field
    lambda u: u.pop("title"),                                    # missing top-level field
    lambda u: u["questions"][0].update(hint="x"),                # extra question field
    lambda u: u["questions"][0].pop("key"),                      # missing question field
    lambda u: u["questions"][0]["options"][0].update(why="x"),   # extra option field
    lambda u: u["questions"][0]["options"][0].update(letter="E"),
    lambda u: u["questions"][0]["options"].pop(),                # three options
    lambda u: u["questions"][1].update(q_index=3),               # numbering gap
    lambda u: u["questions"][0].update(q_index=True),            # a bool is not a q_index
    lambda u: u["questions"][0].update(key="E"),
    lambda u: u.update(section="ELF"),                           # disagrees with the roster
    lambda u: u.update(candidate_id="las-b19-003"),              # disagrees with the roster
])
def test_candidate_field_drift_is_refused(make_tree, rehash, mutate):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    unit = json.loads(path.read_text(encoding="utf-8"))
    mutate(unit)
    path.write_text(json.dumps(unit, ensure_ascii=False, indent=2), encoding="utf-8")
    rehash(root, roster_path, "las-b19-002")
    with pytest.raises(ExportError, match="las-b19-002: candidate fields outside the authoring contract"):
        export_product.export_bank(root, roster_path)


@pytest.mark.parametrize("old,new", [
    ("___(3)___", "___(7)___"),   # a gap renumbered away from its question
    ("___(3)___", "___"),         # a gap marker lost
])
def test_cloze_numbering_must_match_the_gap_questions(make_tree, rehash, old, new):
    root, roster_path = make_tree(["elf-b18-002"])
    path = root / B18_CLOZE
    path.write_text(path.read_text(encoding="utf-8").replace(old, new, 1), encoding="utf-8")
    rehash(root, roster_path, "elf-b18-002")
    with pytest.raises(ExportError, match="gap"):
        export_product.export_bank(root, roster_path)


# --------------------------------------------- whitelist and leak denylist

def test_exported_rows_are_exactly_the_whitelist(pending_export):
    bank = _bank(pending_export)
    assert list(bank) == list(export_product.BANK_FIELDS)
    for row in bank["questions"]:
        assert list(row) == list(export_product.ROW_FIELDS)
        assert row["source"] == "synthetic" and row["provpass"] is None
        assert row["explanation_shard"] is None  # no shard validated, none referenced (bead hpf-no7l)
        assert [list(o) for o in row["options"]] == [["letter", "text"]] * 4

    def keys(node):
        if isinstance(node, dict):
            for k, v in node.items():
                yield k
                yield from keys(v)
        elif isinstance(node, list):
            for v in node:
                yield from keys(v)

    seen = set(keys(bank))
    assert not seen & export_product.DENYLIST
    assert not [k for k in seen if k.startswith("_")]


def test_internal_strings_never_reach_the_bank(pending_export, committed_roster):
    blob = _bank(pending_export)
    values = []

    def strings(node):
        if isinstance(node, dict):
            for v in node.values():
                strings(v)
        elif isinstance(node, list):
            for v in node:
                strings(v)
        elif isinstance(node, str):
            values.append(node)

    strings(blob)
    text = "\n".join(values)
    for entry in committed_roster["units"]:
        if entry["retired"]:
            continue
        unit = _candidate(entry)
        assert unit["family"] not in values
        for q in unit["questions"]:
            assert q["rationale"] not in text


@pytest.mark.parametrize("leak", [
    lambda bank, why: bank["questions"][0].update(rationale=why),
    lambda bank, why: bank["questions"][0]["options"][0].update(generator_meta={}),
    lambda bank, why: bank.update(_meta={"note": "hidden"}),
    lambda bank, why: bank["questions"][0].pop("answer"),
    lambda bank, why: bank["questions"][0].update(prompt=bank["questions"][0]["prompt"] + " " + why),
])
def test_internal_metadata_leaks_are_refused(approved_export, committed_roster, leak):
    bank = copy.deepcopy(_bank(approved_export))
    first = bank["questions"][0]
    entry = next(u for u in committed_roster["units"] if u["unit_id"] == first["unit_id"])
    candidate = _candidate(entry)
    why = candidate["questions"][first["number"] - 1]["rationale"].split("\n\n")[0]
    leak(bank, why)
    with pytest.raises(ExportError):
        export_product.check_bank(bank, {entry["unit_id"]: candidate})


# Internal ids and labels in the bank's learner text (hpf-c8k8 review): a
# Layer-1 entry id of any section, a unit id or qid, the unit's own family
# label, also when the id renders whole only after an invisible character is
# dropped or KaTeX groups are joined.
MATH_OPEN, MATH_CLOSE = chr(0xE000), chr(0xE001)
BANK_LEAKS = {
    "framework-id": "LAS-TYPE-001",
    "quant-framework-id": "XYZ-TRAP-005",
    "unit-id": "las-b19-002",
    "qid": "p5-las-b19-002-r1-LÄS-002",
    "en-dashes": "ELF\N{EN DASH}TYPE\N{EN DASH}001",
    "invisible": "las-b\N{ZERO WIDTH SPACE}7-002",
    "katex": MATH_OPEN + r"\text{LAS-TY}\text{PE-001}" + MATH_CLOSE,
    "family-label": "badbrygga-avgift-debatt-short",
    # No catalog lists it and las-b19-002 does not carry it: only the series
    # that ELF-TYPE-001 stands for can catch a generation-family id here.
    "generation-family": "ELF-CLOZE-001",
}
LEARNER_TEXT = {
    "title": lambda unit, v: unit.update(title=f"{unit['title']} {v}"),
    "passage": lambda unit, v: unit.update(passage=f"{unit['passage']}\n\nSe {v}."),
    "prompt": lambda unit, v: unit["questions"][1].update(prompt=f"{unit['questions'][1]['prompt']} ({v})"),
    "option": lambda unit, v: unit["questions"][0]["options"][2].update(
        text=f"{unit['questions'][0]['options'][2]['text']} ({v})"),
}


@pytest.mark.parametrize("field", list(LEARNER_TEXT))
@pytest.mark.parametrize("leak", list(BANK_LEAKS.values()), ids=list(BANK_LEAKS))
def test_an_internal_label_in_bank_text_is_refused(make_tree, rehash, field, leak):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    unit = json.loads(path.read_text(encoding="utf-8"))
    LEARNER_TEXT[field](unit, leak)
    path.write_text(json.dumps(unit, ensure_ascii=False, indent=2), encoding="utf-8")
    rehash(root, roster_path, "las-b19-002")
    with pytest.raises(ExportError, match=r"bank text: .*las-b19-002 .*carries an internal label"):
        export_product.export_bank(root, roster_path)


# ------------------------------------------------------ exact preservation

def test_student_strings_are_preserved_exactly(pending_export, committed_roster):
    rows = _bank(pending_export)["questions"]
    by_unit = {}
    for row in rows:
        by_unit.setdefault(row["unit_id"], []).append(row)
    order = [u["unit_id"] for u in committed_roster["units"] if not u["retired"]]
    assert list(by_unit) == order  # roster order, then question order
    for entry in committed_roster["units"]:
        if entry["retired"]:
            continue
        unit = _candidate(entry)
        unit_rows = by_unit[entry["unit_id"]]
        assert [r["number"] for r in unit_rows] == [q["q_index"] for q in unit["questions"]]
        for row, q in zip(unit_rows, unit["questions"]):
            assert row["title"] == unit["title"]
            assert row["context"] == unit["passage"]
            assert row["prompt"] == q["prompt"]
            assert row["options"] == q["options"]
            assert row["answer"] == q["key"]
            assert row["section"] == unit["section"] == entry["section"]
            assert row["revision"] == entry["revision"]
            assert row["exam_id"] == f"p5-{entry['unit_id']}-r{entry['revision']}"
            if m := re.fullmatch(r"Gap \((\d+)\)", q["prompt"]):
                assert int(m.group(1)) == row["number"]
                assert row["context"].count(f"___({row['number']})___") == 1


# ----------------------------------------------------------- qid contract

def _regex_literal(source: str, name: str) -> re.Pattern:
    m = re.search(rf"const {name} = /(.+)/\s*$", source, re.M)
    assert m, f"{name} not found"
    return re.compile(m.group(1))


def _ts_string_list(source: str, name: str) -> list[str]:
    m = re.search(rf"export const {name} = \[([^\]]*)\]", source)
    assert m, f"{name} not found"
    return re.findall(r"'([^']+)'", m.group(1))


def test_make_qid_shape():
    assert export_product.make_qid("las-b19-001", 1, "LÄS", 1) == "p5-las-b19-001-r1-LÄS-001"
    assert export_product.make_qid("elf-b18-002", 3, "ELF", 5) == "p5-elf-b18-002-r3-ELF-005"


def test_qids_are_compatible_with_every_current_consumer(pending_export):
    # worker/src/lib/section.ts:11 — extractSection(qid), LAS normalised to LÄS
    section_re = _regex_literal(_ts("worker/src/lib/section.ts"), "SECTION_RE")
    # worker/src/routes/attempts.ts:40 — questionId: z.string().min(1).max(60)
    limit = int(re.search(r"questionId: z\.string\(\)\.min\(1\)\.max\((\d+)\)",
                          _ts("worker/src/routes/attempts.ts")).group(1))
    questions_ts = _ts("app/src/data/questions.ts")
    section_keys = _ts_string_list(questions_ts, "SECTION_KEYS")
    provpass_keys = _ts_string_list(questions_ts, "PROVPASS_KEYS")
    # app/src/lib/dueBySection.ts:25 — second-to-last dash segment must be a SECTION_KEYS literal
    assert "const token = parts[parts.length - 2]" in _ts("app/src/lib/dueBySection.ts")
    # worker/src/routes/mistakes.ts:218 and fit.ts:55 — LIKE '%-<section>-%' with the app literal
    for rel in ("worker/src/routes/mistakes.ts", "worker/src/routes/fit.ts"):
        assert "LIKE ${`%-${section}-%`}" in _ts(rel), rel
    assert limit == 60 and len(provpass_keys) == 4 and "LÄS" in section_keys

    for row in _bank(pending_export)["questions"]:
        qid = row["qid"]
        assert re.fullmatch(r"p5-(las|elf)-b\d{1,2}-\d{3}-r\d+-(LÄS|ELF)-\d{3}", qid), qid
        assert qid == f"{row['exam_id']}-{row['section']}-{row['number']:03d}"
        assert len(qid.encode("utf-16-le")) // 2 <= limit
        m = section_re.search(qid)
        assert m and {"LAS": "LÄS"}.get(m.group(1), m.group(1)) == row["section"]
        assert qid.split("-")[-2] == row["section"] and row["section"] in section_keys
        assert f"-{row['section']}-" in qid
        # app/src/data/explanations.ts:133 must not route a P5 qid to an authentic exam file
        assert not any(f"-{token}-" in qid for token in provpass_keys)


def test_content_keys_fit_the_worker_whitelist(pending_export):
    content_path = _regex_literal(_ts("worker/src/routes/content.ts"), "CONTENT_PATH")
    assert content_path.fullmatch("data/p5-bank-preview.json")
    assert content_path.fullmatch(export_product.shard_key("preview"))
    with pytest.raises(ExportError, match="release"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="pilot.1")


# ------------------------------------------- revision and qid integrity

# The malformed-revision classes of the hpf-iycl review (R1): zero, negative,
# bool, float, string, null, array, nested object, past the bound of 99, huge.
MALFORMED_REVISIONS = [0, -1, True, False, 1.0, 2.5, "1", "r1", None, [1], {"note": "internal"}, 100, 10 ** 30]


def _edit_roster_row(roster_path, save_roster, edit) -> None:
    roster = json.loads(roster_path.read_text(encoding="utf-8"))
    edit(roster["units"][0])
    save_roster(roster_path, roster)


@pytest.mark.parametrize("revision", MALFORMED_REVISIONS, ids=repr)
def test_a_malformed_roster_revision_is_refused(make_tree, save_roster, revision):
    root, roster_path = make_tree(["las-b19-002"])
    _edit_roster_row(roster_path, save_roster, lambda row: row.update(revision=revision))
    with pytest.raises(ExportError, match="roster .*revision"):  # refused where the roster is read
        export_product.export_bank(root, roster_path)


def test_a_roster_row_without_a_revision_is_refused(make_tree, save_roster):
    root, roster_path = make_tree(["las-b19-002"])
    _edit_roster_row(roster_path, save_roster, lambda row: row.pop("revision"))
    with pytest.raises(ExportError, match="roster .*revision"):
        export_product.export_bank(root, roster_path)


def test_a_revision_too_long_to_parse_is_refused(make_tree):
    root, roster_path = make_tree(["las-b19-002"])
    text = roster_path.read_text(encoding="utf-8")
    roster_path.write_text(text.replace('"revision": 1,', '"revision": ' + "9" * 5000 + ",", 1), encoding="utf-8")
    with pytest.raises(ExportError, match="roster is not readable JSON"):
        export_product.export_bank(root, roster_path)


@pytest.mark.parametrize("field,value", [
    ("unit_id", {"id": "las-b19-002"}),
    ("approval", ["approved"]),
    ("retired", 0),
    ("question_count", True),
    ("sha256", None),
])
def test_a_mistyped_roster_field_is_refused(make_tree, save_roster, field, value):
    root, roster_path = make_tree(["las-b19-002"])
    _edit_roster_row(roster_path, save_roster, lambda row: row.update({field: value}))
    with pytest.raises(ExportError, match="mistyped field"):
        export_product.export_bank(root, roster_path)


@pytest.mark.parametrize("unit_id,revision,section,number", [
    ("las-b" + "9" * 40 + "-002", 1, "LÄS", 1),   # 63 characters: over the API's 60
    ("las-b19-002", 100, "LÄS", 1),               # past the revision bound
    ("las-b19-002", True, "LÄS", 1),
    ("las-b19-002", "1", "LÄS", 1),
    ("las-b19-002", 1, "LAS", 1),                 # not the app's section literal
    ("las-b19-002", 1, "ELF", 1),                 # not the section of a las- unit
    ("las-b19-002", 1, "LÄS", 0),
    ("las-b19-002", 1, "LÄS", 1000),
    ("las-b19-002", 1, "LÄS", True),
    ("las-b19-002-r1", 1, "LÄS", 1),
    ("LAS-b19-002", 1, "LÄS", 1),
    ("las-b١٩-002", 1, "LÄS", 1),       # non-ASCII digits
])
def test_make_qid_refuses_anything_but_the_documented_shape(unit_id, revision, section, number):
    with pytest.raises(ExportError, match="qid"):
        export_product.make_qid(unit_id, revision, section, number)


def test_the_qid_bounds_are_inclusive():
    assert build_roster.MAX_REVISION == 99
    assert export_product.make_qid("las-b19-002", 99, "LÄS", 999) == "p5-las-b19-002-r99-LÄS-999"
    assert len(export_product.make_qid("las-b" + "9" * 37 + "-002", 1, "LÄS", 1)) == export_product.QID_MAX == 60


def test_an_export_whose_qid_would_pass_60_characters_is_refused(make_tree, save_roster, rehash):
    root, roster_path = make_tree(["las-b19-002"])
    long_id = "las-b" + "9" * 40 + "-002"
    path = root / B19
    unit = json.loads(path.read_text(encoding="utf-8"))
    unit["candidate_id"] = long_id
    path.write_text(json.dumps(unit, ensure_ascii=False, indent=2), encoding="utf-8")
    _edit_roster_row(roster_path, save_roster, lambda row: row.update(unit_id=long_id))
    rehash(root, roster_path, long_id)
    with pytest.raises(ExportError, match="60"):
        export_product.export_bank(root, roster_path)


# ------------------------------------------------------------ bank schema

@pytest.mark.parametrize("mutate", [
    lambda bank: bank["questions"][0].update(revision={"note": "internal"}),
    lambda bank: bank["questions"][0].update(revision=True),
    lambda bank: bank["questions"][0].update(number=True),
    lambda bank: bank["questions"][0].update(number="1"),
    lambda bank: bank["questions"][0].update(title=[bank["questions"][0]["title"]]),
    lambda bank: bank["questions"][0].update(unit_id={"id": bank["questions"][0]["unit_id"]}),
    lambda bank: bank["questions"][0]["options"][0].update(text={"text": "x"}),
    lambda bank: bank["questions"][0].update(provpass={}),
    lambda bank: bank["questions"][0].update(answer=["A"]),
    lambda bank: bank["questions"][0].update(qid=bank["questions"][0]["qid"] + "-x"),
    lambda bank: bank["questions"][0].update(exam_id=bank["questions"][0]["exam_id"] + "0"),
    lambda bank: bank.update(preview="false"),
    lambda bank: bank.update(stamp=["PREVIEW"]),
    lambda bank: bank.update(exclusion_pairs=[["las-b18-001", {"unit": "las-b19-001"}]]),
    lambda bank: bank.update(exclusion_pairs=[["las-b18-001"]]),
    lambda bank: bank.update(questions={"0": bank["questions"][0]}),
])
def test_the_bank_schema_refuses_nested_or_mistyped_fields(approved_export, mutate):
    bank = copy.deepcopy(_bank(approved_export))
    mutate(bank)
    with pytest.raises(ExportError, match="bank schema"):
        export_product.check_schema(bank)


def test_every_export_conforms_to_the_bank_schema(approved_export, pending_export):
    for files in (approved_export, pending_export):
        export_product.check_schema(_bank(files))


def test_the_bank_schema_is_checked_on_every_export(monkeypatch):
    build = export_product.build_rows

    def nested(*args):
        rows = build(*args)
        rows[0]["revision"] = {"note": "internal"}  # no denylisted key: only the schema can catch it
        return rows

    monkeypatch.setattr(export_product, "build_rows", nested)
    with pytest.raises(ExportError, match="bank schema"):
        export_product.export_bank(REPO_ROOT, ROSTER, units=["las-b19-002"])


# ---------------------------------------------------------- determinism

def test_reruns_are_byte_identical():
    one = export_product.export_bank(REPO_ROOT, ROSTER, release="preview", include_pending=True)
    two = export_product.export_bank(REPO_ROOT, ROSTER, release="preview", include_pending=True)
    assert sorted(one) == ["_export-manifest.json", "p5-bank-preview.json"]
    assert one == two


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_committed_sample_is_reproduced_under_any_hash_seed(seed):
    exporter = build_roster.INFOLD_DIR / "export_product.py"
    done = subprocess.run([sys.executable, str(exporter), "--sample", "--check"],
                          env={**os.environ, "PYTHONHASHSEED": seed},
                          capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr


def test_nondeterministic_output_is_refused(monkeypatch):
    counter = itertools.count()
    render = export_product.render_json
    monkeypatch.setattr(export_product, "render_json",
                        lambda obj: render(obj) + str(next(counter)).encode())
    with pytest.raises(ExportError, match="non-deterministic"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="preview")


# -------------------------------------------------------- exclusion pairs

def test_single_session_sets_refuse_exclusion_pairs():
    pair = ["las-b18-001", "las-b19-001"]
    with pytest.raises(ExportError, match="exclusion pair"):
        export_product.export_bank(REPO_ROOT, ROSTER, units=pair, single_session=True)
    with pytest.raises(ExportError, match="exclusion pair"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="preview", include_pending=True,
                                   units=["elf-b3-002", "las-b3-002"], single_session=True)
    bank = _bank(export_product.export_bank(REPO_ROOT, ROSTER, units=pair))
    assert bank["exclusion_pairs"] == [pair]
    single = _bank(export_product.export_bank(REPO_ROOT, ROSTER, units=pair[:1], single_session=True))
    assert single["exclusion_pairs"] == []


# --------------------------------------------------------------- lint

def test_learner_lint_is_clean_on_every_exported_string(pending_export, tmp_path):
    lint = _manifest(pending_export)["lint"]
    assert lint["findings"] == []
    assert lint["strings_checked"] == 112 * 2 + 306 * 5
    bank_file = tmp_path / "p5-bank-preview.json"
    bank_file.write_bytes(pending_export["p5-bank-preview.json"])
    linter = REPO_ROOT / "pipeline/synthetic/gates/scripts/lint_learner_output.py"
    done = subprocess.run([sys.executable, str(linter), str(bank_file)],
                          capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout


def test_a_lint_finding_blocks_the_export_and_names_the_unit(make_tree, rehash):
    root, roster_path = make_tree(["las-b19-002"])
    path = root / B19
    unit = json.loads(path.read_text(encoding="utf-8"))
    unit["questions"][0]["options"][1]["text"] += " (scope_shift)"
    path.write_text(json.dumps(unit, ensure_ascii=False, indent=2), encoding="utf-8")
    rehash(root, roster_path, "las-b19-002")
    with pytest.raises(ExportError, match=r"L2-SNAKE.*las-b19-002"):
        export_product.export_bank(root, roster_path)


# ------------------------------------------------- manifest, CLI, sample

def test_the_manifest_binds_roster_exporter_and_candidates(approved_export, committed_roster):
    manifest = _manifest(approved_export)
    assert manifest["roster"]["sha256"] == build_roster.sha256_bytes(ROSTER.read_bytes())
    exporter = build_roster.INFOLD_DIR / "export_product.py"
    assert manifest["exporter"]["sha256"] == build_roster.sha256_bytes(exporter.read_bytes())
    bank_name = "p5-bank-preview.json"
    assert manifest["bank"] == {"path": bank_name,
                                "sha256": build_roster.sha256_bytes(approved_export[bank_name])}
    by_id = {u["unit_id"]: u for u in committed_roster["units"]}
    for unit in manifest["units"]:
        assert unit["sha256"] == by_id[unit["unit_id"]]["sha256"]
        assert unit["revision"] == by_id[unit["unit_id"]]["revision"]
    # The internal-label gate derives its id series from every Layer-1 catalog.
    catalogs = sorted((REPO_ROOT / "frameworks").glob("*.json"))
    assert manifest["frameworks"] == [
        {"path": f"frameworks/{p.name}", "sha256": build_roster.sha256_bytes(p.read_bytes())} for p in catalogs]
    assert "bank-internal-label" in manifest["gates"]


def test_output_is_written_only_into_the_preview_directory(tmp_path, approved_export):
    out = tmp_path / "out"
    assert export_product.main(["--out", str(out)]) == 1
    with pytest.raises(ExportError, match="inside pipeline/synthetic/infold/preview/"):
        export_product.write_export(approved_export, out)
    with pytest.raises(ExportError, match="inside pipeline/synthetic/infold/preview/"):
        export_product.write_export(approved_export, export_product.PREVIEW_DIR)
    assert not out.exists()


def test_the_committed_sample_is_current_and_balanced():
    assert export_product.main(["--sample", "--check"]) == 0
    bank = json.loads((export_product.SAMPLE_DIR / "p5-bank-sample.json").read_text(encoding="utf-8"))
    rows = bank["questions"]
    sections = {}
    for row in rows:
        sections.setdefault(row["section"], set()).add(row["unit_id"])
    assert {k: len(v) for k, v in sections.items()} == {"LÄS": 2, "ELF": 2}
    assert any(row["prompt"] == "Gap (1)" for row in rows)
    assert bank["preview"] is False


# ----------------------------------------------------- output confinement

EXPORT = {"p5-bank-preview.json": b'{"bank": true}\n', export_product.MANIFEST_NAME: b'{"manifest": true}\n'}


@pytest.fixture
def preview_root(tmp_path, monkeypatch):
    """A throwaway stand-in for pipeline/synthetic/infold/preview."""
    root = tmp_path / "preview"
    root.mkdir()
    monkeypatch.setattr(export_product, "PREVIEW_DIR", root)
    return root


def _names(directory) -> list[str]:
    return sorted(p.name for p in directory.iterdir())


def test_an_export_is_written_as_fresh_regular_files(preview_root, tmp_path):
    out = preview_root / "full" / "nested"
    export_product.write_export(EXPORT, out)  # creates the directories
    export_product.write_export(EXPORT, out)  # replaces its own files
    assert {p.name: p.read_bytes() for p in out.iterdir()} == EXPORT  # no temporary file left behind
    control = tmp_path / "control"
    control.write_bytes(b"")
    for path in out.iterdir():
        assert stat.S_ISREG(path.lstat().st_mode)
        assert stat.S_IMODE(path.lstat().st_mode) == stat.S_IMODE(control.lstat().st_mode)  # umask only


def test_a_hard_linked_output_file_is_replaced_not_written_through(preview_root, tmp_path):
    out = preview_root / "full"
    out.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_bytes(b"keep")
    os.link(outside, out / "p5-bank-preview.json")
    export_product.write_export(EXPORT, out)
    assert outside.read_bytes() == b"keep"
    assert (out / "p5-bank-preview.json").read_bytes() == EXPORT["p5-bank-preview.json"]


@pytest.mark.parametrize("target", ["outside", "dangling", "inside"])
def test_a_symlinked_output_file_is_refused(preview_root, tmp_path, target):
    out = preview_root / "full"
    out.mkdir()
    victim = {"outside": tmp_path / "outside.json", "dangling": tmp_path / "absent.json",
              "inside": preview_root / "sample" / "p5-bank-sample.json"}[target]
    if target != "dangling":
        victim.parent.mkdir(exist_ok=True)
        victim.write_bytes(b"keep")
    # The second file of the export: the first must not be written either.
    (out / export_product.MANIFEST_NAME).symlink_to(victim)
    with pytest.raises(ExportError, match="is a symlink"):
        export_product.write_export(EXPORT, out)
    if target == "dangling":
        assert not victim.exists()
    else:
        assert victim.read_bytes() == b"keep"
    assert _names(out) == [export_product.MANIFEST_NAME]


@pytest.mark.parametrize("target", ["outside", "inside"])
def test_a_symlinked_parent_directory_is_refused(preview_root, tmp_path, target):
    real = tmp_path / "elsewhere" if target == "outside" else preview_root / "real"
    real.mkdir()
    (preview_root / "full").symlink_to(real, target_is_directory=True)
    for out in (preview_root / "full", preview_root / "full" / "nested"):
        with pytest.raises(ExportError, match="is a symlink"):
            export_product.write_export(EXPORT, out)
    assert _names(real) == []


def test_a_dot_dot_output_path_is_refused(preview_root, tmp_path):
    with pytest.raises(ExportError, match="inside"):
        export_product.write_export(EXPORT, preview_root / "full" / ".." / ".." / "escape")
    assert not (tmp_path / "escape").exists()


def test_check_mode_never_reads_through_a_symlink(preview_root, tmp_path, monkeypatch, capsys):
    sample = preview_root / "sample"
    sample.mkdir()
    for path in (build_roster.INFOLD_DIR / "preview" / "sample").iterdir():
        twin = tmp_path / path.name  # identical bytes, outside the preview root
        twin.write_bytes(path.read_bytes())
        (sample / path.name).symlink_to(twin)
    monkeypatch.setattr(export_product, "SAMPLE_DIR", sample)
    assert export_product.main(["--sample", "--check"]) == 1
    assert "is a symlink" in capsys.readouterr().err

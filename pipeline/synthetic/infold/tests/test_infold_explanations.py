"""Layer-2 explanation pilot and its export gate (docs/p5-infold-design.md §D,
§4 row 2; bead hpf-no7l).

data/explanations/p5-pilot.json holds one reviewed Layer-2 entry for every
question of six approved units. `export_product.py --explanations` pairs a
release's bank with the shard data/explanations/p5-<release>.json only after
validating it against the exported rows: one entry per exported qid, every
wrong option explained exactly once and in order, real Layer-1 framework ids of
the question's own section, no internal label or rationale text, zero
default-mode learner-output lint findings and canonical bytes. It refuses,
writing nothing, on anything else, and a bank without a validated shard
references none.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

import pytest

import build_roster
import export_product

REPO_ROOT = build_roster.REPO_ROOT
ROSTER = build_roster.ROSTER_PATH
ExportError = export_product.ExportError
PILOT = export_product.PILOT_UNITS
PILOT_SHARD = REPO_ROOT / "data/explanations/p5-pilot.json"
LINTER = REPO_ROOT / "pipeline/synthetic/gates/scripts/lint_learner_output.py"
BANK, SHARD, MANIFEST = "p5-bank-pilot.json", "p5-pilot.json", export_product.MANIFEST_NAME
LAS_Q1 = "p5-las-b14-002-r1-LÄS-001"      # key C: the wrong options are A, B, D
LAS_B19_Q2 = "p5-las-b19-002-r1-LÄS-002"  # key A
CLOZE_Q1 = "p5-elf-b18-002-r1-ELF-001"    # key C, a gap question: no framework id
# MathText's math delimiters (app/src/components/MathText.tsx).
MATH_OPEN, MATH_CLOSE = chr(0xE000), chr(0xE001)


def _shard() -> dict:
    return json.loads(PILOT_SHARD.read_text(encoding="utf-8"))


def _rows(files: dict) -> list[dict]:
    return json.loads(files[BANK])["questions"]


def _candidate(committed_roster: dict, unit_id: str) -> dict:
    entry = next(u for u in committed_roster["units"] if u["unit_id"] == unit_id)
    return json.loads((REPO_ROOT / entry["source"]).read_text(encoding="utf-8"))


def _edited(qid: str, edit) -> dict:
    shard = _shard()
    edit(shard[qid])
    return shard


def _export(root, roster_path, **options) -> dict:
    options.setdefault("release", "pilot")
    return export_product.export_bank(root, roster_path, explanations=True, **options)


@pytest.fixture(scope="session")
def pilot_export() -> dict:
    return export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT), explanations=True)


@pytest.fixture
def shard_tree(make_tree):
    """A throwaway repo root with the pilot units, the Layer-1 frameworks and a
    shard at data/explanations/p5-<release>.json: the pilot shard, the given
    entries rendered the way the exporter renders them, or raw bytes."""

    def _make(shard=None, *, raw=None, units=PILOT, release="pilot"):
        root, roster_path = make_tree(list(units))
        shutil.copytree(REPO_ROOT / export_product.FRAMEWORKS_REL, root / export_product.FRAMEWORKS_REL)
        target = root / export_product.EXPLANATIONS_REL / f"p5-{release}.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        if raw is None:
            raw = export_product.render_json(_shard() if shard is None else shard)
        target.write_bytes(raw)
        return root, roster_path, target

    return _make


# --------------------------------------------------------------- the pilot

def test_the_pilot_covers_both_sections_short_and_long_passages_and_cloze(committed_roster):
    by_id = {u["unit_id"]: u for u in committed_roster["units"]}
    assert len(PILOT) == len(set(PILOT)) == 6
    assert set(export_product.SAMPLE_UNITS) < set(PILOT)  # the PR 1 sample plus two units
    assert all(by_id[u]["approval"] == "approved" and not by_id[u]["retired"] for u in PILOT)
    assert {by_id[u]["section"] for u in PILOT} == {"LÄS", "ELF"}
    assert sum(by_id[u]["question_count"] for u in PILOT) == 19
    shapes = {}
    for unit_id in PILOT:
        meta = _candidate(committed_roster, unit_id)["generator_meta"]
        shapes[unit_id] = meta.get("block_format") or meta.get("size")
    assert shapes == {"las-b7-002": "short", "las-b14-002": "long", "elf-b18-001": "long_passage_5q",
                      "elf-b18-002": "cloze_5gap", "elf-b19-003": "short_text_1q", "las-b19-002": "short"}
    assert by_id["las-b7-002"]["revision"] == 2  # an r2 qid is keyed too
    # No exclusion pair inside the pilot: it may stand for one session's content.
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT),
                                       explanations=True, single_session=True)
    assert json.loads(files[BANK])["exclusion_pairs"] == []


def test_the_pilot_shard_is_paired_with_the_pilot_bank(pilot_export):
    assert sorted(pilot_export) == sorted([BANK, SHARD, MANIFEST])
    rows = _rows(pilot_export)
    shard = json.loads(pilot_export[SHARD])
    assert list(shard) == [r["qid"] for r in rows]  # one entry per exported qid, in bank order
    assert {r["unit_id"] for r in rows} == set(PILOT) and len(rows) == 19
    assert {r["explanation_shard"] for r in rows} == {"explanations/p5-pilot.json"}
    assert pilot_export[SHARD] == PILOT_SHARD.read_bytes()  # the reviewed bytes are the bytes that ship
    assert "p5-las-b7-002-r2-LÄS-001" in shard and "p5-las-b7-002-r1-LÄS-001" not in shard


def test_the_manifest_binds_the_shard_and_the_frameworks(pilot_export):
    manifest = json.loads(pilot_export[MANIFEST])
    block = manifest["explanations"]
    assert block["path"] == SHARD and block["key"] == "explanations/p5-pilot.json"
    assert block["source"] == "data/explanations/p5-pilot.json"
    assert block["sha256"] == hashlib.sha256(PILOT_SHARD.read_bytes()).hexdigest()
    assert block["entries"] == 19
    assert block["lint"] == {"tool": export_product.LINT_REL, "mode": "default",
                             "strings_checked": block["lint"]["strings_checked"], "findings": []}
    assert block["lint"]["strings_checked"] > 19 * 10
    frameworks = {f["path"]: f["sha256"] for f in block["frameworks"]}
    for name in ("las_taxonomy.json", "elf_taxonomy.json"):
        raw = (REPO_ROOT / "frameworks" / name).read_bytes()
        assert frameworks[f"frameworks/{name}"] == hashlib.sha256(raw).hexdigest()
    assert manifest["gates"] == list(export_product.GATES) + list(export_product.EXPLANATION_GATES)


@pytest.mark.parametrize("strict", [False, True], ids=["default", "strict"])
def test_the_pilot_shard_is_clean_under_the_learner_lint_cli(strict):
    done = subprocess.run([sys.executable, str(LINTER), *(["--strict"] if strict else []), str(PILOT_SHARD)],
                          capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr
    assert "clean — 1 file(s)" in done.stdout


def test_every_pilot_explanation_states_its_key_and_explains_every_wrong_option(pilot_export):
    shard = _shard()
    for row in _rows(pilot_export):
        entry, key = shard[row["qid"]], row["answer"]
        verdict = f"Svaret är {key}." if row["section"] == "LÄS" else f"The answer is {key}."
        assert entry["solution_path"].endswith(verdict), row["qid"]
        assert entry["steps"][-1]["text"].endswith(verdict), row["qid"]
        wrong = [letter for letter in "ABCD" if letter != key]
        assert [d["letter"] for d in entry["distractors"]] == wrong, row["qid"]
        blob = json.dumps(entry, ensure_ascii=False)
        for letter in wrong:
            assert f"Svaret är {letter}" not in blob and f"The answer is {letter}" not in blob, row["qid"]
        assert 3 <= len(entry["steps"]) <= 6, row["qid"]
        assert entry["steps"][0]["tier"] == entry["steps"][-1]["tier"] == "essential", row["qid"]


QUOTED = re.compile(r"[“”]([^“”]+)”")


def _plain(text: str) -> str:
    text = re.sub(r"___\(\d+\)___", "___", text)
    return " ".join(text.replace("’", "'").replace("‘", "'").split())


def test_every_pilot_explanation_quotes_its_passage(pilot_export):
    shard = _shard()
    for row in _rows(pilot_export):
        entry = shard[row["qid"]]
        passage = _plain(row["context"])
        quotes = [_plain(m.group(1)).rstrip(".,") for text in
                  [entry["solution_path"], *(step["text"] for step in entry["steps"])]
                  for m in QUOTED.finditer(text)]
        assert [q for q in quotes if len(q) >= 15 and q in passage], f"{row['qid']}: no verbatim passage quote"


SWEDISH = (" och ", " att ", " det ", " är ", " inte ", " som ")
ENGLISH = (" the ", " and ", " is ", " of ", " to ", " that ")


def test_las_explanations_are_swedish_and_elf_explanations_english(pilot_export):
    shard = _shard()
    for row in _rows(pilot_export):
        entry = shard[row["qid"]]
        parts = [entry["solution_path"], entry["technique"], entry["pitfall"] or ""]
        parts += [f"{s['title']} {s['text']}" for s in entry["steps"]]
        parts += [f"{d['why_tempting']} {d['why_wrong']}" for d in entry["distractors"]]
        blob = f" {' '.join(parts).lower()} "
        swedish = sum(blob.count(w) for w in SWEDISH)
        english = sum(blob.count(w) for w in ENGLISH)
        if row["section"] == "LÄS":
            assert swedish > 5 * max(english, 1), row["qid"]
        else:
            assert english > 5 * max(swedish, 1), row["qid"]


def test_pilot_framework_ids_are_real_entries_of_the_question_section(pilot_export):
    catalog, _ = export_product.load_frameworks(REPO_ROOT)
    shard = _shard()
    for row in _rows(pilot_export):
        framework_id = shard[row["qid"]].get("framework_id")
        if row["unit_id"] == "elf-b18-002":
            # No Layer-1 entry covers gap filling; ELF-CLOZE-001 is a generation family.
            assert framework_id is None, row["qid"]
        else:
            assert catalog[framework_id] == row["section"], row["qid"]


# ---------------------------------------------------------------- coverage

def test_a_missing_explanation_is_refused(shard_tree):
    shard = _shard()
    del shard[LAS_Q1]
    root, roster_path, _ = shard_tree(shard)
    with pytest.raises(ExportError, match=f"no explanation for .*{re.escape(LAS_Q1)}"):
        _export(root, roster_path)


@pytest.mark.parametrize("qid", [
    "p5-las-b14-002-r1-LÄS-005",   # a question the unit does not have
    "p5-las-b7-002-r1-LÄS-001",    # a superseded revision of a pilot unit
    "p5-las-b19-001-r1-LÄS-001",   # an approved unit outside this export
    "host-2025-verb1-ELF-031",     # an authentic qid
    "_meta",                       # bookkeeping beside the entries
])
def test_an_entry_for_a_qid_outside_the_export_is_refused(shard_tree, qid):
    shard = _shard()
    shard[qid] = copy.deepcopy(shard[LAS_Q1])
    root, roster_path, _ = shard_tree(shard)
    with pytest.raises(ExportError, match="not in this export"):
        _export(root, roster_path)


def test_a_shard_for_more_units_than_the_export_is_refused(shard_tree):
    root, roster_path, _ = shard_tree()
    with pytest.raises(ExportError, match="not in this export"):
        _export(root, roster_path, units=[u for u in PILOT if u != "elf-b19-003"])


# --------------------------------------------------------------- distractors

@pytest.mark.parametrize("edit", [
    lambda e: e["distractors"].pop(),                                        # D missing
    lambda e: e["distractors"][0].update(letter="C"),                        # the key explained, A missing
    lambda e: e["distractors"].append(copy.deepcopy(e["distractors"][0])),   # A twice
    lambda e: e["distractors"][2].update(letter="E"),
    lambda e: e["distractors"][1].update(letter="b"),
    lambda e: e["distractors"].reverse(),                                    # out of order
    lambda e: e.update(distractors=[]),
], ids=["missing", "key", "duplicate", "E", "lowercase", "order", "none"])
def test_distractor_letters_must_be_exactly_the_wrong_options_in_order(shard_tree, edit):
    root, roster_path, _ = shard_tree(_edited(LAS_Q1, edit))
    with pytest.raises(ExportError, match="distractor letters"):
        _export(root, roster_path)


@pytest.mark.parametrize("edit,message", [
    (lambda e: e["distractors"][0].update(why_wrong="  "), "is empty"),
    (lambda e: e["distractors"][0].pop("why_tempting"), "has fields"),
    (lambda e: e["distractors"][0].update(trap="a planted trap"), "has fields"),
    (lambda e: e["distractors"][0].update(why_wrong=["a list"]), "not a string"),
    (lambda e: e["distractors"][0].update(letter=1), "not a string"),
    (lambda e: e.update(distractors={"A": "x"}), "not an array"),
    (lambda e: e["distractors"].__setitem__(0, "A"), "not an object"),
], ids=["empty", "missing-field", "extra-field", "list-text", "int-letter", "object", "string-item"])
def test_a_malformed_distractor_is_refused(shard_tree, edit, message):
    root, roster_path, _ = shard_tree(_edited(LAS_Q1, edit))
    with pytest.raises(ExportError, match=message):
        _export(root, roster_path)


# ------------------------------------------------------------- framework ids

@pytest.mark.parametrize("qid,value", [
    (LAS_Q1, "LAS-TYPE-099"),     # no such Layer-1 entry
    (LAS_Q1, "ELF-TYPE-001"),     # a real entry of another section
    (LAS_Q1, "XYZ-TRAP-001"),     # a real quant entry
    (LAS_Q1, "las-type-001"),     # ids are exact
    (CLOZE_Q1, "ELF-CLOZE-001"),  # a generation family, not a framework id
    (LAS_Q1, None),               # omit the field instead
    (LAS_Q1, 1),
    (LAS_Q1, ""),
], ids=["unknown", "other-section", "quant", "case", "generation-family", "null", "int", "empty"])
def test_an_invalid_framework_id_is_refused(shard_tree, qid, value):
    root, roster_path, _ = shard_tree(_edited(qid, lambda e: e.update(framework_id=value)))
    with pytest.raises(ExportError, match="framework_id"):
        _export(root, roster_path)


def test_the_frameworks_must_be_readable(shard_tree):
    root, roster_path, _ = shard_tree()
    (root / "frameworks" / "las_taxonomy.json").write_text("{", encoding="utf-8")
    with pytest.raises(ExportError, match="framework"):
        _export(root, roster_path)
    shutil.rmtree(root / "frameworks")
    with pytest.raises(ExportError, match="framework"):
        _export(root, roster_path)


# ------------------------------------------------- internal labels and lint

@pytest.mark.parametrize("edit,message", [
    (lambda e: e["distractors"][0].update(why_wrong=e["distractors"][0]["why_wrong"] + " (scope_shift)"),
     "L2-SNAKE"),
    (lambda e: e.update(solution_path="Ett hedgat påstående. " + e["solution_path"]), "L2-HEDGAT"),
    (lambda e: e.update(pitfall="Enligt G-STEM är detta en fälla."), "L2-GATEREF"),
    (lambda e: e["steps"][1].update(text=e["steps"][1]["text"] + " Familj: sockenmagasin-recension-long."),
     "internal label"),
    (lambda e: e.update(technique="Jämför med las-b14-002."), "internal label"),
    (lambda e: e.update(technique="Jämför med p5-las-b19-002-r1-LÄS-001."), "internal label"),
    (lambda e: e["steps"][0].update(title="LAS-TYPE-001"), "internal label"),
    (lambda e: e["steps"][2].update(text="Samma mönster som ELF-CLOZE-001."), "internal label"),
], ids=["snake", "hedgat", "gate", "family", "unit-id", "qid", "framework-id", "cloze-family"])
def test_a_leaked_internal_label_is_refused(shard_tree, edit, message):
    root, roster_path, _ = shard_tree(_edited(LAS_Q1, edit))
    with pytest.raises(ExportError, match=message):
        _export(root, roster_path)


def test_rationale_text_copied_into_an_explanation_is_refused(shard_tree, committed_roster):
    rationale = _candidate(committed_roster, "las-b19-002")["questions"][1]["rationale"]
    paragraph = rationale.split("\n\n")[2]  # the C paragraph, whole
    root, roster_path, _ = shard_tree(_edited(LAS_B19_Q2, lambda e: e["steps"][1].update(text=paragraph)))
    with pytest.raises(ExportError, match="rationale"):
        _export(root, roster_path)


def test_a_single_rationale_sentence_copied_into_an_explanation_is_refused(shard_tree, committed_roster):
    sentence = "Den uttalade alternativa finansieringen är driftsbudgeten."
    assert sentence in _candidate(committed_roster, "las-b19-002")["questions"][0]["rationale"]
    root, roster_path, _ = shard_tree(_edited(LAS_B19_Q2, lambda e: e.update(technique=sentence)))
    with pytest.raises(ExportError, match="rationale"):
        _export(root, roster_path)


# -------------------------------------------------------- entry shape

@pytest.mark.parametrize("edit,message", [
    (lambda e: e.pop("technique"), "has fields"),
    (lambda e: e.pop("pitfall"), "has fields"),
    (lambda e: e.update(_meta={"model": "x"}), "has fields"),
    (lambda e: e.update(rationale="x"), "has fields"),
    (lambda e: e.update(pregrade_tactic={"handle": "x", "move": "y"}), "has fields"),
    (lambda e: e.update(solution_path=""), "is empty"),
    (lambda e: e.update(solution_path=None), "not a string"),
    (lambda e: e.update(technique=" \n"), "is empty"),
    (lambda e: e.update(pitfall=""), "is empty"),
    (lambda e: e.update(pitfall=["x"]), "not a string"),
    (lambda e: e.update(steps=[]), "non-empty array"),
    (lambda e: e.update(steps={"1": "x"}), "non-empty array"),
    (lambda e: e["steps"].__setitem__(0, "x"), "not an object"),
    (lambda e: e["steps"][0].update(n=0), "numbered"),
    (lambda e: e["steps"].reverse(), "numbered"),
    (lambda e: e["steps"][1].update(n=1), "numbered"),
    (lambda e: e["steps"][0].update(n=True), "not an integer"),
    (lambda e: e["steps"][0].update(n=1.0), "not an integer"),
    (lambda e: e["steps"][1].update(tier="optional"), "tier"),
    (lambda e: e["steps"][1].pop("tier"), "has fields"),
    (lambda e: e["steps"][1].pop("title"), "has fields"),
    (lambda e: e["steps"][1].update(source="x"), "has fields"),
    (lambda e: e["steps"][1].update(text=""), "is empty"),
    (lambda e: e.update(solution_path=e["solution_path"] + " " + MATH_OPEN + "x"), "math delimiters"),
    (lambda e: e["steps"][0].update(text=MATH_CLOSE + e["steps"][0]["text"]), "math delimiters"),
], ids=["no-technique", "no-pitfall", "meta", "rationale", "pregrade", "empty-path", "null-path",
        "blank-technique", "empty-pitfall", "list-pitfall", "no-steps", "object-steps", "string-step",
        "step-zero", "step-order", "step-repeat", "step-bool", "step-float", "tier", "no-tier", "no-title",
        "step-extra", "empty-step", "open-math", "stray-close"])
def test_a_malformed_explanation_is_refused(shard_tree, edit, message):
    root, roster_path, _ = shard_tree(_edited(LAS_Q1, edit))
    with pytest.raises(ExportError, match=message):
        _export(root, roster_path)


def test_an_entry_that_is_not_an_object_is_refused(shard_tree):
    shard = _shard()
    shard[LAS_Q1] = "Svaret är C."
    root, roster_path, _ = shard_tree(shard)
    with pytest.raises(ExportError, match="not an object"):
        _export(root, roster_path)


# ------------------------------------------------------- the shard file

@pytest.mark.parametrize("raw,message", [
    (b"", "is empty"),
    (b"  \n", "is empty"),
    (b"{}\n", "holds no explanations"),
    (b"[]\n", "object keyed by qid"),
    (b"null\n", "object keyed by qid"),
    (b"{not json\n", "not readable JSON"),
    (b"\xff\xfe{}", "not UTF-8"),
    (b'{"a": NaN}', "non-finite"),
    (b'{"a": Infinity}', "non-finite"),
], ids=["empty", "blank", "no-entries", "array", "null", "broken", "not-utf8", "nan", "infinity"])
def test_a_malformed_or_empty_shard_is_refused(shard_tree, raw, message):
    root, roster_path, _ = shard_tree(raw=raw)
    with pytest.raises(ExportError, match=message):
        _export(root, roster_path)


def test_a_shard_with_a_byte_order_mark_is_refused(shard_tree):
    root, roster_path, _ = shard_tree(raw="﻿".encode() + PILOT_SHARD.read_bytes())
    with pytest.raises(ExportError, match="not readable JSON"):
        _export(root, roster_path)


def test_a_shard_that_repeats_a_qid_is_refused(shard_tree):
    entry = json.dumps(_shard()[LAS_Q1], ensure_ascii=False)
    raw = ("{" + f'"{LAS_Q1}": {entry}, "{LAS_Q1}": {entry}' + "}").encode()
    root, roster_path, _ = shard_tree(raw=raw)
    with pytest.raises(ExportError, match="repeats the key"):
        _export(root, roster_path)


def test_a_missing_shard_is_refused():
    with pytest.raises(ExportError, match="does not exist"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="nosuch", units=list(PILOT), explanations=True)


def test_a_shard_that_is_a_symlink_or_a_directory_is_refused(shard_tree, tmp_path):
    root, roster_path, target = shard_tree()
    twin = tmp_path / "twin.json"
    twin.write_bytes(target.read_bytes())
    target.unlink()
    target.symlink_to(twin)
    with pytest.raises(ExportError, match="symlink"):
        _export(root, roster_path)
    target.unlink()
    target.mkdir()
    with pytest.raises(ExportError, match="not a regular file"):
        _export(root, roster_path)


@pytest.mark.parametrize("render", [
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=1) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=True, indent=2) + "\n",
    lambda shard: json.dumps(shard, ensure_ascii=False, indent=2),
    lambda shard: json.dumps(dict(reversed(list(shard.items()))), ensure_ascii=False, indent=2) + "\n",
], ids=["indent", "sorted-keys", "ascii-escapes", "no-newline", "entry-order"])
def test_a_shard_that_is_not_in_canonical_form_is_refused(shard_tree, render):
    root, roster_path, _ = shard_tree(raw=render(_shard()).encode())
    with pytest.raises(ExportError, match="canonical form"):
        _export(root, roster_path)


# --------------------------------------------------- the bank's reference

def test_an_export_without_explanations_references_no_shard():
    files = export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT))
    assert sorted(files) == sorted([BANK, MANIFEST])
    assert {r["explanation_shard"] for r in _rows(files)} == {None}
    manifest = json.loads(files[MANIFEST])
    assert manifest["explanations"] is None and manifest["gates"] == list(export_product.GATES)


@pytest.mark.parametrize("explanations,reference", [
    (True, None),
    (False, "explanations/p5-pilot.json"),
], ids=["shard-unreferenced", "reference-without-shard"])
def test_the_reference_is_set_exactly_when_the_shard_is_included(monkeypatch, explanations, reference):
    build = export_product.build_rows

    def rows_with(entry, unit, explanation_shard):
        return [dict(row, explanation_shard=reference) for row in build(entry, unit, explanation_shard)]

    monkeypatch.setattr(export_product, "build_rows", rows_with)
    with pytest.raises(ExportError, match="explanation shard"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT), explanations=explanations)


@pytest.mark.parametrize("mutate", [
    lambda rows: rows[0].update(explanation_shard="explanations/p5-other.json"),
    lambda rows: rows[0].update(explanation_shard={"key": "explanations/p5-pilot.json"}),
    lambda rows: rows[0].update(explanation_shard=None),  # rows disagree
    lambda rows: rows[0].update(explanation_shard="data/p5-pilot.json"),
], ids=["other-release", "object", "mixed", "wrong-prefix"])
def test_the_bank_schema_refuses_a_wrong_shard_reference(pilot_export, mutate):
    bank = json.loads(pilot_export[BANK])
    mutate(bank["questions"])
    with pytest.raises(ExportError, match="bank schema"):
        export_product.check_schema(bank)


def test_the_shard_key_fits_the_worker_content_whitelist(pilot_export):
    source = (REPO_ROOT / "worker/src/routes/content.ts").read_text(encoding="utf-8")
    content_path = re.compile(re.search(r"const CONTENT_PATH = /(.+)/\s*$", source, re.M).group(1))
    for row in _rows(pilot_export):
        assert content_path.fullmatch(row["explanation_shard"])


# -------------------------------------------------------------- determinism

def test_pilot_reruns_are_byte_identical(pilot_export):
    again = export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT), explanations=True)
    assert again == pilot_export


def test_a_shard_that_changes_between_the_two_builds_is_refused(monkeypatch):
    read = export_product.read_shard
    calls = []

    def changing(path, release):
        raw, shard = read(path, release)
        calls.append(path)
        if len(calls) > 1:  # the second build reads other, equally valid, canonical bytes
            shard = copy.deepcopy(shard)
            shard[LAS_Q1]["technique"] += " Läs alltid hela stycket."
            raw = export_product.render_json(shard)
        return raw, shard

    monkeypatch.setattr(export_product, "read_shard", changing)
    with pytest.raises(ExportError, match="non-deterministic"):
        export_product.export_bank(REPO_ROOT, ROSTER, release="pilot", units=list(PILOT), explanations=True)


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_pilot_export_is_reproduced_in_another_process(pilot_export, seed):
    code = ("import hashlib, json, sys; sys.path.insert(0, sys.argv[1]); import export_product as e; "
            "files = e.export_bank(e.REPO_ROOT, e.ROSTER_PATH, release='pilot', units=list(e.PILOT_UNITS), "
            "explanations=True); "
            "print(json.dumps({n: hashlib.sha256(b).hexdigest() for n, b in sorted(files.items())}))")
    done = subprocess.run([sys.executable, "-c", code, str(build_roster.INFOLD_DIR)],
                          env={**os.environ, "PYTHONHASHSEED": seed}, capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stderr
    expected = {n: hashlib.sha256(b).hexdigest() for n, b in sorted(pilot_export.items())}
    assert json.loads(done.stdout) == expected


# ---------------------------------------------------------------- the CLI

@pytest.fixture
def preview_root(tmp_path, monkeypatch):
    """A throwaway stand-in for pipeline/synthetic/infold/preview."""
    root = tmp_path / "preview"
    root.mkdir()
    monkeypatch.setattr(export_product, "PREVIEW_DIR", root)
    monkeypatch.setattr(export_product, "PILOT_DIR", root / "pilot")
    return root


def test_the_pilot_cli_writes_the_paired_export_into_the_preview(preview_root, pilot_export):
    assert export_product.main(["--pilot"]) == 0
    written = {p.name: p.read_bytes() for p in (preview_root / "pilot").iterdir()}
    assert written == pilot_export
    assert export_product.main(["--pilot", "--check"]) == 0
    (preview_root / "pilot" / SHARD).write_bytes(b"{}\n")
    assert export_product.main(["--pilot", "--check"]) == 1


@pytest.mark.parametrize("extra", [["--units", "las-b7-002"], ["--release", "x"], ["--explanations"],
                                   ["--sample"], ["--out", "elsewhere"]])
def test_the_pilot_cli_takes_no_selection_or_output_options(preview_root, extra):
    with pytest.raises(SystemExit):
        export_product.main(["--pilot", *extra])


def test_the_explanations_flag_pairs_any_release_with_its_shard(preview_root, capsys):
    out = preview_root / "custom"
    args = ["--release", "pilot", "--units", ",".join(PILOT), "--explanations", "--out", str(out)]
    assert export_product.main(args) == 0
    assert sorted(p.name for p in out.iterdir()) == sorted([BANK, SHARD, MANIFEST])
    assert "19 explanations" in capsys.readouterr().out
    missing = ["--release", "nosuch", "--units", ",".join(PILOT), "--explanations", "--out", str(out / "x")]
    assert export_product.main(missing) == 1
    assert "REFUSED" in capsys.readouterr().err and not (out / "x").exists()

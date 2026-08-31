"""Tests for the 2026-08-31 pipeline-hardening ägardom (bead hpf-y1p4)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import mech  # noqa: E402
from merge_verdicts import merge  # noqa: E402


# ---------------------------------------------------------------- item 1
def _form_unit(options):
    return {"candidate_id": "t", "questions": [{
        "q_index": 1, "key": "D",
        "options": [{"letter": l, "text": t} for l, t in zip("ABCD", options)],
    }]}


def test_absolutizer_family_extension_bites():
    v = mech.gate_form(_form_unit([
        "Every joint is rinsed", "so nothing has reached the tray yet",
        "Nothing comes out of them", "Water lingers on the tray"]))
    assert v["verdict"] == "flag"  # historical elf-b16-003 round-1 shape


def test_absolutizer_bigram_no_one():
    v = mech.gate_form(_form_unit([
        "No one ever checks", "Always wet", "Impossible to drain", "Water can linger"]))
    assert v["verdict"] == "flag"


def test_absolutizer_swedish_additions():
    for word in ("ingenting", "ingenstans", "uteslutande"):
        assert mech._has_absolutizer(f"Det beror {word} på vinden")


def test_absolutizer_no_false_positive_on_measured_text():
    assert not mech._has_absolutizer("Water can linger on the tray for a while")
    assert not mech._has_absolutizer("Nothingness as a concept")  # 'nothingness' != token 'nothing'


# ---------------------------------------------------------------- item 4
def _v(cid="u1", gate="G-KEY", target="q:1", by="model/leg1", just="because", vote=None, run=None):
    d = {"candidate_id": cid, "gate": gate, "target": target,
         "executed_by": by, "justification": just, "verdict": "pass"}
    if vote is not None:
        d["vote"] = vote
    if run is not None:
        d["run"] = run
    return d


def _write(tmp_path, name, records):
    p = tmp_path / name
    p.write_text("\n".join(json.dumps(r) for r in records) + "\n", encoding="utf-8")
    return p


def test_merge_collapses_stamped_and_unstamped_twin(tmp_path):
    raw = _write(tmp_path, "raw.jsonl", [_v()])
    stamped = _write(tmp_path, "stamped.jsonl", [_v(vote=2)])
    records, dropped = merge([raw, stamped])
    assert len(records) == 1 and dropped == 1
    assert records[0]["vote"] == 2  # vote-bearing copy wins


def test_merge_collapses_unstamped_arriving_after_stamped(tmp_path):
    stamped = _write(tmp_path, "stamped.jsonl", [_v(vote=2)])
    raw = _write(tmp_path, "raw.jsonl", [_v()])
    records, dropped = merge([stamped, raw])
    assert len(records) == 1 and dropped == 1 and records[0]["vote"] == 2


def test_merge_keeps_distinct_votes(tmp_path):
    a = _write(tmp_path, "a.jsonl", [_v(vote=1)])
    b = _write(tmp_path, "b.jsonl", [_v(vote=2)])
    records, dropped = merge([a, b])
    assert len(records) == 2 and dropped == 0
    assert {r["vote"] for r in records} == {1, 2}


def test_merge_keeps_different_evidence(tmp_path):
    a = _write(tmp_path, "a.jsonl", [_v(just="reason A")])
    b = _write(tmp_path, "b.jsonl", [_v(just="reason B")])
    records, dropped = merge([a, b])
    assert len(records) == 2 and dropped == 0


def test_merge_batch16_regression_shape(tmp_path):
    # the exact 8b bug: same leg present raw + vote-stamped => one ballot, not two
    legs = [_v(target=f"q:{i}", just=f"j{i}") for i in (1, 2)]
    raw = _write(tmp_path, "raw.jsonl", legs)
    stamped = _write(tmp_path, "st.jsonl", [dict(v, vote=2) for v in legs])
    records, dropped = merge([raw, stamped])
    assert len(records) == 2 and dropped == 2
    assert all(r.get("vote") == 2 for r in records)


# ---------------------------------------------------------------- item 3
def _mk_batch(tmp_path, mutate=None, drop_sheet=False, contaminate=False):
    b = tmp_path / "batchX"
    unit = {
        "candidate_id": "las-b99-001", "title": "T", "passage": "P text.",
        "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A",
                       "options": [{"letter": "A", "text": "ett"},
                                   {"letter": "B", "text": "två"}],
                       "rationale": "internal"}],
        "generator_meta": {"x": 1},
    }
    (b / "candidates-final").mkdir(parents=True)
    (b / "candidates-final" / "las-b99-001.json").write_text(
        json.dumps(unit, ensure_ascii=False), encoding="utf-8")
    blind = {"candidate_id": unit["candidate_id"], "passage": unit["passage"],
             "questions": [{"q_index": 1, "prompt": "Fråga?",
                            "options": unit["questions"][0]["options"]}]}
    stems = {"candidate_id": unit["candidate_id"],
             "questions": [{"q_index": 1, "prompt": "Fråga?",
                            "options": unit["questions"][0]["options"]}]}
    dist = {"candidate_id": unit["candidate_id"], "passage": unit["passage"],
            "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A",
                           "options": unit["questions"][0]["options"]}]}
    if contaminate:
        blind["key"] = "A"
    if mutate:
        blind["passage"] = "STALE passage."
    for name, obj in (("blind", blind), ("stems", stems), ("distractor", dist)):
        d = b / name
        d.mkdir()
        if not (drop_sheet and name == "stems"):
            (d / "las-b99-001.json").write_text(json.dumps(obj, ensure_ascii=False),
                                                encoding="utf-8")
    return b


def _run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                          capture_output=True, text=True)


def test_sheet_sync_ok(tmp_path):
    b = _mk_batch(tmp_path)
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 0, r.stdout + r.stderr


def test_sheet_sync_catches_stale_passage(tmp_path):
    b = _mk_batch(tmp_path, mutate=True)
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "blind passage" in r.stdout


def test_sheet_sync_catches_missing_sheet(tmp_path):
    b = _mk_batch(tmp_path, drop_sheet=True)
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "sheet file missing" in r.stdout


def test_sheet_sync_catches_contamination(tmp_path):
    b = _mk_batch(tmp_path, contaminate=True)
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "forbidden field" in r.stdout


# ---------------------------------------------------------------- item 2
def test_assembly_disposition_bare_pass_fails(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("Name proximity Quennerby/Quennerly — disposition owed: elf-b16-001\n",
                   encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text(json.dumps({"candidate_id": "elf-b16-001", "gate": "G-REGISTER",
                              "verdict": "pass", "findings": []}) + "\n", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 1 and "DISPOSITION-OWED elf-b16-001" in r.stdout


def test_assembly_disposition_explicit_sentence_passes(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("disposition owed: elf-b16-001\n", encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text(json.dumps({"candidate_id": "elf-b16-001", "gate": "G-REGISTER",
                              "verdict": "pass", "findings": [],
                              "disposition": "different roles, different batches, no same-test collision"})
                  + "\n", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 0, r.stdout


def test_assembly_disposition_not_applicable_passes(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("disposition owed: las-b16-002\n", encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text(json.dumps({"candidate_id": "las-b16-002", "gate": "G-REGISTER",
                              "verdict": "pass",
                              "findings": [{"severity": "note",
                                            "note": "not-applicable: no proximity in scope"}]})
                  + "\n", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 0, r.stdout


def test_assembly_no_marker_ok(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("nothing owed here\n", encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text("", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 0


# ---------------------------------------------------------------- item 5
def test_lint_flags_all_three_classes(tmp_path):
    f = tmp_path / "expl.json"
    f.write_text(json.dumps({
        "a": "B är scope_shift och den intuitiva fällan",
        "b": "Påståendet är hedgat och avgränsat",
        "c": "mech.py's absolutiser list holds none but not nothing",
    }, ensure_ascii=False), encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 1
    for rule in ("L2-SNAKE", "L2-HEDGAT", "L2-GATEREF"):
        assert rule in r.stdout


def test_lint_clean_text_passes(tmp_path):
    f = tmp_path / "expl.json"
    f.write_text(json.dumps({
        "a": "B vänder på riktningen i det led som bär textens poäng.",
        "b": "Påståendet är reserverat och avgränsat.",
    }, ensure_ascii=False), encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 0, r.stdout


def test_lint_gateref_round_version_phrase(tmp_path):
    f = tmp_path / "x.md"
    f.write_text("the round-2 version of this paragraph claimed the same conclusion",
                 encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 1 and "L2-GATEREF" in r.stdout


# ------------------------------------------------- 2026-08-31 GC-review round
def test_absolutizer_bigram_not_across_sentence_boundary():
    assert not mech._has_absolutizer("There is no. One explanation remains.")
    assert mech._has_absolutizer("No one explanation covers it")


def test_absolutizer_second_family_pass():
    for w in ("nowhere", "everyone", "everybody", "everything"):
        assert mech._has_absolutizer(f"It is {w} at once")


def test_sheet_sync_missing_dir_fails_closed(tmp_path):
    b = _mk_batch(tmp_path, drop_sheet=True)
    import shutil
    shutil.rmtree(b / "stems")
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "directory" in r.stdout
    r2 = _run("check_sheet_sync.py", "--allow-missing-dirs", b)
    assert r2.returncode == 0, r2.stdout


def test_sheet_sync_empty_candidates_fails(tmp_path):
    b = tmp_path / "batchY"
    (b / "candidates-final").mkdir(parents=True)
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "empty" in r.stdout


def test_sheet_sync_orphan_sheet_fails(tmp_path):
    b = _mk_batch(tmp_path)
    (b / "blind" / "las-b99-999.json").write_text("{}", encoding="utf-8")
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "orphan" in r.stdout


def test_sheet_sync_contamination_alias_answer_key(tmp_path):
    b = _mk_batch(tmp_path)
    p = b / "blind" / "las-b99-001.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    d["answer_key"] = "A"
    p.write_text(json.dumps(d), encoding="utf-8")
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "answer_key" in r.stdout


def test_sheet_sync_candidate_id_drift_fails(tmp_path):
    b = _mk_batch(tmp_path)
    p = b / "stems" / "las-b99-001.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    d["candidate_id"] = "las-b99-777"
    p.write_text(json.dumps(d), encoding="utf-8")
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1 and "candidate_id" in r.stdout


def test_merge_rejects_missing_identity(tmp_path):
    bad = _write(tmp_path, "bad.jsonl", [{"gate": "G-KEY", "target": "q:1",
                                          "verdict": "pass"}])
    from merge_verdicts import MergeContractError
    with pytest.raises(MergeContractError):
        merge([bad])


def test_merge_rejects_weak_identity(tmp_path):
    bad = _write(tmp_path, "bad.jsonl", [{"candidate_id": "u", "gate": "G-KEY",
                                          "target": "q:1", "verdict": "pass"}])
    from merge_verdicts import MergeContractError
    with pytest.raises(MergeContractError):
        merge([bad])


def test_merge_rejects_nonint_vote(tmp_path):
    from merge_verdicts import MergeContractError
    for vote in ("", 0, "2", True):
        bad = _write(tmp_path, "bad.jsonl", [dict(_v(), vote=vote)])
        with pytest.raises(MergeContractError):
            merge([bad])


def test_disposition_content_free_findings_do_not_discharge(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("disposition owed: elf-b16-001\n", encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text(json.dumps({"candidate_id": "elf-b16-001", "gate": "G-REGISTER",
                              "verdict": "flag",
                              "findings": [{"severity": "note", "note": "seen"}]})
                  + "\n", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 1


def test_disposition_marker_wrapped_across_lines(tmp_path):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text("name proximity, disposition\nowed: elf-b16-001\n", encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text("", encoding="utf-8")
    r = _run("check_assembly_dispositions.py", asm, vf)
    assert r.returncode == 1 and "elf-b16-001" in r.stdout


def test_lint_snake_evasions_caught(tmp_path):
    f = tmp_path / "x.json"
    f.write_text(json.dumps({"a": "B är scope_x här", "b": "C är scope_2_shift",
                             "c": "D är Scope_shift", "d": "E är SCOPE_SHIFT"}),
                 encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 1 and r.stdout.count("L2-SNAKE") == 4


def test_lint_math_subscripts_still_protected(tmp_path):
    f = tmp_path / "x.json"
    f.write_text(json.dumps({"a": "Låt v_r + v_g = 117 och a_1 + a_n = b_m; K_2007=11."}),
                 encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 0, r.stdout


def test_lint_lowercase_gateref_caught_but_math_form_free(tmp_path):
    f = tmp_path / "bad.json"
    f.write_text(json.dumps({"a": "enligt g-stem är detta blint", "b": "Mech.py listan"}),
                 encoding="utf-8")
    r = _run("lint_learner_output.py", f)
    assert r.returncode == 1 and "L2-GATEREF" in r.stdout
    g = tmp_path / "good.json"
    g.write_text(json.dumps({"a": "skriv om på k-m-form: y = kx + m-form ger lutningen"}),
                 encoding="utf-8")
    r2 = _run("lint_learner_output.py", g)
    assert r2.returncode == 0, r2.stdout

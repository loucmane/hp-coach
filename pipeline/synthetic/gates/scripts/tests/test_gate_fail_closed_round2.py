"""PR #370 fix round 2 (bead hpf-oy2w): five fail-open gate paths, closed.

Codex exact-head review hpf-3uon (HOLD at d0265ef). These are gates: every
input a gate cannot positively verify must fail closed — never an unreadable
or empty input turned into a clean result, never a marker or a twin resolved
by borrowing.

Red-first: the defect tests failed on head d0265ef; the guard tests (named
in docs/worklog/hpf-oy2w.md) passed there and must keep passing.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from check_sheet_sync import check_batch  # noqa: E402
from merge_verdicts import MergeContractError, merge  # noqa: E402


def _run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                          capture_output=True, text=True)


# ------------------------------- A: assembly sentence ends whatever the case
def _asm(tmp_path, text, verdicts=()):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text(text, encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text("".join(json.dumps(v) + "\n" for v in verdicts), encoding="utf-8")
    return _run("check_assembly_dispositions.py", asm, vf)


def _disposed(unit):
    return {"candidate_id": unit, "gate": "G-REGISTER", "verdict": "pass", "findings": [],
            "disposition": "different roles, different batches, no same-test collision"}


def _owed_units(stdout):
    return [line.split(": line")[0] for line in stdout.splitlines()
            if line.startswith("DISPOSITION-OWED")]


NO_UNIT = "DISPOSITION-OWED <no unit named>"


def test_review_repro_lowercase_clause_does_not_borrow_the_unit(tmp_path):
    # hpf-3uon repro, verbatim: head exits 0 "all discharged"
    r = _asm(tmp_path, "- elf-b16-003 is clean. cross-batch echo; disposition owed.\n",
             [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


@pytest.mark.parametrize("gap", [". ", "; ", "! ", "? ", ".) ", '." ', ".** ", ";\n  "])
def test_sentence_ends_whatever_the_case_of_the_next_word(tmp_path, gap):
    r = _asm(tmp_path, f"- elf-b16-003 is clean{gap}cross-batch echo, disposition owed.\n",
             [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


def test_unit_in_a_lowercase_sentence_after_the_marker_is_not_lent(tmp_path):
    r = _asm(tmp_path, "- Cross-batch echo, disposition owed. elf-b16-003 is clean.\n",
             [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


def test_named_clause_after_a_semicolon_is_dischargeable(tmp_path):
    # guard (green on head): the remedy for a "<no unit named>" clause is to
    # name the units inside it
    text = "- Same-batch adjacency, cross-language; disposition owed: las-b16-001, elf-b16-003.\n"
    r = _asm(tmp_path, text, [_disposed("las-b16-001")])
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-003"]
    r2 = _asm(tmp_path, text, [_disposed("las-b16-001"), _disposed("elf-b16-003")])
    assert r2.returncode == 0, r2.stdout


# guard (green on head): no split inside abbreviations, decimals, file names
def test_abbreviations_decimals_and_file_names_stay_inside_the_sentence(tmp_path):
    text = ("- Name echo elf-b16-001 vs. elf-b15-002 (e.g. both invented, fk 8.7,\n"
            "  i.e. per ASSEMBLY.md), disposition owed.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b15-002")])
    assert _owed_units(r2.stdout) == ["DISPOSITION-OWED elf-b16-001"]


# guard (green on head)
def test_swedish_abbreviations_stay_inside_the_sentence(tmp_path):
    text = ("- Namneko elf-b16-001 resp. elf-b15-002 (t.ex. båda påhittade, bl.a. ingen\n"
            "  omdöpning, dvs. ingen kollision, jfr. s.k. närpar), disposition owed.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b15-002"]


def test_abbreviation_before_a_capitalised_word_does_not_split(tmp_path):
    # round-1 residual 2: head split after "e.g." when a capital followed
    text = "- Echo elf-b16-001 vs elf-b15-002 (e.g. Quennerby, Quennerly), disposition owed.\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout


# ------------------------------- B: the lint must examine at least one file
def _lint(*paths):
    return _run("lint_learner_output.py", *paths)


def _clean_json(path):
    path.write_text(json.dumps({"a": "B vänder på riktningen i det led som bär poängen."},
                               ensure_ascii=False), encoding="utf-8")
    return path


def test_lint_empty_directory_fails_closed(tmp_path):
    store = tmp_path / "store"
    store.mkdir()
    r = _lint(store)
    assert r.returncode == 2, r.stdout
    assert f"INPUT-FAIL {store}: no lintable file" in r.stdout
    assert "clean" not in r.stdout


def test_lint_directory_without_lintable_files_fails_closed(tmp_path):
    store = tmp_path / "store"
    store.mkdir()
    (store / "_index.json").write_text("{}", encoding="utf-8")   # bookkeeping: skipped
    (store / "notes.csv").write_text("a,b\n", encoding="utf-8")  # not a lintable suffix
    r = _lint(store)
    assert r.returncode == 2, r.stdout
    assert f"INPUT-FAIL {store}: no lintable file" in r.stdout


def test_lint_empty_directory_beside_a_clean_file_fails_closed(tmp_path):
    good = _clean_json(tmp_path / "expl.json")
    store = tmp_path / "store"
    store.mkdir()
    r = _lint(good, store)
    assert r.returncode == 2, r.stdout
    assert f"INPUT-FAIL {store}: no lintable file" in r.stdout


def test_lint_missing_path_fails_closed_without_traceback(tmp_path):
    missing = tmp_path / "no-such-store"
    r = _lint(missing)
    assert r.returncode == 2, r.stdout + r.stderr
    assert f"INPUT-FAIL {missing}: path does not exist" in r.stdout
    assert "Traceback" not in r.stderr


# ------------------------------- C: unparseable JSON is an input failure
def test_lint_unparseable_json_fails_closed_naming_the_file(tmp_path):
    bad = tmp_path / "expl.json"
    bad.write_text('{"a": "B vänder på riktningen", ', encoding="utf-8")  # truncated
    r = _lint(bad)
    assert r.returncode == 2, r.stdout
    assert f"INPUT-FAIL {bad}: not valid JSON" in r.stdout


def test_lint_unparseable_json_inside_a_store_fails_closed(tmp_path):
    store = tmp_path / "store"
    store.mkdir()
    _clean_json(store / "host-2017.json")
    bad = store / "host-2018.json"
    bad.write_text('{"a": "ren text"}\n{"b": "ett andra dokument"}\n', encoding="utf-8")
    r = _lint(store)
    assert r.returncode == 2, r.stdout
    assert f"INPUT-FAIL {bad}: not valid JSON" in r.stdout


def test_lint_reports_findings_and_input_failures_together(tmp_path):
    bad = tmp_path / "a.json"
    bad.write_text("{", encoding="utf-8")
    hit = tmp_path / "b.json"
    hit.write_text(json.dumps({"a": "Påståendet är hedgat"}, ensure_ascii=False),
                   encoding="utf-8")
    r = _lint(bad, hit)
    assert r.returncode == 2, r.stdout       # an input failure outranks findings
    assert f"INPUT-FAIL {bad}: not valid JSON" in r.stdout and "L2-HEDGAT" in r.stdout


def test_lint_non_utf8_input_fails_closed(tmp_path):
    f = tmp_path / "expl.md"
    f.write_bytes("B vänder på riktningen".encode("latin-1"))
    r = _lint(f)
    assert r.returncode == 2, r.stdout + r.stderr
    assert f"INPUT-FAIL {f}: not readable as UTF-8" in r.stdout
    assert "Traceback" not in r.stderr


# ------------------------------- D: sheet-sync alias normalisation
UNIT = "las-b99-001"


def _batch(tmp_path):
    b = tmp_path / "batchX"
    opts = [{"letter": "A", "text": "ett"}, {"letter": "B", "text": "två"}]
    unit = {"candidate_id": UNIT, "title": "T", "passage": "P text.",
            "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A", "options": opts,
                           "rationale": "internal"}]}
    sheets = {
        "blind": {"candidate_id": UNIT, "passage": unit["passage"],
                  "questions": [{"q_index": 1, "prompt": "Fråga?", "options": opts}]},
        "stems": {"candidate_id": UNIT,
                  "questions": [{"q_index": 1, "prompt": "Fråga?", "options": opts}]},
        "distractor": {"candidate_id": UNIT, "passage": unit["passage"],
                       "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A",
                                      "options": opts}]},
    }
    (b / "candidates-final").mkdir(parents=True)
    (b / "candidates-final" / f"{UNIT}.json").write_text(
        json.dumps(unit, ensure_ascii=False), encoding="utf-8")
    for name, obj in sheets.items():
        (b / name).mkdir()
        (b / name / f"{UNIT}.json").write_text(json.dumps(obj, ensure_ascii=False),
                                               encoding="utf-8")
    return b


def _contaminate(batch, sheet, mutate):
    p = batch / sheet / f"{UNIT}.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    mutate(d)
    p.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")


def _contamination(problems, sheet, alias):
    return [p for p in problems
            if p.startswith(f"SYNC-FAIL {UNIT} {sheet} ") and alias in p
            and "forbidden field" in p]


def test_sheet_sync_review_repro_camelcase_answer_on_blind(tmp_path):
    b = _batch(tmp_path)
    assert _run("check_sheet_sync.py", b).returncode == 0   # the clean fixture passes
    _contaminate(b, "blind", lambda d: d.update(correctAnswer="A"))
    r = _run("check_sheet_sync.py", b)
    assert r.returncode == 1, r.stdout
    assert f"SYNC-FAIL {UNIT} blind correctAnswer: forbidden field" in r.stdout


ANSWER_ALIASES = ("correctAnswer", "Answer", "ANSWER_KEY", "answer-key", "Correct Answer",
                  "CorrectOption", "answerLetter", "isCorrect", "Solution", "FACIT",
                  "rätt_svar", "Rätt svar", "ratt_svar", "rättSvar", "korrekt_svar",
                  "Key", "KEYS")


@pytest.mark.parametrize("alias", ANSWER_ALIASES)
def test_sheet_sync_answer_alias_on_blind_fails_closed(tmp_path, alias):
    b = _batch(tmp_path)
    _contaminate(b, "blind", lambda d: d["questions"][0].update({alias: "A"}))
    assert _contamination(check_batch(b, allow_missing_dirs=False), "blind", alias)


_PLACES = {
    "top": lambda d: d.update(correctAnswer="A"),
    "question": lambda d: d["questions"][0].update(correctAnswer="A"),
    "option": lambda d: d["questions"][0]["options"][1].update(correctAnswer=True),
    "deep": lambda d: d["questions"][0]["options"][1].update(
        meta=[{"audit": {"correctAnswer": "A"}}]),
}


@pytest.mark.parametrize("sheet", ["blind", "stems"])
@pytest.mark.parametrize("place", sorted(_PLACES))
def test_sheet_sync_alias_found_at_any_depth(tmp_path, sheet, place):
    b = _batch(tmp_path)
    _contaminate(b, sheet, _PLACES[place])
    assert _contamination(check_batch(b, allow_missing_dirs=False), sheet, "correctAnswer")


RATIONALE_ALIASES = ("Rationale", "whyWrong", "why-tempting", "Explanation", "generatorMeta",
                     "plantedTraps", "HedgeMap", "repair log", "selfBlindSolve")


@pytest.mark.parametrize("alias", RATIONALE_ALIASES)
def test_sheet_sync_rationale_alias_on_distractor_fails_closed(tmp_path, alias):
    b = _batch(tmp_path)
    _contaminate(b, "distractor", lambda d: d["questions"][0].update({alias: "x"}))
    assert _contamination(check_batch(b, allow_missing_dirs=False), "distractor", alias)


@pytest.mark.parametrize("sheet, alias", [("stems", "Passage"), ("stems", "TITLE"),
                                          ("stems", "Family"), ("blind", "FAMILY")])
def test_sheet_sync_sheet_specific_alias_fails_closed(tmp_path, sheet, alias):
    b = _batch(tmp_path)
    _contaminate(b, sheet, lambda d: d.update({alias: "x"}))
    assert _contamination(check_batch(b, allow_missing_dirs=False), sheet, alias)


# guard (green on head): the distractor sheet carries keys by contract
def test_sheet_sync_distractor_keys_are_not_contamination(tmp_path):
    b = _batch(tmp_path)
    assert check_batch(b, allow_missing_dirs=False) == []


# ------------------------------- E: a twin must be the same evidence
def _rec(*, vote=None, verdict="pass", **extra):
    d = {"candidate_id": "elf-b99-001", "gate": "G-KEY", "target": "q:1",
         "verdict": verdict, "findings": [], "executed_by": "model/G-KEY",
         "justification": "leg 2: solved A from paragraph 2", **extra}
    if vote is not None:
        d["vote"] = vote
    return d


def _write(tmp_path, name, records):
    p = tmp_path / name
    p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records),
                 encoding="utf-8")
    return p


def test_review_repro_stamped_pass_and_unstamped_kill_fail_closed(tmp_path):
    # hpf-3uon repro: head collapsed these to the stamped pass (twins=1)
    stamped = _write(tmp_path, "gkey-2v.jsonl", [_rec(vote=2)])
    raw = _write(tmp_path, "gkey-2.jsonl", [_rec(verdict="kill")])
    for order in ([stamped, raw], [raw, stamped]):
        with pytest.raises(MergeContractError) as exc:
            merge(order)
        msg = str(exc.value)
        assert f"{raw}:1" in msg and f"{stamped}:1" in msg and "verdict" in msg


@pytest.mark.parametrize("field, value", [
    ("findings", [{"severity": "minor", "note": "B also defensible"}]),
    ("executed_at", "2026-08-31T10:00:00Z"),
    ("q_index", 2)])
def test_twin_differing_beyond_vote_fails_closed(tmp_path, field, value):
    stamped = _write(tmp_path, "gkey-2v.jsonl", [_rec(vote=2)])
    raw = _write(tmp_path, "gkey-2.jsonl", [_rec(**{field: value})])
    with pytest.raises(MergeContractError, match=field):
        merge([stamped, raw])


def test_twin_pair_inside_one_file_differing_beyond_vote_fails_closed(tmp_path):
    f = _write(tmp_path, "gkey-resolved.jsonl", [_rec(vote=2), _rec(verdict="kill")])
    with pytest.raises(MergeContractError):
        merge([f])


def test_cli_refuses_a_non_twin_and_writes_nothing(tmp_path):
    stamped = _write(tmp_path, "gkey-2v.jsonl", [_rec(vote=2)])
    raw = _write(tmp_path, "gkey-2.jsonl", [_rec(verdict="kill")])
    out = tmp_path / "merged.jsonl"
    r = _run("merge_verdicts.py", stamped, raw, "--out", out)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "MERGE CONTRACT VIOLATION" in r.stderr
    assert not out.exists()


# guard (green on head): batch16 verdicts-r3 shape — a raw leg whose stamped
# copy occurs twice (gkey-2v and gkey-resolved-v) folds once
def test_raw_leg_with_two_identical_stamped_copies_still_folds(tmp_path):
    leg = _rec()
    v1 = _write(tmp_path, "gkey-2v.jsonl", [dict(leg, vote=2)])
    v2 = _write(tmp_path, "gkey-resolved-v.jsonl", [dict(leg, vote=2)])
    raw = _write(tmp_path, "gkey-2.jsonl", [leg])
    records, stats = merge([v1, v2, raw])
    assert records == [dict(leg, vote=2)]
    assert (stats.superseded, stats.duplicates, stats.twins) == (0, 1, 1)


# guard (green on head): the twin is found among several stamped records of
# one identity, so a repaired stamped record for the same slot does not
# turn its own raw copy into a contradiction
def test_twin_found_among_several_stamped_records_of_one_identity(tmp_path):
    leg = _rec()
    old = _write(tmp_path, "gkey-2v.jsonl", [dict(leg, vote=2, verdict="kill")])
    new = _write(tmp_path, "gkey-2v-repair.jsonl", [dict(leg, vote=2)])
    raw = _write(tmp_path, "gkey-2.jsonl", [leg])
    records, stats = merge([old, new, raw])
    assert records == [dict(leg, vote=2)]
    assert (stats.superseded, stats.duplicates, stats.twins) == (1, 0, 1)

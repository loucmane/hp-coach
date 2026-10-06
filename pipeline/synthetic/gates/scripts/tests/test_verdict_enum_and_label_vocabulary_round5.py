"""PR #370 fix round 5 (bead hpf-6fkm): the two [PRE-EXISTING] findings of
Codex exact-head review R5 (hpf-4te8, HOLD at 16b88ed).

1. merge_verdicts.py: every record must carry a `verdict` and a `gate` from
   the verdict schema's enums, checked per line before any supersession — an
   unknown verdict in a repair record used to supersede a kill.
2. lint_learner_output.py: tier 1 (default mode) folds case, diacritics and
   underscores before matching, and its vocabulary covers every snake_case
   label in the pipeline's label sources; the coverage test below scans those
   sources, so a new label cannot slip past the lint again.

Red-first: the defect tests failed on head 16b88ed; the guard tests (marked
"guard" and named in docs/worklog/hpf-6fkm.md) passed there and must keep
passing. Tests marked "added after the red run" cover what the fix turned up
(non-object lines, the schema loader, review and audit statuses); they fail
on head too, as the worklog's second red run shows.
"""
from __future__ import annotations

import ast
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
SYNTHETIC = SCRIPTS.parents[1]                    # pipeline/synthetic
BATCHES = SYNTHETIC / "batches"
sys.path.insert(0, str(SCRIPTS))

import aggregate  # noqa: E402
import lint_learner_output as lint  # noqa: E402
import merge_verdicts  # noqa: E402
from merge_verdicts import MergeContractError, merge  # noqa: E402

SCHEMA = json.loads((SYNTHETIC / "gates/schemas/verdict.schema.json").read_text(encoding="utf-8"))
SCHEMA_VERDICTS = SCHEMA["properties"]["verdict"]["enum"]
SCHEMA_GATES = SCHEMA["properties"]["gate"]["enum"]


def _run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                          capture_output=True, text=True)


# =================================================== 1. merge: verdict enum
CID = "elf-b99-001"
CAND = {CID: {"candidate_id": CID, "section": "ELF", "questions": [{"q_index": 1}]}}
_ABSENT = object()


def _rec(gate, target, *, vote=None, verdict="pass", by=None):
    d = {"candidate_id": CID, "gate": gate, "target": target, "verdict": verdict,
         "findings": [], "executed_by": by or f"model/{gate}"}
    if verdict is _ABSENT:
        del d["verdict"]
    if vote is not None:
        d["vote"] = vote
    return d


def _write(tmp_path, name, records):
    """One JSON line per record; None writes a blank line (line numbers count it)."""
    p = tmp_path / name
    p.write_text("".join("\n" if r is None else json.dumps(r, ensure_ascii=False) + "\n"
                         for r in records), encoding="utf-8")
    return p


def _complete_unit():
    """Every record aggregate.py requires for a one-question ELF unit, all pass."""
    recs = [_rec(g, "passage") for g in ("M-SCHEMA", "M-BANDS", "M-PLAGIARISM", "G-REGISTER")]
    recs += [_rec("G-ENG", "passage", vote=n, by=f"model/G-ENG-{n}") for n in (1, 2, 3)]
    recs += [_rec("G-KEY", "q:1", vote=n, by=f"model/G-KEY-{n}") for n in (1, 2)]
    recs += [_rec("G-STEM", "q:1"), _rec("G-DISTRACTOR", "q:1")]
    return recs


def _review_repro(tmp_path, repair_verdict):
    """hpf-4te8 repro: base G-STEM kill, later same-slot repair with `repair_verdict`."""
    base = [r for r in _complete_unit() if r["gate"] != "G-STEM"]
    base.append(_rec("G-STEM", "q:1", verdict="kill", by="model/G-STEM-r1"))
    repair = _rec("G-STEM", "q:1", verdict=repair_verdict, by="model/G-STEM-r2")
    return (_write(tmp_path, "verdicts.jsonl", base),
            _write(tmp_path, "regate.jsonl", [repair]))


def _status(records):
    return aggregate.aggregate(records, CAND)[CID]["status"]


def test_review_repro_unknown_verdict_cannot_supersede_a_kill(tmp_path):
    # head 16b88ed: merged, the repair replaced the kill -> SURVIVED_CLEAN
    base, regate = _review_repro(tmp_path, "not-a-verdict")
    with pytest.raises(MergeContractError) as exc:
        merge([base, regate])
    msg = str(exc.value)
    assert f"{regate}:1:" in msg and "'not-a-verdict'" in msg and "verdict" in msg


# guard (green on head): the fixture is the finding's shape — the kill alone
# is DEAD, a valid repair supersedes it
def test_review_repro_fixture_with_a_valid_repair(tmp_path):
    base, regate = _review_repro(tmp_path, "pass")
    assert _status(merge([base])[0]) == "DEAD"
    assert _status(merge([base, regate])[0]) == "SURVIVED_CLEAN"


INVALID_VERDICTS = [
    pytest.param(_ABSENT, id="missing"),
    pytest.param(None, id="null"),
    pytest.param("", id="empty"),
    pytest.param("PASS", id="upper-case"),
    pytest.param("Kill", id="title-case"),
    pytest.param(" pass", id="leading-space"),
    pytest.param("pass\n", id="trailing-newline"),
    pytest.param("not-a-verdict", id="unknown-string"),
    pytest.param("DEAD", id="aggregate-status"),
    pytest.param(True, id="bool"),
    pytest.param(1, id="int"),
    pytest.param(["pass"], id="list"),
    pytest.param({"verdict": "pass"}, id="object"),
]


@pytest.mark.parametrize("verdict", INVALID_VERDICTS)
def test_repair_with_an_invalid_verdict_is_refused(tmp_path, verdict):
    base, regate = _review_repro(tmp_path, verdict)
    with pytest.raises(MergeContractError, match=re.escape(f"{regate}:1:")):
        merge([base, regate])


def _bad():
    return _rec("G-STEM", "q:1", verdict="not-a-verdict")


@pytest.mark.parametrize("position", [
    "superseded-by-a-later-file", "restated-later-in-the-same-file",
    "folded-unstamped-twin", "byte-identical-duplicate"])
def test_invalid_verdict_is_refused_where_a_merge_rule_would_drop_it(tmp_path, position):
    # head 16b88ed merged all four silently: the invalid record was replaced,
    # restated away, folded into its twin or collapsed as a duplicate
    if position == "superseded-by-a-later-file":
        bad = _write(tmp_path, "verdicts.jsonl", [_rec("G-DISTRACTOR", "q:1"), None, _bad()])
        files, line = [bad, _write(tmp_path, "regate.jsonl", [_rec("G-STEM", "q:1", by="m/r2")])], 3
    elif position == "restated-later-in-the-same-file":
        bad = _write(tmp_path, "gstem.jsonl", [_bad(), _rec("G-STEM", "q:1")])  # same identity
        files, line = [bad], 1
    elif position == "folded-unstamped-twin":
        leg = _rec("G-KEY", "q:1", verdict="PASS", by="model/G-KEY")
        bad = _write(tmp_path, "gkey-2.jsonl", [leg])
        files, line = [bad, _write(tmp_path, "gkey-2v.jsonl", [dict(leg, vote=2)])], 1
    else:
        bad = _write(tmp_path, "a.jsonl", [_bad()])
        files, line = [bad, _write(tmp_path, "b.jsonl", [_bad()])], 1
    with pytest.raises(MergeContractError, match=re.escape(f"{bad}:{line}:")):
        merge(files)


@pytest.mark.parametrize("gate", ["G-key", "g-stem", "G-STEM ", "G-SPRÅK", "G_KEY", "M-NEW"])
def test_unknown_gate_is_refused_naming_file_and_line(tmp_path, gate):
    f = _write(tmp_path, "v.jsonl", [_rec("G-STEM", "q:1"), _rec(gate, "q:1", verdict="kill")])
    with pytest.raises(MergeContractError, match=re.escape(f"{f}:2:")):
        merge([f])


def test_kill_under_a_misspelt_gate_is_refused_not_ignored(tmp_path):
    # head 16b88ed: merged; aggregate.py only counts kills from gates it
    # knows, so the "G-STEM " kill vanished -> SURVIVED_CLEAN
    base = _write(tmp_path, "verdicts.jsonl", _complete_unit())
    leg = _write(tmp_path, "gstem-r2.jsonl", [_rec("G-STEM ", "q:1", verdict="kill", by="m/r2")])
    with pytest.raises(MergeContractError, match=re.escape(f"{leg}:1:")):
        merge([base, leg])


def test_existing_record_checks_name_the_line_too(tmp_path):
    f = _write(tmp_path, "v.jsonl", [_rec("G-STEM", "q:1"), dict(_rec("G-KEY", "q:1"), candidate_id="")])
    with pytest.raises(MergeContractError, match=re.escape(f"{f}:2:")):
        merge([f])


# added after the red run: a line that is no JSON object carries no verdict
# either (head 16b88ed: JSONDecodeError / AttributeError tracebacks)
@pytest.mark.parametrize("line", ['{"candidate_id": "elf-b99-001",', '["pass"]', '"pass"', "null"],
                         ids=["truncated", "array", "string", "null"])
def test_a_line_that_is_not_a_json_object_is_refused_naming_file_and_line(tmp_path, line):
    f = tmp_path / "v.jsonl"
    f.write_text(json.dumps(_rec("G-STEM", "q:1")) + "\n\n" + line + "\n", encoding="utf-8")
    with pytest.raises(MergeContractError, match=re.escape(f"{f}:3:")):
        merge([f])


def test_merge_reads_its_enums_from_the_verdict_schema():
    assert merge_verdicts.VERDICTS == frozenset(SCHEMA_VERDICTS)
    assert merge_verdicts.GATES == frozenset(SCHEMA_GATES)


# added after the red run: a schema that lost the enum stops the merge
# instead of admitting every value
@pytest.mark.parametrize("schema", [
    {}, {"properties": []}, {"properties": {"verdict": {}}},
    {"properties": {"verdict": {"enum": []}}}, {"properties": {"verdict": {"enum": "pass"}}},
    {"properties": {"verdict": {"enum": ["pass", ""]}}}, {"properties": {"verdict": {"enum": ["pass", 1]}}}],
    ids=["no-properties", "properties-not-an-object", "no-enum", "empty-enum", "enum-not-a-list",
         "empty-string", "non-string"])
def test_a_schema_without_a_usable_enum_stops_the_merge(schema):
    with pytest.raises(RuntimeError, match=re.escape("properties.verdict.enum")):
        merge_verdicts.schema_enum(schema, "verdict")


# guard (green on head): aggregate.py kills on "kill", flags on "flag" and
# reads anything else as a pass, so a new schema verdict needs an aggregation
# rule before the merge may accept it; every gate aggregation names is a
# schema gate, so the merge never refuses a record aggregation needs
def test_schema_enums_match_what_aggregation_decides_on():
    assert set(SCHEMA_VERDICTS) == {"pass", "kill", "flag"}
    assert aggregate.LETHAL_GATES | aggregate.LANGUAGE_GATES <= set(SCHEMA_GATES)


# guard (green on head): every schema value merges unchanged
@pytest.mark.parametrize("verdict", SCHEMA_VERDICTS)
def test_every_schema_verdict_merges(tmp_path, verdict):
    f = _write(tmp_path, "v.jsonl", [_rec("G-STEM", "q:1", verdict=verdict)])
    assert [r["verdict"] for r in merge([f])[0]] == [verdict]


@pytest.mark.parametrize("gate", SCHEMA_GATES)
def test_every_schema_gate_merges(tmp_path, gate):  # guard (green on head)
    f = _write(tmp_path, "v.jsonl", [_rec(gate, "passage")])
    assert [r["gate"] for r in merge([f])[0]] == [gate]


# guard (green on head): what is deliberately NOT enforced. Real batch files
# carry 699 'unit', 118 'q1'..'q5' and 20 'q:' targets and 10 string
# findings; none of them can turn a kill or a flag into a pass
def test_off_schema_target_and_findings_still_merge(tmp_path):
    recs = [_rec("G-SPRAK", "unit"), _rec("G-KEY", "q1", vote=1), _rec("G-KEY", "q:", vote=2),
            dict(_rec("G-STEM", "q:1"), findings="none")]
    assert merge([_write(tmp_path, "v.jsonl", recs)])[0] == recs


def test_cli_refuses_an_invalid_verdict_and_writes_nothing(tmp_path):
    base, regate = _review_repro(tmp_path, "not-a-verdict")
    out = tmp_path / "merged.jsonl"
    r = _run("merge_verdicts.py", base, regate, "--out", out)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "MERGE CONTRACT VIOLATION" in r.stderr and f"{regate}:1:" in r.stderr
    assert not out.exists()


# ======================================= 2. lint: the tier-1 label vocabulary
def _flags(token, strict=False):
    return lint._Snake(strict=strict).search(f"Låt {token} vara här.") is not None


def _lint(tmp_path, *values, strict=False):
    f = tmp_path / "expl.json"
    f.write_text(json.dumps({f"s{i}": v for i, v in enumerate(values)}, ensure_ascii=False),
                 encoding="utf-8")
    return _run("lint_learner_output.py", *(["--strict"] if strict else []), f)


def _snake_lines(stdout):
    return [line for line in stdout.splitlines() if line.startswith("L2-SNAKE")]


REVIEW_LABELS = ("surface_lexical_echo", "WORLD_KNOWLEDGE", "outside_knowledge", "tone_misread")


def test_review_repro_real_labels_flag_in_default_mode(tmp_path):
    # head 16b88ed: "learner-output lint: clean — 1 file(s)"
    r = _lint(tmp_path, "A är surface_lexical_echo på kalken.",
              "Q3 bär en positiv blindgissning (PARTIALLY/WORLD_KNOWLEDGE).",
              "C is outside_knowledge: true in general, absent from the text.",
              "D är tone_misread — tonen är torr, inte ironisk.")
    assert r.returncode == 1, r.stdout
    lines = _snake_lines(r.stdout)
    assert len(lines) == 4
    assert all(label in line for label, line in zip(REVIEW_LABELS, lines))


@pytest.mark.parametrize("token", [
    "WORLD_KNOWLEDGE", "world_knowledge", "World_Knowledge", "plausible_World_Knowledge",
    "SURFACE_LEXICAL_ECHO", "Surface_Lexical_Echo_x", "OUTSIDE_KNOWLEDGE", "Tone_Misread",
    "TRUE_BUT_IRRELEVANT", "Wrong_Location", "structural_leak", "none_defensible",
    "författarens_hållning", "Författarens_Hållning", "jämförelse_relation", "hållning_stämning_ton"])
def test_tier1_folds_case_diacritics_and_underscores(token):
    assert _flags(token)


# added after the red run: review, sweep, audit and adjudication statuses
# (survey 2026-10-05: CONFIRMED_NOTES alone occurs 293 times in the batches)
@pytest.mark.parametrize("token", ["CONFIRMED_NOTES", "Confirmed_Notes", "BLOCKED_SHIP",
                                   "NEEDS_REDESIGN", "PUBLISH_READY", "GODKÄNN_NOTED",
                                   "UNRESOLVED_MITIGATED"])
def test_review_and_audit_statuses_flag_in_default_mode(token):
    assert _flags(token)


# added after the red run: every vocabulary label is itself a snake_case
# label, since a bare word would match inside unrelated tokens (trap in the
# store formula A_trap, stance in distance)
def test_every_vocabulary_label_is_a_snake_label():
    assert [x for x in lint._TAXONOMY_LABELS
            if not (lint._SNAKE_TOKEN.fullmatch(x) and _is_label_shaped(x))] == []


# guard (green on head): the stems keep catching their evasions
@pytest.mark.parametrize("token", ["scope_x", "scope_2_shift", "Scope_shift", "SCOPE_SHIFT",
                                   "DETAIL_AS_MAIN", "Plausible_worldknowledge_3",
                                   "hedge_map", "PLANTED_TRAPS", "refuted_agemarker_overhedged"])
def test_tier1_stems_still_catch_their_evasions(token):
    assert _flags(token)


# --------------------------------------------------- the label sources
# Survey 2026-10-05 (docs/worklog/hpf-6fkm.md). Field and script names
# (candidate_id, run_mech, why_wrong) are not labels and are not collected.
# Taxonomy outputs (las/families.json, las/outputs/*.json, elf/families.json)
# are generated from the definitions read here and add no label of their own.
TAXONOMY_DEFINITIONS = (
    # (file under pipeline/synthetic, module-level name, which strings are labels)
    ("las/scripts/question_taxonomy.py", "TRAP_TAGS", "keys"),     # LÄS trap tags
    ("las/scripts/question_taxonomy.py", "TYPE_RULES", "firsts"),  # LÄS question types
    ("las/scripts/question_taxonomy.py", "FALLBACK", "value"),
    ("las/scripts/genre_classify.py", "PRIORITY", "items"),       # LÄS genres
    ("las/scripts/genre_classify.py", "MACRO", "values"),         # LÄS macro genres
    ("elf/scripts/build_families.py", "TRAP_TAGS", "keys"),       # ELF trap tags
)
# candidate fields whose values are labels: planted_traps, engineered_traps,
# distractor_traps_by_qindex, trap_map, question_families, families_by_qindex,
# per_question_families, family, (fine_)genre, block_format,
# nearest_blueprint_preset, structural_skeleton, key_derivation
_LABEL_FIELD_SEGMENTS = {"trap", "traps", "family", "families", "genre", "format", "preset",
                         "skeleton", "derivation"}
# ALL_CAPS tokens the pipeline docs mention that are not classes or statuses:
# code constants (las/elf TRAP_TAGS, mech's ECHO_NAME_STOP), an environment
# variable, and a web crawler's error code quoted in originality notes
NOT_LABELS = {"TRAP_TAGS", "ECHO_NAME_STOP", "HP_PARSED_DIR", "CRAWL_UNKNOWN_ERROR"}
_JS_STRING = re.compile(r"""(['"`])([^'"`\n]*)\1""")
LABEL_SOURCES = ("gate schema enums", "ALL_CAPS classes and statuses in pipeline docs",
                 "verdict label fields", "ALL_CAPS values in batch records",
                 "ALL_CAPS literals in gate code", "taxonomy definitions",
                 "candidate label fields", "candidate rationales")


def _is_label_shaped(token):
    # subscript notation (shorter than 5, or no segment with two letters) is
    # math by the store's math-preservation contract, never a label
    return len(token) >= 5 and any(sum(c.isalpha() for c in seg) >= 2 for seg in token.split("_"))


def _is_caps_token(s):
    # a whole value or literal that is one ALL_CAPS snake token is an enum
    # value; ALL_CAPS inside prose can be a constant's name (GATEFLEET_PASS)
    return bool(lint._SNAKE_TOKEN.fullmatch(s)) and s.isupper()


def _string_values(obj):
    if isinstance(obj, dict):
        for v in obj.values():
            yield from _string_values(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _string_values(v)
    elif isinstance(obj, str):
        yield obj


def _enum_values(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "enum":
                yield from (x for x in v if isinstance(x, str))
            else:
                yield from _enum_values(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _enum_values(v)


def _definition(path, name, which):
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == name for t in node.targets):
            value = node.value
            strings = {"keys": lambda: value.keys, "values": lambda: value.values,
                       "items": lambda: value.elts,
                       "firsts": lambda: [e.elts[0] for e in value.elts],
                       "value": lambda: [value]}[which]()
            return [s.value for s in strings if isinstance(s, ast.Constant) and isinstance(s.value, str)]
    raise AssertionError(f"{path}: no module-level {name} — taxonomy definition moved?")


def _label_field_values(obj, inside=False):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not str(k).startswith("_"):
                yield from _label_field_values(
                    v, inside or bool(_LABEL_FIELD_SEGMENTS & set(str(k).lower().split("_"))))
    elif isinstance(obj, list):
        for v in obj:
            yield from _label_field_values(v, inside)
    elif isinstance(obj, str) and inside:
        yield obj


def label_sources():
    """{source: {label: {where it occurs}}} over the pipeline's label sources."""
    found = defaultdict(lambda: defaultdict(set))

    def add(source, text, where):
        for m in lint._SNAKE_TOKEN.finditer(text):
            if _is_label_shaped(m.group(0)):
                found[source][m.group(0)].add(where)

    for fp in sorted((SYNTHETIC / "gates/schemas").glob("*.json")):
        for value in _enum_values(json.loads(fp.read_text(encoding="utf-8"))):
            add("gate schema enums", value, fp.name)
    # the pipeline docs (gate prompts, runbooks, batch ADJUDICATION/STATUS
    # notes, eval results) write classes and statuses in ALL_CAPS
    # (STRUCTURAL_LEAK, SURVIVED_FLAGGED, CONFIRMED_NOTES, …); their lowercase
    # snake tokens are field and script names
    for fp in sorted(SYNTHETIC.rglob("*.md")):
        for n, line in enumerate(fp.read_text(encoding="utf-8").splitlines(), 1):
            for m in lint._SNAKE_TOKEN.finditer(line):
                if m.group(0).isupper() and m.group(0) not in NOT_LABELS:
                    add("ALL_CAPS classes and statuses in pipeline docs", m.group(0),
                        f"{fp.relative_to(SYNTHETIC)}:{n}")
    for fp in sorted(set(BATCHES.glob("batch*/verdicts*.jsonl")) | set(BATCHES.glob("batch*/verdicts*/*.jsonl"))):
        for n, line in enumerate(fp.read_text(encoding="utf-8").splitlines(), 1):
            v = json.loads(line) if line.strip() else {}
            for field in ("blind_classification", "solver_answer"):
                if isinstance(v.get(field), str):
                    add("verdict label fields", v[field], f"{fp.relative_to(BATCHES)}:{n}")
    # every batch record (verdicts, reviews, audits, reports, sweeps,
    # candidates) whose value is one whole ALL_CAPS token: audit_verdict
    # CONFIRMED_NOTES, the integrated sweep's BLOCKED_SHIP, law-16 results, …
    for fp in sorted(p for p in BATCHES.rglob("*") if p.suffix in (".json", ".jsonl")):
        text = fp.read_text(encoding="utf-8")
        for n, line in enumerate(text.splitlines() if fp.suffix == ".jsonl" else [text], 1):
            for value in _string_values(json.loads(line) if line.strip() else None):
                if _is_caps_token(value):
                    add("ALL_CAPS values in batch records", value, f"{fp.relative_to(BATCHES)}:{n}")
    # the gate scripts and the batch workflow decide and emit statuses as
    # string literals (aggregate.py, promote.py, vfinal_fold.py, the
    # workflow's review/sweep/audit enums); a constant's NAME is not a literal
    for fp in sorted((SYNTHETIC / "gates/scripts").glob("*.py")):
        if fp.name == "lint_learner_output.py":
            continue  # the vocabulary under test
        for node in ast.walk(ast.parse(fp.read_text(encoding="utf-8"))):
            if isinstance(node, ast.Constant) and isinstance(node.value, str) and _is_caps_token(node.value):
                add("ALL_CAPS literals in gate code", node.value, f"gates/scripts/{fp.name}:{node.lineno}")
    for fp in sorted((SYNTHETIC / "pipeline").glob("*.js")):
        for n, line in enumerate(fp.read_text(encoding="utf-8").splitlines(), 1):
            for m in _JS_STRING.finditer(line):
                if _is_caps_token(m.group(2)):
                    add("ALL_CAPS literals in gate code", m.group(2), f"pipeline/{fp.name}:{n}")
    for rel, name, which in TAXONOMY_DEFINITIONS:
        labels = _definition(SYNTHETIC / rel, name, which)
        assert labels, f"{rel}: {name} defines no label"
        for label in labels:
            add("taxonomy definitions", label, f"{rel}:{name}")
    for fp in sorted(BATCHES.glob("*/candidates*/**/*.json")):
        doc = json.loads(fp.read_text(encoding="utf-8"))
        for unit in doc if isinstance(doc, list) else [doc]:
            rel = str(fp.relative_to(BATCHES))
            for value in _label_field_values(unit):
                add("candidate label fields", value, rel)
            for q in unit.get("questions") or []:
                if isinstance(q.get("rationale"), str):
                    add("candidate rationales", q["rationale"], rel)
    return found


def test_every_label_in_the_label_sources_flags_in_default_mode():
    sources = label_sources()
    empty = [s for s in LABEL_SOURCES if not sources.get(s)]
    assert not empty, f"label sources that yielded nothing (moved or renamed?): {empty}"
    missed = defaultdict(set)
    for source, labels in sources.items():
        for label, where in labels.items():
            if not _flags(label):
                missed[label].add(f"{source}: {sorted(where)[0]}")
    assert not missed, (
        f"{len(missed)} label(s) the default-mode lint does not flag — add each to "
        f"lint_learner_output._TAXONOMY_LABELS (a code identifier a doc names in "
        f"ALL_CAPS goes to NOT_LABELS here instead):\n" + "\n".join(
            f"  {label}  ({'; '.join(sorted(where))})" for label, where in sorted(missed.items())))


# ------------------------------------------- math-preservation guards
CONTRACT_EXAMPLES = ("v_r", "a_n", "b_m", "K_2007", "a_1", "värde_B", "antal_A", "K_diff")
# every snake token in data/explanations at 16b88ed that has tier 2's shape
# (>= 5 characters, a segment with two letters): all formula names, and the
# ones a careless label stem would hit first (A_trap, total_area, F_shelf)
STORE_FORMULA_NAMES = (
    "110111_två", "210_fem", "A_rekt", "A_tot", "A_trap", "annan_linjär_a", "antal_A", "antal_B",
    "antal_cirk_kvinn", "antal_cirkulation_kvinnor_2002", "antal_matsmält_kvinn",
    "antal_matsmältning_kvinnor_2002", "BG_1G_2", "BG_2G_1", "d_Anna", "d_Berit", "F_shelf",
    "F_total", "första_term", "G_1BG_2", "G_2BG_1", "invanare_i", "K_diff", "K_skafferi",
    "linjär_a", "medel_i", "Median_A", "Median_B", "ordinarie_pris", "P_grön", "p_röd", "P_röd",
    "P_svart", "P_vit", "procent_A", "procent_B", "procent_cirk_kvinn", "procent_matsmält_kvinn",
    "R_box", "R_shelf", "R_total", "ruta_bredd", "s_total", "sida_1", "sida_2",
    "stapel_totalhöjd", "t_Anna", "t_Berit", "t_hög", "t_låg", "t_total", "total_area",
    "TOTAL_X", "TOTAL_Y", "utlands_incidens_i", "v_Anna", "v_Berit", "V_frys", "v_hög", "v_låg",
    "v_långsam", "V_skafferi", "v_snabb", "V_total", "värde_A", "värde_B", "värde_år1",
    "värde_år2", "x_max", "x_min", "y_max", "y_min", "y_slut", "y_start")


# guard (green on head): math notation never reaches tier 1
@pytest.mark.parametrize("names", [CONTRACT_EXAMPLES, STORE_FORMULA_NAMES],
                         ids=["contract-examples", "store-formula-names"])
def test_math_notation_never_flags_in_default_mode(names):
    assert [n for n in names if _flags(n)] == []


# guard (green on head): formula names stay tier-2 style debt (bead hpf-gyo5)
def test_store_formula_names_still_flag_in_strict_mode():
    assert [n for n in STORE_FORMULA_NAMES if not _flags(n, strict=True)] == []


# guard (green on head): the same through the CLI, every name in one file
def test_cli_default_mode_passes_formula_names(tmp_path):
    names = CONTRACT_EXAMPLES + STORE_FORMULA_NAMES
    r = _lint(tmp_path, *(f"Sätt {n} = 2 och räkna vidare." for n in names))
    assert r.returncode == 0, r.stdout
    r2 = _lint(tmp_path, *(f"Sätt {n} = 2 och räkna vidare." for n in names), strict=True)
    assert len(_snake_lines(r2.stdout)) == sum(map(_is_label_shaped, names))  # tier 2's shape

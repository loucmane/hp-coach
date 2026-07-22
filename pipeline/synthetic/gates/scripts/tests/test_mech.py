"""Self-contained tests for the mechanical gates + aggregation rule.

Run from pipeline/synthetic/gates/scripts:  python3 -m pytest tests/ -q
No app dependencies; builds its own tiny corpus fixtures.
"""

import copy
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aggregate import aggregate  # noqa: E402
from mech import Corpus, gate_bands, gate_form, gate_plagiarism, gate_schema, gate_tell, tokenize  # noqa: E402


def _q(idx, key, texts):
    return {"q_index": idx, "prompt": "P", "key": key,
            "options": [{"letter": L, "text": t} for L, t in zip("ABCD", texts)]}


def test_mtell_flags_systematic_longest_key():
    # key is the strict-longest option in both questions -> systematic tell
    cand = {"candidate_id": "las-b0-000", "questions": [
        _q(1, "A", ["one two three four five", "a", "b", "c"]),
        _q(2, "A", ["one two three four five", "a", "b", "c"]),
    ]}
    v = gate_tell(cand)
    assert v["verdict"] == "flag"
    assert "length tell" in v["findings"][0]["note"]


def test_mtell_passes_when_key_length_varies():
    cand = {"candidate_id": "las-b0-000", "questions": [
        _q(1, "A", ["a", "b", "c", "d"]),
        _q(2, "B", ["one two three", "x", "y", "z"]),
    ]}
    assert gate_tell(cand)["verdict"] == "pass"


def test_mform_flags_key_sole_measured_among_absolutes_sv():
    # The G-STEM kill shape (elf-b3-001 q5, las-b3-003 round-1 q2): every
    # distractor carries a hard absolutizer while the key is measured — the
    # key is pickable by form alone.
    cand = {"candidate_id": "las-b0-000", "questions": [
        _q(1, "C", ["Det är alltid samtalen, aldrig trafiken, som stör mest",
                    "Rosa brus är alltid den bästa lösningen för samtliga kontor",
                    "Effekten kan hjälpa, men den beror på arbetets art",
                    "Alla anställda störs helt av varje samtal i rummet"]),
    ]}
    v = gate_form(cand)
    assert v["verdict"] == "flag"
    assert "form tell" in v["findings"][0]["note"]


def test_mform_flags_english_absolutes():
    cand = {"candidate_id": "elf-b0-000", "questions": [
        _q(1, "D", ["The council always enforced every rule without fail",
                    "Baltic ports never allowed a single lamp to go dark",
                    "All keepers were entirely motivated by only the toll",
                    "Keepers were paid when ships arrived safely, so lit lamps served their interests"]),
    ]}
    assert gate_form(cand)["verdict"] == "flag"


def test_mform_passes_when_a_distractor_is_hedged_too():
    cand = {"candidate_id": "las-b0-000", "questions": [
        _q(1, "C", ["Oftast är det trafiken som stör mest, snarare än samtal",
                    "Rosa brus är alltid den bästa lösningen för samtliga kontor",
                    "Effekten kan hjälpa, men den beror på arbetets art",
                    "Alla anställda störs helt av varje samtal i rummet"]),
    ]}
    assert gate_form(cand)["verdict"] == "pass"


def test_mform_passes_when_key_is_also_absolute():
    # No sole-measured-key tell if the key itself absolutises.
    cand = {"candidate_id": "las-b0-000", "questions": [
        _q(1, "C", ["Det är alltid samtalen som stör mest i rummet",
                    "Rosa brus är alltid den bästa lösningen för samtliga",
                    "Effekten är alltid densamma oavsett arbetets art",
                    "Alla anställda störs helt av varje samtal i rummet"]),
    ]}
    assert gate_form(cand)["verdict"] == "pass"


def make_candidate(**over):
    cand = {
        "candidate_id": "las-b1-001",
        "section": "LÄS",
        "family": "test-family",
        "title": "Testpassage",
        "passage": (
            "Det här är en testpassage som handlar om någonting helt annat än den "
            "autentiska korpusen och som därför inte delar några längre ordföljder med den. "
            "Den innehåller flera meningar av rimlig längd så att statistiken hamnar rätt.\n\n"
            "Ett andra stycke gör att styckesräkningen hamnar inom det förväntade bandet. "
            "Texten fortsätter med ytterligare resonemang i lugn sakprosa av det slag som "
            "brukar förekomma i provets läsförståelsedel utan att efterlikna någon verklig text. "
        ) * 6,
        "questions": [
            {
                "q_index": 1,
                "prompt": "Vad handlar texten om enligt författaren?",
                "options": [
                    {"letter": "A", "text": "Ett första alternativ."},
                    {"letter": "B", "text": "Ett andra alternativ."},
                    {"letter": "C", "text": "Ett tredje alternativ."},
                    {"letter": "D", "text": "Ett fjärde alternativ."},
                ],
                "key": "B",
            }
        ],
    }
    cand.update(over)
    return cand


# ---------------------------------------------------------------- M-SCHEMA

def test_schema_pass():
    assert gate_schema(make_candidate())["verdict"] == "pass"


def test_placeholder_candidate_id_is_accepted():
    # Generators emit "PLACEHOLDER" pre-renumber; a self-check must be clean.
    v = gate_schema(make_candidate(candidate_id="PLACEHOLDER"))
    assert v["verdict"] == "pass"
    assert not any("candidate_id does not match" in f["note"] for f in v["findings"])


def test_malformed_candidate_id_still_flagged():
    v = gate_schema(make_candidate(candidate_id="nope-123"))
    assert any("candidate_id does not match" in f["note"] for f in v["findings"])


@pytest.mark.parametrize("mutate,why", [
    (lambda c: c["questions"][0]["options"].pop(), "3 options"),
    (lambda c: c["questions"][0].update(key="E"), "invalid key letter"),
    (lambda c: c["questions"][0]["options"][1].update(text=c["questions"][0]["options"][0]["text"]), "duplicate option text"),
    (lambda c: c.update(passage=""), "empty passage"),
    (lambda c: c["questions"][0]["options"][2].update(letter="A"), "duplicate letter"),
])
def test_schema_kills(mutate, why):
    c = make_candidate()
    mutate(c)
    v = gate_schema(c)
    assert v["verdict"] == "kill", why
    assert v["findings"], "kill must carry findings"


# ---------------------------------------------------------------- M-BANDS

def test_bands_pass_in_band():
    assert gate_bands(make_candidate())["verdict"] == "pass"


def test_bands_uncalibrated_flags_not_kills(tmp_path):
    # bands.json on disk is calibrated=true (see gates/bands.json); the
    # uncalibrated-downgrade behavior is tested against an explicit
    # uncalibrated fixture so it doesn't depend on that committed state.
    bands = json.loads((Path(__file__).resolve().parents[2] / "bands.json").read_text(encoding="utf-8"))
    bands["calibrated"] = False
    bp = tmp_path / "bands.json"
    bp.write_text(json.dumps(bands), encoding="utf-8")
    c = make_candidate(passage="Alldeles för kort passage. Bara två meningar.")
    v = gate_bands(c, bands_path=bp)
    assert v["verdict"] == "flag"  # calibrated=false => downgrade
    assert any("passage_words" in f["quote"] for f in v["findings"])


def test_band_check_union_across_classes():
    # a stat given as multiple class bands passes if the value is in ANY of
    # them -- e.g. ELF passage_words: cloze ~228-401, short_text ~101-368,
    # long_passage ~332-873 (see bands.json). A value in the short_text-only
    # region (below cloze's floor) must still pass via short_text alone.
    f = []
    bands = [{"class": "short_text", "min": 101, "max": 368},
             {"class": "cloze", "min": 228, "max": 401},
             {"class": "long_passage", "min": 332, "max": 873}]
    from mech import _band_check
    _band_check(f, "passage_words", 150, bands)  # short_text only
    assert f == []
    _band_check(f, "passage_words", 900, bands)  # outside all three
    assert len(f) == 1
    assert "short_text=[101, 368]" in f[0]["note"]
    assert "cloze=[228, 401]" in f[0]["note"]
    assert "long_passage=[332, 873]" in f[0]["note"]


def test_bands_calibrated_kills(tmp_path):
    bands = json.loads((Path(__file__).resolve().parents[2] / "bands.json").read_text(encoding="utf-8"))
    bands["calibrated"] = True
    bp = tmp_path / "bands.json"
    bp.write_text(json.dumps(bands), encoding="utf-8")
    c = make_candidate(passage="Alldeles för kort passage. Bara två meningar.")
    assert gate_bands(c, bands_path=bp)["verdict"] == "kill"


# ---------------------------------------------------------------- M-PLAGIARISM

AUTHENTIC_CONTEXT = (
    "När Martin Luther i oktober femtonhundrasjutton spikade upp sina berömda teser "
    "på kyrkporten i Wittenberg kunde han inte ha valt en lämpligare stad för sitt "
    "uppror mot den etablerade kyrkan och dess försäljning av avlatsbrev till folket."
)


@pytest.fixture
def corpus(tmp_path):
    parsed = tmp_path / "parsed"
    parsed.mkdir()
    (parsed / "fake-2020.json").write_text(json.dumps([
        {"qid": "fake-2020-verb1-LÄS-011", "section": "LÄS",
         "context": AUTHENTIC_CONTEXT, "prompt": "Vad gjorde Luther?",
         "options": [{"letter": "A", "text": "Han spikade upp teser."}], "answer": "A"},
    ], ensure_ascii=False), encoding="utf-8")
    return Corpus(parsed)


def test_plagiarism_clean_passes(corpus):
    assert gate_plagiarism(make_candidate(), corpus)["verdict"] == "pass"


def test_plagiarism_verbatim_lift_kills(corpus):
    lift = "spikade upp sina berömda teser på kyrkporten i Wittenberg kunde han inte ha valt en lämpligare stad"
    assert len(tokenize(lift)) >= 13
    c = make_candidate()
    c["passage"] = c["passage"] + " " + lift + "."
    v = gate_plagiarism(c, corpus)
    assert v["verdict"] == "kill"
    assert "fake-2020-verb1-LÄS-011" in v["findings"][0]["note"]


def test_plagiarism_short_echo_does_not_kill(corpus):
    c = make_candidate()
    c["passage"] += " på kyrkporten i Wittenberg stod någonting annat."  # < 8 shared tokens
    assert gate_plagiarism(c, corpus)["verdict"] == "pass"


# ---------------------------------------------------------------- aggregation

def V(cid, gate, target="passage", verdict="pass", vote=None, findings=None, **kw):
    d = {"candidate_id": cid, "gate": gate, "target": target, "verdict": verdict,
         "findings": findings or []}
    if vote is not None:
        d["vote"] = vote
    d.update(kw)
    return d


def full_pass_verdicts(cid="las-b1-001"):
    return [
        V(cid, "M-SCHEMA"), V(cid, "M-BANDS"), V(cid, "M-PLAGIARISM"),
        V(cid, "G-KEY", "q:1", vote=1, solver_answer="B"),
        V(cid, "G-KEY", "q:1", vote=2, solver_answer="B"),
        V(cid, "G-STEM", "q:1"), V(cid, "G-DISTRACTOR", "q:1"),
        V(cid, "G-SPRAK", vote=1), V(cid, "G-SPRAK", vote=2), V(cid, "G-SPRAK", vote=3),
        V(cid, "G-REGISTER"),
    ]


def test_aggregate_clean():
    r = aggregate(full_pass_verdicts(), {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "SURVIVED_CLEAN"


def test_aggregate_gkey_single_vote_kills():
    vs = full_pass_verdicts()
    vs[4] = V("las-b1-001", "G-KEY", "q:1", verdict="kill", vote=2, solver_answer="C",
              findings=[{"severity": "lethal", "quote": "C", "note": "blind solve mismatch"}])
    r = aggregate(vs, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "DEAD"
    assert r["las-b1-001"]["killed_by"] == ["G-KEY"]


def test_aggregate_language_votes():
    f = [{"severity": "lethal", "quote": "spendera tid", "note": "calque"}]
    base = full_pass_verdicts()
    one = copy.deepcopy(base)
    one[7] = V("las-b1-001", "G-SPRAK", verdict="kill", vote=1, findings=f)
    r = aggregate(one, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "SURVIVED_FLAGGED"
    assert r["las-b1-001"]["dissenting_language_vote"] == f

    two = copy.deepcopy(one)
    two[8] = V("las-b1-001", "G-SPRAK", verdict="kill", vote=2, findings=f)
    r = aggregate(two, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "DEAD"


def test_aggregate_lethal_kill_does_not_shadow_language_majority():
    """Regression: eval run 2026-07-20, las-b0-005.

    G-SPRAK recorded 3/3 kill votes AND G-STEM also killed; killed_by listed
    only [G-STEM], hiding the language-majority kill from score_eval's
    killed-by-right-gate check (the seed's intended gate was G-SPRAK, so it
    scored FAIL(wrong-gate) despite the gate having fired 3/3).
    killed_by must be the UNION of lethal-gate kills and language-majority
    kills.
    """
    f = [{"severity": "lethal", "quote": "spenderade tid", "note": "calque"}]
    vs = full_pass_verdicts()
    vs[5] = V("las-b1-001", "G-STEM", "q:1", verdict="kill",
              findings=[{"severity": "lethal", "quote": "stem", "note": "blind-answerable"}])
    for i in (7, 8, 9):
        vs[i] = V("las-b1-001", "G-SPRAK", verdict="kill", vote=i - 6, findings=f)
    r = aggregate(vs, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "DEAD"
    assert r["las-b1-001"]["killed_by"] == ["G-SPRAK", "G-STEM"]
    assert r["las-b1-001"]["language_kill_votes"] == 3


def test_aggregate_language_minority_not_in_killed_by():
    """A single dissenting language vote alongside a lethal kill is NOT a
    language-majority kill and must not appear in killed_by."""
    f = [{"severity": "lethal", "quote": "spenderade tid", "note": "calque"}]
    vs = full_pass_verdicts()
    vs[5] = V("las-b1-001", "G-STEM", "q:1", verdict="kill",
              findings=[{"severity": "lethal", "quote": "stem", "note": "blind-answerable"}])
    vs[7] = V("las-b1-001", "G-SPRAK", verdict="kill", vote=1, findings=f)
    r = aggregate(vs, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "DEAD"
    assert r["las-b1-001"]["killed_by"] == ["G-STEM"]


def test_aggregate_incomplete():
    vs = full_pass_verdicts()[:-1]  # G-REGISTER missing, nothing killed
    r = aggregate(vs, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "INCOMPLETE"
    assert r["las-b1-001"]["missing_records"]


def test_aggregate_early_kill_tolerates_missing_downstream():
    vs = [V("las-b1-001", "M-SCHEMA", verdict="kill",
            findings=[{"severity": "lethal", "quote": "key=E", "note": "bad key"}])]
    r = aggregate(vs, {"las-b1-001": make_candidate()})
    assert r["las-b1-001"]["status"] == "DEAD"

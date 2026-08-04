"""Tests for M-ECHO — self-corpus echo detection (mech.py).

M-PLAGIARISM checks the candidate against the AUTHENTIC UHR corpus. M-ECHO is
the other axis: does this candidate echo OUR OWN shipped P5 units? The
2026-07-30 whole-bank scan found five architectural clones and two name
collisions that every per-batch gate missed, because no gate had ever compared
a candidate to its siblings. Flag-only, like M-TELL/M-FORM.

Run from pipeline/synthetic/gates/scripts:  python3 -m pytest tests/ -q
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from mech import P5Corpus, gate_echo  # noqa: E402


def _unit(cid, passage, questions=None):
    return {"candidate_id": cid, "section": "LÄS", "title": "T", "passage": passage,
            "questions": questions or [{"q_index": 1, "key": "A", "options": [
                {"letter": L, "text": f"opt {L}"} for L in "ABCD"]}]}


def _corpus(tmp_path, units):
    d = tmp_path / "shipped"
    d.mkdir(exist_ok=True)
    for u in units:
        (d / f"{u['candidate_id']}.json").write_text(json.dumps(u, ensure_ascii=False),
                                                     encoding="utf-8")
    return P5Corpus.load([d])


SHIPPED = _unit(
    "las-b5-001",
    "När historikern Ingeborg Salomonsson gick igenom kyrkböckerna från fjorton "
    "socknar, letade hon efter en förklaring till varför somliga byar behöll sina "
    "kvarnar medan andra lade ned. Svaret blev inte det hon väntat sig. Materialet "
    "var spretigt och krävde tålamod. Alla håller inte med. Docenten Nils Hedlund "
    "invänder att hon förväxlar orsak och verkan.")


def test_phrase_echo_flags(tmp_path):
    corpus = _corpus(tmp_path, [SHIPPED])
    clone = _unit(
        "las-b6-001",
        "När historikern Petra Wingård gick igenom kyrkböckerna från fjorton "
        "socknar, letade hon efter en förklaring till varför somliga byar behöll "
        "sina kvarnar medan andra lade ned. Svaret blev inte det hon väntat sig. "
        "Något helt annat visade sig i marginalerna.")
    v = gate_echo(clone, corpus)
    assert v["verdict"] == "flag"
    assert any("las-b5-001" in f["note"] for f in v["findings"])


def test_name_reuse_flags(tmp_path):
    corpus = _corpus(tmp_path, [SHIPPED])
    reuser = _unit(
        "las-b7-001",
        "Ett annat spår öppnade sig i arkivet. Forskaren Ingeborg Salomonsson hade "
        "redan noterat detta i en fotnot som ingen läste, och materialet pekade åt "
        "ett annat håll än väntat den gången.")
    v = gate_echo(reuser, corpus)
    assert v["verdict"] == "flag"
    assert any("Salomonsson" in f["note"] for f in v["findings"])


def test_clean_unit_passes(tmp_path):
    corpus = _corpus(tmp_path, [SHIPPED])
    clean = _unit(
        "las-b8-001",
        "Tegelbruket vid Ekenäs brann tre gånger under samma sekel, och varje gång "
        "byggdes det upp med mindre ambition än förut. Bertil Lundkvist har räknat "
        "skorstenarna på fotografier tagna mellan branden och rivningen.")
    assert gate_echo(clean, corpus)["verdict"] == "pass"


def test_unit_is_not_compared_against_itself(tmp_path):
    # A shipped unit re-gated must not echo-flag against its own stored copy.
    corpus = _corpus(tmp_path, [SHIPPED])
    assert gate_echo(SHIPPED, corpus)["verdict"] == "pass"


def test_empty_corpus_passes(tmp_path):
    # First batch ever: nothing to echo.
    corpus = _corpus(tmp_path, [])
    assert gate_echo(SHIPPED, corpus)["verdict"] == "pass"


def test_generic_institution_words_are_not_name_collisions(tmp_path):
    # "Institute"/"Research" inside invented names are generic, not law-13
    # collisions (they flagged 3 unrelated ELF units before calibration).
    a = _unit("elf-b1-001", "Work at the Marine Research Institute went slowly. "
                            "Nobody at the Institute expected the result.")
    b = _unit("elf-b2-001", "The Coastal Research Institute published late. "
                            "Staff at the Institute disagreed sharply.")
    corpus = _corpus(tmp_path, [a])
    assert gate_echo(b, corpus)["verdict"] == "pass"


def test_incidental_phrase_overlap_below_threshold_passes(tmp_path):
    # Two unrelated units sharing a few stock 6-grams must not flag; only
    # clone-scale overlap does.
    a = _unit("las-b9-001", "Materialet var spretigt och krävde tålamod av alla "
                            "som försökte läsa det med någon slags noggrannhet.")
    b = _unit("las-b9-002", "Materialet var spretigt och krävde tålamod av alla, "
                            "men slutsatsen pekade åt ett helt annat håll än väntat.")
    corpus = _corpus(tmp_path, [a])
    assert gate_echo(b, corpus)["verdict"] == "pass"

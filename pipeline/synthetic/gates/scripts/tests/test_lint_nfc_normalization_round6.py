"""PR #370 fix round 6 (bead hpf-pvkp): the [FIX-INCOMPLETE][medium] finding
of Codex exact-head review R6 (hpf-tipc, HOLD at 5e89c03).

lint_learner_output.py tokenized learner text BEFORE normalizing it, with a
token class of a-z, digits and åäö only. A canonically equivalent NFD
spelling (å written as a + U+030A) split at the combining mark and slipped
past tier 1 (författarens_hållning -> rfattarens_ha), and a token with any
other letter (idé_skifte) was no token at all. scan_text now normalizes
every scanned text to NFC once, before any rule runs, and a token segment
is any run of Unicode letters and digits.

Red-first: the defect tests failed on head 5e89c03; the guard tests (marked
"guard") passed there and must keep passing. docs/worklog/hpf-pvkp.md has
both runs.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unicodedata
from pathlib import Path

import pytest

TESTS = Path(__file__).resolve().parent
SCRIPTS = TESTS.parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(TESTS))

import lint_learner_output as lint  # noqa: E402
from test_verdict_enum_and_label_vocabulary_round5 import (  # noqa: E402
    CONTRACT_EXAMPLES, STORE_FORMULA_NAMES, label_sources)


def nfc(s):
    return unicodedata.normalize("NFC", s)


def nfd(s):
    return unicodedata.normalize("NFD", s)


def _sentence(token):
    return nfc("Låt ") + token + nfc(" vara här.")  # round 5's frame; its å/ä decompose too


def _rules(hits):
    return [rule for rule, _ in hits]


def _run(*args):
    return subprocess.run([sys.executable, str(SCRIPTS / "lint_learner_output.py"), *map(str, args)],
                          capture_output=True, text=True)


def _lint_json(tmp_path, name, values, *, ensure_ascii=False):
    f = tmp_path / name
    f.write_text(json.dumps({f"s{i}": v for i, v in enumerate(values)}, ensure_ascii=ensure_ascii),
                 encoding="utf-8")
    r = _run(f)
    return r.returncode, r.stdout.replace(str(f), "<file>")


# ================================================ 1. labels: NFC vs NFD
REVIEW_LABELS = tuple(map(nfc, ("författarens_hållning", "jämförelse_relation", "GODKÄNN_NOTED")))


@pytest.mark.parametrize("label", REVIEW_LABELS)
def test_review_repro_nfd_label_lints_like_nfc(label):
    # head 5e89c03: the NFD form split at the combining mark (rfattarens_ha,
    # relse_relation, NN_NOTED) and scan_text found nothing
    assert nfd(label) != label
    want = lint.scan_text(_sentence(label))
    assert _rules(want) == ["L2-SNAKE"] and label in want[0][1]
    assert lint.scan_text(nfd(_sentence(label))) == want


# Every label spelled with a diacritic: the review's three; the other accented
# label spellings in pipeline/synthetic (survey 2026-10-05, docs/worklog/
# hpf-pvkp.md: essä_kulturhistoria in a batch16 note, the rest round 5's test
# cases); the Swedish spellings of the remaining folded vocabulary entries
# (hallning_stance_tone, essa_kulturhistorisk, facktext_larobok); and, read
# live, every accented label label_sources() yields.
ACCENTED_LABELS = REVIEW_LABELS + tuple(map(nfc, (
    "Författarens_Hållning", "hållning_stämning_ton", "essä_kulturhistoria",
    "hållning_stance_tone", "essä_kulturhistorisk", "facktext_lärobok")))


def test_every_accented_label_lints_alike_in_nfc_and_nfd():
    live = {nfc(label) for labels in label_sources().values() for label in labels
            if not label.isascii()}
    assert live, "label_sources() yields no accented label any more (GODKÄNN_NOTED moved?)"
    differ = {}
    for label in sorted(set(ACCENTED_LABELS) | live):
        want = lint.scan_text(_sentence(label))
        got = lint.scan_text(nfd(_sentence(label)))
        if _rules(want) != ["L2-SNAKE"] or got != want:
            differ[label] = (want, got)
    assert not differ, "NFC and NFD lint differently:\n" + "\n".join(
        f"  {label}: NFC {want} / NFD {got}" for label, (want, got) in differ.items())


# ================================== 2. every rule, through every entry path
GATE_TEXTS = tuple(map(nfc, ("Det här är G-SPRÅK:s dom.", "Se versionen från runda 2 för detaljer.")))
MIXED = nfc("Låt författarens_hållning vara här; G-SPRÅK var hedgat i versionen från runda 2.")


@pytest.mark.parametrize("text", GATE_TEXTS, ids=["G-SPRAK-with-ring", "versionen-fran-runda"])
def test_gate_references_with_diacritics_lint_alike_in_nfd(text):
    # head 5e89c03: the NFD forms (SPRA + U+030A + K, fra + U+030A + n) missed
    # the precomposed å in the L2-GATEREF patterns
    want = lint.scan_text(text)
    assert _rules(want) == ["L2-GATEREF"]
    assert lint.scan_text(nfd(text)) == want


def test_every_rule_sees_the_nfc_text(monkeypatch):
    # the requirement itself: one normalization, before any rule's regex runs
    seen = []

    class Spy:
        def __init__(self, rx):
            self.rx = rx

        def search(self, text):
            seen.append(text)
            return self.rx.search(text)

    monkeypatch.setattr(lint, "RULES", tuple((name, Spy(rx)) for name, rx in lint.RULES))
    hits = lint.scan_text(nfd(MIXED))
    assert seen == [MIXED] * 3
    assert _rules(hits) == ["L2-SNAKE", "L2-HEDGAT", "L2-GATEREF"]


CLI_VALUES = tuple(_sentence(label) for label in ACCENTED_LABELS) + GATE_TEXTS + (MIXED,)


@pytest.mark.parametrize("ensure_ascii", [False, True], ids=["utf-8", "ascii-escaped"])
def test_cli_lints_an_nfd_json_file_exactly_like_nfc(tmp_path, ensure_ascii):
    # ascii-escaped: json.dumps' default writes each combining mark as an
    # ASCII escape (backslash, u, four hex digits), which only a normalization
    # of the decoded string reaches, never one of the raw file text
    want = _lint_json(tmp_path, "nfc.json", CLI_VALUES)
    assert want[0] == 1 and want[1].count("L2-SNAKE") == len(ACCENTED_LABELS) + 1
    nfd_values = [nfd(v) for v in CLI_VALUES]
    assert all(a != b for a, b in zip(nfd_values, CLI_VALUES))
    assert _lint_json(tmp_path, "nfd.json", nfd_values, ensure_ascii=ensure_ascii) == want


@pytest.mark.parametrize("suffix", [".md", ".txt"])
def test_cli_lints_nfd_raw_text_like_nfc(tmp_path, suffix):
    out = {}
    for name, text in (("nfc", MIXED), ("nfd", nfd(MIXED))):
        f = tmp_path / f"{name}{suffix}"
        f.write_text(text + "\n", encoding="utf-8")
        r = _run(f)
        out[name] = (r.returncode, r.stdout.replace(str(f), "<file>"))
    assert out["nfc"][0] == 1
    assert all(f"{rule} <file>:-:" in out["nfc"][1] for rule in ("L2-SNAKE", "L2-HEDGAT", "L2-GATEREF"))
    assert out["nfd"] == out["nfc"]


# ===================================== 3. letters outside a-z and åäö
# No token in pipeline/synthetic or the store has one inside a snake token
# today (survey), so these are constructed: the bead's idé_skifte (Swedish
# idé), and accents a rendering step could put on a taxonomy label.
@pytest.mark.parametrize("token", tuple(map(nfc, ("idé_skifte", "über_mått", "naïve_reading", "café_crème_2"))))
def test_a_token_with_letters_outside_aao_is_one_token(token):
    # head 5e89c03: no match at all — the token's own letter blocked \b
    assert lint._SNAKE_TOKEN.fullmatch(token)
    assert [m.group(0) for m in lint._SNAKE_TOKEN.finditer(_sentence(token))] == [token]


def test_ide_skifte_is_strict_style_debt_not_a_label(monkeypatch):
    s = _sentence(nfc("idé_skifte"))
    assert lint.scan_text(s) == []  # no taxonomy stem or label in it
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    hits = lint.scan_text(s)
    assert _rules(hits) == ["L2-SNAKE"] and lint.SNAKE.search(s).group(0) == nfc("idé_skifte")
    assert lint.scan_text(nfd(s)) == hits


@pytest.mark.parametrize("label", tuple(map(nfc, (
    "détail_as_main", "Tóne_Misread", "surface_lexical_écho", "naïve_scope_shift",
    "ÜBER_WORLD_KNOWLEDGE"))))
def test_tier1_folds_accents_outside_aao(label):
    want = lint.scan_text(_sentence(label))
    assert _rules(want) == ["L2-SNAKE"] and label in want[0][1]
    assert lint.scan_text(nfd(_sentence(label))) == want


# ==================================== 4. compatibility forms (NFKC)
FI_LIGATURE = chr(0xFB01)  # U+FB01, left behind by PDF text extraction


def _fullwidth(s):
    return "".join(chr(ord(c) + 0xFEE0) if c.isascii() and c.isalnum() else c for c in s)


# Decision (worklog D3): the scan normalizes to NFC, not NFKC. A compatibility
# letter INSIDE a label still cannot hide it, because tier 1 compares via
# _fold, which applies NFKD: the fi ligature and fullwidth letters flag like
# the ASCII spelling (head 5e89c03: no token).
@pytest.mark.parametrize("label", [FI_LIGATURE + "nding_or_ruling", _fullwidth("WORLD_KNOWLEDGE")],
                         ids=["fi-ligature", "fullwidth-letters"])
def test_compatibility_letters_inside_a_label_flag(label):
    hits = lint.scan_text(_sentence(label))
    assert _rules(hits) == ["L2-SNAKE"] and label in hits[0][1]


# guard (green on head): NFKC would rewrite learner math in every excerpt —
# aₙ = 2ⁿ as an = 2n, x² as x2, ½ as 1⁄2 (the store writes ⁿ, ₐ, ₛ, ᵦ)
def test_the_scan_keeps_compatibility_characters_of_learner_math():
    text = nfc("Svaret blev hedgat: aₙ = 2ⁿ och x² = ½.")
    assert lint.scan_text(text) == [("L2-HEDGAT", text)]


# ============================== 5. math preservation, in NFC and NFD
FORMULA_SENTENCES = tuple(nfc("Sätt ") + n + nfc(" = 2 och räkna vidare.")
                          for n in CONTRACT_EXAMPLES + STORE_FORMULA_NAMES)


# guard (green on head): no math notation flags by default, in either form
def test_math_notation_never_flags_in_default_mode_in_nfc_or_nfd():
    assert [s for s in FORMULA_SENTENCES if lint.scan_text(s) or lint.scan_text(nfd(s))] == []


# guard (green on head): the widened token class reaches formula names with
# Greek letters or superscripts, which tier 1 must still leave alone
@pytest.mark.parametrize("name", ["Δ_total", "θ_max", "σ_A", "μ_1", "v_max²", "x_1²", "a_n²"])
def test_greek_and_superscript_formula_names_never_flag_in_default_mode(name):
    assert lint.scan_text(nfc("Sätt ") + nfc(name) + " = 2.") == []


def test_strict_mode_lints_nfd_math_like_nfc(monkeypatch):
    # head 5e89c03: every name with åäö (värde_B, P_grön, t_låg, …) reported a
    # fragment in NFD (rde_B), and every excerpt kept the NFD frame
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    assert [s for s in FORMULA_SENTENCES if lint.scan_text(nfd(s)) != lint.scan_text(s)] == []


# guard (green on head): the same through the CLI, every name in one NFD file
def test_cli_default_mode_passes_nfd_formula_names(tmp_path):
    code, out = _lint_json(tmp_path, "nfd.json", [nfd(s) for s in FORMULA_SENTENCES])
    assert code == 0, out

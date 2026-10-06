"""PR #370 fix round 4 (bead hpf-wu46): blockquotes and the marker's spelling.

Codex exact-head review R4 hpf-tuqq (HOLD at 6af7c1a), findings 1 and 2 (the
third, the gate suite missing from CI, is a .github/workflows/ci.yml change):

1. Blockquotes failed open: the block rules read raw quoted lines, so a
   marker wrapped across two quote lines was missed, a quote-only line ">"
   did not close a block and a quoted list item was no item. Every block
   rule now reads a line's text after its quote markers; a quote-only line
   is a blank line and a change of quote depth closes the block.
2. The marker was matched literally ("disposition\\s+owed"). It is now
   "disposition" or "dispositions", then "owed", in any case, across
   whitespace, a line wrap and inline emphasis/code markers (*, _, `).

Red-first: the defect tests failed on head 6af7c1a; the guard tests (named
in docs/worklog/hpf-wu46.md) passed there and must keep passing.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]


def _asm(tmp_path, text, verdicts=()):
    asm = tmp_path / "ASSEMBLY.md"
    asm.write_text(text, encoding="utf-8")
    vf = tmp_path / "v.jsonl"
    vf.write_text("".join(json.dumps(v) + "\n" for v in verdicts), encoding="utf-8")
    return subprocess.run([sys.executable, str(SCRIPTS / "check_assembly_dispositions.py"),
                           str(asm), str(vf)], capture_output=True, text=True)


def _disposed(unit):
    return {"candidate_id": unit, "gate": "G-REGISTER", "verdict": "pass", "findings": [],
            "disposition": "different roles, different batches, no same-test collision"}


def _owed_units(stdout):
    return [line.split(": line")[0] for line in stdout.splitlines()
            if line.startswith("DISPOSITION-OWED")]


NO_UNIT = "DISPOSITION-OWED <no unit named>"


# ------------------------------------- 1a: a marker wrapped inside a blockquote
@pytest.mark.parametrize("q", ["> ", ">", "   > ", "> > ", ">> ", "> > > "])
def test_marker_wrapped_across_two_quote_lines_is_found(tmp_path, q):
    # hpf-tuqq repro (a), verbatim for "> ": head exits 0 with 0 markers
    text = f"{q}Cross-batch echo, disposition\n{q}owed: elf-b16-001\n"
    r = _asm(tmp_path, text)
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]
    assert "line 1: Cross-batch echo, disposition owed: elf-b16-001" in r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert r2.returncode == 0, r2.stdout
    assert "OK — 1 marker(s), all discharged" in r2.stdout


def test_marker_wrapped_inside_a_quote_inside_a_list_item_is_found(tmp_path):
    text = ("- Batch notes:\n"
            "  > Cross-batch echo, disposition\n"
            "  > owed: elf-b16-001\n")
    r = _asm(tmp_path, text)
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]
    assert "line 2:" in r.stdout


# ------------------------------------------- 1b: a quote-only line is blank
@pytest.mark.parametrize("q, blank", [("> ", ">"), ("> ", "> "), ("> ", ">   "),
                                      ("> > ", "> >"), ("> > ", ">>"), ("> > ", ">")])
def test_quote_only_line_is_a_blank_line(tmp_path, q, blank):
    # hpf-tuqq repro (b), verbatim for ("> ", ">"): head exits 0, lending elf-b16-003
    text = f"{q}elf-b16-003 is clean\n{blank}\n{q}Cross-batch echo, disposition owed\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 3: Cross-batch echo, disposition owed" in r.stdout


# ------------------------------------------ 1c: a quoted list item is an item
@pytest.mark.parametrize("bullet", ["- ", "* ", "+ ", "1) "])
@pytest.mark.parametrize("q", ["> ", ">", "> > "])
def test_quoted_list_items_are_items(tmp_path, q, bullet):
    # hpf-tuqq repro (c), verbatim for ("> ", "- "): head exits 0, the sibling
    # item lending elf-b16-003
    text = f"{q}{bullet}elf-b16-003 is clean\n{q}{bullet}Cross-batch echo, disposition owed\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 2:" in r.stdout


# ------------------------------- 1d: a change of quote depth closes the block
DEPTH_CHANGES = {
    "quote after paragraph": "elf-b16-003 is clean\n> Cross-batch echo, disposition owed\n",
    # GFM reads the next two as lazy continuation lines of the quoted
    # paragraph; the gate splits them (fail closed, never lends a unit)
    "lazy line after quote": "> elf-b16-003 is clean\nCross-batch echo, disposition owed\n",
    "lazy line after nested quote": ("> > elf-b16-003 is clean\n"
                                     "> Cross-batch echo, disposition owed\n"),
    "nested quote": "> elf-b16-003 is clean\n> > Cross-batch echo, disposition owed\n",
    "quote inside list item": "- elf-b16-003 is clean\n  > Cross-batch echo, disposition owed\n",
}


@pytest.mark.parametrize("case", sorted(DEPTH_CHANGES))
def test_change_of_quote_depth_closes_the_block(tmp_path, case):
    r = _asm(tmp_path, DEPTH_CHANGES[case], [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 2:" in r.stdout


@pytest.mark.parametrize("text", [
    "> Cross-batch echo, disposition\n> > owed: elf-b16-001\n",
    "> > Cross-batch echo, disposition\n> owed: elf-b16-001\n",
    "> Cross-batch echo, disposition\nowed: elf-b16-001\n",
    "Cross-batch echo, disposition\n> owed: elf-b16-001\n",
], ids=["into-nested", "out-of-nested", "lazy-line", "into-quote"])
def test_marker_wrapped_across_a_quote_depth_change_is_never_dropped(tmp_path, text):
    # the marker is in neither block, so it names no unit; it is never lost
    r = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert ("line 1: (split across two blocks) Cross-batch echo, disposition owed: elf-b16-001"
            in r.stdout)
    assert "1 undischarged of 1 marker(s)" in r.stdout


# ---------------- 1e: headings, rows, breaks and fences read the de-quoted text
QUOTED_OPENERS = {
    "heading": "> ## elf-b16-003 notes\n> Cross-batch echo, disposition owed\n",
    "pipe row": "> | elf-b16-003 | clean |\n> Cross-batch echo, disposition owed\n",
    "thematic break": "> elf-b16-003 is clean\n> ***\n> Cross-batch echo, disposition owed\n",
    "setext underline": "> elf-b16-003 is clean\n> ---\n> Cross-batch echo, disposition owed\n",
    "code fence": "> elf-b16-003 is clean\n> ```\n> Cross-batch echo, disposition owed\n",
}


@pytest.mark.parametrize("case", sorted(QUOTED_OPENERS))
def test_block_openers_inside_a_quote_close_the_block(tmp_path, case):
    r = _asm(tmp_path, QUOTED_OPENERS[case], [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


# ------------------------------------------------- guards: what stays the same
# guard (green on head): no line starts with ">", so the block rules see the
# same text as on head; a ">" inside a line is no quote marker
UNQUOTED = (
    "# Batch99 — stage 2 assembly record\n"
    "\n"
    "| candidate_id | note |\n"
    "|---|---|\n"
    "| elf-b99-001 | clean |\n"
    "| elf-b99-003 | gen-elf-short, disposition owed |\n"
    "\n"
    "## Name sweep\n"
    "- elf-b99-002's generator rejected the surname on a live collision.\n"
    "- **Cross-batch near-pair (register echo, disposition owed, no rename)**:\n"
    "  batch98's elf-b98-002 ships *Verity Quennerby*, one letter apart from\n"
    "  the surname elf-b99-001 ships, both invented (fk > 11.0).\n"
    "\n"
    "1. **Same-batch adjacency**: las-b99-001 and elf-b99-003 — disjoint\n"
    "   mechanism; one written disposition owed per the process rule.\n"
    "2. Cross-batch cloze echo vs the batch98 noticeboard, disposition\n"
    "   owed: elf-b99-002.\n"
    "\n"
    "Echo elf-b99-004 vs. elf-b98-001 (e.g. Quennerly), disposition owed.\n"
    "elf-b99-005 is clean.\n"
)


def test_unquoted_document_behaves_as_before(tmp_path):
    r = _asm(tmp_path, UNQUOTED,
             [_disposed("elf-b99-001"), _disposed("elf-b98-002"), _disposed("elf-b99-004")])
    assert r.returncode == 1, r.stdout
    assert r.stdout.splitlines() == [
        "DISPOSITION-OWED elf-b99-003: line 6: | elf-b99-003 | gen-elf-short, disposition owed |",
        "DISPOSITION-OWED <no unit named>: line 15: one written disposition owed per the"
        " process rule.",
        "DISPOSITION-OWED elf-b99-002: line 16: Cross-batch cloze echo vs the batch98"
        " noticeboard, disposition owed: elf-b99-002.",
        "DISPOSITION-OWED elf-b98-001: line 19: Echo elf-b99-004 vs. elf-b98-001"
        " (e.g. Quennerly), disposition owed.",
        "assembly-dispositions: 4 undischarged of 5 marker(s)",
    ]


QUOTED_OWN_UNITS = {
    "paragraph": ("> Cross-batch echo with the batch15 cloze, disposition owed\n"
                  "> for elf-b16-001 vs elf-b15-002.\n"
                  "> elf-b16-003 is clean.\n"),
    "nested paragraph": ("> > Cross-batch echo with the batch15 cloze, disposition owed\n"
                         "> > for elf-b16-001 vs elf-b15-002.\n"
                         "> > elf-b16-003 is clean.\n"),
    "list item": ("> - Cross-batch echo with the batch15 cloze, disposition owed\n"
                  ">   for elf-b16-001 vs elf-b15-002.\n"
                  "> - elf-b16-003 is clean.\n"),
}


# guard (green on head)
@pytest.mark.parametrize("case", sorted(QUOTED_OWN_UNITS))
def test_quoted_marker_names_its_own_units_only(tmp_path, case):
    text = QUOTED_OWN_UNITS[case]
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert _owed_units(r2.stdout) == ["DISPOSITION-OWED elf-b16-001",
                                      "DISPOSITION-OWED elf-b15-002"]


def test_quote_takes_no_unit_from_the_paragraph_above(tmp_path):
    # red on head in the over-strict direction: head read the quote into the
    # paragraph above and also demanded elf-b16-003
    text = "elf-b16-003 is clean\n> Cross-batch echo, disposition owed: elf-b16-001\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert r.returncode == 0, r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert _owed_units(r2.stdout) == ["DISPOSITION-OWED elf-b16-001"]


TWINS = {
    "assembly record": (UNQUOTED, ("elf-b99-001", "elf-b98-002", "elf-b99-004")),
    # the space after ">" belongs to the quote marker (GFM), so the heading is
    # indented 3 spaces, quoted or not, and ends the table in both readings;
    # head kept it as a table row whenever a space followed ">" (over-strict)
    "table then heading": ("Unit | Note\n--- | ---\nelf-b16-003 | clean\n   ## Notes\n"
                           "elf-b16-003 is clean\nCross-batch echo, disposition owed\n",
                           ("elf-b16-003",)),
}


@pytest.mark.parametrize("q", ["> ", ">", "> > "])
@pytest.mark.parametrize("twin", sorted(TWINS))
def test_quoted_document_reads_like_its_unquoted_twin(tmp_path, twin, q):
    # every rule reads the de-quoted text: quoting a whole document at any
    # depth changes neither the exit status nor a byte of the report
    text, disposed = TWINS[twin]
    verdicts = [_disposed(u) for u in disposed]
    plain = _asm(tmp_path, text, verdicts)
    quoted = "".join(f"{q}{line}".rstrip() + "\n" for line in text.splitlines())
    r = _asm(tmp_path, quoted, verdicts)
    assert (r.returncode, r.stdout) == (plain.returncode, plain.stdout)


# guard (green on head): the round-3 table rule already read de-quoted text
def test_quoted_pipe_table_rows_stay_rows(tmp_path):
    text = ("> | Unit | Note |\n"
            "> |---|---|\n"
            "> | elf-b16-003 | clean |\n"
            "> | Other | disposition owed |\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 4:" in r.stdout


# ------------------------------------------------ 2: the marker's spelling
@pytest.mark.parametrize("variant", [
    "dispositions owed", "Dispositions OWED", "disposition **owed**", "**disposition** owed",
    "*disposition* *owed*", "_disposition_ owed", "disposition __owed__",
    "`disposition` `owed`", "disposition `owed`", "**dispositions** _owed_",
    "disposition_owed",
])
def test_marker_variant_is_found(tmp_path, variant):
    text = f"- Cross-batch echo, {variant}: elf-b16-001\n"
    r = _asm(tmp_path, text)
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert r2.returncode == 0, r2.stdout
    assert "OK — 1 marker(s), all discharged" in r2.stdout


# guard (green on head): markup around the whole phrase
@pytest.mark.parametrize("variant", ["*disposition owed*", "**disposition owed**",
                                     "_disposition owed_", "`disposition owed`",
                                     "DISPOSITION OWED"])
def test_marker_inside_emphasis_or_code_is_found(tmp_path, variant):
    text = f"- Cross-batch echo, {variant}: elf-b16-001\n"
    r = _asm(tmp_path, text)
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]


@pytest.mark.parametrize("first, second", [("disposition", "**owed**"),
                                           ("**disposition**", "owed"),
                                           ("dispositions", "owed"),
                                           ("`disposition`", "`owed`")])
def test_marker_variant_wrapped_across_lines_is_found(tmp_path, first, second):
    text = f"- Cross-batch echo, {first}\n  {second}: elf-b16-001\n"
    r = _asm(tmp_path, text)
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]
    assert "line 1:" in r.stdout


def test_emphasised_marker_wrapped_inside_a_quote_is_found(tmp_path):
    r = _asm(tmp_path, "> Cross-batch echo, **disposition**\n> **owed**: elf-b16-001\n")
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == ["DISPOSITION-OWED elf-b16-001"]


def test_variant_marker_split_across_two_blocks_is_never_dropped(tmp_path):
    r = _asm(tmp_path, "## Echoes, **disposition**\n**owed**: elf-b16-001\n",
             [_disposed("elf-b16-001")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 1: (split across two blocks)" in r.stdout


# batch17 ASSEMBLY.md:55-56, verbatim: a standing process rule naming no unit
BATCH17_ITEM6 = ("6. Written dispositions owed for any named adjacency per the 2026-08-26\n"
                 "   process rule.\n")


def test_batch17_plural_process_rule_fails_closed(tmp_path):
    r = _asm(tmp_path, BATCH17_ITEM6)
    assert r.returncode == 1, r.stdout
    assert r.stdout.splitlines() == [
        "DISPOSITION-OWED <no unit named>: line 1: Written dispositions owed for any named"
        " adjacency per the 2026-08-26 process rule.",
        "assembly-dispositions: 1 undischarged of 1 marker(s)",
    ]

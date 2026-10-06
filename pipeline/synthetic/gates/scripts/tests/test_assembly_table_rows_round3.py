"""PR #370 fix round 3 (bead hpf-96rj): every GFM pipe-table row is a block.

Codex exact-head review hpf-tfkw (HOLD at bb7c4b6): a table written without
the optional leading pipe was read as one paragraph, so its marker-only row
borrowed a unit from another row and the gate exited 0. A table is now found
by its delimiter row, with or without outer pipes, and each of its lines is
a block of its own.

Red-first: the defect tests failed on head bb7c4b6; the guard tests (named
in docs/worklog/hpf-96rj.md) passed there and must keep passing.
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
STYLES = ("none", "leading", "trailing", "both")


def _table(style, *rows):
    """A pipe table whose rows carry the given outer pipes."""
    lead, trail = {"none": ("", ""), "leading": ("| ", ""), "trailing": ("", " |"),
                   "both": ("| ", " |")}[style]
    return "".join(f"{lead}{' | '.join(cells)}{trail}\n" for cells in rows)


# ---------------------------------------------- the review repro and its shapes
def test_review_repro_table_without_outer_pipes_fails_closed(tmp_path):
    # hpf-tfkw repro, verbatim: head exits 0 "all discharged"
    text = ("Unit | Note\n"
            "--- | ---\n"
            "elf-b16-003 | clean\n"
            "Other | disposition owed\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 4: Other | disposition owed" in r.stdout


# guard (green on head) for the "leading" and "both" styles: a line starting
# with "|" was already a block of its own
@pytest.mark.parametrize("style", STYLES)
def test_marker_only_row_fails_closed_whatever_the_outer_pipes(tmp_path, style):
    text = _table(style, ("Unit", "Note"), ("---", "---"), ("elf-b16-003", "clean"),
                  ("Other", "disposition owed"))
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


# guard (green on head) for the "leading" and "both" styles
@pytest.mark.parametrize("style", STYLES)
def test_marker_row_names_only_its_own_units(tmp_path, style):
    text = _table(style, ("Unit", "Note"), ("---", "---"), ("elf-b16-003", "clean"),
                  ("elf-b16-001", "echo of elf-b15-002, disposition owed"))
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout    # elf-b16-003's row is not the marker's row
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert _owed_units(r2.stdout) == ["DISPOSITION-OWED elf-b16-001",
                                      "DISPOSITION-OWED elf-b15-002"]


@pytest.mark.parametrize("delimiter", [":--- | ---:", ":-: | :-:", "---|---", "-|-",
                                       "| --- | ---", "--- | --- |", "|:---|---:|"])
def test_any_delimiter_row_opens_a_table(tmp_path, delimiter):
    text = f"Unit | Note\n{delimiter}\nelf-b16-003 | clean\nOther | disposition owed\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


def test_single_column_table(tmp_path):
    # ":" marks a delimiter row even without a "|"
    text = "Note\n:---\nelf-b16-003 is clean\nCross-batch echo, disposition owed\n"
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


# ------------------------------------------------------------ the table extent
def test_header_row_is_a_row_of_its_own(tmp_path):
    # the table interrupts the paragraph: the line above the delimiter row is
    # the header, never a continuation of the paragraph line above it
    text = ("Batch notes for elf-b16-003\n"
            "Cross-batch echo, disposition owed | Unit\n"
            "--- | ---\n"
            "noticeboard cloze | elf-b15-002\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003"), _disposed("elf-b15-002")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert "line 2:" in r.stdout


def test_line_without_a_pipe_after_the_rows_is_a_row_of_its_own(tmp_path):
    # GFM spec example 202: the table runs to a blank line or another block,
    # and a line without "|" inside it is a one-cell row, so it never joins
    # the next line as a paragraph
    text = ("Unit | Note\n"
            "--- | ---\n"
            "elf-b16-003 | clean\n"
            "Cross-batch cloze echo, disposition owed\n"
            "elf-b16-001 is clean\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003"), _disposed("elf-b16-001")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


@pytest.mark.parametrize("item, indent", [
    ("- elf-b16-003 assembly notes:\n", "  "),
    ("- Batch notes:\n  - elf-b16-003 assembly notes:\n", "    "),
], ids=["item", "nested-item"])
def test_table_inside_a_list_item(tmp_path, item, indent):
    text = (item
            + f"{indent}Unit | Note\n"
            + f"{indent}--- | ---\n"
            + f"{indent}Other | disposition owed\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


def test_table_inside_a_blockquote(tmp_path):
    text = ("> elf-b16-003 assembly notes\n"
            "> Unit | Note\n"
            "> --- | ---\n"
            "> Other | disposition owed\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]


TABLE = "Unit | Note\n--- | ---\nelf-b16-003 | clean\n"
AFTER_TABLE = {
    "blank line": "\nCross-batch echo with the batch15 cloze, disposition owed\nfor elf-b16-001.\n",
    "heading": "## Echoes\nCross-batch echo with the batch15 cloze, disposition owed\n"
               "for elf-b16-001.\n",
    "list item": "- Cross-batch echo with the batch15 cloze, disposition owed\n"
                 "  for elf-b16-001.\n",
    "blockquote": "> Cross-batch echo with the batch15 cloze, disposition owed\n"
                  "> for elf-b16-001.\n",
}


# guard (green on head) except "blockquote", red on head in the over-strict
# direction (head read the quote into the table's paragraph and owed elf-b16-003)
@pytest.mark.parametrize("end", sorted(AFTER_TABLE))
def test_table_ends_at_a_blank_line_or_another_block(tmp_path, end):
    # after the table, a wrapped marker reads as one block again
    r = _asm(tmp_path, TABLE + AFTER_TABLE[end], [_disposed("elf-b16-001")])
    assert r.returncode == 0, r.stdout


# ------------------------------------------------------- "|" in ordinary prose
# guard (green on head): a "|" in prose, with no delimiter row, is not a table
@pytest.mark.parametrize("prefix, cont", [("", ""), ("- ", "  ")], ids=["paragraph", "item"])
def test_pipe_in_prose_is_not_a_table(tmp_path, prefix, cont):
    text = (f"{prefix}Name echo elf-b16-001 | elf-b15-002 (both invented,\n"
            f"{cont}one letter apart | bank precedent tolerates closer),\n"
            f"{cont}disposition owed.\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout
    r2 = _asm(tmp_path, text, [_disposed("elf-b16-001")])
    assert _owed_units(r2.stdout) == ["DISPOSITION-OWED elf-b15-002"]


# guard (green on head): a bare "---" under pipe-bearing prose is a setext
# underline or thematic break, never a delimiter row
def test_bare_dash_line_under_prose_is_not_a_delimiter_row(tmp_path):
    text = ("Name echo elf-b16-001 | elf-b15-002, both invented,\n"
            "disposition owed\n"
            "---\n")
    r = _asm(tmp_path, text, [_disposed("elf-b16-001"), _disposed("elf-b15-002")])
    assert r.returncode == 0, r.stdout


# ------------------------------------------- a marker split across two blocks
@pytest.mark.parametrize("text, line", [
    ("Unit | Note\n--- | ---\nelf-b16-003 | cross-batch echo, disposition\nowed\n", 3),
    ("Unit | Note\n--- | ---\nelf-b16-003 | cross-batch echo, disposition\nowed | elf-b16-003\n", 3),
    ("## elf-b16-003: cross-batch echo, disposition\nowed: elf-b16-003\n", 1),
], ids=["row-then-pipeless-row", "row-then-row", "heading-then-paragraph"])
def test_marker_wrapped_across_two_blocks_is_never_dropped(tmp_path, text, line):
    # the marker is in neither block, so it names no unit; it is never lost
    r = _asm(tmp_path, text, [_disposed("elf-b16-003")])
    assert r.returncode == 1, r.stdout
    assert _owed_units(r.stdout) == [NO_UNIT]
    assert f"line {line}: (split across two blocks)" in r.stdout
    assert "1 undischarged of 1 marker(s)" in r.stdout

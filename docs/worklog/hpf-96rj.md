# hpf-96rj — PR #370 fix round 3: GFM pipe-table rows as their own blocks

Origin: Codex exact-head review R3 hpf-tfkw (VERDICT: HOLD at bb7c4b6) of PR #370 (pipeline
hardening, origin bead hpf-y1p4). This round closes its single remaining finding,
[PRE-EXISTING][medium], in `check_assembly_dispositions.py`. Rounds 1 and 2 (hpf-qo10,
hpf-oy2w) are not reworked. Lane `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`,
`git rev-parse HEAD` = `bb7c4b64d5d28916a67cc61a2f7f40a10e9b8f4e` (verified first). All
changes are UNCOMMITTED in the lane.

## Changed files

| File | Change |
|---|---|
| `pipeline/synthetic/gates/scripts/check_assembly_dispositions.py` | a GFM table is found by its delimiter row and every line of it is a block of its own; a marker split across two blocks still counts, naming no unit; contract in the module docstring |
| `pipeline/synthetic/gates/scripts/tests/test_assembly_table_rows_round3.py` | new: 32 items, 22 red-first defect tests + 10 guards |
| `docs/worklog/hpf-96rj.md` | this file |

Not touched: `BATCH-RUNBOOK.md` (it carries no assembly-gate behaviour text — no line
mentions "assembly" or "disposition" — so there is no contract sentence to match; the gate's
only prose contract is its module docstring), batch content, verdict files, `data/`, `app/`,
`worker/`, `.github/workflows/`, the pre-existing untracked `.claude/skills/*`, `.agents/`,
`.codex/`, `.gc/` material and the sandbox dotfiles. The bead names no validator (metadata
`gc.check_path` belongs to the workflow-control check lane), so none was run.

---

## The finding

`_ONE_LINE_BLOCK` recognised a table row only by its optional leading pipe. A valid GFM table
without outer pipes was read as one paragraph, so the marker-only row borrowed a unit from
another row:

```
Unit | Note
--- | ---
elf-b16-003 | clean
Other | disposition owed
```

With elf-b16-003 disposed in the verdicts file:

```
head (exit 0): assembly-dispositions: OK — 1 marker(s), all discharged
fix  (exit 1): DISPOSITION-OWED <no unit named>: line 4: Other | disposition owed
               assembly-dispositions: 1 undischarged of 1 marker(s)
```

## The contract now (module docstring "Tables" + comment above `_TABLE_DELIMITER`)

1. **A table is found by its delimiter row**: cells of `-` with optional `:` alignment,
   outer pipes optional, holding at least one `|` or `:`. A bare `---` stays what it was, a
   thematic break or setext underline (`test_bare_dash_line_under_prose_is_not_a_delimiter_row`).
2. **Its lines**: the header row directly above the delimiter row (when not blank), the
   delimiter row, and every following line up to the next blank line, line opening another
   block (list item, ATX heading, thematic break, code fence) or change of blockquote depth.
3. **Every table line is a block of its own**, so a marker row names only its own unit(s)
   and a marker-only row reports `DISPOSITION-OWED <no unit named>`. Inside its row the
   existing sentence rule still applies; a cell's `|` is not a sentence boundary. The
   delimiter row can hold only `|`, `:`, `-` and whitespace, so it names no unit and is no
   marker.
4. **A `|` in prose with no delimiter row is not a table** (unchanged). A line starting
   with `|` remains a one-line block, as on head.
5. **A marker wrapped across two adjacent lines of different blocks** (two rows; a heading
   and the line below it) is in neither block. It still counts and names no unit. Its
   excerpt opens with `(split across two blocks)`.

Implementation: `_table_rows()` collects the table line indices in one pass; `_blocks()`
makes each of them a one-line block (`i in table or _ONE_LINE_BLOCK.match(raw)`), so the
fix only ever adds block boundaries. `_ONE_LINE_BLOCK` itself is unchanged in meaning: its
heading/thematic-break/fence alternatives moved into `_OPENER`, shared with `_TABLE_END`.
`find_markers()` additionally scans each pair of adjacent non-blank lines that straddle a
block boundary.

## Decisions — each fails closed, each is pinned by a test

### D1. A line without `|` inside the table is a one-cell row (GFM spec example 202)

The bead says "all following rows containing `|` until a blank line or a non-table line".
Read literally, the first line without `|` ends the table and opens a paragraph, which then
swallows the next line. GFM renders both as separate rows: "The table is broken at the first
empty line, or beginning of another block-level structure" (spec examples 201/202). The
literal reading would therefore join two rendered rows and borrow:

```
Unit | Note
--- | ---
elf-b16-003 | clean
Cross-batch cloze echo, disposition owed     <- GFM: a row; literal reading: a paragraph...
elf-b16-001 is clean                         <- ...that joins this row and borrows elf-b16-001
```

So the table runs to a blank line, block opener or quote-depth change, and pipe-less lines
inside it are rows. Every row containing `|` is covered exactly as the bead states; the only
difference is that a pipe-less line can never join the next line. That is strictly stricter,
and the 243 pre-existing Markdown files have 0 such lines (probe §3; its only hits are lines
88–89 above). Pinned by
`test_line_without_a_pipe_after_the_rows_is_a_row_of_its_own`. Reverting to the literal
reading is one condition: add `or "|" not in text` to the break test in `_table_rows`, and
drop that test.

### D2. A marker split across two blocks is counted, naming no unit

Making every row a block means a marker wrapped from one row into the next
(`elf-b16-003 | cross-batch echo, disposition` / `owed`) lies in neither block. Head found it,
because it read the pipe-less table as one paragraph. Silently dropping it would turn
"1 undischarged" into "OK — 0 marker(s)", a fail-open introduced by this fix. So the
boundary between any two adjacent non-blank lines in different blocks is scanned; a marker
crossing it is reported as `<no unit named>`. Verdicts can never discharge such a report;
the remedy is to put the marker and its unit(s) in one row or block.

The rule is general. It also catches a heading ending `…, disposition` over a line starting
`owed…`, which head dropped (0 markers). A next line that opens with `- `, `1. `, `#`, `|` or
`>`, or a previous line ending in `|`, cannot produce a crossing match, because the marker
regex allows only whitespace between its words. List items and piped rows are therefore
unaffected. Real corpus: 0 hits (probe §3). Pinned by
`test_marker_wrapped_across_two_blocks_is_never_dropped[row-then-pipeless-row|row-then-row|heading-then-paragraph]`.

### D3. Tables inside list items and blockquotes

The delimiter row may be indented by any amount, so a table nested in a list item is found
(`test_table_inside_a_list_item[item|nested-item]`; nested item content sits at 4 spaces).
In a blockquote, detection reads the text after the `>` markers, and the table ends where the
quote depth changes, as in GFM example 201 where a blockquote breaks the table
(`test_table_inside_a_blockquote`, `test_table_ends_at_a_blank_line_or_another_block[blockquote]`).
Blockquotes outside tables are untouched (residual R1).

### D4. Detection errs towards "table"

- Column counts are not compared.
- The header row may be any non-blank line, including a list-item or heading line.
- Indentation is not capped at 3 spaces.
- A `:`-only delimiter (`:---`) counts (`test_single_column_table`).

Each of these can only split lines that GFM might keep together. That narrows a marker's
scope towards `<no unit named>` and never lends it a unit. Checked mechanically: on every
Markdown file in the sweep (the 243 pre-existing ones plus this worklog) the fix's block
partition refines head's, so no fix block spans two head blocks (probe §3). That follows
from the code too: the fix only adds a one-line-block condition (`i in table`), and never
removes one.

---

## Red-first evidence

Before any edit: `git rev-parse HEAD:pipeline/synthetic/gates/scripts/check_assembly_dispositions.py`
= `git hash-object` of the lane copy = `45ce1751449883696b5028479436799e3b5adfbd`. The red run
below used the final test file; it has not changed since, so the line numbers are current.

```
$ python3 -m pytest -q -p no:cacheprovider --tb=line -rf pipeline/synthetic/gates/scripts/tests
22 failed, 222 passed in 2.69s
```

That is 244 items: the 212 baseline items all pass; of the 32 new ones, the 22 defect tests
fail and the 10 guards pass. Assertion lines, all in `test_assembly_table_rows_round3.py`:

```
:62   test_review_repro_table_without_outer_pipes_fails_closed
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:74   test_marker_only_row_fails_closed_whatever_the_outer_pipes[none|trailing]          (x2)
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:84   test_marker_row_names_only_its_own_units[none|trailing]                            (x2)
        AssertionError: DISPOSITION-OWED elf-b16-003: line 4: Unit | Note --- | --- elf-b16-003 | clean elf-b16-001 | echo of elf-b15-002, disposition owed
:95   test_any_delimiter_row_opens_a_table[...]                                          (x7)
        ":--- | ---:", ":-: | :-:", "---|---", "-|-", "| --- | ---", "--- | --- |", "|:---|---:|"
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:103  test_single_column_table
:116  test_header_row_is_a_row_of_its_own
:131  test_line_without_a_pipe_after_the_rows_is_a_row_of_its_own
:145  test_table_inside_a_list_item[item|nested-item]                                    (x2)
:155  test_table_inside_a_blockquote
        each: AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:177  test_table_ends_at_a_blank_line_or_another_block[blockquote]   (over-strict head, D3)
        AssertionError: DISPOSITION-OWED elf-b16-003: line 4: Unit | Note --- | --- elf-b16-003 | clean > Cross-batch echo with the batch15 cloze, disposition owed > for elf-b16-001.
:212  test_marker_wrapped_across_two_blocks_is_never_dropped[row-then-pipeless-row|row-then-row]   (x2)
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:212  test_marker_wrapped_across_two_blocks_is_never_dropped[heading-then-paragraph]
        AssertionError: assembly-dispositions: OK — 0 marker(s), all discharged
```

The `[blockquote]` failure is head being over-strict: it read the quote into the table's
paragraph and demanded elf-b16-003. It is not a fail-open.

Guards (10), green on head and after the fix:
- `test_marker_only_row_fails_closed_whatever_the_outer_pipes[leading|both]`: a line
  starting with `|` was already its own block on head.
- `test_marker_row_names_only_its_own_units[leading|both]`.
- `test_table_ends_at_a_blank_line_or_another_block[blank line|heading|list item]`.
- `test_pipe_in_prose_is_not_a_table[paragraph|item]`.
- `test_bare_dash_line_under_prose_is_not_a_delimiter_row`.

The bead's four required behaviours map to these tests:
1. The pipe-less table must fail closed: `test_review_repro_table_without_outer_pipes_fails_closed`
   and `test_marker_only_row_fails_closed_whatever_the_outer_pipes[none]`.
2. The same with leading and trailing pipes: `...[both]`, plus `[leading]` and `[trailing]`.
3. A marker row naming its own unit: `test_marker_row_names_only_its_own_units[none|leading|trailing|both]`.
4. A prose line with `|` that is not a table: `test_pipe_in_prose_is_not_a_table[paragraph|item]`.

## Green run (after the fix)

```
$ python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
244 passed in 2.52s           # baseline 212 + 32 new
$ python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
70 passed in 5.75s            # baseline 70
```

---

## Real-corpus probe — head bb7c4b6 vs fix (appendix A, `probe_round3.py`)

Every `pipeline/synthetic/batches/*/ASSEMBLY.md` is **byte-identical**, head vs fix, in
stdout, stderr and exit code. Only batch15, batch16 and batch17 of the 17 batch dirs have one.
Block partitions and markers are identical too. Each file has one Id-map table, lines
10–18, already piped, so head had already split it.

```
head copy: blob 45ce1751449883696b5028479436799e3b5adfbd == git rev-parse bb7c4b6:pipeline/synthetic/gates/scripts/check_assembly_dispositions.py
fix:       blob aa69af8049433a423560e8155fc3a3d90fd8a435 (lane working tree)

=== 1. gate CLI, every batches/*/ASSEMBLY.md (3 of 17 batch dirs have one: batch15, batch16, batch17)
  batch15: IDENTICAL (head exit 0, fix exit 0)
    | assembly-dispositions: OK — 0 marker(s), all discharged
  batch16: IDENTICAL (head exit 1, fix exit 1)
    | DISPOSITION-OWED elf-b15-002: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
    | DISPOSITION-OWED elf-b16-001: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
    | DISPOSITION-OWED <no unit named>: line 48: one written disposition owed per the 2026-08-26 process rule.
    | DISPOSITION-OWED <no unit named>: line 50: disposition owed).
    | assembly-dispositions: 4 undischarged of 3 marker(s)
  batch17: IDENTICAL (head exit 0, fix exit 0)
    | assembly-dispositions: OK — 0 marker(s), all discharged
  3/3 byte-identical

=== 2. per ASSEMBLY.md: blocks, markers, table lines (1-based)
  batch15: 58 lines; blocks head 22 fix 22 identical=True; markers 0 identical=True; table lines 10-18
  batch16: 60 lines; blocks head 24 fix 24 identical=True; markers 3 identical=True; table lines 10-18
  batch17: 56 lines; blocks head 21 fix 21 identical=True; markers 0 identical=True; table lines 10-18

=== 3. structural sweep: every *.md under pipeline/synthetic/ and docs/
  244 files, 0 not UTF-8, 256 delimiter rows; fix partition refines head's everywhere: True
  files whose blocks or markers differ from head: 1
    docs/worklog/hpf-96rj.md: markers identical=False; head blocks split: 34-37; 85-89
  table lines without '|' (one-cell rows): 2
    docs/worklog/hpf-96rj.md:88: Cross-batch cloze echo, disposition owed     <- GFM: a row; literal reading: a paragraph...
    docs/worklog/hpf-96rj.md:89: elf-b16-001 is clean                         <- ...that joins this row and borrows elf-b16-001
  '(split across two blocks)' markers: 0

=== 4. hpf-tfkw review repro, head vs fix
  head (exit 0):
    | assembly-dispositions: OK — 1 marker(s), all discharged
  fix (exit 1):
    | DISPOSITION-OWED <no unit named>: line 4: Other | disposition owed
    | assembly-dispositions: 1 undischarged of 1 marker(s)
```

Every gated file is identical. The batch16 result (4 undischarged of 3 markers, exit 1) is
the round-2 state carried unchanged; it is batch content, not in scope.

The one sweep difference is this worklog's own fenced examples: the review repro (lines
34–37) and the D1 example (lines 85–89). The gate never reads `docs/`. It also does not model
code fences, on head or now, so their content lines are read as Markdown. A first run,
before this file existed, gave the same sections 1, 2 and 4, and for section 3: 243 files,
252 delimiter rows, 0 differing files, 0 pipe-less rows, 0 split markers. In the 243
pre-existing Markdown files, then, the fix changes no block and no marker. Every real table
in the repo is piped, which is why head already split them.

---

## Residual risks (out of scope; evidence from appendix B, head = fix in every case)

1. **R1 — blockquotes outside tables are not modelled.** These pre-existing fail-open paths
   lie outside tables; this round did not change them. The real ASSEMBLY.md files have no
   blockquotes.
   - A marker wrapped across two quote lines (`> …, disposition` / `> owed: elf-b16-001`)
     is missed, because the joined text reads `disposition > owed`. Result: exit 0,
     0 markers.
   - A quote-blank line `>` does not close the block, so
     `> elf-b16-003 is clean` / `>` / `> …, disposition owed` borrows elf-b16-003. Result:
     exit 0.
   - Quoted list items (`> - …`) are not items, so a sibling item lends its unit. Result:
     exit 0.

   A fix would strip quote markers before the block rules, treat a quote-only line as blank
   and close the block at a depth change. That warrants its own bead with its own probe,
   because GFM lazy continuation makes the depth rule non-trivial.
2. **R2 — the marker phrase is matched literally.**
   - `dispositions owed` (plural) is not a marker. Batch17 `ASSEMBLY.md:55` reads "6. Written
     dispositions owed for any named adjacency per the 2026-08-26 process rule.", a real
     obligation the gate does not see. Result: batch17 OK with 0 markers.
   - `disposition **owed**` (emphasis inside the phrase) is missed too.

   Widening `MARKER_RE` would change batch17's real result: the plural line names no unit,
   so it would report `<no unit named>` and exit 1. That is an owner decision.
3. **R3 — CI still does not run the gate suite.** `.github/workflows/ci.yml:30` runs only
   `.github/contract-tests` and `pipeline/synthetic/evidence/tests`, so the 244 gate tests,
   including three review rounds of regressions, run only by hand. This is unchanged from
   hpf-oy2w residual 1.
4. **R4 — over-detection can raise a false `<no unit named>` on malformed Markdown.** Two
   examples: a table followed by a paragraph without a blank line (D1), and a pipe-bearing
   prose line directly above a delimiter-shaped line (D4). Both fail closed by design; the
   remedy is a blank line, or the marker's units in its own row.

## Reproduction

```
git rev-parse HEAD                    # bb7c4b64d5d28916a67cc61a2f7f40a10e9b8f4e
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
python3 probe_round3.py "$PWD" bb7c4b6 <work-dir>                     # appendix A
python3 residuals_round3.py "$PWD" <work-dir>/head/check_assembly_dispositions.py <work-dir2>   # appendix B
```

The scripts ran from this session's scratchpad. SHA-256 of each, as run:
- `probe_round3.py`: `86ca62b4e0765ec51cb66ca2c6d3a9ac6b5658c47af1346ea59767b3dbf12dc1`
- `residuals_round3.py`: `a1895873afcceb7e581338b142e94c5a57a4e1ecd1e9586217bcc13515726c73`

Lane files at hand-off:

| File | git blob | SHA-256 |
|---|---|---|
| `check_assembly_dispositions.py` | `aa69af8049433a423560e8155fc3a3d90fd8a435` | `98f3d4d5071a8c9d54f22637874282533f9df2a8430fe3a5978d34fa0d5f4d1e` |
| `tests/test_assembly_table_rows_round3.py` | `21e08ad5a86e5d803cb9b78b5d306425d95b4725` | `05d56dea311a073d21d8c5e2c917afad86629cc01c71173c1ddec59af04a2c13` |

### Appendix A — `probe_round3.py`

```python
"""Real-corpus probe for bead hpf-96rj: the head gate (bb7c4b6) vs the lane's gate.

1. the gate CLI on every pipeline/synthetic/batches/*/ASSEMBLY.md with its
   verdicts.jsonl, head vs fix, byte for byte (stdout + stderr + exit code);
2. per ASSEMBLY.md: block partition, markers and the table lines found;
3. structural sweep of every *.md under pipeline/synthetic/ and docs/: where
   do the fix's blocks or markers differ from head's (blast radius of the
   table rule outside the gated files), plus every table line without "|"
   and every "(split across two blocks)" marker;
4. the hpf-tfkw review repro, head vs fix.

Read-only over the repo; writes only the verified head copy and the repro
files under <work-dir>.
usage: probe_round3.py <lane-root> <head-rev> <work-dir>
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

LANE, REV, WORK = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
REL = "pipeline/synthetic/gates/scripts/check_assembly_dispositions.py"
FIX = LANE / REL
BATCHES = LANE / "pipeline/synthetic/batches"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(LANE), *args], capture_output=True, text=True,
                          check=True).stdout


def head_copy() -> Path:
    dst = WORK / "head" / "check_assembly_dispositions.py"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(subprocess.run(["git", "-C", str(LANE), "show", f"{REV}:{REL}"],
                                   capture_output=True, check=True).stdout)
    want, got = git("rev-parse", f"{REV}:{REL}").strip(), git("hash-object", str(dst)).strip()
    if want != got:
        raise SystemExit(f"head copy blob {got} != {REV}:{REL} {want}")
    print(f"head copy: blob {got} == git rev-parse {REV}:{REL}")
    print(f"fix:       blob {git('hash-object', str(FIX)).strip()} (lane working tree)")
    return dst


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def cli(script: Path, *args) -> tuple[int, str]:
    r = subprocess.run([sys.executable, str(script), *map(str, args)], capture_output=True,
                       text=True, cwd=LANE)
    return r.returncode, r.stdout + r.stderr


def ranges(idx) -> str:
    out: list[list[int]] = []
    for i in sorted(idx):
        if out and i == out[-1][1] + 1:
            out[-1][1] = i
        else:
            out.append([i, i])
    return ", ".join(f"{a + 1}-{b + 1}" if a != b else f"{a + 1}" for a, b in out) or "none"


def batch_key(p: Path) -> int:
    n = p.name[5:]
    return int(n) if n.isdigit() else 999


HEAD = head_copy()
H, F = load("asm_head", HEAD), load("asm_fix", FIX)
asms = sorted(BATCHES.glob("*/ASSEMBLY.md"), key=lambda p: batch_key(p.parent))
batches = sorted((p for p in BATCHES.iterdir() if p.is_dir()), key=batch_key)

print(f"\n=== 1. gate CLI, every batches/*/ASSEMBLY.md ({len(asms)} of {len(batches)} batch dirs"
      f" have one: {', '.join(a.parent.name for a in asms)})")
identical = 0
for asm in asms:
    v = asm.parent / "verdicts.jsonl"
    a, b = cli(HEAD, asm, v), cli(FIX, asm, v)
    identical += a == b
    print(f"  {asm.parent.name}: {'IDENTICAL' if a == b else 'DIFFERENT'}"
          f" (head exit {a[0]}, fix exit {b[0]})")
    for line in b[1].splitlines():
        print(f"    | {line}")
    if a != b:
        print("    head was:")
        for line in a[1].splitlines():
            print(f"    | {line}")
print(f"  {identical}/{len(asms)} byte-identical")

print("\n=== 2. per ASSEMBLY.md: blocks, markers, table lines (1-based)")
for asm in asms:
    lines = asm.read_text(encoding="utf-8").splitlines()
    hb, fb = H._blocks(lines), F._blocks(lines)
    hm, fm = H.find_markers(lines), F.find_markers(lines)
    print(f"  {asm.parent.name}: {len(lines)} lines; blocks head {len(hb)} fix {len(fb)}"
          f" identical={hb == fb}; markers {len(fm)} identical={hm == fm};"
          f" table lines {ranges(F._table_rows(lines))}")

print("\n=== 3. structural sweep: every *.md under pipeline/synthetic/ and docs/")
mds = sorted([*(LANE / "pipeline/synthetic").rglob("*.md"), *(LANE / "docs").rglob("*.md")])
diff_files, lazy, split_markers, tables, unreadable, refined = [], [], [], 0, [], True
for md in mds:
    try:
        lines = md.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError as exc:
        unreadable.append(f"{md.relative_to(LANE)} ({exc.reason})")
        continue
    rows = F._table_rows(lines)
    tables += sum(1 for i, l in enumerate(lines) if F._TABLE_DELIMITER.match(F._quoted(l)[1]))
    lazy += [(md, i, lines[i]) for i in sorted(rows) if "|" not in lines[i]]
    hb, fb = H._blocks(lines), F._blocks(lines)
    hm, fm = H.find_markers(lines), F.find_markers(lines)
    split_markers += [(md, m) for m in fm if m[2].startswith("(split across two blocks)")]
    # the fix only ever splits: each fix block lies inside one head block
    owner = {i: k for k, b in enumerate(hb) for i in b}
    refined &= all(len({owner[i] for i in b}) == 1 for b in fb)
    if hb != fb or hm != fm:
        diff_files.append((md, hb, fb, hm, fm))
print(f"  {len(mds)} files, {len(unreadable)} not UTF-8, {tables} delimiter rows;"
      f" fix partition refines head's everywhere: {refined}")
for u in unreadable:
    print(f"    not UTF-8 (skipped): {u}")
print(f"  files whose blocks or markers differ from head: {len(diff_files)}")
for md, hb, fb, hm, fm in diff_files:
    fset = {tuple(b) for b in fb}
    split = [b for b in hb if tuple(b) not in fset]
    print(f"    {md.relative_to(LANE)}: markers identical={hm == fm};"
          f" head blocks split: {'; '.join(ranges(b) for b in split)}")
print(f"  table lines without '|' (one-cell rows): {len(lazy)}")
for md, i, text in lazy:
    print(f"    {md.relative_to(LANE)}:{i + 1}: {text[:100]}")
print(f"  '(split across two blocks)' markers: {len(split_markers)}")
for md, m in split_markers:
    print(f"    {md.relative_to(LANE)}:{m[0]}: {m[2][:100]}")

print("\n=== 4. hpf-tfkw review repro, head vs fix")
repro = WORK / "repro"
repro.mkdir(parents=True, exist_ok=True)
(repro / "ASSEMBLY.md").write_text("Unit | Note\n--- | ---\nelf-b16-003 | clean\n"
                                   "Other | disposition owed\n", encoding="utf-8")
(repro / "v.jsonl").write_text(json.dumps({
    "candidate_id": "elf-b16-003", "gate": "G-REGISTER", "verdict": "pass", "findings": [],
    "disposition": "different roles, different batches, no same-test collision"}) + "\n",
    encoding="utf-8")
for label, script in (("head", HEAD), ("fix", FIX)):
    code, out = cli(script, repro / "ASSEMBLY.md", repro / "v.jsonl")
    print(f"  {label} (exit {code}):")
    for line in out.splitlines():
        print(f"    | {line}")
```

### Appendix B — `residuals_round3.py` and its output

```python
"""Residual-risk repros for bead hpf-96rj, head (verified copy) vs the lane's gate.

Each case is out of this bead's scope (not a table row); the probe records
what both gates do so the worklog states it from evidence, not inference.
usage: residuals_round3.py <lane-root> <head-copy> <work-dir>
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

LANE, HEAD, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
FIX = LANE / "pipeline/synthetic/gates/scripts/check_assembly_dispositions.py"

CASES = {
    "R1 quoted marker wrapped across two quote lines":
        ("> Cross-batch echo, disposition\n> owed: elf-b16-001\n", []),
    "R1 quote-blank line between two quoted paragraphs":
        ("> elf-b16-003 is clean\n>\n> Cross-batch echo, disposition owed\n", ["elf-b16-003"]),
    "R1 two quoted list items":
        ("> - elf-b16-003 is clean\n> - Cross-batch echo, disposition owed\n", ["elf-b16-003"]),
    "R2 plural marker (batch17 ASSEMBLY.md:55 shape)":
        ("6. Written dispositions owed for elf-b17-001 per the process rule.\n", []),
    "R2 emphasis inside the marker":
        ("- Cross-batch echo, disposition **owed**: elf-b16-001\n", []),
}

WORK.mkdir(parents=True, exist_ok=True)
for title, (text, disposed) in CASES.items():
    asm, vf = WORK / "ASSEMBLY.md", WORK / "v.jsonl"
    asm.write_text(text, encoding="utf-8")
    vf.write_text("".join(json.dumps({
        "candidate_id": u, "gate": "G-REGISTER", "verdict": "pass", "findings": [],
        "disposition": "different roles, different batches, no same-test collision"}) + "\n"
        for u in disposed), encoding="utf-8")
    print(f"### {title}  (disposed: {', '.join(disposed) or 'none'})")
    for line in text.splitlines():
        print(f"    > {line}")
    for label, script in (("head", HEAD), ("fix ", FIX)):
        r = subprocess.run([sys.executable, str(script), str(asm), str(vf)],
                           capture_output=True, text=True)
        print(f"  {label} exit {r.returncode}: {(r.stdout + r.stderr).strip().splitlines()[-1]}")
```

```
### R1 quoted marker wrapped across two quote lines  (disposed: none)
    > > Cross-batch echo, disposition
    > > owed: elf-b16-001
  head exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
  fix  exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
### R1 quote-blank line between two quoted paragraphs  (disposed: elf-b16-003)
    > > elf-b16-003 is clean
    > >
    > > Cross-batch echo, disposition owed
  head exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
  fix  exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
### R1 two quoted list items  (disposed: elf-b16-003)
    > > - elf-b16-003 is clean
    > > - Cross-batch echo, disposition owed
  head exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
  fix  exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
### R2 plural marker (batch17 ASSEMBLY.md:55 shape)  (disposed: none)
    > 6. Written dispositions owed for elf-b17-001 per the process rule.
  head exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
  fix  exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
### R2 emphasis inside the marker  (disposed: none)
    > - Cross-batch echo, disposition **owed**: elf-b16-001
  head exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
  fix  exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
```

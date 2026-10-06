# hpf-wu46 — PR #370 fix round 4: blockquote scoping, marker variants, gate suite in CI

Origin: Codex exact-head review R4 hpf-tuqq (VERDICT: HOLD at 6af7c1a) of PR #370 (pipeline
hardening, origin bead hpf-y1p4). This round closes its three [PRE-EXISTING][medium] findings.
Rounds 1–3 (hpf-qo10, hpf-oy2w, hpf-96rj) are not reworked. Lane
`/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`, `git rev-parse HEAD` =
`6af7c1ab77d1cecb2809434e889c7df39168a5e7` (verified first). All changes are UNCOMMITTED.

## Changed files

| File | Change |
|---|---|
| `pipeline/synthetic/gates/scripts/check_assembly_dispositions.py` | F1: every block rule reads a line's de-quoted text; a quote-only line is blank; a change of quote depth ends the block; the block-boundary scan reads de-quoted text. F2: `MARKER_RE` = `` dispositions?[\s*_`]+owed `` (case-insensitive). Contract in the module docstring ("Marker", "Blockquotes") |
| `pipeline/synthetic/gates/scripts/tests/test_assembly_blockquotes_markers_round4.py` | new: 74 items, 63 red on 6af7c1a + 11 green there (10 guards, 1 coincidental pass) |
| `.github/workflows/ci.yml` | F3: line 30 adds `pipeline/synthetic/gates/scripts/tests` to the `workflow contract` pytest command |
| `docs/worklog/hpf-wu46.md` | this file |

Not touched:
- `BATCH-RUNBOOK.md`. It holds no assembly-gate behaviour text:
  `grep -n -i -E "assembly|disposition|marker" pipeline/synthetic/BATCH-RUNBOOK.md` → 0
  lines. So there is no contract sentence to match, as in round 3.
- Batch content, including batch17 `ASSEMBLY.md`, `STATUS.md` and `BRIEF-ADDENDUM.md:161`.
  The last describes the gate in Swedish ("fäller *disposition owed*"). That is still true;
  it just doesn't list every form.
- Verdict files, `data/`, `app/`, `worker/`.
- The `ci.yml` comment above the `contract:` job. The bead scope is the one pytest line;
  see R4.
- The pre-existing untracked `.claude/skills/*`, `.agents/`, `.codex/`, `.gc/` material and
  the sandbox dotfiles.

The bead names no validator (`gc.check_path` belongs to the workflow-control check lane), so
none was run.

---

## Finding 1 — blockquotes fail open

**Contract now** (module docstring "Blockquotes" + the comment above `_LIST_ITEM`):

1. Every rule reads the text after the line's quote markers: blank line, list item, heading,
   thematic break, fence, leading-pipe row, table detection, block joining and the
   block-boundary scan. A quote marker is `>` and one optional space or tab, at any nesting
   depth, with any indentation before each `>`
   (`_QUOTE = ^(?:\s*>[ \t]?)*`). A quoted list item, heading or table row is therefore one.
2. **A quote-only line** (`>`, `> `, `> >`, `>>`) is a blank line: it closes the open block.
3. **A change of quote depth ends the block**, in both directions, and also where GFM would
   read a lazy continuation line (D1).
4. **A marker wrapped across two lines of one quoted block is found.** The block is joined
   from de-quoted text, so `> …, disposition` / `> owed: elf-b16-001` reads
   `…, disposition owed: elf-b16-001`.
5. A marker wrapped across a quote-depth boundary is in neither block. The round-3
   boundary scan, now run on de-quoted text, still finds it and reports it as
   `(split across two blocks)`, naming no unit (D5).

**Implementation** (`_blocks`, `find_markers`):
- `_blocks` takes `(depth, text) = _quoted(raw)` per line and opens a new block when
  `depth != open_depth`.
- `find_markers` builds `dequoted = [_quoted(raw)[1] for raw in lines]` once and uses it for
  block joining and for the boundary pair scan.
- For a line without a leading `>`, `_quoted` returns the raw line at depth 0, so an
  unquoted document goes through exactly the code path it went through at 6af7c1a. The
  probe (§3) confirms this on 295 tracked Markdown files.

**Review repros, head vs fix** (probe §4, verbatim):

```
F1a  > Cross-batch echo, disposition / > owed: elf-b16-001          (no verdicts)
     head exit 0: assembly-dispositions: OK — 0 marker(s), all discharged
     fix  exit 1: DISPOSITION-OWED elf-b16-001: line 1: Cross-batch echo, disposition owed: elf-b16-001
F1b  > elf-b16-003 is clean / > / > Cross-batch echo, disposition owed   (elf-b16-003 disposed)
     head exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
     fix  exit 1: DISPOSITION-OWED <no unit named>: line 3: Cross-batch echo, disposition owed
F1c  > - elf-b16-003 is clean / > - Cross-batch echo, disposition owed   (elf-b16-003 disposed)
     head exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
     fix  exit 1: DISPOSITION-OWED <no unit named>: line 2: Cross-batch echo, disposition owed
```

## Finding 2 — the marker pattern was too literal

`` MARKER_RE = re.compile(r"dispositions?[\s*_`]+owed", re.IGNORECASE) ``: "disposition" or
"dispositions", then "owed", in any case. One or more whitespace, `*`, `_` or `` ` ``
characters may sit between the words. A line wrap counts, because blocks are joined with
single spaces. Markup *around* the phrase never stopped a match, because the pattern is not
anchored. Any other word or punctuation between the two words makes no marker (R1).

The bead's list, measured at 6af7c1a (probe §4):
- `dispositions owed`, `disposition **owed**`: missed on head (exit 0, 0 markers), found
  now.
- `*disposition owed*`, `` `disposition owed` ``: **already found on head** (exit 1,
  `DISPOSITION-OWED elf-b16-001`), because the inner phrase still matches the literal
  pattern. Head truly missed only markup *between* the words, and the plural. Those two
  forms are pinned as guards
  (`` test_marker_inside_emphasis_or_code_is_found[*disposition owed*|`disposition owed`|…] ``).

**batch17 `ASSEMBLY.md:55` now:**

```
DISPOSITION-OWED <no unit named>: line 55: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.
assembly-dispositions: 1 undischarged of 1 marker(s)          exit 1 (was exit 0, 0 markers)
```

This is the expected fail-closed result. Item 6 is a standing process rule and names no
unit, so no verdict can discharge it. The remedy is a batch-content decision outside this
bead (R5). Pinned by `test_batch17_plural_process_rule_fails_closed` on the verbatim
text.

## Finding 3 — the gate suite was not in CI

```diff
-      - run: python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests -q
+      - run: python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q
```

- **Dependencies.** Every gate test imports only stdlib modules, `pytest` and sibling
  scripts. Those scripts import only stdlib modules. Checked with
  `grep -E "^\s*(import|from) "` over all 11 test files and all 15 scripts.
  `pip install pytest pyyaml` therefore stays as it was (`pyyaml` is for the contract tests).
- **Collection.** No `conftest.py` and no pytest config are tracked
  (`git ls-files -- '*pytest.ini' '*conftest.py' '*pyproject.toml' '*setup.cfg' '*tox.ini'`
  → none). No test basename repeats across the three directories. The gate tests' `sys.path`
  inserts name only `gates/scripts` modules, and no other test directory imports a module
  of the same name.
- **Local run of the exact CI command, from the repo root** (Python 3.12.3, like CI's 3.12;
  pytest 7.4.4):

  ```
  $ python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q
  388 passed in 9.54s           # 70 contract+evidence + 318 gate
  ```

  Without `-p no:cacheprovider`, that command creates `.pytest_cache/` in the repo root.
  The directory did not exist before. It ignores itself (it carries its own `*`
  `.gitignore`), and I deleted it after each run.

---

## Decisions — each fails closed, each is pinned by a test

### D1. A change of quote depth ends the block, even where GFM reads a lazy continuation line

The bead requires a depth change to be a block boundary. GFM would join
`> elf-b16-003 is clean` / `Cross-batch echo, disposition owed` (or `> > a` / `> b`) as one
paragraph through a lazy continuation line. The gate splits them, so the marker names no unit
and borrows nothing. The cost is a false `<no unit named>` on lazily continued Markdown
(R2, evidence §C). The remedy is to put `>` on every quoted line. Pinned by
`test_change_of_quote_depth_closes_the_block[lazy line after quote|lazy line after nested quote]`
and `test_marker_wrapped_across_a_quote_depth_change_is_never_dropped[lazy-line]`.

### D2. The optional space after `>` belongs to the quote marker: quoting never changes a result

The bead says "`>` with optional following space", and GFM agrees. Head's `_QUOTE` kept that
space in the text. So inside a quoted table, `>    ## Notes` read as a 4-space-indented line,
not a heading, and stayed a table row. Now it reads `   ## Notes`, a heading indented 3
spaces. That heading ends the table exactly as it does unquoted, which head already did for
the unquoted line.

On that one shape (a quoted table whose rows are followed by a 3-space-indented opener and
then unpunctuated paragraph lines) the fix is **less strict than head**. Head kept the
following lines as one-line rows. The fix reads them as one paragraph and attributes the
paragraph's unit to the marker's sentence. That is the established contract for a paragraph,
and the same result as the unquoted twin. Every other change in this round only adds
boundaries or markers.

Pinned by `test_quoted_document_reads_like_its_unquoted_twin`. Quoting a whole document
(`> `, `>`, `> > `) must give the same exit status and the same report, byte for byte, as
the unquoted document. Its `table then heading` twin is that shape (head: exit 1
`<no unit named>`, unquoted twin exit 0). Its `assembly record` twin is the
unquoted-document guard's text (head missed a marker; see the red table).

Corpus: 0 occurrences. On all 326 tracked Markdown files the fix's block partition refines
head's (probe §3), so no fix block spans two head blocks anywhere.

### D3. Markup between the words: any run of whitespace, `*`, `_`, `` ` ``

`` [\s*_`]+ `` also accepts `disposition_owed` (no whitespace), `disposition * owed`, and an
emphasis run from two adjacent lines (`**disposition**` / `**owed**`). It accepts the
boundary between a line ending `disposition` and a next line opening a `* ` bullet too:
that pair is reported as `(split across two blocks)`, naming no unit. Each of these can only
add a marker, never remove one or change its units. Strikethrough, backslash escapes, HTML
tags, links, hyphens and words between the two words are not markers (R1).

Checked by CLI: `- Cross-batch echo, disposition` / `* owed: elf-b16-001`, with
elf-b16-001 disposed.
- fix exit 1: `DISPOSITION-OWED <no unit named>: line 1: (split across two blocks) - Cross-batch echo, disposition * owed: elf-b16-001`
- head exit 0: `OK — 0 marker(s)`

### D4. Any indentation before `>`, at any depth

A quote inside a list item (`  > …`) is a quote. Indented 4+ spaces it is too, where GFM
might see an indented code block. That is fail-closed: it only adds boundaries and
de-quotes text. Pinned by `test_marker_wrapped_across_two_quote_lines_is_found[   > ]`,
`test_marker_wrapped_inside_a_quote_inside_a_list_item_is_found` and
`test_change_of_quote_depth_closes_the_block[quote inside list item]`.

The 4-space case, checked by CLI: `elf-b16-003 is clean` / `    > Cross-batch echo, disposition` /
`    > owed: elf-b16-001`, with elf-b16-001 disposed.
- fix exit 0: `OK — 1 marker(s)`. The wrapped marker is found, and elf-b16-003 is not lent.
- head exit 0: `OK — 0 marker(s)`. The marker was dropped.

### D5. The block-boundary scan reads de-quoted text

Without this, a marker wrapped across a depth change (`> …, disposition` / `> > owed: …`)
would join to `disposition > > owed` and be dropped (head: exit 0, 0 markers). Pinned by
`test_marker_wrapped_across_a_quote_depth_change_is_never_dropped[into-nested|out-of-nested|into-quote|lazy-line]`.
A quote-only line before a block counts as blank here as well, so a marker is never paired
across a paragraph break. That matches the blank-line rule.

---

## Red-first evidence

Before any edit, the lane copy had blob `aa69af8049433a423560e8155fc3a3d90fd8a435`, equal
to `git rev-parse 6af7c1a:pipeline/synthetic/gates/scripts/check_assembly_dispositions.py`.
I verified a copy of it, kept in the scratchpad, against the same blob before every
head-side run. Baselines at head: gates `244 passed`; contract+evidence `70 passed`.

1. **Red run in the lane, before the fix.** It used the test file's first version: 68
   items, everything except the twin test.

   ```
   $ python3 -m pytest -q -p no:cacheprovider --tb=line -rf pipeline/synthetic/gates/scripts/tests
   58 failed, 254 passed in 4.56s
   ```

2. **Final red run.** `test_quoted_document_reads_like_its_unquoted_twin` (6 items) was
   written after the fix, while I was checking D2. Its red check is retroactive. I copied
   `pipeline/synthetic/gates/` to the scratchpad and replaced the gate with the verified head
   copy (blob `aa69af80…`). Its `scripts/tests` are byte-identical to the lane's
   (`git diff --no-index` empty), and every other script there equals head, because only
   the gate changed in this lane. Then I ran the final test file against head:

   ```
   $ python3 -m pytest -q -p no:cacheprovider --tb=line -rN --junit-xml=red-final-head.xml <mirror>/scripts/tests
   63 failed, 255 passed in 5.04s
   ```

`junit_summary.py` (appendix C) over this run and the green run: the 244 pre-existing tests
pass in both runs, with the same test ids. The 74 new tests: head `63 FAIL, 11 pass`, fix
`74 pass`.

**Red on 6af7c1a (63).** Each fails at its first assertion, with head's last report line:

| Test | n | Head |
|---|---|---|
| `test_marker_wrapped_across_two_quote_lines_is_found[> \|> (no space)\|   > \|> > \|>> \|> > > ]` | 6 | exit 0, `OK — 0 marker(s)` |
| `test_marker_wrapped_inside_a_quote_inside_a_list_item_is_found` | 1 | exit 0, `OK — 0 marker(s)` |
| `test_quote_only_line_is_a_blank_line[> ->\|> -> \|> ->   \|> > -> >\|> > ->>\|> > ->]` | 6 | exit 0, `OK — 1 marker(s)`: borrowed elf-b16-003 |
| `test_quoted_list_items_are_items[{> , >, > > } × {- , * , + , 1) }]` | 12 | exit 0, `OK — 1 marker(s)`: borrowed |
| `test_change_of_quote_depth_closes_the_block[5 cases]` | 5 | exit 0, `OK — 1 marker(s)`: borrowed |
| `test_marker_wrapped_across_a_quote_depth_change_is_never_dropped[into-nested\|out-of-nested\|into-quote]` | 3 | exit 0, `OK — 0 marker(s)` |
| `…never_dropped[lazy-line]` | 1 | exit 0, `OK — 1 marker(s)`: head joined the lazy line (D1) |
| `test_block_openers_inside_a_quote_close_the_block[heading\|pipe row\|thematic break\|setext underline\|code fence]` | 5 | exit 0, `OK — 1 marker(s)`: borrowed |
| `test_quote_takes_no_unit_from_the_paragraph_above` | 1 | over-strict: `DISPOSITION-OWED elf-b16-003: line 2: elf-b16-003 is clean > Cross-batch echo, …` |
| `test_quoted_document_reads_like_its_unquoted_twin[assembly record × 3]` | 3 | head missed the wrapped `elf-b99-002` marker: `3 undischarged of 4` vs `4 of 5` (evidence §A) |
| `test_quoted_document_reads_like_its_unquoted_twin[table then heading-> \|-> > ]` | 2 | over-strict: exit 1 `<no unit named>` where the unquoted twin exits 0 (D2) |
| `test_marker_variant_is_found[11 forms]` | 11 | exit 0, `OK — 0 marker(s)` |
| `test_marker_variant_wrapped_across_lines_is_found[4 forms]` | 4 | exit 0, `OK — 0 marker(s)` |
| `test_emphasised_marker_wrapped_inside_a_quote_is_found` | 1 | exit 0, `OK — 0 marker(s)` |
| `test_variant_marker_split_across_two_blocks_is_never_dropped` | 1 | exit 0, `OK — 0 marker(s)` |
| `test_batch17_plural_process_rule_fails_closed` | 1 | exit 0, `OK — 0 marker(s)` |

Of the 63:
- **57 are fail-open on head:** a marker dropped, or a unit borrowed across a boundary that
  GFM draws too.
- **3 are lazy continuation lines** (`[lazy line after quote]`,
  `[lazy line after nested quote]`, `never_dropped[lazy-line]`). Head joined them, as GFM
  does; the bead's depth rule now splits them (D1).
- **3 are over-strict on head:** the paragraph-above test and two `table then heading`
  twins.

**Green on 6af7c1a (11).** These stay green after the fix:
- Guard, "an unquoted document still behaves as at 6af7c1a":
  `test_unquoted_document_behaves_as_before`. It asserts head's exact five-line report on a
  record with a heading, a pipe table with a marker row, wrapped list items, a `;` clause,
  `vs.`/`e.g.` abbreviations and a mid-line `>`.
- Guard, "a blockquote naming its own unit attributes only that unit":
  `test_quoted_marker_names_its_own_units_only[paragraph|nested paragraph|list item]`.
  `test_quote_takes_no_unit_from_the_paragraph_above` covers the same rule where head was
  over-strict (red above).
- Guard: `test_quoted_pipe_table_rows_stay_rows`. The round-3 table rule already read
  de-quoted text.
- Guard: `` test_marker_inside_emphasis_or_code_is_found[*disposition owed*|**disposition owed**|_disposition owed_|`disposition owed`|DISPOSITION OWED] ``
  (see Finding 2).
- Coincidental pass: `test_quoted_document_reads_like_its_unquoted_twin[table then heading->]`.
  With no space after `>`, head's de-quoted text already held the 3-space heading. Head then
  joined the quoted lines into one paragraph, and that matched the twin.

## Green run (after the fix)

```
$ python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
318 passed in 5.30s           # baseline 244 + 74 new
$ python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q
388 passed in 9.54s           # the updated CI command, exact
```

---

## Real-corpus probe — head 6af7c1a vs fix (appendix A, `probe_round4.py`)

```
head copy: blob aa69af8049433a423560e8155fc3a3d90fd8a435 == git rev-parse 6af7c1ab77d1cecb2809434e889c7df39168a5e7:pipeline/synthetic/gates/scripts/check_assembly_dispositions.py
fix:       blob 8ed6173fa78411f83a5ebfe577a65c1b73540779 (lane working tree)

=== 1. gate CLI, every batches/*/ASSEMBLY.md (3 of 17 batch dirs have one: batch15, batch16, batch17)
  batch15: IDENTICAL (head exit 0, fix exit 0; verdicts.jsonl exists: True)
    | assembly-dispositions: OK — 0 marker(s), all discharged
  batch16: IDENTICAL (head exit 1, fix exit 1; verdicts.jsonl exists: True)
    | DISPOSITION-OWED elf-b15-002: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
    | DISPOSITION-OWED elf-b16-001: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
    | DISPOSITION-OWED <no unit named>: line 48: one written disposition owed per the 2026-08-26 process rule.
    | DISPOSITION-OWED <no unit named>: line 50: disposition owed).
    | assembly-dispositions: 4 undischarged of 3 marker(s)
  batch17: DIFFERENT (head exit 0, fix exit 1; verdicts.jsonl exists: True)
    --- head
    +++ fix
    @@ -1 +1,2 @@
    -assembly-dispositions: OK — 0 marker(s), all discharged
    +DISPOSITION-OWED <no unit named>: line 55: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.
    +assembly-dispositions: 1 undischarged of 1 marker(s)
  2/3 byte-identical

=== 2. per ASSEMBLY.md: blocks, markers, quote lines (1-based)
  batch15: 58 lines; quote lines 0; blocks head 22 fix 22 identical=True; markers head 0 fix 0
  batch16: 60 lines; quote lines 0; blocks head 24 fix 24 identical=True; markers head 3 fix 3
  batch17: 56 lines; quote lines 0; blocks head 21 fix 21 identical=True; markers head 0 fix 1
    new marker:  line 55 units ['<no unit named>']: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.

=== 3. structural sweep: every tracked *.md
  326 tracked files, 0 not UTF-8 (skipped)
  fix partition refines head's everywhere: True
  files without a quote line: 295; blocks differ from head in 0
    markers differ from head in 2 (each difference must be a marker variant)
      pipeline/synthetic/batches/batch17/ASSEMBLY.md:55 new ['<no unit named>']: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.
      pipeline/synthetic/batches/batch17/STATUS.md:86 new ['<no unit named>']: **Written dispositions owed for any named adjacency** per the 2026-08-26 process rule.
  files with a quote line: 31; blocks or markers differ in 9
    docs/curriculum-scheduler.md: blocks differ=True; markers new 0 lost 0
    docs/superpowers/consults/landing-pedagogy-consult.md: blocks differ=True; markers new 0 lost 0
    docs/worklog/hpf-96rj.md: blocks differ=True; markers new 10 lost 2
      new  :287 ['<no unit named>']: `dispositions owed` (plural) is not a marker.
      new  :288 ['<no unit named>']: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.", a real obligati
      new  :290 ['<no unit named>']: `disposition **owed**` (emphasis inside the phrase) is missed too.
      new  :513 ['elf-b17-001', 'elf-b16-001']: Written dispositions owed for elf-b17-001 per the process rule.\n", []), "R2 emphasis inside the mar
      new  :515 ['elf-b17-001', 'elf-b16-001']: Written dispositions owed for elf-b17-001 per the process rule.\n", []), "R2 emphasis inside the mar
      new  :537 ['elf-b16-001']: Cross-batch echo, disposition owed: elf-b16-001
      new  :544 ['<no unit named>']: Cross-batch echo, disposition owed
      new  :549 ['<no unit named>']: Cross-batch echo, disposition owed
      new  :553 ['elf-b17-001']: Written dispositions owed for elf-b17-001 per the process rule.
      new  :557 ['elf-b16-001']: Cross-batch echo, disposition **owed**: elf-b16-001
      lost :544 ['elf-b16-003']: > > elf-b16-003 is clean > > > > Cross-batch echo, disposition owed head exit 0: assembly-dispositio
      lost :549 ['elf-b16-003']: > > - elf-b16-003 is clean > > - Cross-batch echo, disposition owed head exit 0: assembly-dispositio
    docs/worklog/hpf-oy2w.md: blocks differ=False; markers new 1 lost 1
      new  :55 ['<no unit named>']: one written disposition owed per the 2026-08-26 process rule.
      lost :55 ['<no unit named>']: one written disposition owed per the 2026-08-26 > process rule.
    docs/worklog/hpf-qo10.md: blocks differ=True; markers new 1 lost 0
      new  :324 ['<no unit named>']: batch17 `ASSEMBLY.md:55` "Written dispositions owed for any named adjacency" (plural, generic rule) 
    pipeline/synthetic/BATCH-RUNBOOK.md: blocks differ=True; markers new 0 lost 0
    pipeline/synthetic/batches/batch15/ADJUDICATION.md: blocks differ=True; markers new 0 lost 0
    pipeline/synthetic/batches/batch16/ADJUDICATION.md: blocks differ=True; markers new 1 lost 1
      new  :949 ['<no unit named>']: **Gör det till regel:** när `ASSEMBLY.md` lämnar över en flagga med orden *disposition owed* ska G-R
      lost :949 ['<no unit named>']: > **Gör det till regel:** när `ASSEMBLY.md` lämnar över en flagga med orden *disposition owed* > ska
    pipeline/synthetic/batches/batch17/ADJUDICATION.md: blocks differ=True; markers new 0 lost 0
  marker variants found (new markers the old pattern cannot match): 10
    docs/worklog/hpf-96rj.md:287 ['<no unit named>']: `dispositions owed` (plural) is not a marker.
    docs/worklog/hpf-96rj.md:288 ['<no unit named>']: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.", a real obligati
    docs/worklog/hpf-96rj.md:290 ['<no unit named>']: `disposition **owed**` (emphasis inside the phrase) is missed too.
    docs/worklog/hpf-96rj.md:513 ['elf-b17-001', 'elf-b16-001']: Written dispositions owed for elf-b17-001 per the process rule.\n", []), "R2 emphasis inside the mar
    docs/worklog/hpf-96rj.md:515 ['elf-b17-001', 'elf-b16-001']: Written dispositions owed for elf-b17-001 per the process rule.\n", []), "R2 emphasis inside the mar
    docs/worklog/hpf-96rj.md:553 ['elf-b17-001']: Written dispositions owed for elf-b17-001 per the process rule.
    docs/worklog/hpf-96rj.md:557 ['elf-b16-001']: Cross-batch echo, disposition **owed**: elf-b16-001
    docs/worklog/hpf-qo10.md:324 ['<no unit named>']: batch17 `ASSEMBLY.md:55` "Written dispositions owed for any named adjacency" (plural, generic rule) 
    pipeline/synthetic/batches/batch17/ASSEMBLY.md:55 ['<no unit named>']: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.
    pipeline/synthetic/batches/batch17/STATUS.md:86 ['<no unit named>']: **Written dispositions owed for any named adjacency** per the 2026-08-26 process rule.
```

**Gate runs (§1, §2).** The only change is the expected one: batch17 `ASSEMBLY.md:55`, now
`<no unit named>` and exit 1. batch15 and batch16 are byte-identical to head. None of the
three files has a quote line, and their block partitions are identical. batch16's
`4 undischarged of 3 marker(s)` is the round-2 state carried unchanged; it is batch content
and out of scope.

**Sweep (§3).** The gate never reads these files; the sweep measures blast radius. Every
difference has one of two causes, quote lines or a marker variant:
- **295 files without a quote line.** Blocks are identical to head in all of them; the
  "unquoted documents unchanged" claim holds. Their markers differ only by the plural
  variant: batch17 `ASSEMBLY.md:55` (the expected change) and batch17 `STATUS.md:86`, the
  same rule restated in a file the gate never reads.
- **31 files with a quote line; 9 differ.**
  - Five change only their blocks (quote-only lines now blank, depth changes now
    boundaries) and keep their markers: `curriculum-scheduler.md`,
    `landing-pedagogy-consult.md`, `BATCH-RUNBOOK.md`, batch15 and batch17
    `ADJUDICATION.md`.
  - `hpf-oy2w.md:55` and batch16 `ADJUDICATION.md:949` keep the same marker and the same
    (no) unit. Only the excerpt lost its stray `>`.
  - `hpf-qo10.md:324` is the plural in prose.
  - `hpf-96rj.md` is round 3's worklog. It quotes this round's own repros in prose and in
    fenced blocks, which the gate reads as Markdown because fences are not modelled. Its
    plural and emphasis lines become markers, and its quoted R1 repro outputs are now read
    as intended: line 537 is found with elf-b16-001, and lines 544/549 no longer borrow
    elf-b16-003.
- **Refinement** holds in all 326 files: no fix block spans two head blocks (D2's shape
  occurs nowhere).

## Residual risks (knowingly left; evidence in appendix B)

1. **R1: marker forms the pattern does not match.** Head and fix both exit 0 with 0
   markers on: `disposition-owed`, `disposition is owed`, `disposition: owed for …`,
   `disposition ~~owed~~`, `disposition \*\*owed\*\*` (backslash-escaped),
   `disposition <em>owed</em>`, `disposition [owed](#x)` and `owed a disposition`. The bead
   fixes the grammar at whitespace and `*`/`_`/`` ` ``. Widening it is an owner decision; a
   hyphen, for instance, is one more character in the class. Zero-width characters between
   the words are not whitespace either.
2. **R2: fail-closed over-reads.**
   - A lazily continued quote reports a false `<no unit named>`:
     `> Cross-batch echo, disposition owed` / `for elf-b16-001.` with elf-b16-001 disposed
     gives head exit 0, fix exit 1 (D1).
   - Fenced code is still read as Markdown, as on head (`example: disposition owed` inside
     a fence is a marker on both).
   - D3's bullet-boundary pairing can also report a split marker.

   Each remedy is plain Markdown: `>` on every quoted line, and the marker and its units in
   one block.
3. **R3: one shape is less strict than head (D2).** A quoted table followed by a
   3-space-indented opener now ends where its unquoted twin ends. This is deliberate,
   pinned and absent from the corpus.
4. **R4: CI wiring is pinned only by the workflow line.**
   - No contract test asserts that CI runs the gate suite. One would belong in
     `.github/contract-tests/`, which is out of this bead's file scope.
   - The comment above the `contract:` job still describes only the auto-merge contract
     tests. That staleness predates this round (it never mentioned the evidence tests
     either), and the bead limits the CI change to the one pytest line.
   - CI installs an unpinned `pytest`; the local run used 7.4.4. The gate tests use only
     `parametrize`, `tmp_path`, `raises` and `subprocess`.
5. **R5: batch17 now fails the gate.** batch17 `ASSEMBLY.md:55` exits 1
   (`<no unit named>`), as the bead expects. Whoever re-runs the gate on batch17 has to
   resolve item 6 in batch content: name the units, reword the standing rule so it is not
   a marker, or adjudicate it. I made no batch edit, per the bead.

## Bead bookkeeping: blocked at hand-off (2026-10-05T17:43Z)

The lane work above is complete. Every bead *write* from this worker session failed:
`bd update hpf-wu46 --append-notes …` → `Error: failed to open database: Dolt server
unreachable at 127.0.0.1:53381: dial tcp 127.0.0.1:53381: connect: connection refused`
(`bd dolt status`: "not reachable (external)"). Bead reads kept working. `gc bd update` is
outside this worker's command allowlist, and starting Dolt is city infrastructure, not this
bead's work, so I did neither.

Pending once Dolt is reachable: append the note below (its last line is the `LANE DONE`
line), then `bd update hpf-wu46 --set-metadata 'gc.outcome=pass'`, then
`bd close hpf-wu46 --reason '…'`.

```
Round 4: all 3 R4 findings closed, uncommitted @6af7c1a. F1: gate reads de-quoted text; quote-only line = blank, quote-depth change = boundary; list/table/heading rules and wrapped markers work inside quotes. F2: marker = dispositions? + owed across whitespace and * _ ` markup. F3: ci.yml pytest line adds gates/scripts/tests (no new deps). Red on head 63F/255P, green 318P; exact CI cmd 388P. Probe: batch15/16 byte-identical; batch17 now exit 1, <no unit named> line 55 (expected). Decisions + residuals in docs/worklog/hpf-wu46.md.
LANE DONE: hpf-wu46
```

## Reproduction

```
git rev-parse HEAD                    # 6af7c1ab77d1cecb2809434e889c7df39168a5e7
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q
python3 probe_round4.py "$PWD" <head-copy> 6af7c1ab77d1cecb2809434e889c7df39168a5e7 <work-dir>   # appendix A
python3 residuals_round4.py "$PWD" <head-copy> <work-dir2>                                        # appendix B
python3 junit_summary.py red-final-head.xml green-final-fix.xml test_assembly_blockquotes_markers_round4  # appendix C
```

`<head-copy>` is `git show 6af7c1a:pipeline/synthetic/gates/scripts/check_assembly_dispositions.py`
saved to a file. The probe refuses to run unless its blob equals that path at the given
revision. The scripts ran from this session's scratchpad. SHA-256 of each, as run:
- `probe_round4.py`: `4d619f6e648c0b17a4f09592f91cfc51548ff8486ee8c8746d1cce8f7b4d00dc`
- `residuals_round4.py`: `2646b213a4cacaa73ac5eadbf39702cbe3e89af0511e04375e2ecf4ef70fadda`
- `junit_summary.py`: `5761d01164a26b9228a37181ca6c9644da9adf94a250e10c84bfedc53de632b1`

Lane files at hand-off:

| File | git blob | SHA-256 |
|---|---|---|
| `check_assembly_dispositions.py` | `8ed6173fa78411f83a5ebfe577a65c1b73540779` | `05af15f4935147da0254cb73c07bcdf77e27a0ffa111eb92417b6b03bde2968c` |
| `tests/test_assembly_blockquotes_markers_round4.py` | `e2505723d4ca7c86a76f86d321d684765131d71b` | `679e781acce272c33c526cc3982b6b10a7bf1ebc997b3a3c740f7377c1225b20` |
| `.github/workflows/ci.yml` | `8f2dc240483c67d56389df5b99de52e373c301c7` | `5a8cb667075b471404986e81527611249294fd4116949381cdd6af5ccb607048` |

### Appendix A — `probe_round4.py`

```python
"""Real-corpus probe for bead hpf-wu46: the head gate (6af7c1a) vs the lane's gate.

1. the gate CLI on every pipeline/synthetic/batches/*/ASSEMBLY.md with its
   verdicts.jsonl, head vs fix, byte for byte (stdout + stderr + exit code);
2. per ASSEMBLY.md: block partition, markers and quote lines;
3. structural sweep of every tracked *.md: where the fix's blocks or markers
   differ from head's, and why. A document without a quote line must keep
   head's blocks exactly; its markers may differ only by a marker variant
   (a marker the old literal pattern cannot match). Also checks that the
   fix's partition refines head's (no fix block spans two head blocks);
4. the hpf-tuqq review repros, head vs fix.

Read-only over the repo; writes only the repro files under <work-dir>.
usage: probe_round4.py <lane-root> <head-copy> <head-rev> <work-dir>
"""
from __future__ import annotations

import difflib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

LANE, HEAD, REV, WORK = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
REL = "pipeline/synthetic/gates/scripts/check_assembly_dispositions.py"
FIX = LANE / REL
BATCHES = LANE / "pipeline/synthetic/batches"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(LANE), *args], capture_output=True, text=True,
                          check=True).stdout


want, got = git("rev-parse", f"{REV}:{REL}").strip(), git("hash-object", str(HEAD)).strip()
if want != got:
    raise SystemExit(f"head copy blob {got} != {REV}:{REL} {want}")
print(f"head copy: blob {got} == git rev-parse {REV}:{REL}")
print(f"fix:       blob {git('hash-object', str(FIX)).strip()} (lane working tree)")


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def cli(script: Path, *args) -> tuple[int, str]:
    r = subprocess.run([sys.executable, str(script), *map(str, args)], capture_output=True,
                       text=True, cwd=LANE)
    return r.returncode, r.stdout + r.stderr


def batch_key(p: Path) -> int:
    n = p.name[5:]
    return int(n) if n.isdigit() else 999


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
          f" (head exit {a[0]}, fix exit {b[0]}; verdicts.jsonl exists: {v.exists()})")
    if a == b:
        for line in b[1].splitlines():
            print(f"    | {line}")
    else:
        for line in difflib.unified_diff(a[1].splitlines(), b[1].splitlines(), "head", "fix",
                                         lineterm="", n=99):
            print(f"    {line}")
print(f"  {identical}/{len(asms)} byte-identical")

print("\n=== 2. per ASSEMBLY.md: blocks, markers, quote lines (1-based)")
for asm in asms:
    lines = asm.read_text(encoding="utf-8").splitlines()
    hb, fb = H._blocks(lines), F._blocks(lines)
    hm, fm = H.find_markers(lines), F.find_markers(lines)
    quoted = [i + 1 for i, l in enumerate(lines) if F._quoted(l)[0]]
    print(f"  {asm.parent.name}: {len(lines)} lines; quote lines {len(quoted)};"
          f" blocks head {len(hb)} fix {len(fb)} identical={hb == fb};"
          f" markers head {len(hm)} fix {len(fm)}")
    for m in fm:
        if m not in hm:
            print(f"    new marker:  line {m[0]} units {m[1] or ['<no unit named>']}: {m[2][:110]}")
    for m in hm:
        if m not in fm:
            print(f"    lost marker: line {m[0]} units {m[1] or ['<no unit named>']}: {m[2][:110]}")

print("\n=== 3. structural sweep: every tracked *.md")
mds = [LANE / p for p in git("ls-files", "-z", "--", "*.md").split("\0") if p]
unreadable, refined_bad, plain_block_diff, plain_marker_diff, quoted_diff = [], [], [], [], []
n_plain = n_quoted = 0
variants = []
for md in sorted(mds):
    try:
        lines = md.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError as exc:
        unreadable.append(f"{md.relative_to(LANE)} ({exc.reason})")
        continue
    hb, fb = H._blocks(lines), F._blocks(lines)
    hm, fm = H.find_markers(lines), F.find_markers(lines)
    owner = {i: k for k, b in enumerate(hb) for i in b}
    if not all(len({owner.get(i) for i in b}) == 1 and None not in {owner.get(i) for i in b}
               for b in fb):
        refined_bad.append(md)
    has_quote = any(F._quoted(l)[0] for l in lines)
    new = [m for m in fm if m not in hm]
    lost = [m for m in hm if m not in fm]
    rel = md.relative_to(LANE)
    for m in new:
        # a variant: a marker the old literal pattern cannot match in its sentence
        if not H.MARKER_RE.search(m[2].replace("(split across two blocks) ", "")):
            variants.append((rel, m))
    if has_quote:
        n_quoted += 1
        if hb != fb or hm != fm:
            quoted_diff.append((rel, hb != fb, new, lost))
    else:
        n_plain += 1
        if hb != fb:
            plain_block_diff.append(rel)
        if hm != fm:
            plain_marker_diff.append((rel, new, lost))
print(f"  {len(mds)} tracked files, {len(unreadable)} not UTF-8 (skipped)")
for u in unreadable:
    print(f"    not UTF-8: {u}")
print(f"  fix partition refines head's everywhere: {not refined_bad}")
for md in refined_bad:
    print(f"    NOT REFINED: {md.relative_to(LANE)}")
print(f"  files without a quote line: {n_plain}; blocks differ from head in {len(plain_block_diff)}")
for rel in plain_block_diff:
    print(f"    BLOCKS DIFFER: {rel}")
print(f"    markers differ from head in {len(plain_marker_diff)}"
      f" (each difference must be a marker variant)")
for rel, new, lost in plain_marker_diff:
    for m in new:
        print(f"      {rel}:{m[0]} new {m[1] or ['<no unit named>']}: {m[2][:100]}")
    for m in lost:
        print(f"      {rel}:{m[0]} LOST {m[1] or ['<no unit named>']}: {m[2][:100]}")
print(f"  files with a quote line: {n_quoted}; blocks or markers differ in {len(quoted_diff)}")
for rel, blocks_differ, new, lost in quoted_diff:
    print(f"    {rel}: blocks differ={blocks_differ}; markers new {len(new)} lost {len(lost)}")
    for m in new:
        print(f"      new  :{m[0]} {m[1] or ['<no unit named>']}: {m[2][:100]}")
    for m in lost:
        print(f"      lost :{m[0]} {m[1] or ['<no unit named>']}: {m[2][:100]}")
print(f"  marker variants found (new markers the old pattern cannot match): {len(variants)}")
for rel, m in variants:
    print(f"    {rel}:{m[0]} {m[1] or ['<no unit named>']}: {m[2][:100]}")

print("\n=== 4. hpf-tuqq review repros, head vs fix")
REPROS = {
    "F1a marker wrapped across two quote lines (no verdicts)":
        ("> Cross-batch echo, disposition\n> owed: elf-b16-001\n", []),
    "F1b quote-only line between quoted paragraphs (elf-b16-003 disposed)":
        ("> elf-b16-003 is clean\n>\n> Cross-batch echo, disposition owed\n", ["elf-b16-003"]),
    "F1c two quoted list items (elf-b16-003 disposed)":
        ("> - elf-b16-003 is clean\n> - Cross-batch echo, disposition owed\n", ["elf-b16-003"]),
    "F2 plural (no verdicts)": ("- Cross-batch echo, dispositions owed: elf-b16-001\n", []),
    "F2 disposition **owed** (no verdicts)":
        ("- Cross-batch echo, disposition **owed**: elf-b16-001\n", []),
    "F2 *disposition owed* (no verdicts)":
        ("- Cross-batch echo, *disposition owed*: elf-b16-001\n", []),
    "F2 `disposition owed` (no verdicts)":
        ("- Cross-batch echo, `disposition owed`: elf-b16-001\n", []),
}
WORK.mkdir(parents=True, exist_ok=True)
for title, (text, disposed) in REPROS.items():
    asm, vf = WORK / "ASSEMBLY.md", WORK / "v.jsonl"
    asm.write_text(text, encoding="utf-8")
    vf.write_text("".join(json.dumps({
        "candidate_id": u, "gate": "G-REGISTER", "verdict": "pass", "findings": [],
        "disposition": "different roles, different batches, no same-test collision"}) + "\n"
        for u in disposed), encoding="utf-8")
    print(f"  ### {title}")
    for line in text.splitlines():
        print(f"      {line}")
    for label, script in (("head", HEAD), ("fix ", FIX)):
        code, out = cli(script, asm, vf)
        print(f"    {label} exit {code}:")
        for line in out.splitlines():
            print(f"      | {line}")
```

Its §4 output for the two forms head already caught:

```
  ### F2 *disposition owed* (no verdicts)
    head exit 1:
      | DISPOSITION-OWED elf-b16-001: line 1: Cross-batch echo, *disposition owed*: elf-b16-001
      | assembly-dispositions: 1 undischarged of 1 marker(s)
    fix  exit 1:   (identical)
  ### F2 `disposition owed` (no verdicts)
    head exit 1:
      | DISPOSITION-OWED elf-b16-001: line 1: Cross-batch echo, `disposition owed`: elf-b16-001
      | assembly-dispositions: 1 undischarged of 1 marker(s)
    fix  exit 1:   (identical)
```

### Appendix B — `residuals_round4.py` and its output

```python
"""Twin demo and residual-risk repros for bead hpf-wu46, head (verified copy) vs fix.

A. the twin test's assembly record, unquoted and quoted, through both gates
   (the text is taken from the lane's test module, so it is the tested text);
B. marker forms the pattern still does not match (out of scope, recorded);
C. fail-closed over-reads the fix keeps or adds (false "<no unit named>").
usage: residuals_round4.py <lane-root> <head-copy> <work-dir>
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

LANE, HEAD, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
FIX = LANE / "pipeline/synthetic/gates/scripts/check_assembly_dispositions.py"
TESTS = LANE / "pipeline/synthetic/gates/scripts/tests/test_assembly_blockquotes_markers_round4.py"

spec = importlib.util.spec_from_file_location("round4_tests", TESTS)
T = importlib.util.module_from_spec(spec)
spec.loader.exec_module(T)


def run(script: Path, text: str, disposed) -> tuple[int, list[str]]:
    WORK.mkdir(parents=True, exist_ok=True)
    asm, vf = WORK / "ASSEMBLY.md", WORK / "v.jsonl"
    asm.write_text(text, encoding="utf-8")
    vf.write_text("".join(json.dumps(T._disposed(u)) + "\n" for u in disposed), encoding="utf-8")
    r = subprocess.run([sys.executable, str(script), str(asm), str(vf)], capture_output=True,
                       text=True)
    return r.returncode, (r.stdout + r.stderr).strip().splitlines()


def show(title: str, text: str, disposed, full: bool = False) -> None:
    print(f"### {title}  (disposed: {', '.join(disposed) or 'none'})")
    for line in text.splitlines():
        print(f"    | {line}")
    for label, script in (("head", HEAD), ("fix ", FIX)):
        code, out = run(script, text, disposed)
        print(f"  {label} exit {code}:")
        for line in (out if full else out[-1:]):
            print(f"      {line}")


print("=== A. the twin test's assembly record, head vs fix")
text, disposed = T.TWINS["assembly record"]
show("unquoted", text, disposed, full=True)
show("quoted with '> '", "".join(f"> {line}".rstrip() + "\n" for line in text.splitlines()),
     disposed, full=True)

print("\n=== B. marker forms the pattern does not match (out of scope)")
FORMS = {
    "hyphen": "- Cross-batch echo, disposition-owed: elf-b16-001\n",
    "a word between": "- Cross-batch echo, disposition is owed: elf-b16-001\n",
    "a colon between": "- Cross-batch echo, disposition: owed for elf-b16-001\n",
    "strikethrough inside": "- Cross-batch echo, disposition ~~owed~~: elf-b16-001\n",
    "backslash-escaped emphasis": "- Cross-batch echo, disposition \\*\\*owed\\*\\*: elf-b16-001\n",
    "HTML emphasis": "- Cross-batch echo, disposition <em>owed</em>: elf-b16-001\n",
    "link text": "- Cross-batch echo, disposition [owed](#x): elf-b16-001\n",
    "reversed order": "- Cross-batch echo, owed a disposition: elf-b16-001\n",
}
for title, text in FORMS.items():
    show(title, text, [])

print("\n=== C. fail-closed over-reads (false '<no unit named>' or extra markers)")
OVER = {
    "lazy continuation line (GFM: one quoted paragraph)":
        ("> Cross-batch echo, disposition owed\nfor elf-b16-001.\n", ["elf-b16-001"]),
    "marker inside a fenced code block (fences are not modelled)":
        ("```\nexample: disposition owed\n```\n", []),
}
for title, (text, disposed) in OVER.items():
    show(title, text, disposed)
```

Output, abridged. §A's unquoted record gives the same five lines on head and fix
(`4 undischarged of 5 marker(s)`); every §B form gives exit 0, `OK — 0 marker(s)`, on head
and fix alike.

```
=== A. quoted with '> '  (disposed: elf-b99-001, elf-b98-002, elf-b99-004)
  head exit 1:
      DISPOSITION-OWED elf-b99-003: line 6: > | elf-b99-003 | gen-elf-short, disposition owed |
      DISPOSITION-OWED <no unit named>: line 15: one written disposition owed per the process rule.
      DISPOSITION-OWED elf-b98-001: line 19: > > Echo elf-b99-004 vs. elf-b98-001 (e.g. Quennerly), disposition owed.
      assembly-dispositions: 3 undischarged of 4 marker(s)        <- the wrapped elf-b99-002 marker is lost
  fix  exit 1:
      DISPOSITION-OWED elf-b99-003: line 6: | elf-b99-003 | gen-elf-short, disposition owed |
      DISPOSITION-OWED <no unit named>: line 15: one written disposition owed per the process rule.
      DISPOSITION-OWED elf-b99-002: line 16: Cross-batch cloze echo vs the batch98 noticeboard, disposition owed: elf-b99-002.
      DISPOSITION-OWED elf-b98-001: line 19: Echo elf-b99-004 vs. elf-b98-001 (e.g. Quennerly), disposition owed.
      assembly-dispositions: 4 undischarged of 5 marker(s)        <- identical to the unquoted record

=== C.
### lazy continuation line (GFM: one quoted paragraph)  (disposed: elf-b16-001)
  head exit 0: assembly-dispositions: OK — 1 marker(s), all discharged
  fix  exit 1: assembly-dispositions: 1 undischarged of 1 marker(s)
### marker inside a fenced code block (fences are not modelled)  (disposed: none)
  head exit 1: assembly-dispositions: 1 undischarged of 1 marker(s)
  fix  exit 1: assembly-dispositions: 1 undischarged of 1 marker(s)
```

### Appendix C — `junit_summary.py`

```python
"""Red/green table for bead hpf-wu46 from two pytest --junit-xml reports.

usage: junit_summary.py <red-head.xml> <green-fix.xml> <test-file-stem>
Prints every test of <test-file-stem> with its head outcome (first line of
the failure message) and its fix outcome, then the totals of both runs and
whether every OTHER test passed in both.
"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from collections import Counter

RED, GREEN, STEM = sys.argv[1], sys.argv[2], sys.argv[3]


def outcomes(path: str) -> dict[tuple[str, str], tuple[str, str]]:
    out = {}
    for case in ET.parse(path).getroot().iter("testcase"):
        module = case.get("classname").rsplit(".", 1)[-1]
        bad = case.find("failure")
        if bad is None:
            bad = case.find("error")
        skipped = case.find("skipped") is not None
        if bad is not None:
            msg = (bad.get("message") or "").strip().splitlines()
            out[(module, case.get("name"))] = ("FAIL", msg[0] if msg else "")
        else:
            out[(module, case.get("name"))] = ("SKIP" if skipped else "pass", "")
    return out


red, green = outcomes(RED), outcomes(GREEN)
mine = [k for k in red if k[0] == STEM]
print(f"{len(mine)} tests in {STEM}")
for k in mine:
    h, f = red[k], green.get(k, ("MISSING", ""))
    print(f"  head {h[0]:4} fix {f[0]:4}  {k[1]}")
    if h[0] == "FAIL":
        print(f"        head: {h[1][:150]}")
print(f"head run: {dict(Counter(v[0] for v in red.values()))}")
print(f"fix run:  {dict(Counter(v[0] for v in green.values()))}")
others = [k for k in red if k[0] != STEM]
print(f"other tests: {len(others)}; pass on head: {all(red[k][0] == 'pass' for k in others)};"
      f" pass on fix: {all(green.get(k, ('MISSING',))[0] == 'pass' for k in others)};"
      f" same ids in both runs: {set(red) == set(green)}")
print(f"new-file totals: head {dict(Counter(red[k][0] for k in mine))},"
      f" fix {dict(Counter(green[k][0] for k in mine))}")
```

Its closing lines:

```
head run: {'pass': 255, 'FAIL': 63}
fix run:  {'pass': 318}
other tests: 244; pass on head: True; pass on fix: True; same ids in both runs: True
new-file totals: head {'FAIL': 63, 'pass': 11}, fix {'pass': 74}
```

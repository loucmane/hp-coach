# hpf-qo10 — PR #370 fix round 1: verdict-merge repair supersession + assembly marker scoping

Origin: Codex exact-head review hpf-66p2 (VERDICT: HOLD) of PR #370 (pipeline
hardening, bead hpf-y1p4). Lane `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`,
`git rev-parse HEAD` = `0294fd9673b27f116c99241843d949bcfefb4ec7` (verified first),
base origin/main `b296a8e`. All changes are uncommitted in the lane.

## Changed files

| File | Change |
|---|---|
| `pipeline/synthetic/gates/scripts/merge_verdicts.py` | Defect 1: slot-based repair supersession, same-file rule, split accounting, in-place ordering, `run` validation, clean CLI error |
| `pipeline/synthetic/gates/scripts/check_assembly_dispositions.py` | Defect 2: block-bounded, sentence-scoped unit lookup; line numbers in output; docstring made accurate |
| `pipeline/synthetic/gates/scripts/tests/test_merge_supersession_marker_scope.py` | new: 22 red-first test items (20 functions, one parametrised x3) |
| `pipeline/synthetic/gates/scripts/tests/test_hardening_2026_08_31.py` | 5 merge tests adapted to the `(records, MergeStats)` return; `test_merge_keeps_different_evidence` rewritten (see D1.6) |
| `pipeline/synthetic/BATCH-RUNBOOK.md` | "Repair re-gates must flow into the batch merge" now states how `merge_verdicts.py` must be fed |

Not touched: batch content, verdict files, `data/`, `app/`, `worker/`, the pre-existing
untracked `.claude/skills/*`, `.agents/`, `.codex/`, `.gc/` material. The bead description
names no validator (metadata `gc.check_path` belongs to the workflow-control check lane),
so none was run.

---

## Defect 1 — `merge_verdicts.py`: repair supersession

### Contract now implemented (the module docstring is the authority)

```
SLOT     = (candidate_id, gate, target, vote)                        one ballot position
IDENTITY = (candidate_id, gate, target, executed_by, justification, run)  one piece of evidence
1. Twins        unstamped copy of evidence that also occurs vote-stamped folds into the
                stamped copy (either order, any file)                   -> counted `twins`
2. Same file    records sharing a SLOT must be the same evidence restated (same IDENTITY,
                later line wins) or run-numbered ballots (every one has an integer `run`,
                runs distinct: all kept). Anything else: MergeContractError (fail closed)
3. Across files the LAST input file (argv order) carrying a SLOT wins it; its records
                replace every earlier-file record for that SLOT whatever executed_by /
                justification / run                                     -> `superseded`
```

Repro from the bead, now: input 1 = G-KEY vote=1 `kill` by worker/a, input 2 = repaired
G-KEY vote=1 `pass` by worker/b with a new justification → one record (the pass),
`superseded=1`, aggregate `SURVIVED_CLEAN` (head: both kept, `dropped=0`, unit DEAD) —
`test_repair_supersedes_obsolete_kill_despite_new_executor_and_justification`.

### D1.1 Same-file collision rule: FAIL CLOSED unless the ballots are `run`-numbered

Survey of every real verdict file under `pipeline/synthetic/batches/`, grouping records by
SLOT within one file. Counts below are for the 438 leg files in `verdicts*/` dirs; the 21
committed merged `verdicts*.jsonl` files contain only 6 run-numbered groups (batch14/16/17
unit runs) and batch6's 35 same-IDENTITY mech restatements:

| Same-file SLOT collision class | groups | what it is in the real data |
|---|---|---|
| differ in executed_by/justification, verdicts differ | 33 | append-style re-gates, e.g. `batch3/verdicts/verdicts-gregister.jsonl` elf-b3-002: `kill` (G-REGISTER) → `pass` (G-REGISTER-regate0724); `batch2/verdicts-vfinal/verdicts-gkey-1.jsonl` las-b2-003 q:1 v1: kill → regate pass → declone pass; `batch11/verdicts-vfinal/verdicts-gkey-resolved.jsonl` las-b11-003 q:2: kill → regate3 pass |
| differ in executed_by/justification, verdicts agree | 678 | the same two shapes: whole-fleet re-runs appended into one file (batch14 `verdicts/*`: opus-4-8 then opus-5 lines) and unstamped two-leg G-KEY resolves (`batch16/verdicts-r3/verdicts-gkey-resolved.jsonl`, `batch17/verdicts-{r2,agardom,agardom2}/verdicts-gkey-resolved.jsonl`: leg 1 and leg 2 share `(cid, G-KEY, q:N, None)`) |
| differ only in `run` | 7 | unit-level language re-gates run 1/2/3 (batch14 `verdicts-ruling` G-ENG + G-SPRAK, batch16 `verdicts-r3/verdicts-gsprak.jsonl` x2 units, batch17 `verdicts-agardom`/`agardom2` G-SPRAK, batch17 `verdicts-r2` G-ENG) |
| same IDENTITY, content differs | 235 | restatements (mech re-runs with new `executed_at`, batch1 same-executor re-judgements) |
| byte-identical | 12 | duplicates |

Why neither alternative is safe:
- **keep both** resurrects every appended re-gate's obsolete verdict (33 groups carry a
  different verdict, including kills): `aggregate.py` treats ANY lethal kill record as DEAD
  — Defect 1 again, just inside one file;
- **last line wins** silently deletes a ballot in the unstamped two-leg resolve files (leg 1
  disappears behind leg 2) and in any other same-file ballot pair.

Provenance cannot tell the two apart (both differ only in executed_by/justification), so the
merge refuses and names the file, the SLOT and the colliding lines; the operator either puts
the re-gate in its own later input file (rule 3 then applies) or stamps the ballots
(`vote` / `run`). Run-numbered records are explicit ballots and are kept — they are the only
same-SLOT, different-provenance groups in all 21 committed merged files (batch14/16/17 unit
runs), and every committed merge passes the new rule unchanged (regression table below).
Impact on raw leg files fed alone: 358/438 identical to head, 80 refused — all are the
ambiguous shapes above (V-FINAL / `verdicts-final` files of batches 1–14 with appended
re-gates, batch3/13/14 fleet files with appended re-runs, and the four unstamped
`verdicts-gkey-resolved.jsonl` files whose stamped siblings are what the merges use). None
of them is an input of any committed merge; V-FINAL files are read by `vfinal_fold.py`,
which keeps its own within-file rule.

Order of application: twins fold BEFORE the same-file check, so an unstamped two-leg file is
fine when its vote-stamped copies are merged too
(`test_same_file_unstamped_legs_resolved_by_their_stamped_twins`), and refused alone.

### D1.2 Accounting

`merge()` now returns `(records, MergeStats(superseded, duplicates, twins))`; the CLI prints
`N record(s) (V vote-bearing); S superseded by later input, D exact duplicate(s), T unstamped
twin(s) collapsed`. `duplicates` = a dropped record byte-identical to what replaces it (a
no-op), `superseded` = replaced by different content (repair, or a restatement that changed
something), `twins` = the 8b fold. A re-merge of an already-merged batch with its repairs
re-applied prints `0 superseded` (batch16: 31 duplicates, 14 twins), so a silent no-op is
visible. The only caller of `merge()` besides the CLI is the test suite (grep).

### D1.3 Twin precedence

The batch16 8b fix is kept: an unstamped copy and its vote-stamped twin merge to one record,
the stamped copy winning, in either order and across files (pre-existing tests + 
`test_twin_collapse_still_holds_under_repair_supersession`). A folded unstamped copy is the
same evidence as its stamped twin, so it supersedes nothing on its own.

### D1.4 Output order

Output keeps first-seen order; replacing records take the places of the records they
replace, pairwise in order (the k-th replacement takes the k-th replaced record's place,
extras line up behind the last). This reproduces the batch16/17 hand merges exactly and keeps
a no-op re-merge byte-identical — a first version that put a whole run set at the first
replaced position de-interleaved batch16's las-b16-001/002 unit runs (lines 152–157) on
re-merge; caught by the regression driver, fixed, pinned by
`test_rerun_sets_replace_in_place_keeping_interleaving`.

### D1.5 `run` validation

`run` now numbers same-file ballots, so it gets the same validation as `vote` (positive int,
not bool): otherwise `"1"` and `1` would pass as two ballots. Every `run` value in the corpus
is an int 1–3 (39 records), so nothing real is rejected.

### D1.6 Existing test whose assertion encoded the defect

`test_merge_keeps_different_evidence` asserted that two files carrying different evidence for
the same SLOT both survive — exactly Defect 1. Rewritten as
`test_merge_later_file_supersedes_different_evidence` (later file wins, `superseded=1`).
The other four pre-existing merge tests keep their assertions, now on the split counters.

---

## Defect 2 — `check_assembly_dispositions.py`: marker scope

### Contract now implemented

Each "disposition owed" occurrence (case-insensitive, also wrapped across two lines) is
looked up only inside its markdown block — the list item or paragraph holding it, wrapped
continuation lines included; never a sibling or nested list item, heading, table row,
thematic break, fence, or text across a blank line — and, within that block, only in the
sentence holding the marker. No unit there → `DISPOSITION-OWED <no unit named>`. Output is
now `DISPOSITION-OWED <unit>: line <n>: <sentence excerpt>` (the line where the marker
starts), so attribution is auditable.

### D2.1 Why the sentence bound (inside the block bound the bead requires)

batch16 `ASSEMBLY.md` item 2 (lines 46–50) is ONE list item carrying TWO obligations: the
same-batch adjacency las-b16-001/elf-b16-003 (marker line 48) and the cross-batch
landmark-directions cloze vs batch15 noticeboard (marker line 50), which names no unit. With
item-level scope, line 50 would be attributed to las-b16-001 + elf-b16-003 and silently
discharged by the dispositions written for line 48 — the masking failure the review
describes, and not the `<no unit named>` outcome the review expects for line 50. The
sentence bound gives exactly the review's expected outcomes on the real file (below) and is
pinned by `test_unnamed_second_obligation_is_not_masked_by_the_named_first` (verbatim copy of
lines 46–51).

Sentence boundary is conservative: `.`/`!`/`?` (plus closing quotes/brackets/emphasis),
whitespace, then an upper-case letter. `vs. las-b16-002`, `e.g. the`, `8.7`, `ASSEMBLY.md`
and a unit id starting a clause stay in one sentence. The two-line wrapped-marker detection
keeps working (pre-existing `test_disposition_marker_wrapped_across_lines` + new
`test_marker_wrapped_inside_list_item_keeps_its_line_and_scope`).

---

## Red-first evidence

### Red run 1 — lane, tests written, implementation still at head (before any fix)

`python3 -m pytest -q -p no:cacheprovider --tb=line pipeline/synthetic/gates/scripts/tests`
→ **25 failed, 115 passed**. 19 behavioural reds + 6 that fail only because head returns a
bare `int` with no split counters (marked API). Line numbers refer to the test file as it
stood at this run (20 items); red run 2 covers the final 22-item file:

```
test_hardening_2026_08_31.py:70  test_merge_collapses_stamped_and_unstamped_twin      AttributeError: 'int' object has no attribute 'twins'   [API]
test_hardening_2026_08_31.py:78  test_merge_collapses_unstamped_arriving_after_stamped AttributeError: 'int' object has no attribute 'twins'   [API]
test_hardening_2026_08_31.py:86  test_merge_keeps_distinct_votes                       AttributeError: 'int' object has no attribute 'superseded' [API]
test_hardening_2026_08_31.py:96  test_merge_later_file_supersedes_different_evidence   assert ['reason A', 'reason B'] == ['reason B']
test_hardening_2026_08_31.py:106 test_merge_batch16_regression_shape                   AttributeError: 'int' object has no attribute 'twins'   [API]
test_merge_supersession_marker_scope.py:79  test_repair_supersedes_obsolete_kill_despite_new_executor_and_justification  assert [('kill', 'wo..., 'worker/b')] == [('pass', 'worker/b')]
test_merge_supersession_marker_scope.py:91  test_superseding_record_takes_the_superseded_slot   assert [('q:1', 'mod...l/G-STEM-r2')] == [('q:1', 'mod...odel/G-STEM')]
test_merge_supersession_marker_scope.py:103 test_twin_collapse_still_holds_under_repair_supersession  assert [{'candidate_...'G-KEY', ...}] == [{'candidate_...'G-KEY', ...}]
test_merge_supersession_marker_scope.py:115 test_later_run_set_supersedes_earlier_run_set      assert [(1, 'flag', ...e-5/G-SPRAK')] == [(1, 'pass', ...e-5/G-SPRAK')]
test_merge_supersession_marker_scope.py:125 test_identical_regate_is_counted_as_duplicate_not_superseded  assert (None, None, None) == (0, 1, 0)  [API]
test_merge_supersession_marker_scope.py:138 test_cli_summary_reports_superseded_apart_from_duplicates  assert '1 superseded' in 'merge_verdicts: 3 record(s) (2 vote-bearing), 1 duplicate copy/copies collapsed -> ...'
test_merge_supersession_marker_scope.py:150 test_same_file_unnumbered_collision_fails_closed   Failed: DID NOT RAISE <class 'merge_verdicts.MergeContractError'>
test_merge_supersession_marker_scope.py:157 test_same_file_appended_regate_fails_closed_and_split_files_supersede  Failed: DID NOT RAISE
test_merge_supersession_marker_scope.py:169 test_same_file_collision_needs_distinct_run_numbers[runs0|runs1|runs2]  Failed: DID NOT RAISE (x3)
test_merge_supersession_marker_scope.py:181 test_same_file_unstamped_legs_resolved_by_their_stamped_twins  assert (None, None, None) == (0, 0, 2)  [API]
test_merge_supersession_marker_scope.py:187 test_merge_rejects_non_integer_run                  Failed: DID NOT RAISE
test_merge_supersession_marker_scope.py:216 test_marker_item_without_unit_is_not_lent_a_sibling_unit  assert (2 == 1)
test_merge_supersession_marker_scope.py:228 test_marker_unit_on_wrapped_continuation_line_is_attributed  AssertionError: DISPOSITION-OWED elf-b16-003: - **Cross-batch near-pair (register echo, disposition owed, no rename)**:
test_merge_supersession_marker_scope.py:239 test_marker_not_attributed_to_following_item        assert 0 == 1
test_merge_supersession_marker_scope.py:256 test_unnamed_second_obligation_is_not_masked_by_the_named_first  assert 0 == 1
test_merge_supersession_marker_scope.py:265 test_named_first_obligation_still_requires_its_units  assert ['DISPOSITION... elf-b16-003'] == ['DISPOSITION... unit named>']
test_merge_supersession_marker_scope.py:276 test_marker_scope_stops_at_heading_and_blank_line   assert 0 == 1
test_merge_supersession_marker_scope.py:288 test_unit_beyond_the_old_two_line_window_is_attributed  AssertionError: DISPOSITION-OWED <no unit named>: - Cross-batch near-pair (register echo, disposition owed): the batch15
```

(`assert 0 == 1` = head exited 0: the marker was "discharged" through a neighbouring item's
unit — the masking defect.)

### Red run 2 — FINAL test file against byte-identical head scripts

Two tests were added after the fix (`test_rerun_sets_replace_in_place_keeping_interleaving`,
`test_marker_wrapped_inside_list_item_keeps_its_line_and_scope`). To show the final file is
red on head, a scratch tree held the head scripts, verified by git blob hash
(`git rev-parse HEAD:<path>` == `git hash-object <copy>`): `merge_verdicts.py`
`867493428572dc5813b394e112a2bb9a4cdc6e32`, `check_assembly_dispositions.py`
`82d045dda16fb08263b9c5e6da88caeb11645abc`, `aggregate.py` (unchanged)
`2936595ec7175fbea8a2f3912f07a05df345c1c4`, plus the final test file.
`python3 -m pytest -q -p no:cacheprovider --tb=line -rf <scratch>/scripts/tests/test_merge_supersession_marker_scope.py`
→ **22 failed** (every item; the interleaving test fails at its order assertion, line 133).

## Green run (after the fix)

```
$ python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
142 passed            # baseline 120 + 22 new
$ python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
70 passed             # baseline 70
```

---

## Real-corpus probes

### `check_assembly_dispositions.py` on batch16 (`ASSEMBLY.md` + `verdicts.jsonl`)

Head (6 undischarged of 3 markers):
```
DISPOSITION-OWED elf-b16-003: - **Cross-batch near-pair (register echo, disposition owed, no rename)**:     <- from sibling item, line 28
DISPOSITION-OWED elf-b15-002: - **Cross-batch near-pair (register echo, disposition owed, no rename)**:
DISPOSITION-OWED elf-b16-001: - **Cross-batch near-pair (register echo, disposition owed, no rename)**:
DISPOSITION-OWED las-b16-001: cross-language; one written disposition owed per the 2026-08-26 process
DISPOSITION-OWED elf-b16-003: cross-language; one written disposition owed per the 2026-08-26 process
DISPOSITION-OWED elf-b16-003: (both village-communication—distinct mechanism; disposition owed).          <- from next item, line 51
```
Fixed (5 undischarged of 3 markers) — the new findings list:
```
DISPOSITION-OWED elf-b15-002: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED elf-b16-001: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED las-b16-001: line 48: **Same-batch material adjacency**: las-b16-001 (brickworks history, SV) and elf-b16-003 (cavity-wall drainage physics, E
DISPOSITION-OWED elf-b16-003: line 48: **Same-batch material adjacency**: las-b16-001 (brickworks history, SV) and elf-b16-003 (cavity-wall drainage physics, E
DISPOSITION-OWED <no unit named>: line 50: Also cross-batch: landmark-directions cloze vs batch15 noticeboard (both village-communication—distinct mechanism; dispo
assembly-dispositions: 5 undischarged of 3 marker(s)
```
(The line-30 obligation names batch15's elf-b15-002; its G-REGISTER disposition would be
discharged by passing batch15's verdict file as an extra argument.) batch15 and batch17
`ASSEMBLY.md` (the only other assembly records): 0 markers on head and after — unchanged.

### Merge regression proof (head implementation vs fix, real batch inputs)

Driver: appendix A (loads the head copy and the lane module side by side; argv order = the
pipeline order of the leg files; G-KEY via the vote-stamped `-v` legs plus the raw leg-2
copy that leaked in 8b). "Committed − twins" = the committed `verdicts.jsonl` with its 7
unstamped 8b twins removed.

| Scenario | inputs | head | fix | head-only records | fix vs committed − twins |
|---|---|---|---|---|---|
| batch16 fleet `verdicts/` + `verdicts-r3/` repairs | 19 | 164 (dropped 17) | 150 (superseded 24, dup 0, twins 7) | 14, all explained | **identical, same order** (150) |
| batch16 committed `verdicts.jsonl` + r3 repairs re-applied | 8 | 150 (dropped 45) | 150 (superseded 0, dup 31, twins 14) | 0 | **identical, same order** |
| batch17 fleet + `r2` + `agardom` + `agardom2` | 28 | 174 (dropped 16) | 149 (superseded 34, dup 0, twins 7) | 25, all explained | **identical, same order** (149) |
| batch17 fleet + `r2` + `agardom2` | 23 | 167 (dropped 12) | 149 (superseded 23, twins 7) | 18, all explained | **identical, same order** |
| batch17 committed `verdicts.jsonl` + r2/agardom2 re-applied | 12 | 149 (dropped 43) | 149 (superseded 0, dup 29, twins 14) | 0 | **identical, same order** |

In every scenario the fix emits no record head does not ("only in NEW: 0"), and its order
equals head's order with each repair moved into the place of the record it replaced. The
superseded count exceeds the head-only count by re-gates that reuse the base executor string
(batch16 r3 G-STEM x3 + G-DISTRACTOR x7; batch17 r2 G-DISTRACTOR x5, agardom G-STEM x2 +
G-DISTRACTOR x2): head already collapsed those by identity (counted in `dropped`), with the
same result. Every head-only record, with the later-file record that superseded it:

batch16 fleet + r3 (14 — all G-KEY; the r3 legs carry executor `claude-opus-5/G-KEY` + a justification, the round-2 legs `claude-opus-5/G-KEY-1`/`-2` without one, so head kept both):
```
(elf-b16-003, G-KEY, q:1, 1|2)        pass G-KEY-1|G-KEY-2 [verdicts/verdicts-gkey-1|2.jsonl] -> pass G-KEY [verdicts-r3/verdicts-gkey-1v|2v.jsonl]
(las-b16-001, G-KEY, q:1..q:4, 1|2)   pass G-KEY-1|G-KEY-2 [verdicts/verdicts-gkey-1|2.jsonl] -> pass G-KEY [verdicts-r3/verdicts-gkey-1v|2v.jsonl]   (8 records)
(las-b16-002, G-KEY, q:1..q:2, 1|2)   pass G-KEY-1|G-KEY-2 [verdicts/verdicts-gkey-1|2.jsonl] -> pass G-KEY [verdicts-r3/verdicts-gkey-1v|2v.jsonl]   (4 records)
```
batch17 fleet + r2 + agardom + agardom2 (25):
```
(elf-b17-001, G-KEY, q:1..q:5, 1|2)   pass G-KEY-1|G-KEY-2 [verdicts/] -> pass claude-opus-5/G-KEY [verdicts-r2/verdicts-gkey-1v|2v.jsonl]           (10)
(las-b17-003, G-KEY, q:1..q:2, 1|2)   pass G-KEY-1|G-KEY-2 [verdicts/] -> pass claude-fable-5/G-KEY-leg1|leg2 [verdicts-agardom2/...-1v|2v.jsonl]     (4)
(las-b17-003, G-KEY, q:1..q:2, 1|2)   pass claude-opus-5/G-KEY [verdicts-agardom/...-1v|2v.jsonl] -> pass claude-fable-5/G-KEY-leg1|leg2 [agardom2]  (4)
(las-b17-003, G-DISTRACTOR, q:1|q:2)  pass claude-opus-5 [verdicts-agardom/] -> pass claude-fable-5 [verdicts-agardom2/]                              (2)
(las-b17-003, G-SPRAK, unit) run 1..3 flag claude-opus-5 [verdicts-agardom/verdicts-gsprak.jsonl] -> pass claude-fable-5 run 1..3 [verdicts-agardom2/]  (3)
(las-b17-003, G-STEM, q:1|q:2)        pass claude-opus-5 [verdicts-agardom/] -> flag claude-fable-5 [verdicts-agardom2/]                              (2)
```
batch17 fleet + r2 + agardom2 (18): the 10 elf-b17-001 G-KEY lines and 4 las-b17-003 G-KEY
lines above (from `verdicts/`), plus `(las-b17-003, G-DISTRACTOR, q:1)` pass and `q:2` **flag**
[verdicts/] → pass [agardom2], and `(las-b17-003, G-STEM, q:1)` pass and `q:2` flag
[verdicts/] → flag [agardom2].

Aggregate impact (`aggregate.py`, `candidates-final/`): batch16 statuses identical (every
superseded G-KEY record was a pass). batch17 las-b17-003: head SURVIVED_FLAGGED with
**6** flags (with agardom: the three obsolete agardom G-SPRAK unit flags survive) or **5**
(without: the obsolete fleet G-DISTRACTOR q:2 and G-STEM q:2 flags survive) vs **3** for the
fix — the committed, owner-accepted state. All other units identical.

Every committed merged file merged alone (21 files, batch1–17 incl. `verdicts-round1.jsonl`,
`verdicts-merged.jsonl`, `verdicts-mech.jsonl`): output identical head vs fix, none refused.
Counters: batch6 35 superseded (same-identity mech restatements with a new `executed_at`;
head counted them as dropped), batch16 and batch17 7 twins each, all others 0.

Leg files merged alone: 438 → 358 identical, 0 differ, 80 refused by the same-file rule
(categories in D1.1). CLI view of the refusal on a real file:
```
merge_verdicts: MERGE CONTRACT VIOLATION — .../batch16/verdicts-r3/verdicts-gkey-resolved.jsonl: same file carries 2 different records
for (candidate_id, gate, target, vote)=('elf-b16-003', 'G-KEY', 'q:1', None) without distinct integer `run` numbers (line 1
executed_by='claude-opus-5/G-KEY' run=None, line 8 executed_by='claude-opus-5/G-KEY' run=None) — an appended re-gate and a
second ballot are indistinguishable here; put the re-gate in its own later input file, or stamp the ballots with `vote`/`run`
```
(exit 1, no `--out` written). CLI view of the batch16 fleet + r3 merge:
`merge_verdicts: 150 record(s) (61 vote-bearing); 24 superseded by later input, 0 exact duplicate(s), 7 unstamped twin(s) collapsed`.

---

## Residual risks / follow-ups (not in this bead's scope)

1. An UNSTAMPED later-file G-KEY record does not supersede earlier vote-stamped records for
   the same target (different SLOT by contract). The runbook already requires `-v` legs; a
   guard refusing an unstamped G-KEY record whose target has stamped votes would make that
   mechanical.
2. Sentence boundary heuristic: an abbreviation followed by a capitalised word ("Dr. X")
   ends a sentence, so a unit id after it is out of the marker's scope → a false
   `<no unit named>`. This errs toward a block, never toward a silent discharge; the fix is to
   name the unit in the marker's sentence. Nested list items are their own blocks (same
   direction).
3. batch17 `ASSEMBLY.md:55` "Written dispositions owed for any named adjacency" (plural,
   generic rule) is not the marker phrase — pre-existing behaviour, unchanged.
4. The 80 refused leg files are frozen pre-merge-tool artefacts; if one ever has to be
   re-merged, split its appended re-gate lines into a later file first.

## Reproduction

```
git rev-parse HEAD                                   # 0294fd9673b27f116c99241843d949bcfefb4ec7
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
python3 pipeline/synthetic/gates/scripts/check_assembly_dispositions.py \
    pipeline/synthetic/batches/batch16/ASSEMBLY.md pipeline/synthetic/batches/batch16/verdicts.jsonl
# head copy for the regression driver (verify: git hash-object == git rev-parse HEAD:<path>)
git show 0294fd9:pipeline/synthetic/gates/scripts/merge_verdicts.py > /tmp/merge_verdicts_head.py
python3 merge_regression.py "$PWD" /tmp/merge_verdicts_head.py [report.txt]
```

### Appendix A — `merge_regression.py` (the regression driver, run from a scratch dir)

```python
"""Merge regression proof for bead hpf-qo10: head merge_verdicts.py vs the fix.

Runs OLD (head 0294fd9 copy) and NEW (lane) over real batch inputs and
explains every difference. Read-only over the repo; prints a report.

usage: merge_regression.py <lane-root> <old-merge-module-path> [report-path]
"""
from __future__ import annotations

import importlib.util
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
OLD_PATH = Path(sys.argv[2])
SCRIPTS = LANE / "pipeline/synthetic/gates/scripts"
BATCHES = LANE / "pipeline/synthetic/batches"
sys.path.insert(0, str(SCRIPTS))


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod  # @dataclass resolves its module via sys.modules
    spec.loader.exec_module(mod)
    return mod


OLD = _load("merge_old", OLD_PATH)
NEW = _load("merge_new", SCRIPTS / "merge_verdicts.py")
from aggregate import aggregate  # noqa: E402

B16_FLEET = [
    "verdicts/verdicts-mech.jsonl",
    "verdicts/verdicts-gkey-1.jsonl", "verdicts/verdicts-gkey-2.jsonl",
    "verdicts/verdicts-gstem.jsonl", "verdicts/verdicts-gdistractor.jsonl",
    "verdicts/verdicts-gregister.jsonl",
    "verdicts/verdicts-gsprak-1.jsonl", "verdicts/verdicts-gsprak-2.jsonl",
    "verdicts/verdicts-gsprak-3.jsonl",
    "verdicts/verdicts-geng-1.jsonl", "verdicts/verdicts-geng-2.jsonl",
    "verdicts/verdicts-geng-3.jsonl",
]
B16_R3 = [
    "verdicts-r3/verdicts-gkey-1v.jsonl", "verdicts-r3/verdicts-gkey-2v.jsonl",
    "verdicts-r3/verdicts-gkey-2.jsonl",  # the raw leg-2 copy that leaked in 8b
    "verdicts-r3/verdicts-gstem.jsonl", "verdicts-r3/verdicts-gdistractor.jsonl",
    "verdicts-r3/verdicts-geng-elf003.jsonl", "verdicts-r3/verdicts-gsprak.jsonl",
]
B17_FLEET = list(B16_FLEET)
B17_R2 = [
    "verdicts-r2/verdicts-gkey-1v.jsonl", "verdicts-r2/verdicts-gkey-2v.jsonl",
    "verdicts-r2/verdicts-gkey-2.jsonl",  # raw leg-2 copy (8b shape)
    "verdicts-r2/verdicts-gdistractor.jsonl", "verdicts-r2/verdicts-geng.jsonl",
]
B17_AGARDOM = [
    "verdicts-agardom/verdicts-gkey-1v.jsonl", "verdicts-agardom/verdicts-gkey-2v.jsonl",
    "verdicts-agardom/verdicts-gstem.jsonl", "verdicts-agardom/verdicts-gdistractor.jsonl",
    "verdicts-agardom/verdicts-gsprak.jsonl",
]
B17_AGARDOM2 = [
    "verdicts-agardom2/verdicts-gkey-1v.jsonl", "verdicts-agardom2/verdicts-gkey-2v.jsonl",
    "verdicts-agardom2/verdicts-gkey-2.jsonl",  # raw leg-2 copy (8b shape)
    "verdicts-agardom2/verdicts-gstem.jsonl", "verdicts-agardom2/verdicts-gdistractor.jsonl",
    "verdicts-agardom2/verdicts-gsprak.jsonl",
]


def canon(v: dict) -> str:
    return json.dumps(v, sort_keys=True, ensure_ascii=False)


def slot(v: dict) -> tuple:
    return (v.get("candidate_id"), v.get("gate"), v.get("target"), v.get("vote"))


def load(fp: Path) -> list[dict]:
    return [json.loads(l) for l in fp.read_text(encoding="utf-8").splitlines() if l.strip()]


def candidates(batch: Path) -> dict:
    out = {}
    for p in sorted((batch / "candidates-final").glob("*.json")):
        c = json.loads(p.read_text(encoding="utf-8"))
        if "candidate_id" in c:
            out[c["candidate_id"]] = c
    return out


def run_old(files):
    try:
        recs, dropped = OLD.merge(files)
        return recs, f"dropped={dropped}", None
    except Exception as exc:  # noqa: BLE001
        return None, None, f"{type(exc).__name__}: {exc}"


def run_new(files):
    try:
        recs, st = NEW.merge(files)
        return recs, f"superseded={st.superseded} duplicates={st.duplicates} twins={st.twins}", None
    except Exception as exc:  # noqa: BLE001
        return None, None, f"{type(exc).__name__}: {exc}"


def sources(files, batch):
    where = defaultdict(list)
    for fp in files:
        for v in load(fp):
            where[canon(v)].append(str(fp.relative_to(batch)))
    return where


def short(v):
    return (f"{v.get('verdict')} by={v.get('executed_by')}"
            + (f" run={v['run']}" if "run" in v else ""))


def explain(name, batch, rels, committed_minus_twins=None):
    files = [batch / r for r in rels]
    print(f"\n=== {name}  ({len(files)} input file(s))")
    old, old_stats, old_err = run_old(files)
    new, new_stats, new_err = run_new(files)
    print(f"OLD: {'ERROR ' + old_err if old_err else f'{len(old)} records, {old_stats}'}")
    print(f"NEW: {'ERROR ' + new_err if new_err else f'{len(new)} records, {new_stats}'}")
    if old_err or new_err:
        return
    oc, nc = Counter(map(canon, old)), Counter(map(canon, new))
    only_old, only_new = oc - nc, nc - oc
    print(f"records only in OLD: {sum(only_old.values())}   only in NEW: {sum(only_new.values())}")
    where = sources(files, batch)
    by_slot_new = defaultdict(list)
    for v in new:
        by_slot_new[slot(v)].append(v)
    unexplained = 0
    for c in sorted(only_old, key=lambda c: str(slot(json.loads(c)))):
        v = json.loads(c)
        repl = by_slot_new.get(slot(v), [])
        src_old = where[c][-1]
        later = [r for r in repl if max(files.index(batch / s) for s in where[canon(r)])
                 > max(files.index(batch / s) for s in where[c])]
        if "run" in v and any(r.get("run") == v["run"] for r in later):
            later = [r for r in later if r.get("run") == v["run"]]
        if not later:
            unexplained += 1
            print(f"  UNEXPLAINED {slot(v)} {short(v)} [{src_old}]")
            continue
        for r in later:
            print(f"  superseded {slot(v)}: {short(v)} [{src_old}] -> {short(r)} [{where[canon(r)][-1]}]")
    print(f"unexplained OLD-only records: {unexplained}")
    # order: OLD with each superseded record replaced in place by its superseder(s)
    replaced_by = {}
    for c in only_old:
        v = json.loads(c)
        replaced_by.setdefault(slot(v), by_slot_new.get(slot(v), []))
    expected, placed = [], set()
    superseders = {canon(r) for rs in replaced_by.values() for r in rs}
    for v in old:
        c = canon(v)
        if c in only_old:
            s = slot(v)
            if s not in placed:
                expected.extend(replaced_by[s])
                placed.add(s)
            continue
        if c in superseders:
            if slot(v) not in placed:
                expected.extend(replaced_by[slot(v)])
                placed.add(slot(v))
            continue
        expected.append(v)
    print(f"NEW order == OLD order with each repair moved into the slot it replaced: "
          f"{[canon(v) for v in expected] == [canon(v) for v in new]}")
    if committed_minus_twins is not None:
        same = [canon(v) for v in new] == [canon(v) for v in committed_minus_twins]
        print(f"NEW == committed verdicts.jsonl minus its unstamped twins "
              f"({len(committed_minus_twins)} records), same order: {same}")
    cands = candidates(batch)
    ra, rb = aggregate(old, cands), aggregate(new, cands)
    for cid in sorted(cands):
        a, b = ra[cid], rb[cid]
        note = "" if (a["status"], len(a["flags"])) == (b["status"], len(b["flags"])) else "   <-- differs"
        print(f"  aggregate {cid}: OLD {a['status']} flags={len(a['flags'])} lang_kills={a['language_kill_votes']}"
              f" | NEW {b['status']} flags={len(b['flags'])} lang_kills={b['language_kill_votes']}{note}")


def strip_twins(records):
    stamped = {(v.get("candidate_id"), v.get("gate"), v.get("target"), v.get("executed_by"),
                v.get("justification"), v.get("run")) for v in records if v.get("vote") is not None}
    return [v for v in records if not (v.get("vote") is None and (
        v.get("candidate_id"), v.get("gate"), v.get("target"), v.get("executed_by"),
        v.get("justification"), v.get("run")) in stamped)]


class _Tee:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, s):
        for st in self.streams:
            st.write(s)

    def flush(self):
        for st in self.streams:
            st.flush()


def main() -> int:
    if len(sys.argv) > 3:
        report = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
        sys.stdout = _Tee(sys.__stdout__, report)
    b16, b17 = BATCHES / "batch16", BATCHES / "batch17"
    c16 = strip_twins(load(b16 / "verdicts.jsonl"))
    c17 = strip_twins(load(b17 / "verdicts.jsonl"))
    explain("batch16 legs: fleet + r3 repairs", b16, B16_FLEET + B16_R3, c16)
    explain("batch16 committed verdicts.jsonl + r3 repairs re-applied", b16,
            ["verdicts.jsonl"] + B16_R3, c16)
    explain("batch17 legs: fleet + r2 + agardom + agardom2", b17,
            B17_FLEET + B17_R2 + B17_AGARDOM + B17_AGARDOM2, c17)
    explain("batch17 legs: fleet + r2 + agardom2 (no agardom)", b17,
            B17_FLEET + B17_R2 + B17_AGARDOM2, c17)
    explain("batch17 committed verdicts.jsonl + r2/agardom2 repairs re-applied", b17,
            ["verdicts.jsonl"] + B17_R2 + B17_AGARDOM2, c17)
    print("\n=== every committed merged file, merged alone (OLD vs NEW)")
    for fp in sorted(BATCHES.glob("batch*/verdicts*.jsonl"),
                     key=lambda p: (int(p.parent.name[5:]), p.name)):
        old, old_stats, old_err = run_old([fp])
        new, new_stats, new_err = run_new([fp])
        rel = f"{fp.parent.name}/{fp.name}"
        if old_err or new_err:
            print(f"  {rel}: OLD {old_err or 'ok'} | NEW {new_err or 'ok'}")
            continue
        same = [canon(v) for v in old] == [canon(v) for v in new]
        print(f"  {rel}: in={len(load(fp))} OLD {len(old)} ({old_stats}) | NEW {len(new)} ({new_stats})"
              f" | identical output: {same}")
    print("\n=== every leg file (verdicts*/ dirs), merged alone: where NEW now fails closed")
    legs = sorted(BATCHES.glob("batch*/verdicts*/*.jsonl"),
                  key=lambda p: (int(p.parts[-3][5:]), p.parent.name, p.name))
    refused, same, differ = [], 0, []
    for fp in legs:
        old, _, old_err = run_old([fp])
        new, _, new_err = run_new([fp])
        rel = str(fp.relative_to(BATCHES))
        if new_err:
            refused.append((rel, new_err))
        elif [canon(v) for v in old] == [canon(v) for v in new]:
            same += 1
        else:
            differ.append(rel)
    print(f"  {len(legs)} leg files: {same} identical OLD/NEW, {len(differ)} differ, "
          f"{len(refused)} refused by NEW (same-file rule)")
    for rel in differ:
        print(f"  DIFFER {rel}")
    for rel, err in refused:
        print(f"  REFUSED {rel}: {err[:260]}")
    print("\n=== `run` values present in any verdict file (NEW validates positive int)")
    runs = Counter()
    for fp in BATCHES.glob("batch*/**/*.jsonl"):
        for v in load(fp):
            if "run" in v:
                runs[repr(v["run"])] += 1
    print(f"  {dict(runs)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

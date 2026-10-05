# hpf-oy2w — PR #370 fix round 2: five fail-open gate paths closed

Origin: Codex exact-head review hpf-3uon (VERDICT: HOLD at d0265ef) of PR #370 (pipeline
hardening, origin bead hpf-y1p4). Round 1 = hpf-qo10 (commit d0265ef, evidence in
`docs/worklog/hpf-qo10.md`). Lane `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`,
`git rev-parse HEAD` = `d0265efec900ba366448ad3a3351dbe4b618bc50` (verified first). All
changes are UNCOMMITTED in the lane.

Principle applied to every change: these are gates. An input the gate cannot positively
verify fails closed (non-zero exit, explicit message). An unreadable or empty input is
never turned into a clean result, and a marker or twin is never resolved by borrowing.

## Changed files

| File | Change |
|---|---|
| `pipeline/synthetic/gates/scripts/check_assembly_dispositions.py` | A: sentence boundary on `.` `;` `!` `?` + whitespace, independent of the next word's case; explicit abbreviation exemptions |
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | B+C: `collect()` and input failures (`INPUT-FAIL`, exit 2) for a missing path, a directory with no lintable file, a non-UTF-8 file and an unparseable `.json` (raw-text fallback removed) |
| `pipeline/synthetic/gates/scripts/check_sheet_sync.py` | D: forbidden keys matched on a normalised key (NFKD, accents dropped, case-folded, non-alphanumerics removed) as stems + words, at any depth; every hit reported with its JSON path |
| `pipeline/synthetic/gates/scripts/merge_verdicts.py` | E: a twin must equal its stamped copy once `vote` is removed, searched over every stamped record of the IDENTITY; otherwise `MergeContractError` naming both records |
| `pipeline/synthetic/gates/scripts/tests/test_gate_fail_closed_round2.py` | new: 70 items, 64 red-first defect tests + 6 guards |
| `pipeline/synthetic/gates/scripts/tests/test_merge_supersession_marker_scope.py` | the two BATCH16_ITEM2 attribution tests rewritten for `;` (decision A.1); docstring note |
| `pipeline/synthetic/LAYER2-RENDERING.md` | new section: input failures fail closed, exit codes 0/1/2 |
| `pipeline/synthetic/BATCH-RUNBOOK.md` | merge paragraph: the twin-equality rule |
| `docs/worklog/hpf-oy2w.md` | this file |

Not touched: batch content, verdict files, `data/`, `app/`, `worker/`, `.github/workflows/`,
and the pre-existing untracked `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/` material
plus the sandbox dotfiles. The bead names no validator (metadata `gc.check_path` belongs to
the workflow-control check lane), so none was run.

---

## Defect A — `check_assembly_dispositions.py`: the sentence boundary ignores case

Contract now: a marker's units are looked up in its block (unchanged from round 1) and,
within the block, only in its sentence. A sentence ends at `.` `;` `!` or `?` (plus closing
quotes, brackets or emphasis) followed by whitespace, whatever the case of the next word.
Not boundaries: `8.7`, `ASSEMBLY.md` and unit ids (no whitespace after the dot), and a full
stop closing an entry of `_ABBREVIATIONS`.

The repro now gives `- elf-b16-003 is clean. cross-batch echo; disposition owed.` (elf-b16-003
disposed) → `DISPOSITION-OWED <no unit named>: line 1: disposition owed.`, exit 1. Head
printed "all discharged" and exited 0.

### A.1 Decision: `;` ends a clause, which changes the real batch16 line 48

The bead lists `;` among the terminators, and the gate depends on it. Without it,
`- elf-b16-003 is clean; cross-batch echo, disposition owed.` still borrows elf-b16-003. That
case is pinned by `test_sentence_ends_whatever_the_case_of_the_next_word[; ]` and `[;\n  ]`.
The same rule detaches batch16 `ASSEMBLY.md` line 48's obligation from the units named
before its semicolon:

> las-b16-001 (brickworks history, SV) and elf-b16-003 (cavity-wall drainage physics, EN) —
> disjoint mechanism, cross-language; one written disposition owed per the 2026-08-26
> process rule.

The marker clause, `one written disposition owed per the 2026-08-26 process rule.`, names no
unit, so it now gives `<no unit named>` (head: las-b16-001 + elf-b16-003). It has the same
shape as the borrowing repro, so no boundary rule can attribute one and refuse the other. The
bead says to prefer `<no unit named>` over borrowing, so the line fails closed. This is
strictly stricter than head. No verdict file can discharge `<no unit named>`; only naming
the units in the marker's clause can, e.g. `... disposition owed for las-b16-001/elf-b16-003
per ...` (pinned by `test_first_obligation_requires_its_units_once_its_clause_names_them`).
Editing `ASSEMBLY.md` is batch content and out of scope here.

Two round-1 tests asserted head's attribution of BATCH16_ITEM2 (verbatim lines 46–51). They
were rewritten, as round 1 did with its D1.6:
- `test_unnamed_second_obligation_is_not_masked_by_the_named_first` →
  `test_unnamed_second_obligation_is_not_masked_by_the_first`. With las-b16-001 and
  elf-b16-003 disposed, it now expects two `<no unit named>` (lines 3 and 5) instead of one
  (line 5). The property it guards still holds: line 5 is never discharged by another
  clause's units.
- `test_named_first_obligation_still_requires_its_units` →
  `test_first_obligation_requires_its_units_once_its_clause_names_them`. As committed, the
  item gives two `<no unit named>`. With the units named in the clause it gives las-b16-001,
  elf-b16-003 and `<no unit named>`, the old expectation, now reached through the authoring
  fix.

If the owner prefers that `;` NOT end a clause, the revert is one character in
`_SENTENCE_GAP`, plus these two tests and the two `;` cases of the parametrised test. The
cost is that the `X is clean; ..., disposition owed` borrowing comes back.

### A.2 Abbreviations

Head relied on the uppercase rule for its documented non-splits ("vs. las-b16-002",
"e.g. the"). With that rule gone they need an explicit list. `_ABBREVIATIONS` holds only
abbreviations that always take a complement:

- English: vs, e.g, i.e, cf, viz, approx, ca, incl, excl, resp, fig, nr, dr, mr, mrs, ms, prof.
- Swedish: t.ex, bl.a, d.v.s, dvs, s.k, jfr, p.g.a, pga, fr.o.m, t.o.m, inkl, exkl, kap.

Abbreviations that can end a sentence ("etc.", "osv.", "m.m.", "m.fl.", "no.", "St.") are
left out on purpose. Exempting one could JOIN two sentences and lend the marker a unit;
leaving it out can only split, which narrows the scope towards `<no unit named>` and fails
closed. The match is on the token before the dot, with opening quotes, brackets and emphasis
stripped, case-insensitive. Guards: `test_abbreviations_decimals_and_file_names_stay_inside_the_sentence`
and `test_swedish_abbreviations_stay_inside_the_sentence`.

Side effect: head split after an abbreviation followed by a capital ("e.g. Quennerby",
round-1 residual 2) and now does not. `test_abbreviation_before_a_capitalised_word_does_not_split`
is red on head in the over-strict direction; it is not a fail-open.

## Defect B — `lint_learner_output.py`: zero files examined

Every path argument must resolve to something:
- A missing path gives `INPUT-FAIL <p>: path does not exist (...)`. Head raised a
  FileNotFoundError traceback.
- A directory with no lintable file gives `INPUT-FAIL <dir>: no lintable file in this
  directory (.json/.md/.txt, not _-prefixed) — nothing to check`. Lintable means `.json`,
  `.md` or `.txt` and not `_`-prefixed. The suffix match is now case-insensitive, and
  directories named `*.json` are skipped.

The check is per path, not only on the total. An empty store directory passed beside a good
file still fails (`test_lint_empty_directory_beside_a_clean_file_fails_closed`), so a typo'd
store path is not masked by another argument. A final backstop turns zero examined files
into `INPUT-FAIL -: zero files examined`. It cannot be reached through `collect()` today; it
states the bead's invariant.

Exit codes: 0 clean, 1 findings, **2 input failure**. Findings are still printed, but an
input failure outranks them. The summary line reads `learner-output lint: FAILED — N input
failure(s), M finding(s) in K file(s) examined`. No caller in the repo depends on the exit
code: only `LAYER2-RENDERING.md`, `BATCH-RUNBOOK.md` and batch17 `BRIEF-ADDENDUM.md` mention
the script, and CI does not run it.

## Defect C — `lint_learner_output.py`: unparseable `.json`

A `JSONDecodeError` gives `INPUT-FAIL <file>: not valid JSON (<decoder message>)` and exit 2;
the raw-text fallback is gone. A file of any suffix that is not UTF-8 gives `INPUT-FAIL
<file>: not readable as UTF-8 text (...)` instead of a traceback. All 27 store files still
parse: the store probe below is byte-identical to head.

## Defect D — `check_sheet_sync.py`: normalised alias matching

The normalised key is NFKD, combining marks dropped, case-folded, non-alphanumerics removed.
`correctAnswer`, `Correct Answer`, `correct-answer` and `CORRECT_ANSWER` all become
`correctanswer`; `rätt_svar`, `Rätt svar`, `ratt_svar` and `rättSvar` all become `rattsvar`.
Each sheet matches two tiers:

| tier | entries | blind | stems | distractor |
|---|---|---|---|---|
| stem (contains) | answer, correct, solution, facit, keyed, keyletter, rattsvar, korrekt | ✓ | ✓ | – |
| word (equals) | key, keys, svar, svaret, ratt, losning | ✓ | ✓ | – |
| stem (contains) | rationale, explanation, whywrong, whytempting, generatormeta, plantedtrap, hedgemap, repairlog, selfblindsolve | ✓ | ✓ | ✓ |
| stem (contains) | family | ✓ | ✓ | – |
| stem (contains) | passage, title | – | ✓ | – |

Stems catch compounds without listing every spelling: answerLetter, isCorrect,
correctOption, korrekt_svar, plantedTraps. Words are names too short to match inside other
keys: "key" sits in "keyword", and "svar" in "svarsalternativ" (Swedish for answer options).
Every head entry is still covered, since head's snake_case names normalise into these.
Checked mechanically against the d0265ef module: all 59 (sheet, name) pairs head forbade are
still forbidden. No field the real sheets legitimately carry is newly forbidden, including
`family`, `key`, `title` and `passage` on the distractor sheet, and `title` and `passage` on
the blind sheet.

Every forbidden key at any depth is now reported; head reported only the first. The JSON
path is used as the field:
- `SYNC-FAIL las-b99-001 blind correctAnswer: forbidden field present (contamination)`
- nested: `questions[0].options[1].meta[0].audit.correctAnswer`
- non-plain keys quoted: `questions[0]["Correct Answer"]`

Real sheets: I walked every key at every depth of all 86 real sheet files (stems 44,
stems-round1 14, blind-round1 14, distractor-round1 14). The gate itself reads only `blind/`,
`stems/` and `distractor/`. The only keys present are candidate_id, section, title, passage,
family, key, questions, q_index, prompt, options, letter and text. Result: 0 hits on head,
0 hits on the fix, so no new finding anywhere.

## Defect E — `merge_verdicts.py`: a twin must be the same evidence

Twin rule now: an unstamped record folds into a stamped record of the same IDENTITY only if
the two are equal once `vote` is removed. Every stamped record of the IDENTITY is searched,
and the first equal one wins; that is head's choice whenever head's first candidate was
equal. If none is equal, `MergeContractError` names the raw record and every stamped
candidate with file:line, vote, verdict and the differing fields:

```
merge_verdicts: MERGE CONTRACT VIOLATION — gkey-2.jsonl:1: unstamped record (verdict='kill') shares its
evidence IDENTITY (candidate_id, gate, target, executed_by, justification, run) with vote-stamped
gkey-2v.jsonl:1 (vote=2, verdict='pass'; differs in verdict) — not a twin: a raw leg must equal its
stamped copy apart from `vote`. Contradictory evidence is never folded; drop the stale copy or
re-stamp the leg from the raw file
```

Why every candidate is searched:
- The real batch16 `verdicts-r3/` and batch17 `verdicts-r2/` dirs carry each stamped leg
  twice (`-1v`/`-2v` and `verdicts-gkey-resolved-v.jsonl`). A raw record can therefore have
  several stamped copies: 35 such raw records in the batch16 pool, 43 in batch17.
- A raw copy of a repaired stamped record must still fold when an older, superseded stamped
  record shares its IDENTITY (`test_twin_found_among_several_stamped_records_of_one_identity`).

Survey of every batch with all verdict files pooled: every real identity-twin is equal minus
`vote`. That is 7 each in the batch16 and batch17 committed `verdicts.jsonl`, 35 in the
batch16 pool, 43 in the batch17 pool, and none in batches 1–15. The stricter rule therefore
refuses nothing real; the replay below confirms it.

---

## Red-first evidence

The red run used gate scripts byte-identical to head. Scratch copies were verified by blob
hash before any edit (`git rev-parse HEAD:<path>` == `git hash-object <copy>`):

| Script | Blob |
|---|---|
| `check_assembly_dispositions.py` | `01456fee347221734c1bbeb743366db1052c9641` |
| `lint_learner_output.py` | `0334eddf37e92e0e91765d8721e5354539998db1` |
| `check_sheet_sync.py` | `d8fecc21b4c755812196d7a6bb6674f904ab691b` |
| `merge_verdicts.py` | `c0b7efc4ccef98829a0548605a87975190192bfe` |
| `aggregate.py` | `2936595ec7175fbea8a2f3912f07a05df345c1c4` |
| `mech.py` | `a909f800230acb7f8c2060179ca8204158de67b2` |

The tests were final at the red run; neither test file has changed since, so the line
numbers below are current.

`python3 -m pytest -q -p no:cacheprovider --tb=line -rf pipeline/synthetic/gates/scripts/tests`
→ **66 failed, 146 passed**. That is 212 items: 140 unchanged, 2 rewritten, 70 new. Every
defect test fails and the 6 guards pass. Failures per defect: A 13 (11 new + 2 rewritten),
B 4, C 4, D 39, E 6.

Assertion lines, in `test_gate_fail_closed_round2.py` unless named:

```
:58   test_review_repro_lowercase_clause_does_not_borrow_the_unit
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:66   test_sentence_ends_whatever_the_case_of_the_next_word[. |; |! |? |.) |." |.** |;\n  ]   (x8)
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:73   test_unit_in_a_lowercase_sentence_after_the_marker_is_not_lent
        AssertionError: assembly-dispositions: OK — 1 marker(s), all discharged
:109  test_abbreviation_before_a_capitalised_word_does_not_split            (over-strict head, A.2)
        AssertionError: DISPOSITION-OWED <no unit named>: line 1: Quennerby, Quennerly), disposition owed.
test_merge_supersession_marker_scope.py:283  test_unnamed_second_obligation_is_not_masked_by_the_first
        AssertionError: assert (1 == 2)
test_merge_supersession_marker_scope.py:292  test_first_obligation_requires_its_units_once_its_clause_names_them
        AssertionError: assert ['DISPOSITION... unit named>'] == ['DISPOSITION... unit named>']
        (head: [las-b16-001, elf-b16-003, <no unit named>] vs expected [<no unit named>] x2)
:127  test_lint_empty_directory_fails_closed
        AssertionError: learner-output lint: clean — 0 file(s)
:138  test_lint_directory_without_lintable_files_fails_closed
        AssertionError: learner-output lint: clean — 0 file(s)
:147  test_lint_empty_directory_beside_a_clean_file_fails_closed
        AssertionError: learner-output lint: clean — 1 file(s)
:154  test_lint_missing_path_fails_closed_without_traceback
        AssertionError: Traceback (most recent call last):          (head: FileNotFoundError, exit 1)
:164  test_lint_unparseable_json_fails_closed_naming_the_file
        AssertionError: learner-output lint: clean — 1 file(s)
:175  test_lint_unparseable_json_inside_a_store_fails_closed
        AssertionError: learner-output lint: clean — 2 file(s)
:186  test_lint_reports_findings_and_input_failures_together
        AssertionError: L2-HEDGAT .../b.json:$.a: …Påståendet är hedgat…   (head exit 1; broken a.json raw-scanned)
:194  test_lint_non_utf8_input_fails_closed
        AssertionError: Traceback (most recent call last):          (head: UnicodeDecodeError)
:246  test_sheet_sync_review_repro_camelcase_answer_on_blind
        AssertionError: sheet-sync: OK — 1 unit(s) in sync
:260  test_sheet_sync_answer_alias_on_blind_fails_closed[...]   (x17)        AssertionError: assert []
        correctAnswer, Answer, ANSWER_KEY, answer-key, Correct Answer, CorrectOption, answerLetter,
        isCorrect, Solution, FACIT, rätt_svar, Rätt svar, ratt_svar, rättSvar, korrekt_svar, Key, KEYS
:277  test_sheet_sync_alias_found_at_any_depth[{top,question,option,deep}-{blind,stems}]   (x8)
        AssertionError: assert []
:288  test_sheet_sync_rationale_alias_on_distractor_fails_closed[...]   (x9)  AssertionError: assert []
        Rationale, whyWrong, why-tempting, Explanation, generatorMeta, plantedTraps, HedgeMap,
        repair log, selfBlindSolve
:296  test_sheet_sync_sheet_specific_alias_fails_closed[stems-Passage|stems-TITLE|stems-Family|blind-FAMILY]  (x4)
        AssertionError: assert []
:327  test_review_repro_stamped_pass_and_unstamped_kill_fail_closed
        Failed: DID NOT RAISE <class 'merge_verdicts.MergeContractError'>
:340  test_twin_differing_beyond_vote_fails_closed[findings|executed_at|q_index]   (x3)
        Failed: DID NOT RAISE <class 'merge_verdicts.MergeContractError'>
:346  test_twin_pair_inside_one_file_differing_beyond_vote_fails_closed
        Failed: DID NOT RAISE <class 'merge_verdicts.MergeContractError'>
:355  test_cli_refuses_a_non_twin_and_writes_nothing
        AssertionError: merge_verdicts: 1 record(s) (1 vote-bearing); 0 superseded by later input,
        0 exact duplicate(s), 1 unstamped twin(s) collapsed -> .../merged.jsonl
```

Guards, green on head and after the fix:
- `test_named_clause_after_a_semicolon_is_dischargeable`
- `test_abbreviations_decimals_and_file_names_stay_inside_the_sentence`
- `test_swedish_abbreviations_stay_inside_the_sentence`
- `test_sheet_sync_distractor_keys_are_not_contamination`
- `test_raw_leg_with_two_identical_stamped_copies_still_folds`
- `test_twin_found_among_several_stamped_records_of_one_identity`

## Green run (after the fix)

```
$ python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
212 passed            # baseline 142 + 70 new (2 of the 142 rewritten in place)
$ python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
70 passed             # baseline 70
```

---

## Real-corpus probes (head d0265ef copies vs fix)

Only one probe output changes: batch16 `ASSEMBLY.md` line 48 (A.1). Every other output is
byte-identical to head.

### `check_assembly_dispositions.py`

batch16 (`ASSEMBLY.md` + `verdicts.jsonl`), exit 1 on both:

```
head (5 undischarged of 3 markers)
DISPOSITION-OWED elf-b15-002: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED elf-b16-001: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED las-b16-001: line 48: **Same-batch material adjacency**: las-b16-001 (brickworks history, SV) and elf-b16-003 (cavity-wall drainage physics, E
DISPOSITION-OWED elf-b16-003: line 48: **Same-batch material adjacency**: las-b16-001 (brickworks history, SV) and elf-b16-003 (cavity-wall drainage physics, E
DISPOSITION-OWED <no unit named>: line 50: Also cross-batch: landmark-directions cloze vs batch15 noticeboard (both village-communication—distinct mechanism; dispo
fix (4 undischarged of 3 markers)
DISPOSITION-OWED elf-b15-002: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED elf-b16-001: line 30: **Cross-batch near-pair (register echo, disposition owed, no rename)**: batch15's elf-b15-002 now ships *Verity Quennerb
DISPOSITION-OWED <no unit named>: line 48: one written disposition owed per the 2026-08-26 process rule.
DISPOSITION-OWED <no unit named>: line 50: disposition owed).
```

- Line 30: unchanged.
- Line 48: was las-b16-001 + elf-b16-003, now `<no unit named>` (A.1). Stricter: no verdict
  file can discharge it until the clause names its units.
- Line 50: still `<no unit named>`; the excerpt is now the marker's own `;` clause.

batch15 and batch17 (0 markers) are identical: exit 0.

### `check_sheet_sync.py`

batch16 + batch17, strict (no `--allow-missing-dirs`): identical, exit 1, 7 problems, all
already present at head:
- 4× `SYNC-FAIL - {blind,distractor} directory: sheet directory missing`. Neither batch has
  `blind/` or `distractor/`; batch16 keeps only the `-round1` copies.
- `elf-b17-003 stems q1.options`, `las-b17-001 stems q2.prompt`, `las-b17-002 stems q1.prompt`:
  batch17 stems drift.

With `--allow-missing-dirs`: identical, 3 problems (the batch17 drift). Every batch 1–17 run
alone with `--allow-missing-dirs`: 17/17 byte-identical. No new findings, so nothing new to
explain. The 7 existing problems are batch content, out of scope.

### `lint_learner_output.py` on `data/explanations` (the store path in LAYER2-RENDERING.md)

- Default: identical, exit 1, `2 finding(s) in 27 file(s)`. These are the two known genuine
  L2-HEDGAT findings in `host-2017.json`: `host-2017-verb2-MEK-025.distractors[2].why_wrong`
  and `.steps[2].text`.
- `--strict`: identical, 74 findings.

No store file is an input failure.

### Merge regression replay (bead requirement)

The hpf-qo10 replay was re-run with OLD = the d0265ef copy and NEW = the lane (appendix A).
Every scenario is identical in records, order and the (superseded, duplicates, twins)
counters:

| Scenario | inputs | records | (superseded, duplicates, twins), head = fix | fix vs committed − twins |
|---|---|---|---|---|
| batch16 fleet + r3 repairs | 19 | 150 | (24, 0, 7) | identical, same order |
| batch16 committed + r3 re-applied | 8 | 150 | (0, 31, 14) | identical, same order |
| batch17 fleet + r2 + agardom + agardom2 | 28 | 149 | (34, 0, 7) | identical, same order |
| batch17 fleet + r2 + agardom2 | 23 | 149 | (23, 0, 7) | identical, same order |
| batch17 committed + r2/agardom2 re-applied | 12 | 149 | (0, 29, 14) | identical, same order |
| batch16 `verdicts.jsonl` alone | 1 | 150 | (0, 0, 7) | — |
| batch17 `verdicts.jsonl` alone | 1 | 149 | (0, 0, 7) | — |

The numbers equal the hpf-qo10 table. **The 7 real 8b twins still collapse** in every
batch16/17 scenario: twins = 7, or 14 where the committed file and the repair legs each
bring 7.

Wider sweep:

| Sweep | Count | Identical | Refused by both, byte-identical message | NEW-only refusals |
|---|---|---|---|---|
| Committed merged files, each alone | 21 | 21 | 0 | 0 |
| Leg files, each alone | 438 | 358 | 80 (the hpf-qo10 same-file refusals) | 0 |
| Twin-stress pools (every `verdicts*/` dir pooled; every batch pooled whole) | 63 | 32 | 31 | 0 |

Total: 529 comparisons, 418 identical, 111 identical refusals, 0 NEW-only refusals, 0
differences. Refusals are compared by exact message, so a new "not a twin" refusal cannot
hide behind an old same-file refusal of the same exception class.

## CLI before/after — the five review repros (appendix C)

```
A  check_assembly_dispositions.py  '- elf-b16-003 is clean. cross-batch echo; disposition owed.' + elf-b16-003 disposed
   head (exit 0): assembly-dispositions: OK — 1 marker(s), all discharged
   fix  (exit 1): DISPOSITION-OWED <no unit named>: line 1: disposition owed.
B  lint_learner_output.py  empty directory
   head (exit 0): learner-output lint: clean — 0 file(s)
   fix  (exit 2): INPUT-FAIL empty-store: no lintable file in this directory (.json/.md/.txt, not _-prefixed) — nothing to check
C  lint_learner_output.py  truncated .json
   head (exit 0): learner-output lint: clean — 1 file(s)
   fix  (exit 2): INPUT-FAIL broken.json: not valid JSON (Expecting property name enclosed in double quotes: line 1 column 33 (char 32))
D  check_sheet_sync.py  blind sheet carrying correctAnswer: "A"
   head (exit 0): sheet-sync: OK — 1 unit(s) in sync
   fix  (exit 1): SYNC-FAIL las-b99-001 blind correctAnswer: forbidden field present (contamination)
E  merge_verdicts.py  stamped pass (vote=2) + unstamped kill, same identity
   head (exit 0): merge_verdicts: 1 record(s) (1 vote-bearing); 0 superseded by later input, 0 exact duplicate(s), 1 unstamped twin(s) collapsed
   fix  (exit 1): merge_verdicts: MERGE CONTRACT VIOLATION — gkey-2.jsonl:1: unstamped record (verdict='kill') shares its evidence IDENTITY ... differs in verdict ...
```

---

## Residual risks / follow-ups (not in this bead's scope)

1. **CI does not run the gate suite.** `.github/workflows/ci.yml:30` runs only
   `.github/contract-tests` and `pipeline/synthetic/evidence/tests`. The 212 gate tests,
   including both review rounds' regressions, run only by hand. Adding
   `pipeline/synthetic/gates/scripts/tests` to that line would enforce them; workflows were
   out of scope here.
2. **A — attribution within a sentence.** Every unit named in a sentence bounded by `.;!?`
   is attributed. "elf-b16-003 is clean, cross-batch echo, disposition owed" (comma, colon or
   em-dash) still binds elf-b16-003. A colon cannot be a boundary, because
   `disposition owed: elf-b16-001` is the canonical authoring form. The remaining guard is
   the authoring rule: name the owed units in the marker's own clause.
3. **A — batch16 `ASSEMBLY.md` line 48** now needs the clause to name its units before it
   can be discharged at all (A.1). That is an `ASSEMBLY.md` edit, which is batch content.
4. **D — matching is on keys only.** A value-level leak, such as option text "A (correct)",
   is not detected. Homoglyph keys (a Cyrillic "а" in "аnswer") evade NFKD. A synonym
   outside the stems and words (e.g. "rightOption") passes; extend the lists with a
   bank-wide run, never narrow them.
5. **E — one piece of evidence in two vote slots** is still counted as two ballots. The
   twin rule does not cover this case, and equality cannot detect it. batch1
   `verdicts.jsonl` has 8 such groups, and all of them are legitimate: content-free
   unanimous G-ENG/G-SPRAK/G-KEY votes (pass, no findings, same executor, no justification)
   in votes 1–3. A guard would need per-leg provenance, not content equality.
6. **Some unparseable inputs still crash instead of failing with a message.** This applies
   to sheet and candidate JSON in `check_sheet_sync.py`, a verdict line in
   `check_assembly_dispositions.py`, and an input line in `merge_verdicts.py`. Each still
   raises a traceback and exits 1. That fails closed, but without an explicit message.
   Not fail-open, so not in this round; a later hardening pass could give them the lint's
   `INPUT-FAIL` treatment.

## Reproduction

```
git rev-parse HEAD                    # d0265efec900ba366448ad3a3351dbe4b618bc50
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests
python3 -m pytest -q -p no:cacheprovider .github/contract-tests pipeline/synthetic/evidence/tests
python3 pipeline/synthetic/gates/scripts/check_assembly_dispositions.py \
    pipeline/synthetic/batches/batch16/ASSEMBLY.md pipeline/synthetic/batches/batch16/verdicts.jsonl
python3 pipeline/synthetic/gates/scripts/check_sheet_sync.py \
    pipeline/synthetic/batches/batch16 pipeline/synthetic/batches/batch17
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations
# head copies for the comparisons; verify each: git hash-object <copy> == git rev-parse d0265ef:<path>
mkdir -p /tmp/head/scripts
for f in check_assembly_dispositions lint_learner_output check_sheet_sync merge_verdicts; do
  git show d0265ef:pipeline/synthetic/gates/scripts/$f.py > /tmp/head/scripts/$f.py; done
python3 merge_regression_r2.py "$PWD" /tmp/head/scripts/merge_verdicts.py   # appendix A
python3 probe_compare.py "$PWD" /tmp/head/scripts                           # appendix B
python3 repro_cli.py "$PWD" /tmp/head/scripts /tmp/repro-work               # appendix C
```

### Appendix A — `merge_regression_r2.py` (the replay, run from a scratch dir)

```python
"""Merge regression replay for bead hpf-oy2w: d0265ef merge_verdicts.py vs the fix.

The hpf-qo10 replay (docs/worklog/hpf-qo10.md appendix A) re-run with OLD =
the d0265ef copy (verified by blob hash) and NEW = the lane module. Both
return (records, MergeStats). The fix only adds a refusal (a same-IDENTITY
raw/stamped pair that differs beyond `vote`), so on real inputs every output
must be identical in records, order and counters. Read-only; prints a report.

usage: merge_regression_r2.py <lane-root> <old-merge-module-path>
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
OLD_PATH = Path(sys.argv[2])
SCRIPTS = LANE / "pipeline/synthetic/gates/scripts"
BATCHES = LANE / "pipeline/synthetic/batches"


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod  # @dataclass resolves its module via sys.modules
    spec.loader.exec_module(mod)
    return mod


OLD = _load("merge_old", OLD_PATH)
NEW = _load("merge_new", SCRIPTS / "merge_verdicts.py")

# input lists exactly as in the hpf-qo10 driver (pipeline order of the legs)
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


def load(fp: Path) -> list[dict]:
    return [json.loads(l) for l in fp.read_text(encoding="utf-8").splitlines() if l.strip()]


def run(mod, files):
    try:
        recs, st = mod.merge(files)
        return recs, (st.superseded, st.duplicates, st.twins), None
    except Exception as exc:  # noqa: BLE001
        return None, None, f"{type(exc).__name__}: {exc}"


def strip_twins(records):
    def ident(v):
        return (v.get("candidate_id"), v.get("gate"), v.get("target"), v.get("executed_by"),
                v.get("justification"), v.get("run"))
    stamped = {ident(v) for v in records if v.get("vote") is not None}
    return [v for v in records if not (v.get("vote") is None and ident(v) in stamped)]


TALLY = {"identical": 0, "both refused alike": 0, "NEW-only refusal": 0, "DIFFERENT": 0}


def compare(label, files, committed=None, expect_twins=None, quiet=False):
    old, old_st, old_err = run(OLD, files)
    new, new_st, new_err = run(NEW, files)
    if old_err or new_err:
        # identical messages only: a NEW twin refusal ("not a twin") must not
        # hide behind an OLD same-file refusal of the same exception class
        if old_err and new_err and old_err == new_err:
            TALLY["both refused alike"] += 1
            if not quiet:
                print(f"  {label}: both refuse ({new_err[:160]})")
            return
        key = "NEW-only refusal" if new_err and not old_err else "DIFFERENT"
        TALLY[key] += 1
        print(f"  {label}: {key}\n    OLD: {old_err or 'ok'}\n    NEW: {new_err or 'ok'}")
        return
    same_recs = [canon(v) for v in old] == [canon(v) for v in new]
    same_stats = old_st == new_st
    ok = same_recs and same_stats
    TALLY["identical" if ok else "DIFFERENT"] += 1
    if quiet and ok:
        return
    line = (f"  {label}: {len(files)} input(s) -> {len(new)} records; "
            f"(superseded, duplicates, twins) OLD {old_st} NEW {new_st}; "
            f"records+order identical: {same_recs}")
    if committed is not None:
        line += (f"; NEW == committed verdicts.jsonl minus its unstamped twins "
                 f"({len(committed)}): {[canon(v) for v in new] == [canon(v) for v in committed]}")
    if expect_twins is not None:
        line += f"; twins == {expect_twins}: {new_st[2] == expect_twins}"
    print(line)


def main() -> int:
    b16, b17 = BATCHES / "batch16", BATCHES / "batch17"
    c16 = strip_twins(load(b16 / "verdicts.jsonl"))
    c17 = strip_twins(load(b17 / "verdicts.jsonl"))
    print("=== hpf-qo10 scenarios")
    compare("batch16 fleet + r3 repairs", [b16 / r for r in B16_FLEET + B16_R3], c16, 7)
    compare("batch16 committed + r3 re-applied", [b16 / r for r in ["verdicts.jsonl"] + B16_R3],
            c16, 14)
    compare("batch17 fleet + r2 + agardom + agardom2",
            [b17 / r for r in B17_FLEET + B17_R2 + B17_AGARDOM + B17_AGARDOM2], c17, 7)
    compare("batch17 fleet + r2 + agardom2",
            [b17 / r for r in B17_FLEET + B17_R2 + B17_AGARDOM2], c17, 7)
    compare("batch17 committed + r2/agardom2 re-applied",
            [b17 / r for r in ["verdicts.jsonl"] + B17_R2 + B17_AGARDOM2], c17, 14)
    for b in (b16, b17):
        compare(f"{b.name}/verdicts.jsonl alone", [b / "verdicts.jsonl"], None, 7)

    print("\n=== every committed merged file, merged alone")
    merged = sorted(BATCHES.glob("batch*/verdicts*.jsonl"),
                    key=lambda p: (int(p.parent.name[5:]), p.name))
    for fp in merged:
        compare(f"{fp.parent.name}/{fp.name}", [fp], quiet=True)
    print(f"  {len(merged)} files; tally so far {TALLY}")

    print("\n=== every leg file, merged alone")
    legs = sorted(BATCHES.glob("batch*/verdicts*/*.jsonl"),
                  key=lambda p: (int(p.parts[-3][5:]), p.parent.name, p.name))
    before = dict(TALLY)
    for fp in legs:
        compare(str(fp.relative_to(BATCHES)), [fp], quiet=True)
    print(f"  {len(legs)} files; delta {{{', '.join(f'{k}: {TALLY[k] - before[k]}' for k in TALLY)}}}")

    print("\n=== twin stress: every verdicts*/ directory pooled (all its files, name order),"
          " and every batch pooled whole (merged files first, then leg dirs)")
    before = dict(TALLY)
    pools = 0
    for d in sorted({p.parent for p in legs}, key=lambda p: (int(p.parent.name[5:]), p.name)):
        compare(str(d.relative_to(BATCHES)) + "/*", sorted(d.glob("*.jsonl")), quiet=True)
        pools += 1
    for b in sorted({p.parents[1] for p in legs}, key=lambda p: int(p.name[5:])):
        files = sorted(b.glob("verdicts*.jsonl")) + sorted(b.glob("verdicts*/*.jsonl"))
        compare(f"{b.name} whole pool ({len(files)} files)", files, quiet=True)
        pools += 1
    print(f"  {pools} pools; delta {{{', '.join(f'{k}: {TALLY[k] - before[k]}' for k in TALLY)}}}")

    print(f"\nTOTAL {TALLY}")
    return 0 if TALLY["DIFFERENT"] == 0 and TALLY["NEW-only refusal"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
```

Its output (exit 0):

```
=== hpf-qo10 scenarios
  batch16 fleet + r3 repairs: 19 input(s) -> 150 records; (superseded, duplicates, twins) OLD (24, 0, 7) NEW (24, 0, 7); records+order identical: True; NEW == committed verdicts.jsonl minus its unstamped twins (150): True; twins == 7: True
  batch16 committed + r3 re-applied: 8 input(s) -> 150 records; (superseded, duplicates, twins) OLD (0, 31, 14) NEW (0, 31, 14); records+order identical: True; NEW == committed verdicts.jsonl minus its unstamped twins (150): True; twins == 14: True
  batch17 fleet + r2 + agardom + agardom2: 28 input(s) -> 149 records; (superseded, duplicates, twins) OLD (34, 0, 7) NEW (34, 0, 7); records+order identical: True; NEW == committed verdicts.jsonl minus its unstamped twins (149): True; twins == 7: True
  batch17 fleet + r2 + agardom2: 23 input(s) -> 149 records; (superseded, duplicates, twins) OLD (23, 0, 7) NEW (23, 0, 7); records+order identical: True; NEW == committed verdicts.jsonl minus its unstamped twins (149): True; twins == 7: True
  batch17 committed + r2/agardom2 re-applied: 12 input(s) -> 149 records; (superseded, duplicates, twins) OLD (0, 29, 14) NEW (0, 29, 14); records+order identical: True; NEW == committed verdicts.jsonl minus its unstamped twins (149): True; twins == 14: True
  batch16/verdicts.jsonl alone: 1 input(s) -> 150 records; (superseded, duplicates, twins) OLD (0, 0, 7) NEW (0, 0, 7); records+order identical: True; twins == 7: True
  batch17/verdicts.jsonl alone: 1 input(s) -> 149 records; (superseded, duplicates, twins) OLD (0, 0, 7) NEW (0, 0, 7); records+order identical: True; twins == 7: True

=== every committed merged file, merged alone
  21 files; tally so far {'identical': 28, 'both refused alike': 0, 'NEW-only refusal': 0, 'DIFFERENT': 0}

=== every leg file, merged alone
  438 files; delta {identical: 358, both refused alike: 80, NEW-only refusal: 0, DIFFERENT: 0}

=== twin stress: every verdicts*/ directory pooled (all its files, name order), and every batch pooled whole (merged files first, then leg dirs)
  63 pools; delta {identical: 32, both refused alike: 31, NEW-only refusal: 0, DIFFERENT: 0}

TOTAL {'identical': 418, 'both refused alike': 111, 'NEW-only refusal': 0, 'DIFFERENT': 0}
```

### Appendix B — `probe_compare.py` (head vs fix: lint, sheet-sync, sheet keys, assembly)

```python
"""Real-corpus probes for bead hpf-oy2w: head (d0265ef copies) vs the lane fix.

Read-only over the repo; prints a report.
usage: probe_compare.py <lane-root> <head-scripts-dir>
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
HEAD = Path(sys.argv[2])
FIX = LANE / "pipeline/synthetic/gates/scripts"
BATCHES = LANE / "pipeline/synthetic/batches"


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def cli(script_dir: Path, script: str, *args) -> tuple[int, str]:
    r = subprocess.run([sys.executable, str(script_dir / script), *map(str, args)],
                       capture_output=True, text=True, cwd=LANE)
    return r.returncode, r.stdout + r.stderr


def same(label, a, b):
    ok = a == b
    print(f"  {label}: {'IDENTICAL' if ok else 'DIFFERENT'} (head exit {a[0]}, fix exit {b[0]})")
    if not ok:
        print("    --- head ---\n    " + a[1].replace("\n", "\n    "))
        print("    --- fix ---\n    " + b[1].replace("\n", "\n    "))
    return ok


def batch_key(p: Path) -> int:
    return int(p.name[5:]) if p.name[5:].isdigit() else 999


print("=== lint_learner_output.py on data/explanations (store path from LAYER2-RENDERING.md)")
for mode in ([], ["--strict"]):
    a = cli(HEAD, "lint_learner_output.py", *mode, "data/explanations")
    b = cli(FIX, "lint_learner_output.py", *mode, "data/explanations")
    same(f"default" if not mode else "--strict", a, b)
    print(f"    fix summary: {b[1].strip().splitlines()[-1]}")

print("\n=== check_sheet_sync.py --allow-missing-dirs, every batch, head vs fix")
batches = sorted((p for p in BATCHES.glob("batch*") if p.is_dir()), key=batch_key)
diffs = 0
for b in batches:
    a = cli(HEAD, "check_sheet_sync.py", "--allow-missing-dirs", b)
    f = cli(FIX, "check_sheet_sync.py", "--allow-missing-dirs", b)
    if a != f:
        diffs += 1
        same(b.name, a, f)
    else:
        last = f[1].strip().splitlines()[-1]
        print(f"  {b.name}: IDENTICAL (exit {f[0]}): {last}")
print(f"  batches differing head vs fix: {diffs}")
for b in ("batch16", "batch17"):
    same(f"{b} strict (no --allow-missing-dirs)",
         cli(HEAD, "check_sheet_sync.py", BATCHES / b), cli(FIX, "check_sheet_sync.py", BATCHES / b))

print("\n=== forbidden-key walk over EVERY real sheet file (incl. -round1 dirs, which the gate"
      " does not read), by sheet kind")
head_ss = _load("sheet_head", HEAD / "check_sheet_sync.py")
fix_ss = _load("sheet_fix", FIX / "check_sheet_sync.py")
counts = {}
for d in sorted(BATCHES.glob("batch*/*")):
    kind = d.name.split("-")[0]
    if not d.is_dir() or kind not in fix_ss.SHEETS:
        continue
    for fp in sorted(d.glob("*.json")):
        obj = json.loads(fp.read_text(encoding="utf-8"))
        h = head_ss._walk_forbidden(obj, head_ss.FORBIDDEN[kind])
        x = fix_ss._walk_forbidden(obj, kind)
        counts.setdefault(d.name, [0, 0, 0])
        counts[d.name][0] += 1
        counts[d.name][1] += bool(h)
        counts[d.name][2] += len(x)
        if h or x:
            print(f"  HIT {fp.relative_to(BATCHES)}: head={h!r} fix={x!r}")
for name, (n, h, x) in sorted(counts.items()):
    print(f"  {name:20} files={n:<4} head files-with-hit={h}  fix hits={x}")

print("\n=== check_assembly_dispositions.py, every ASSEMBLY.md with its batch verdicts.jsonl")
for asm in sorted(BATCHES.glob("batch*/ASSEMBLY.md"), key=lambda p: batch_key(p.parent)):
    v = asm.parent / "verdicts.jsonl"
    same(asm.parent.name, cli(HEAD, "check_assembly_dispositions.py", asm, v),
         cli(FIX, "check_assembly_dispositions.py", asm, v))
```

Its result: lint default and `--strict` IDENTICAL; 17/17 batches IDENTICAL under
`--allow-missing-dirs`; batch16 and batch17 strict IDENTICAL; sheet-key walk `blind-round1`
14 / `distractor-round1` 14 / `stems` 44 / `stems-round1` 14 files with 0 head and 0 fix
hits; assembly batch15 and batch17 IDENTICAL, batch16 DIFFERENT as shown above.

### Appendix C — `repro_cli.py` (the five review repros, head vs fix)

```python
"""CLI before/after for the five hpf-3uon repros: head (d0265ef copies) vs lane fix.

usage: repro_cli.py <lane-root> <head-scripts-dir> <work-dir>
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

LANE, HEAD, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
FIX = LANE / "pipeline/synthetic/gates/scripts"
if WORK.exists():
    shutil.rmtree(WORK)
WORK.mkdir(parents=True)


def show(title, script, *args):
    print(f"\n### {title}")
    for label, d in (("head d0265ef", HEAD), ("fix", FIX)):
        r = subprocess.run([sys.executable, str(d / script), *map(str, args)],
                           capture_output=True, text=True)
        out = (r.stdout + r.stderr).strip().replace(str(WORK) + "/", "")
        if "Traceback" in out:
            out = out.splitlines()[-1] + "   [Python traceback]"
        print(f"{label} (exit {r.returncode}):")
        for line in out.splitlines():
            print(f"    {line[:300]}")


# A
asm = WORK / "ASSEMBLY.md"
asm.write_text("- elf-b16-003 is clean. cross-batch echo; disposition owed.\n", encoding="utf-8")
v = WORK / "v.jsonl"
v.write_text(json.dumps({"candidate_id": "elf-b16-003", "gate": "G-REGISTER", "verdict": "pass",
                         "findings": [], "disposition": "different roles, different batches, "
                                                        "no same-test collision"}) + "\n",
             encoding="utf-8")
show("A  check_assembly_dispositions.py: '- elf-b16-003 is clean. cross-batch echo; "
     "disposition owed.' + elf-b16-003 disposed", "check_assembly_dispositions.py", asm, v)

# B
empty = WORK / "empty-store"
empty.mkdir()
show("B  lint_learner_output.py on an empty directory", "lint_learner_output.py", empty)

# C
bad = WORK / "broken.json"
bad.write_text('{"a": "B vänder på riktningen", ', encoding="utf-8")
show("C  lint_learner_output.py on a truncated .json", "lint_learner_output.py", bad)

# D
b = WORK / "batchX"
opts = [{"letter": "A", "text": "ett"}, {"letter": "B", "text": "två"}]
unit = {"candidate_id": "las-b99-001", "passage": "P text.",
        "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A", "options": opts}]}
sheets = {"blind": {"candidate_id": "las-b99-001", "passage": "P text.", "correctAnswer": "A",
                    "questions": [{"q_index": 1, "prompt": "Fråga?", "options": opts}]},
          "stems": {"candidate_id": "las-b99-001",
                    "questions": [{"q_index": 1, "prompt": "Fråga?", "options": opts}]},
          "distractor": {"candidate_id": "las-b99-001", "passage": "P text.",
                         "questions": [{"q_index": 1, "prompt": "Fråga?", "key": "A",
                                        "options": opts}]}}
(b / "candidates-final").mkdir(parents=True)
(b / "candidates-final" / "las-b99-001.json").write_text(json.dumps(unit, ensure_ascii=False),
                                                         encoding="utf-8")
for name, obj in sheets.items():
    (b / name).mkdir()
    (b / name / "las-b99-001.json").write_text(json.dumps(obj, ensure_ascii=False),
                                               encoding="utf-8")
show("D  check_sheet_sync.py: blind sheet carrying correctAnswer: \"A\"", "check_sheet_sync.py", b)

# E
rec = {"candidate_id": "elf-b99-001", "gate": "G-KEY", "target": "q:1", "verdict": "pass",
       "findings": [], "executed_by": "model/G-KEY", "justification": "leg 2: A"}
st = WORK / "gkey-2v.jsonl"
st.write_text(json.dumps(dict(rec, vote=2)) + "\n", encoding="utf-8")
raw = WORK / "gkey-2.jsonl"
raw.write_text(json.dumps(dict(rec, verdict="kill")) + "\n", encoding="utf-8")
show("E  merge_verdicts.py: stamped pass (vote=2) + unstamped kill, same identity",
     "merge_verdicts.py", st, raw, "--out", WORK / "merged.jsonl")
```

# hpf-6fkm — PR #370 fix round 5: verdict enum validation in merge; label vocabulary in the Layer-2 lint

Origin: Codex exact-head review R5 hpf-4te8 (VERDICT: HOLD at 16b88ed) of PR #370 (pipeline
hardening, origin bead hpf-y1p4). This round closes its two [PRE-EXISTING] findings; rounds 1–4
(hpf-qo10, hpf-oy2w, hpf-96rj, hpf-wu46) are not reworked. Lane
`/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`, `git rev-parse HEAD` =
`16b88edfb708d660aba9a4280e83acc434398c4e` (verified first, in both sessions). All changes are
UNCOMMITTED. The work ran in two sessions: the first wrote the red-first tests and the surveys
and handed off at a clean seam (decisions D1–D7 below); the second implemented and verified.

## Outcome

- **Finding 1 (merge, high): closed.** Every record's `verdict` and `gate` must be exactly one of
  the enum values in `gates/schemas/verdict.schema.json`. The enums are read from the schema at
  import, never copied. Each record is checked per line, before any merge rule can replace, fold
  or collapse it. Anything else raises `MergeContractError` naming `<file>:<line>`. The review
  repro now fails closed: `regate.jsonl:1: verdict must be exactly one of flag, kill, pass
  (verdict.schema.json), got 'not-a-verdict'`.
- **Finding 2 (lint, medium): closed.** Tier 1 folds case, diacritics and underscores on both
  the token and the vocabulary. The vocabulary now holds every snake_case label found in eight
  label sources (116 distinct labels). A coverage test scans those sources and fails on any
  label that default mode lets through. All four review labels flag. The math-preservation
  guards hold.
- **Tests.** The final round-5 file has 96 tests: on head 16b88ed, 65 fail and 31 guards pass;
  on the lane, 96 pass. Gate suite: 414 passed (baseline 318 + 96). Exact CI command: 484 passed
  (baseline 388 + 96).
- **Merge replay** over the real batch16/17 inputs and the whole verdict corpus: identical
  records, order and counters, 0 differences, 0 new refusals.
- **Store probe** (`data/explanations`, the LAYER2-RENDERING.md store): 0 new default-mode
  findings. Default mode still gives the same 2 L2-HEDGAT findings and `--strict` the same 74.

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `pipeline/synthetic/gates/scripts/merge_verdicts.py` | schema enums; per-line validation; file:line | `631f0aab553c5b385d840e77da2fc02aa799ae97487857c11a741a5a64c2badb` | `941265e` |
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | `_fold`; `_TAXONOMY_LABELS`; tier 1 on folded tokens | `0720b74aa2704766e900f614f765716097522002fa931bf693ef0f2feb23ab02` | `44bea2a` |
| `pipeline/synthetic/gates/scripts/tests/test_verdict_enum_and_label_vocabulary_round5.py` | new, 96 tests | `0890b2ec58b1083c4f33152cb2976cea342ba0697e415e459a8ca098709a8bef` | `93c661f` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | new section "Etikettvokabulär (PR #370 rond 5, bead hpf-6fkm)" | `d16af364ee7355e9d2e8d9ad4bd7c87eb8e3e99e4d7ab4427aab93a21cc0cd34` | `f5dcd79` |
| `pipeline/synthetic/BATCH-RUNBOOK.md` | one sentence in "Repair re-gates must flow into the batch merge" | `22a1e4695e7c3fcb8163b85a52e4b692532498b589fa5d7d1d40dd79098f04d6` | `3710985` |
| `docs/worklog/hpf-6fkm.md` | this file | — | — |

No batch content, verdict file, `data/`, `app/` or `worker/` file was touched. The untracked
sandbox dotfiles and `.claude/skills/*`, `.agents/`, `.codex/`, `.gc/` were already there and
are left alone.

---

## Finding 1 — `merge_verdicts.py`

### The fix

- `SCHEMA_PATH` = `gates/schemas/verdict.schema.json`, resolved from the script's own location.
  `VERDICTS` and `GATES` are frozensets built by `schema_enum(schema, prop)` from
  `properties.verdict.enum` and `properties.gate.enum`. If a property, its enum, or a non-empty
  list of non-empty strings is missing, `schema_enum` raises `RuntimeError` at import. The merge
  stops rather than admitting every value.
- `merge()` passes `f"{fp}:{n}"` to `_validate`, where `n` is the physical line number with
  blank lines counted. Every validation refusal therefore names the file and line.
- `_validate` refuses, in this order:
  1. a record that is not a JSON object;
  2. the existing identity checks;
  3. a `gate` not in `GATES`;
  4. a `verdict` that is missing or not a `str`, checked before membership because a list or
     dict is unhashable;
  5. a `verdict` not in `VERDICTS`.

  The existing executed_by/justification and positive-integer `vote`/`run` checks follow
  unchanged.
- An unparseable line is now `MergeContractError: <file>:<line>: not valid JSON (…)` instead of
  a `JSONDecodeError` traceback. This is D9.
- Matching is exact: no case folding, no stripping. `PASS`, `" pass"`, `"pass\n"`, `G-key`,
  `"G-STEM "` and `G-SPRÅK` are all refused.

### Required schema fields: what is enforced and what is deliberately left

The schema requires `candidate_id`, `gate`, `target`, `verdict` and `findings`. aggregate.py
decides as follows:
- any `kill` under a lethal gate makes the unit DEAD;
- language-gate kills are counted;
- any `flag` makes it FLAGGED;
- every other verdict counts as a pass;
- a kill under a gate outside `LETHAL_GATES`/`LANGUAGE_GATES` is ignored.

| field | enforced now | why |
|---|---|---|
| `candidate_id` | non-empty string (round 1, unchanged) | identity |
| `gate` | non-empty string (round 1) **and in the schema enum (new)** | a kill under `"G-STEM "` was merged and then ignored by aggregation → SURVIVED_CLEAN (`test_kill_under_a_misspelt_gate_is_refused_not_ignored`) |
| `verdict` | **present, a `str`, in the schema enum (new)** | any non-kill/flag value counts as a pass; the review repro let `not-a-verdict` supersede a kill |
| `target` | non-empty string (round 1); **pattern `^(passage\|q:[0-9]+)$` deliberately NOT enforced** | 837 real records break it (see survey). A bad target cannot produce a pass: a pass under it misses the required `(gate, target, vote)` set (INCOMPLETE), a repair under it supersedes nothing, so the kill stays (DEAD), and kills and flags count whatever their target |
| `findings` | **deliberately NOT enforced** (presence or type) | No real record lacks it; 10 real G-KEY passes carry a string. aggregate.py reads `findings` only to report flags and a lone language-kill dissent. A missing value there raises `KeyError`, so no report is produced: fail closed, and a status never changes. The round-1 fixture `_v()` has no `findings`, so enforcing it would rework round 1 |

Also deliberately left:
- The schema's `additionalProperties: false`. Real records carry `justification` (726), `date`
  (403), `blind_classification`/`blind_pick` (307), `run` (39), `exemplars_used`/
  `comparative_note` (38) and `contamination_note` (6). None of them changes aggregation.
- The optional `solver_answer` enum. aggregate.py never reads it; gkey_resolve.py reads it
  upstream of the merge.

The guard `test_off_schema_target_and_findings_still_merge` pins what is left.

### Verdict-corpus survey (appendix D)

`batches/batch*/verdicts*.jsonl` and `verdicts*/*.jsonl` hold 459 files and 10,338 records,
with 0 unparseable lines.

- **Verdicts:** pass 9393, flag 894, kill 51. Every one is an enum value.
- **Gates:** all 12 values are schema gates.
- **Required fields:** none is ever missing.
- **Kills:** G-STEM 34, G-SPRAK 10, G-KEY 4, G-DISTRACTOR 2, G-REGISTER 1. M-* gates only pass.
- **Targets off the pattern (837):**
  - 699 `unit`: M-TELL 354, M-FORM 269, M-ECHO 33, and G-SPRAK 27 / G-ENG 14 / G-REGISTER 2
    unit-level re-gates;
  - 118 `q1`–`q5` in V-FINAL G-KEY legs;
  - 20 `q:` in `batch9/verdicts-vfinal/verdicts-gkey-1.jsonl`.
- **`findings`:** list 10,328, str 10 (G-KEY passes in 2 files, e.g.
  `batch14/verdicts-vfinal/verdicts-gkey-1.jsonl:37`).

So nothing real is refused, and the replay confirms it.

---

## Finding 2 — `lint_learner_output.py`

### Folding

`_fold(s)` takes `NFKD(s.casefold())` and drops combining marks and `_`. It applies to every
snake token and to every vocabulary entry. Tier 1 hits when a folded entry is a substring of
the folded token, so:
- `WORLD_KNOWLEDGE`, `World_Knowledge` and `plausible_World_Knowledge` hit the stem
  `worldknowledge`;
- `författarens_hållning` (`las/families.md:90`) hits the label `forfattarens_hallning`.

Tier 2 (`--strict`) is unchanged.

### Vocabulary

- `_TAXONOMY_STEMS` is unchanged: the 17 evasion stems, still pinned by the guard
  `test_tier1_stems_still_catch_their_evasions`.
- `_TAXONOMY_LABELS` lists 99 labels. Each comes verbatim from a source (checked:
  `vocab_provenance.py`, appendix C), and no two fold alike. They fall into these groups:
  - **Taxonomy labels, listed in full:**
    - LÄS trap tags (`question_taxonomy.py` TRAP_TAGS), 7;
    - LÄS question types (TYPE_RULES + FALLBACK), 9;
    - LÄS genres (`genre_classify.py` PRIORITY/MACRO), 4;
    - ELF trap tags (`build_families.py` TRAP_TAGS), 10.
  - **Gate classes and aggregation statuses**, 9.
  - **Review, sweep, audit, V-FINAL and adjudication statuses**, 16.
  - **Bank labels:** the minimal set not already caught by an entry above, 44.
- `_TIER1` is the set of folded stems and labels, 115 entries; `WORLD_KNOWLEDGE` folds onto
  its stem. The shortest entries are `hedg` and `swap` (4 characters).

### Label sources: `label_sources()` in the round-5 test

The test is the single definition of "label". `vocab_provenance.py` (appendix C) gives these
counts per source:

| source | how | labels | missed by head lint | missed by lane lint |
|---|---|---|---|---|
| gate schema enums | every `enum` string in `gates/schemas/*.json` | 2 | 2 | 0 |
| ALL_CAPS classes and statuses in pipeline docs | every ALL_CAPS snake token in every `*.md` under `pipeline/synthetic` (prompts, runbooks, batch ADJUDICATION/STATUS/LANGUAGE-/PEDAGOGY- notes, eval results), minus 4 code identifiers in `NOT_LABELS` | 21 | 20 | 0 |
| verdict label fields | `blind_classification` / `solver_answer` in verdict files | 5 | 5 | 0 |
| ALL_CAPS values in batch records | every JSON value under `batches/` (`*.json`, `*.jsonl`) that is one whole ALL_CAPS token | 18 | 18 | 0 |
| ALL_CAPS literals in gate code | string literals in `gates/scripts/*.py` (AST; not tests, not the lint itself) and quoted strings in `pipeline/*.js` that are one whole ALL_CAPS token | 11 | 11 | 0 |
| taxonomy definitions | AST of the six module-level definitions (TRAP_TAGS ×2, TYPE_RULES, FALLBACK, PRIORITY, MACRO) | 30 | 23 | 0 |
| candidate label fields | values under keys with a trap/traps/family/families/genre/format/preset/skeleton/derivation segment in `batches/*/candidates*/**/*.json` | 74 | 55 | 0 |
| candidate rationales | `questions[].rationale` in the same files | 46 | 34 | 0 |
| **all, distinct** | | **116** | **96** | **0** |

**D8 — why eight sources, not the six in the handoff.** After the handoff vocabulary went in,
I re-surveyed every ALL_CAPS snake token under `pipeline/synthetic` (126 distinct). The six
sources missed the review, sweep, audit and V-FINAL status vocabulary. `CONFIRMED_NOTES` alone
occurs 293 times in audits, reviews and ADJUDICATION.md, and it appears in candidate
`generator_meta` notes too. The others it missed:
- `BLOCKED_SHIP` and `NEEDS_REDESIGN`, enums in `run-batch.workflow.js`;
- `PUBLISH_READY`, `MINOR_EDITS`, `NEEDS_WORK` and `REJECT_LANGUAGE`, batch1's
  language-adjudication scale;
- `RESOLVED_WITH_REGRESSION` and `UNRESOLVED_MITIGATED`, audit recheck statuses;
- `NO_BEARER`, `BEARER_SAME_DOMAIN` and `BEARER_UNRELATED_FIELD`, the law-16 sweep results;
- `GODKÄNN_NOTED`.

The widened sources are structural, so a constant's NAME never counts as a label:
- docs carry prose, so they get an explicit `NOT_LABELS` set;
- record values must be a whole ALL_CAPS token, not ALL_CAPS inside prose;
- code contributes literals, not identifiers.

`NOT_LABELS` = `TRAP_TAGS`, `ECHO_NAME_STOP` (code constants named in `elf/families.md` and an
eval RESULT), `HP_PARSED_DIR` (an environment variable in `elf/corpus-analysis.md`) and
`CRAWL_UNKNOWN_ERROR` (a web crawler's error code quoted in originality notes).

**Boundary, deliberately not collected:** lowercase whole values outside the candidate bank
are tooling metadata, not taxonomy labels. Appendix E surveys them:
- law-16 sweep entity kinds: `invented_toponym`, `surname_or_toponym`, `person_full_name`;
- an adjudication-evidence naturalness rating: `minor_friction`;
- stage, field and tool names: `final_verify`, `originality_note`,
  `mojeek_exact_via_exa_fetch`.

They never enter the bank fields that rendering draws on, and `--strict` flags every one.

### Math preservation (unchanged contract)

- The contract examples (`v_r`, `a_n`, `b_m`, `K_2007`, `a_1`, `värde_B`, `antal_A`, `K_diff`)
  never flag in default mode.
- Neither do the 74 tier-2-shaped formula names in the store. That includes the ones a
  careless entry would hit first: `A_trap`, `total_area`, `F_shelf`.
- All 74 still flag under `--strict`, also through the CLI.

D7 holds: no entry is a bare word. `test_every_vocabulary_label_is_a_snake_label` pins it.

---

## Decisions

The first session made D1–D7, and they were kept. The second session added D8 and D9.

- **D1** — The merge reads `VERDICTS`/`GATES` from the schema at import and fails closed if an
  enum is unusable. Tests pin `merge_verdicts.VERDICTS`/`GATES` to the schema, and the schema's
  verdict enum to aggregate.py's `{"pass","kill","flag"}`.
- **D2** — Every refusal names `file:line` (physical line, blank lines counted).
- **D3** — `_validate` enforces `gate ∈ GATES`, and that `verdict` is present, a `str` and in
  `VERDICTS`, after the identity check.
- **D4** — The `target` pattern and `findings` presence/type are not enforced (table above).
- **D5** — Folding is `NFKD(casefold)`, dropping combining marks and `_`, on the token and on
  the vocabulary.
- **D6** — The stems are unchanged. `_TAXONOMY_LABELS` is generated from `label_sources()`:
  canonical groups in full, bank labels as a minimal cover.
- **D7** — Never add a bare word (`trap` → `A_trap`, `stance` → `total_distance`).
- **D8** — The label sources were widened to eight (above).
- **D9** — A line that is not a JSON object (unparseable, array, string or null) is a
  `MergeContractError` naming file:line. This closes the merge part of hpf-oy2w residual 6.
  The schema loader is a public `schema_enum(schema, prop)`, so its fail-closed paths are
  testable.

---

## Red-first evidence

1. **Red run 1** came from the first session, on the 77-test file, while the lane scripts were
   still the 16b88ed blobs: **46 failed, 31 passed** (`red-head.xml`, SHA-256
   `572fe987…0b7a08`).
2. **Red run 2** used the final 96-test file on a **head tree**: a copy of the final lane's
   `pipeline/synthetic`, with `merge_verdicts.py` and `lint_learner_output.py` replaced by the
   16b88ed copies. Their blobs were verified with `git hash-object`: `03de6c6…` and
   `dbfbae7…`, equal to `git rev-parse 16b88ed:<path>`. Result: **65 failed, 31 passed**
   (`red-head-final.xml`, `c1cf89b3…`).
3. **Green on the lane:** **96 passed** (`green-final.xml`, `260973f2…`).
   `junit_summary.py red-head.xml green-final.xml` shows all 77 original tests ending PASS;
   the only tests not in the first red run are the 19 added afterwards.

In red run 2 every failure fails for its own reason:

| tests | count | head failure |
|---|---|---|
| review repro, 13 invalid verdicts, 4 merge-rule positions, 6 unknown gates, misspelt-gate kill | 25 | `DID NOT RAISE MergeContractError` |
| `test_existing_record_checks_name_the_line_too` | 1 | `Regex pattern did not match` (no `:line`) |
| `test_merge_reads_its_enums_from_the_verdict_schema` | 1 | `AttributeError: … no attribute 'VERDICTS'` |
| `test_cli_refuses_an_invalid_verdict_and_writes_nothing` | 1 | exit 0, `merge_verdicts: 11 record(s) … 1 superseded` |
| *added:* a line that is not a JSON object (truncated / array / string / null) | 4 | `JSONDecodeError` traceback; `AttributeError: 'list'/'str'/'NoneType' object has no attribute 'get'` |
| *added:* a schema without a usable enum | 7 | `AttributeError: … no attribute 'schema_enum'` |
| the four review labels through the CLI | 1 | exit 0, `learner-output lint: clean — 1 file(s)` |
| folding cases | 16 | `assert False` |
| *added:* review and audit statuses | 7 | `assert False` |
| *added:* every vocabulary label is a snake label | 1 | `AttributeError: … no attribute '_TAXONOMY_LABELS'` |
| corpus coverage | 1 | `96 label(s) the default-mode lint does not flag` |
| **total** | **65** | |

The 31 head passes are the guards:
- the fixture shape;
- the schema/aggregate pin;
- 3 schema verdicts and 12 schema gates merging;
- off-schema target and findings merging;
- 9 stem evasions;
- 4 math guards.

## Full suites (lane)

- `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` →
  **414 passed** (318 + 96).
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q`
  (the exact CI command) → **484 passed** (388 + 96).

The coverage test takes about 0.5 s, and the round-5 file about 0.7 s in all.

## CLI before/after — the two review repros (appendix F)

```
1  merge_verdicts.py  base G-STEM kill + later same-slot repair verdict 'not-a-verdict'
   head (exit 0): merge_verdicts: 11 record(s) (5 vote-bearing); 1 superseded by later input, 0 exact duplicate(s), 0 unstamped twin(s) collapsed -> merged-head.jsonl
        merged G-STEM verdicts: ['not-a-verdict']
   fix  (exit 1): merge_verdicts: MERGE CONTRACT VIOLATION — regate.jsonl:1: verdict must be exactly one of flag, kill, pass (verdict.schema.json), got 'not-a-verdict'
        no output written
2  lint_learner_output.py  the four review labels, default mode
   head (exit 0): learner-output lint: clean — 1 file(s)
   fix  (exit 1): L2-SNAKE expl.json:$.s0: …A är surface_lexical_echo på kalken.…
L2-SNAKE expl.json:$.s1: …itiv blindgissning (PARTIALLY/WORLD_KNOWLEDGE).…
L2-SNAKE expl.json:$.s2: …C is outside_knowledge: true in general, absent from…
L2-SNAKE expl.json:$.s3: …D är tone_misread — tonen är torr, inte ironisk…
learner-output lint: 4 finding(s) in 1 file(s)
```

## Merge regression replay (appendix A)

The hpf-oy2w replay was re-run with OLD = the 16b88ed copy (blob `03de6c6…`) and NEW = the
lane. One change: a refusal that both sides make for the same reason, differing only by NEW's
`:<line>`, would be counted in its own column. There were none.

| Scenario | inputs | records | (superseded, duplicates, twins), head = fix | fix vs committed − twins |
|---|---|---|---|---|
| batch16 fleet + r3 repairs | 19 | 150 | (24, 0, 7) | identical, same order |
| batch16 committed + r3 re-applied | 8 | 150 | (0, 31, 14) | identical, same order |
| batch17 fleet + r2 + agardom + agardom2 | 28 | 149 | (34, 0, 7) | identical, same order |
| batch17 fleet + r2 + agardom2 | 23 | 149 | (23, 0, 7) | identical, same order |
| batch17 committed + r2/agardom2 re-applied | 12 | 149 | (0, 29, 14) | identical, same order |
| batch16 `verdicts.jsonl` alone | 1 | 150 | (0, 0, 7) | — |
| batch17 `verdicts.jsonl` alone | 1 | 149 | (0, 0, 7) | — |

| Sweep | Count | Identical | Refused by both, byte-identical message | NEW adds `:line` only | NEW-only refusals |
|---|---|---|---|---|---|
| Committed merged files, each alone | 21 | 21 | 0 | 0 | 0 |
| Leg files, each alone | 438 | 358 | 80 (the hpf-qo10 same-file refusals) | 0 | 0 |
| Twin-stress pools | 63 | 32 | 31 | 0 | 0 |

Totals: `{'identical': 418, 'both refused alike': 111, 'both refused, NEW adds :line': 0,
'NEW-only refusal': 0, 'DIFFERENT': 0}`, exit 0. Every number equals the hpf-oy2w table, and
the 7 real 8b twins still collapse.

## Store probe (appendix B): `data/explanations`, the store LAYER2-RENDERING.md names

- 27 lintable files, 0 input failures.
- **Default:**
  - head: 2 findings, exit 1;
  - lane: the same 2 findings, exit 1.

  Both are the known L2-HEDGAT findings in `host-2017.json`:
  `host-2017-verb2-MEK-025.distractors[2].why_wrong` and `.steps[2].text`. Head and lane
  report the same findings, and neither has one the other lacks.
- **`--strict`:** head 74 = lane 74 (72 L2-SNAKE + 2 L2-HEDGAT), the same set.
- **Token inventory**, every snake_case occurrence in learner strings, not only the CLI's
  first per string:
  - 1,331 occurrences, 236 distinct tokens;
  - newly flagged in default mode: **0**;
  - flagged on head but not on the lane, in either mode: **0**.

**New default-mode findings: none.** `data/` was not edited.

---

## Residual risks, knowingly left

1. **Merge: `target` pattern, `findings`, `additionalProperties` and `solver_answer` are not
   enforced** (table above). None of them can turn a kill or a flag into a pass. A target
   typo makes the unit INCOMPLETE or leaves a kill standing; a missing `findings` on a flag
   crashes aggregate.py.
2. **Merge: some inputs still crash without a message.** A missing input path or a non-UTF-8
   input file raises a traceback (`FileNotFoundError` / `UnicodeDecodeError`). This is fail
   closed, but there is no message. It is the rest of hpf-oy2w residual 6; the JSON-line part
   is closed (D9).
3. **Merge: `splitlines()` also breaks on U+2028/U+2029, `\x0b`, `\x0c`, `\x1c`–`\x1e` and
   `\x85`.**
   - Pre-existing behaviour.
   - A JSON string carrying one of them raw, which JSON allows and
     `json.dumps(ensure_ascii=False)` writes, splits into invalid fragments. That fails closed
     (now as "not valid JSON") with a line number that counts the extra break.
   - No real verdict file is affected: 0 unparseable lines.
4. **Lint: matching is a substring of the folded token.** A future formula name that contains
   an entry would flag in default mode. That is a false positive in the safe direction: the
   import stops until the name is changed or the entry narrowed. The math guards pin today's
   74 store formula names.
5. **Lint: the token regex covers ASCII letters, digits and åäö/ÅÄÖ only** (pre-existing). A
   label written camelCase, hyphenated or with other letters (é, ü) is not a snake token, so
   neither tier sees it. Every label in use today is ASCII/åäö snake_case.
6. **Lint: a label truncated inside its last stem is not caught.** Examples are
   `WORLD_KNOWLE…` and `WORLD_KNOWLEDG…`, once each, as cut-off excerpts in
   `adjudication/flags.json`. The stems catch truncations that keep the stem.
7. **Lint: the label boundary** (D8). Lowercase tooling values outside the candidate bank are
   not collected; `--strict` flags them all. `NOT_LABELS` is kept by hand: when a doc mentions
   a new ALL_CAPS code identifier, the coverage test fails until someone classifies it. That is
   loud, never silent.
8. **The coverage test scans today's corpus.** A label that first appears in a future batch
   fails the test when that batch lands, by design. The gate suite runs in CI since round 4
   (hpf-wu46), so that failure is visible on the PR.
9. **Store: the 2 known L2-HEDGAT findings remain** in `host-2017-verb2-MEK-025`. They are
   pre-existing, and `data/` edits are out of scope.

## Reproduction

```
git rev-parse HEAD     # 16b88edfb708d660aba9a4280e83acc434398c4e
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 414 passed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 484 passed
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations        # exit 1: the 2 known L2-HEDGAT
# head copies (S = a scratch dir); verify: git hash-object <copy> == git rev-parse 16b88ed:<path>
for f in merge_verdicts lint_learner_output; do
  git show 16b88ed:pipeline/synthetic/gates/scripts/$f.py > $S/head/$f.py; done
# head tree for red run 2: the lane's pipeline/synthetic with the two head copies swapped in
cp -r pipeline/synthetic $S/headtree/pipeline/synthetic && cp $S/head/*.py $S/headtree/pipeline/synthetic/gates/scripts/
python3 -m pytest -q -p no:cacheprovider $S/headtree/pipeline/synthetic/gates/scripts/tests/test_verdict_enum_and_label_vocabulary_round5.py  # 65 failed, 31 passed
python3 merge_regression_r5.py "$PWD" $S/head/merge_verdicts.py                    # appendix A
python3 store_probe.py "$PWD" $S/head/lint_learner_output.py $S/store.txt          # appendix B
python3 vocab_provenance.py "$PWD" $S/head/lint_learner_output.py $S/prov.txt      # appendix C
python3 survey_verdicts_to_file.py "$PWD" $S/verdicts.txt                          # appendix D
python3 survey_values.py "$PWD" $S/values.txt                                      # appendix E
python3 repro_cli.py "$PWD" $S/headtree/pipeline/synthetic/gates/scripts $S/repro $S/repro.txt   # appendix F
```

Coordination note: the bead's metadata names `gc.check_path` =
`…/gascity/assets/scripts/checks/build-artifact-valid.sh` (SHA-256
`71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`). It is the dispatcher's
producer-stage gate, and the bead's description does not ask the worker to run it. It was read,
not run. It requires step metadata `gc.build.artifact_schema` and `gc.build.artifact_path_keys`,
which this bead does not carry, so a dispatcher run would stop with "step metadata … is
missing", not on anything in this lane.

Exploratory surveys, whose conclusions are encoded in `label_sources()`, are kept in the
session scratchpad and not reproduced here:

| script | SHA-256 |
|---|---|
| `survey_labels.py` | `d3ee29d6a47432cc43aa7d0f0a182f8e20ea4362cefecef1c0e2b5b5c7ec5fc7` |
| `survey_caps_md.py` | `d47a15a02e82ba290cff57ae467e36064b10b6086e4021259417ffc9e035dbb3` |
| `survey_status.py` | `e8aec64146cde378c3347d46c9d10cfbf6e542aeec46ba9d3f8dd539a70a5733` |
| `junit_summary.py` | `d3ad80e8e578b50d89cbf6301f3390aee4b006f9762629586d00727f01c2f990` |

## Appendices

### Appendix A — `merge_regression_r5.py` (SHA-256 `4a2162289a371a35ea774835e5af9b57061e374da136dbb092513e82935805e0`)

The replay is `docs/worklog/hpf-oy2w.md` appendix A (`merge_regression_r2.py`, extracted verbatim, SHA-256 `0892e256587c37b284ca5478d48360297a5259d012bb490c9c3072a23862c0f7`) with this diff applied.

```diff
--- merge_regression_r2.py
+++ merge_regression_r5.py
@@ -1,17 +1,20 @@
-"""Merge regression replay for bead hpf-oy2w: d0265ef merge_verdicts.py vs the fix.
+"""Merge regression replay for bead hpf-6fkm: 16b88ed merge_verdicts.py vs the fix.
 
-The hpf-qo10 replay (docs/worklog/hpf-qo10.md appendix A) re-run with OLD =
-the d0265ef copy (verified by blob hash) and NEW = the lane module. Both
-return (records, MergeStats). The fix only adds a refusal (a same-IDENTITY
-raw/stamped pair that differs beyond `vote`), so on real inputs every output
-must be identical in records, order and counters. Read-only; prints a report.
+The hpf-oy2w replay (docs/worklog/hpf-oy2w.md appendix A, itself the hpf-qo10
+replay) re-run with OLD = the 16b88ed copy (verified by blob hash) and NEW =
+the lane module. The fix only adds refusals (off-enum verdict or gate, a line
+that is no JSON object) and puts the line number into the validation
+refusals, so on real inputs every output must be identical in records, order
+and counters; a refusal both sides make for the same reason may differ only
+by NEW's ":<line>" and is counted apart. Read-only; prints a report.
 
-usage: merge_regression_r2.py <lane-root> <old-merge-module-path>
+usage: merge_regression_r5.py <lane-root> <old-merge-module-path>
 """
 from __future__ import annotations
 
 import importlib.util
 import json
+import re
 import sys
 from pathlib import Path
 
@@ -92,7 +95,13 @@
     return [v for v in records if not (v.get("vote") is None and ident(v) in stamped)]
 
 
-TALLY = {"identical": 0, "both refused alike": 0, "NEW-only refusal": 0, "DIFFERENT": 0}
+TALLY = {"identical": 0, "both refused alike": 0, "both refused, NEW adds :line": 0,
+         "NEW-only refusal": 0, "DIFFERENT": 0}
+
+
+def _without_line(msg: str) -> str:
+    # round 5 names the line in every validation refusal: "<file>:<n>: ..."
+    return re.sub(r"(\.jsonl?):\d+: ", r"\1: ", msg, count=1)
 
 
 def compare(label, files, committed=None, expect_twins=None, quiet=False):
@@ -105,6 +114,10 @@
             TALLY["both refused alike"] += 1
             if not quiet:
                 print(f"  {label}: both refuse ({new_err[:160]})")
+            return
+        if old_err and new_err and old_err == _without_line(new_err):
+            TALLY["both refused, NEW adds :line"] += 1
+            print(f"  {label}: both refuse, NEW names the line ({new_err[:160]})")
             return
         key = "NEW-only refusal" if new_err and not old_err else "DIFFERENT"
         TALLY[key] += 1
```

### Appendix B — `store_probe.py` (SHA-256 `9809a7ca1f563ff2c5383c0783150d5bee40778482d7a879ff712d2a0ccbd1eb`)

Head vs lane lint over `data/explanations`: cli findings in both modes, and every snake token's flags.

```python
"""Store probe for bead hpf-6fkm: head (16b88ed) lint vs the lane lint over the
learner store named in LAYER2-RENDERING.md (data/explanations).

Two views, both read-only:
  1. findings, exactly as the CLI computes them (collect + walk_json/scan_text),
     default and --strict, head vs lane: every finding only one side reports;
  2. token inventory: EVERY snake_case token occurrence in the store's learner
     strings (the CLI reports only the first match per string and rule), and
     for each distinct token whether tier 1 (default) / tier 2 (--strict)
     flags it on head and on the lane.

usage: store_probe.py <lane-root> <head-lint-path> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
HEAD_PATH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
STORE = LANE / "data/explanations"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


HEAD = _load("lint_head", HEAD_PATH)
NEW = _load("lint_new", LANE / "pipeline/synthetic/gates/scripts/lint_learner_output.py")


def findings(mod, strict: bool) -> list[tuple[str, str, str, str]]:
    mod.SNAKE.strict = strict
    files, failures = mod.collect([STORE])
    assert not failures, failures
    out = []
    for fp in files:
        text = fp.read_text(encoding="utf-8")
        hits: list[tuple[str, str, str]] = []
        if fp.suffix.lower() == ".json":
            mod.walk_json(json.loads(text), "$", hits)
        else:
            hits = [(r, "-", e) for r, e in mod.scan_text(text)]
        out += [(rule, fp.name, path, excerpt) for rule, path, excerpt in hits]
    mod.SNAKE.strict = False
    return out


def strings(obj, path):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not k.startswith("_"):          # the lint's own convention
                yield from strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


def main() -> int:
    files, failures = NEW.collect([STORE])
    print(f"store: {STORE.relative_to(LANE)} — {len(files)} lintable file(s), input failures: {failures}")

    print("\n=== 1. CLI findings, head vs lane")
    for strict in (False, True):
        h, n = findings(HEAD, strict), findings(NEW, strict)
        mode = "--strict" if strict else "default"
        print(f"{mode}: head {len(h)} finding(s), lane {len(n)} finding(s); "
              f"by rule head {dict(sorted(_count(h).items()))} lane {dict(sorted(_count(n).items()))}")
        for f in sorted(set(n) - set(h)):
            print(f"  ONLY LANE  {f[0]} {f[1]}:{f[2]}: …{f[3]}…")
        for f in sorted(set(h) - set(n)):
            print(f"  ONLY HEAD  {f[0]} {f[1]}:{f[2]}: …{f[3]}…")

    print("\n=== 2. token inventory (every snake_case occurrence in learner strings)")
    occ: dict[str, list[str]] = defaultdict(list)
    for fp in files:
        if fp.suffix.lower() != ".json":
            continue
        for path, s in strings(json.loads(fp.read_text(encoding="utf-8")), "$"):
            for m in NEW._SNAKE_TOKEN.finditer(s):
                occ[m.group(0)].append(f"{fp.name}:{path}")
    flags = {}
    for tok in occ:
        flags[tok] = tuple(bool(mod._Snake(strict=st).search(f"x {tok} y"))
                           for mod in (HEAD, NEW) for st in (False, True))
    print(f"{sum(map(len, occ.values()))} occurrence(s), {len(occ)} distinct token(s)")
    print("columns: head-default head-strict lane-default lane-strict")
    for tok in sorted(occ, key=str.casefold):
        hd, hs, nd, ns = flags[tok]
        mark = "NEW-DEFAULT" if nd and not hd else ("LOST-DEFAULT" if hd and not nd else "")
        print(f"  {'DS'[0] if hd else '-'}{'S' if hs else '-'} {'D' if nd else '-'}{'S' if ns else '-'} "
              f"{tok:40s} x{len(occ[tok]):<3d} {mark} {occ[tok][0]}")
    new_default = sorted(t for t, f in flags.items() if f[2] and not f[0])
    lost = sorted(t for t, f in flags.items() if (f[0] and not f[2]) or (f[1] and not f[3]))
    print(f"\ntokens newly flagged in default mode: {len(new_default)} {new_default}")
    print(f"tokens flagged on head but not on the lane (either mode): {len(lost)} {lost}")
    print("\nPYTHON-LIST of distinct store tokens:")
    print(repr(sorted(occ, key=str.casefold)))
    return 0


def _count(fs):
    c: dict[str, int] = defaultdict(int)
    for f in fs:
        c[f[0]] += 1
    return c


if __name__ == "__main__":
    raise SystemExit(main())
```

### Appendix C — `vocab_provenance.py` (SHA-256 `3fa0d2fc3737ef76ccfc94d8e884efa7cbd407b4f7f49bdd63994d4147e2ca1a`)

Per-source label counts, head vs lane misses, provenance of every vocabulary label.

```python
"""Vocabulary provenance and coverage for bead hpf-6fkm (read-only).

  * per label source (the round-5 test's label_sources()): labels found, and
    how many the head (16b88ed) lint and the lane lint miss in default mode;
  * every label the head lint misses, with its sources (the red message);
  * provenance: every lane _TAXONOMY_LABELS entry occurs verbatim in a source;
  * every tier-1 entry's folded form, shortest first.

usage: vocab_provenance.py <lane-root> <head-lint-path> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import sys
from collections import defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
HEAD_PATH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
TEST = LANE / "pipeline/synthetic/gates/scripts/tests/test_verdict_enum_and_label_vocabulary_round5.py"


def print(*a, **k):  # noqa: A001
    builtins.print(*a, **k, file=REPORT)


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


t = _load("round5", TEST)
head = _load("lint_head", HEAD_PATH)
lane = t.lint


def flags(mod, tok):
    return mod._Snake().search(f"Låt {tok} vara här.") is not None


src = t.label_sources()
print("=== per source: labels, missed by head lint, missed by lane lint")
for name in t.LABEL_SOURCES:
    labels = src.get(name, {})
    print(f"  {name:48s} {len(labels):4d}  head-miss {sum(not flags(head, l) for l in labels):3d}"
          f"  lane-miss {sum(not flags(lane, l) for l in labels):3d}")
alls = {l for s in src.values() for l in s}
print(f"  {'ALL (distinct)':48s} {len(alls):4d}  head-miss {sum(not flags(head, l) for l in alls):3d}"
      f"  lane-miss {sum(not flags(lane, l) for l in alls):3d}")

print("\n=== labels the head lint misses (and their sources)")
by = defaultdict(set)
for name, labels in src.items():
    for l in labels:
        by[l].add(name)
for l in sorted(by, key=str.casefold):
    if not flags(head, l):
        print(f"  {l:36s} {sorted(by[l])}")

print("\n=== provenance of the lane vocabulary")
orphans = [x for x in lane._TAXONOMY_LABELS if x not in alls]
print(f"  {len(lane._TAXONOMY_LABELS)} labels listed, {len(set(lane._TAXONOMY_LABELS))} distinct; "
      f"not found verbatim in any source: {orphans}")
dups = sorted({lane._fold(x) for x in lane._TAXONOMY_LABELS
               if [lane._fold(y) for y in lane._TAXONOMY_LABELS].count(lane._fold(x)) > 1})
print(f"  folded duplicates: {dups}")
print(f"  tier-1 entries: {len(lane._TIER1)} (stems {len(lane._TAXONOMY_STEMS)} + labels)")

print("\n=== tier-1 entries, folded, shortest first (first 15)")
for e in sorted(lane._TIER1, key=lambda x: (len(x), x))[:15]:
    print(f"  {len(e):2d} {e}")
```

### Appendix D — `survey_verdicts_to_file.py` (SHA-256 `3f1ae5e24ed7c8c731b1aeb268bbd9ec576a82d8f64fc196fb5c24fbc586173c`)

The verdict-corpus survey behind the enforced/left table.

```python
"""Survey every real verdict record: which values do the schema-REQUIRED fields
(candidate_id, gate, target, verdict, findings) actually carry?  Read-only.

usage: survey_verdicts_to_file.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


BATCHES = LANE / "pipeline/synthetic/batches"
SCHEMA = json.loads((LANE / "pipeline/synthetic/gates/schemas/verdict.schema.json")
                    .read_text(encoding="utf-8"))
VERDICTS = SCHEMA["properties"]["verdict"]["enum"]
GATES = SCHEMA["properties"]["gate"]["enum"]
TARGET = re.compile(SCHEMA["properties"]["target"]["pattern"])
PROPS = set(SCHEMA["properties"])

files = sorted(set(BATCHES.glob("batch*/verdicts*.jsonl"))
               | set(BATCHES.glob("batch*/verdicts*/*.jsonl")))
print(f"verdict files: {len(files)}")
n = bad_json = 0
verdict_vals: Counter = Counter()
gate_vals: Counter = Counter()
target_vals: Counter = Counter()
findings_kinds: Counter = Counter()
extra_keys: Counter = Counter()
missing: Counter = Counter()
where = defaultdict(list)
by_gate: Counter = Counter()
for fp in files:
    for i, line in enumerate(fp.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            v = json.loads(line)
        except json.JSONDecodeError:
            bad_json += 1
            continue
        n += 1
        if not isinstance(v, dict):
            missing["<not an object>"] += 1
            continue
        for req in SCHEMA["required"]:
            if req not in v:
                missing[req] += 1
                where[f"missing {req}"].append(f"{fp.relative_to(BATCHES)}:{i}")
        verdict_vals[repr(v.get("verdict", "<absent>"))] += 1
        if v.get("verdict") not in VERDICTS:
            where[f"verdict {v.get('verdict')!r}"].append(f"{fp.relative_to(BATCHES)}:{i}")
        gate_vals[repr(v.get("gate"))] += 1
        if v.get("gate") not in GATES:
            where[f"gate {v.get('gate')!r}"].append(f"{fp.relative_to(BATCHES)}:{i}")
        t = v.get("target")
        target_vals["schema-pattern" if isinstance(t, str) and TARGET.match(t) else repr(t)] += 1
        if not (isinstance(t, str) and TARGET.match(t)):
            where[f"target {t!r} ({v.get('gate')}, verdict={v.get('verdict')})"].append(
                f"{fp.relative_to(BATCHES)}:{i}")
        f = v.get("findings", "<absent>")
        findings_kinds[type(f).__name__ if f != "<absent>" else "<absent>"] += 1
        if not isinstance(f, list):
            where[f"findings {type(f).__name__} (verdict={v.get('verdict')})"].append(
                f"{fp.relative_to(BATCHES)}:{i}")
        by_gate[(v.get("gate"), v.get("verdict"))] += 1
        for k in v:
            if k not in PROPS:
                extra_keys[k] += 1

print(f"records: {n}  (unparseable lines: {bad_json})")
print(f"schema verdict enum: {VERDICTS}")
print(f"verdict values: {dict(verdict_vals)}")
print(f"gate values: {dict(gate_vals)}")
print(f"target values: {dict(target_vals)}")
print(f"findings kinds: {dict(findings_kinds)}")
print(f"missing required: {dict(missing)}")
print(f"keys outside the schema's properties: {dict(extra_keys)}")
for k, locs in sorted(where.items()):
    print(f"  {k}: {len(locs)} in {len({l.rsplit(':', 1)[0] for l in locs})} file(s) e.g. {locs[:3]}")
print("verdict by gate:")
for (g, verdict), c in sorted(by_gate.items()):
    print(f"  {g:13s} {verdict:5s} {c}")
```

### Appendix E — `survey_values.py` (SHA-256 `22eb8b739381b97a7ae09266b7a2636633d2f49f5744f149c716c46a74e962b9`)

Lowercase and all_caps whole values in batch records outside the candidate bank (the d8 boundary).

```python
"""Batch JSON/JSONL string values (outside candidates*/ and gen-*.json) that
are EXACTLY one label-shaped snake_case token of any case, per field path,
with the lane lint's default-mode verdict. Read-only.

usage: survey_values.py <lane-root> <report-path>
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
OUT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115
SYN = LANE / "pipeline/synthetic"
spec = importlib.util.spec_from_file_location("lint_lane", SYN / "gates/scripts/lint_learner_output.py")
lint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lint)


def shaped(t):
    return len(t) >= 5 and any(sum(c.isalpha() for c in s) >= 2 for s in t.split("_"))


found = defaultdict(set)


def walk(obj, path, where):
    if isinstance(obj, dict):
        for k, v in obj.items():
            walk(v, f"{path}.{re.sub(r'^(las|elf)-b[0-9]+-[0-9]+$', '<cid>', str(k))}", where)
    elif isinstance(obj, list):
        for v in obj:
            walk(v, f"{path}[]", where)
    elif isinstance(obj, str) and lint._SNAKE_TOKEN.fullmatch(obj) and shaped(obj):
        found[obj].add(f"{where} {path}")


for fp in sorted((SYN / "batches").rglob("*")):
    if not fp.is_file():
        continue
    rel = fp.relative_to(SYN / "batches")
    if rel.parts[1].startswith("candidates") or rel.name.startswith("gen-"):
        continue
    kind = "/".join(rel.parts[1:-1] + (re.sub(r"[0-9]", "#", rel.name),)) if len(rel.parts) > 2 else re.sub(r"[0-9]", "#", rel.name)
    if fp.suffix == ".json" or ".json.stale" in fp.name:
        walk(json.loads(fp.read_text(encoding="utf-8")), "$", re.sub(r"(las|elf)-b#+-#+", "<cid>", kind))
    elif fp.suffix == ".jsonl":
        for line in fp.read_text(encoding="utf-8").splitlines():
            if line.strip():
                walk(json.loads(line), "$", re.sub(r"(las|elf)-b#+-#+", "<cid>", kind))

print(f"{len(found)} distinct exact-token values", file=OUT)
for tok in sorted(found, key=str.casefold):
    flagged = lint._Snake().search(f"x {tok} y") is not None
    locs = sorted(found[tok])
    print(f"  {'flag' if flagged else 'MISS'} {tok:32s} {len(locs):3d} {locs[:3]}", file=OUT)
```

### Appendix F — `repro_cli.py` (SHA-256 `caa6538c9295ba24296497d9b26706e6f60ee276d693b7a429363d465bb3576b`)

The two review repros through the clis, head vs lane.

```python
"""The two R5 review repros through the CLIs, head (16b88ed copies) vs lane.

usage: repro_cli.py <lane-root> <head-scripts-dir> <work-dir> <report-path>
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

LANE, HEAD, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
REPORT = open(sys.argv[4], "w", encoding="utf-8")  # noqa: SIM115
NEW = LANE / "pipeline/synthetic/gates/scripts"
WORK.mkdir(parents=True, exist_ok=True)
CID = "elf-b99-001"


def rec(gate, target, *, vote=None, verdict="pass", by=None):
    d = {"candidate_id": CID, "gate": gate, "target": target, "verdict": verdict,
         "findings": [], "executed_by": by or f"model/{gate}"}
    if vote is not None:
        d["vote"] = vote
    return d


def write(name, records):
    p = WORK / name
    p.write_text("".join(json.dumps(r) + "\n" for r in records), encoding="utf-8")
    return p


def run(label, script_dir, script, *args):
    r = subprocess.run([sys.executable, str(script_dir / script), *map(str, args)],
                       capture_output=True, text=True)
    out = (r.stdout + r.stderr).strip().replace(str(WORK) + "/", "")
    print(f"   {label} (exit {r.returncode}): {out}", file=REPORT)


# 1. merge: base G-STEM kill + later same-slot repair with verdict "not-a-verdict"
unit = [rec(g, "passage") for g in ("M-SCHEMA", "M-BANDS", "M-PLAGIARISM", "G-REGISTER")]
unit += [rec("G-ENG", "passage", vote=n, by=f"model/G-ENG-{n}") for n in (1, 2, 3)]
unit += [rec("G-KEY", "q:1", vote=n, by=f"model/G-KEY-{n}") for n in (1, 2)]
unit += [rec("G-DISTRACTOR", "q:1"), rec("G-STEM", "q:1", verdict="kill", by="model/G-STEM-r1")]
base = write("verdicts.jsonl", unit)
regate = write("regate.jsonl", [rec("G-STEM", "q:1", verdict="not-a-verdict", by="model/G-STEM-r2")])
print("1  merge_verdicts.py  base G-STEM kill + later same-slot repair verdict 'not-a-verdict'",
      file=REPORT)
for label, d in (("head", HEAD), ("fix ", NEW)):
    out = WORK / f"merged-{label.strip()}.jsonl"
    run(label, d, "merge_verdicts.py", base, regate, "--out", out)
    if out.exists():
        recs = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines()]
        stem = [r["verdict"] for r in recs if r["gate"] == "G-STEM"]
        print(f"        merged G-STEM verdicts: {stem}", file=REPORT)
    else:
        print("        no output written", file=REPORT)

# 2. lint: the four review labels in learner text
expl = WORK / "expl.json"
expl.write_text(json.dumps({
    "s0": "A är surface_lexical_echo på kalken.",
    "s1": "Q3 bär en positiv blindgissning (PARTIALLY/WORLD_KNOWLEDGE).",
    "s2": "C is outside_knowledge: true in general, absent from the text.",
    "s3": "D är tone_misread — tonen är torr, inte ironisk."}, ensure_ascii=False), encoding="utf-8")
print("2  lint_learner_output.py  the four review labels, default mode", file=REPORT)
for label, d in (("head", HEAD), ("fix ", NEW)):
    run(label, d, "lint_learner_output.py", expl)
```

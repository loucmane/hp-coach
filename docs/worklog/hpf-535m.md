---
bead: "hpf-535m"
project: "hpfetcher"
session: "ci-9b796"
status: "implemented_uncommitted"
---

# Worklog — hpf-535m

P5 infold PR 1, the export contract: a ratified approval roster, a deterministic exporter and preview artifacts only. Spec: `docs/p5-infold-design.md` §4 row 1 with §2, §C and §F (owner-approved 2026-10-07, merged in PR #374).

## Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-535m`, assignee `gc__implementation-worker-ci-9b796`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-535m --json` matched id, status `in_progress`, assignee and `gc.routed_to`.
- `git rev-parse HEAD` and `git rev-parse origin/main` both returned `bed27524396778349a5d8e0b72cc0afd0ed7454d`; `git branch --show-current` printed nothing (detached). The untracked runtime/skill paths and dotfiles present at start are untouched.
- No git writes and no network. Nothing changed under `app/`, `worker/`, `data/explanations/` or `app/public/`, and nothing goes to R2. No candidate, ruling or registry file was edited. The only tracked change is one line of `.github/workflows/ci.yml`.
- The bead metadata `gc.check_path` names `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. This worker did not run it. It is the dispatcher's post-close producer check: it reads `GC_BEAD_ID`/`GC_STORE_PATH` and the step metadata `gc.build.artifact_schema`/`gc.build.artifact_path_keys`, none of which this bead carries, and the bead description names no validator.
- CI prerequisite (design §F, §4 row 1). The batch18/19 acceptance hold (187 failures on six missing lint labels, `pipeline/synthetic/batches/batch18/STATUS.md:167`, `pipeline/synthetic/batches/batch19/STATUS.md:191`) is resolved in this tree:
  - `git merge-base --is-ancestor e4ce2a3 HEAD` succeeds; that commit is PR #372, "Merge pull request #372 from loucmane/codex/hpf-irme-batch18-19".
  - The six labels are at `pipeline/synthetic/gates/scripts/lint_learner_output.py:156`.
  - The baseline selection passes (see Verification).

## Deliverables (uncommitted)

| Path | Content |
|---|---|
| `pipeline/synthetic/infold/build_roster.py` | Roster builder: census gate, evidence anchors, revision continuity, `--check` |
| `pipeline/synthetic/infold/approval-roster.json` | Generated: 128 rows, one per candidate unit in batches 1–19 |
| `pipeline/synthetic/infold/ROSTER.md` | Generated owner summary for ratifying batches 1–13 |
| `pipeline/synthetic/infold/export_product.py` | Deterministic exporter and its gates |
| `pipeline/synthetic/infold/preview/.gitignore` | Keeps every preview export local except `sample/` |
| `pipeline/synthetic/infold/preview/sample/` | Committed sample `p5-bank-sample.json` + `_export-manifest.json`: las-b14-002 (LÄS long), las-b19-002 (LÄS short), elf-b18-002 (ELF cloze), elf-b19-003 (ELF short); 4 units / 12 questions |
| `pipeline/synthetic/infold/tests/` | `conftest.py`, `test_infold_roster.py` (15 tests), `test_infold_export.py` (47 tests) |
| `.github/workflows/ci.yml:30` | `pipeline/synthetic/infold/tests` appended to the contract job's pytest line |

## Roster

- **Row fields:**
  - identity: `unit_id`, `batch`, `section` (the candidates' literal `LÄS`/`ELF`), `title`, `source`;
  - binding: `sha256` (exact bytes), `content_sha256` (canonical digest of section, title, passage, prompts, options and keys only), `question_count`, `revision`;
  - status: `approval`, `approval_basis`, `evidence[]` (each with `ref` = file:line, the `quote` found on that line, and a `note`), `retired`, `exclusion_pairs`.

  Top-level fields: `census`, `exclusion_pairs` (with rule, status and evidence) and `legacy_basis`.
- **Census.** Checked batch by batch and in totals against `EXPECTED_CENSUS`, the design's §2 table. A test also parses that table from `docs/p5-infold-design.md` and compares.

  | Selected | Retired | Retained | LÄS | ELF |
  |---|---|---|---|---|
  | 128 / 373 | 8 / 33 | 120 / 340 | 52 / 136 | 68 / 204 |

  Any difference raises `RosterError("census differs from docs/p5-infold-design.md §2: batch …")` and the script exits 1.
- **Approval.**

  | Status | Units / questions | Basis |
  |---|---|---|
  | `approved` | 39 / 121 | batches 14–19, explicit owner rulings |
  | `pending-owner-ratification` | 81 / 219 | batches 1–13 |
  | `retired` | 8 / 33 | `RETIRED.json`, which always wins |

  `elf-b14-002` stays retired although `pipeline/synthetic/batches/batch14/ADJUDICATION.md:693` lists it as GODKÄND. Both lines are cited in its row.
- **Rulings cited for batches 14–19:**
  - batch 14: `ADJUDICATION.md:689` (ruling), `:693` (four units approved as they stood), `:698` and `:702` (ÄNDRA for elf-b14-001 and las-b14-001), `:711` (changes executed, 6 PASS);
  - batch 15: `ADJUDICATION.md:701`, `:704`;
  - batch 16: `STATUS.md:168`, `ADJUDICATION.md:1451`;
  - batch 17: `STATUS.md:199`, `ADJUDICATION.md:1506`;
  - batch 18: `STATUS.md:127`, `ADJUDICATION.md:337`;
  - batch 19: `STATUS.md:145`, `ADJUDICATION.md:433`; the retirement is ledger item `:441`.
- **Evidence for batches 1–13.** Each unit cites its shipped-final line (`batch1/ADJUDICATION.md:2`; `batchN/STATUS.md:1` for 2–13) and its master line.
  - 77 units have approve-with-note rows (`pipeline/synthetic/ADJUDICATION-MASTER.md:53`–`:129`).
  - Four kept units were ÄGARBLICK items: `:24` (elf-b5-002 and las-b10-002 name-collision renames, landed in 4791084 / PR #356), `:29` (las-b3-002, approve with a scheduler rule) and `:36` (las-b2-003, the owner's eye; q1 redesign landed in 4791084).
  - The master's reply section, with no owner response recorded, is cited once as `legacy_basis` (`:45`).
- **Anchors.** Each evidence anchor must occur on exactly one line or the build fails, and a test re-reads every cited line to check that its quote is there.
- **Exclusion pairs:**
  - `las-b18-001`·`las-b19-001`: owner ruling, `batch18/ADJUDICATION.md:347` and `batch19/ADJUDICATION.md:443`.
  - `elf-b3-002`·`las-b3-002`: the master topic pair (`ADJUDICATION-MASTER.md:28`) and the unit's `serving_constraint` (`batch3/candidates-final/las-b3-002.json:87`). Its status is `pending-owner-confirmation`, enforced conservatively (design §5).
- **Revisions.** Every unit is r1.
  - `check_revision_continuity` refuses a reused revision with a different `content_sha256`, and a revision that goes backwards.
  - A bumped revision is `pending-owner-ratification` until a ruling is recorded for it.
  - A metadata-only change keeps the revision (sha256 changes, content digest does not), but the hash gate still forces a roster rebuild and review.

## Exporter

- **Output location.** Output goes only under `pipeline/synthetic/infold/preview/`. `check_out_dir` runs inside `write_export` itself and before any CLI export.
  - `preview/.gitignore` keeps everything except `sample/` local; `git check-ignore -v` reports `pipeline/synthetic/infold/preview/.gitignore:4:/*` for `preview/full/…` and `preview/approved/…`.
- **Bank shape.**
  - Each row has exactly `qid, exam_id, provpass, section, number, title, context, prompt, options, answer, source, unit_id, revision, explanation_shard`.
  - The header has exactly `format, release, preview, stamp, source, exclusion_pairs, questions`.
  - The internal `_export-manifest.json` binds the bank, roster, RETIRED.json and exporter sha256s, plus each unit's candidate sha256 and content digest, the exclusions, the gates and the lint result. The lint CLI skips `_`-files by store convention.
- **Identity.**
  - qid `p5-<unit>-r<rev>-<SECTION>-<nnn>`; the longest is 25 UTF-16 units against the 60 limit at `worker/src/routes/attempts.ts:40`.
  - exam_id `p5-<unit>-r<rev>`: a synthetic namespace, never an authentic sitting. provpass is null.
  - The explanation shard is `explanations/p5-<release>.json`.
- **Deviation for review: the section token is `LÄS`, not the design example's `LAS`** (`docs/p5-infold-design.md:72`). `worker/src/lib/section.ts:11` (`/-(…|L[ÄA]S)-\d+$/`) accepts both, but:
  - `app/src/lib/dueBySection.ts:25`–`:28` counts a mistake under a section only if the second-to-last dash segment is a `SECTION_KEYS` literal (`app/src/data/questions.ts:26`, `'LÄS'`). With `LAS`, every P5 LÄS mistake would drop out of the per-section counts.
  - `worker/src/routes/mistakes.ts:216`–`:218` and `worker/src/routes/fit.ts:47`–`:55` filter with `LIKE '%-${section}-%'` on the enum value `LÄS`. SQLite's LIKE folds ASCII case only, so `-LAS-` never matches.
  - All 27 authentic exam files under `app/public/data/` use `-LÄS-`: 27 files match `-LÄS-<n>"`, none match `-LAS-<n>"`.

  The token comes from one f-string in `make_qid`; switching to `LAS` would be one line plus the test expectation.
- **No misrouting.** No P5 qid contains a provpass token, so `extractExamId` (`app/src/data/explanations.ts:133`) returns null instead of loading an authentic exam's explanations; the P5 resolver is PR 4. The bank key and shard key fit the content whitelist at `worker/src/routes/content.ts:28`.
- **Preservation.**
  - `context`, `title`, `prompt`, `options` and `answer` are the candidate's strings, unnormalised, with options in A–D order.
  - A cloze unit's `Gap (n)` questions must have n = q_index, and the passage must contain exactly the markers `___(1)___`…`___(n)___`, in order. A non-cloze unit must contain none.
- **Gates.** Each refuses the export and writes nothing:
  - candidate sha256 and content digest disagree with the roster;
  - retirement, read directly from RETIRED.json: a requested retired id is refused, and a roster that disagrees with RETIRED.json in either direction is refused as stale;
  - approval: `pending-owner-ratification` units only with `--include-pending`, which stamps `preview: true` + `PREVIEW: …` and requires a `preview…` release name;
  - candidate fields outside the GENERATION.md output format: top-level keys, question keys, four A–D options;
  - duplicate roster rows or qids;
  - bank whitelist; denylisted or `_` keys at any depth; any rationale paragraph of 40+ characters inside any bank string;
  - a complete exclusion pair in a `--single-session` export;
  - any default-mode learner-output lint finding on an exported title, passage, prompt or option (listed per unit and field, never hidden);
  - two builds from disk that are not byte-identical.
- **Single-session rule** (also in the exporter docstring and ROSTER.md). A bank may hold both members of a pair, since the session pickers separate them (design §A, PR 4), and it lists the complete pairs it holds in `exclusion_pairs`. An export that represents one session's content must not hold both.

## Verification

- **Baseline, before any change:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q -p no:cacheprovider` → **1478 passed, 7 xfailed** (22.39 s).
- **Red first:** conftest and both test modules were written before either script existed. `python3 -m pytest pipeline/synthetic/infold/tests -q -p no:cacheprovider` → exit 4, `ModuleNotFoundError: No module named 'build_roster'`.
- **Bead VERIFICATION command:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1540 passed, 7 xfailed**, i.e. 1478 + 62 new.
  - The exact CI line (`.github/workflows/ci.yml:30`, without `-p no:cacheprovider`) also gives **1540 passed, 7 xfailed**.
  - Local versions are pytest 7.4.4 on Python 3.12.3. CI installs current pytest on 3.12, which was not run here (no network).
- **Gate mutation check** (scratch harness, not committed). Each gate was disabled in turn and the suite rerun; every mutation fails at least one test, and the unmutated suite passes 62.

  | Gate disabled | Tests failing |
  |---|---|
  | cloze numbering | 2 |
  | candidate fields | 11 |
  | duplicate qid | 1 |
  | bank whitelist / denylist / leak | 5 |
  | exclusion pairs | 1 |
  | learner lint | 3 |
  | RETIRED.json cross-check | 3 |
  | sha comparison skipped | 2 |
  | RETIRED.json ignored in selection | 3 (+16 errors) |
  | determinism comparison removed | 1 |
  | census gate | 1 |
  | revision continuity | 2 |
  | approval carried to a bumped revision | 1 |
- **Determinism:**
  - Every export compares an in-process double build byte for byte.
  - `export_product.py --sample --check` passes in separate processes under `PYTHONHASHSEED=0` and `4242`.
  - `export_product.py --include-pending --out pipeline/synthetic/infold/preview/full --check` re-exports byte-identical to the written files.
- **Roster:** `build_roster.py --check` reports current: `roster: 128 units / 373 questions; retained 120 / 340 (LÄS 52 / 136, ELF 68 / 204); retired 8 / 33; approved 39 / 121; pending owner ratification 81 / 219`.
- **Exports:**

  | Export | Units / questions | Strings linted | Excluded |
  |---|---|---|---|
  | `--include-pending` (full preview) | 120 / 340 [PREVIEW] | 1940 | 8 retired |
  | approved only | 39 / 121 | 683 | 8 retired + 81 pending |
  | sample | 4 / 12 | 68 | — |
- **Learner-output lint (default mode)** over the written exports: `python3 pipeline/synthetic/gates/scripts/lint_learner_output.py pipeline/synthetic/infold/preview/full pipeline/synthetic/infold/preview/approved pipeline/synthetic/infold/preview/sample` → `learner-output lint: clean — 3 file(s)`. A `--strict` run on the full preview is also clean.

## Learner-output lint per unit (for PR 2 and the owner)

Every exported unit has zero findings. That covers all 120 retained units (LÄS 52, ELF 68) and 1940 strings: title and passage once per unit, plus the prompt and four options of every question. Both the exporter's own scan and the CLI over the written bank agree.

There is nothing to list for PR 2 from the student strings. The rationale-field findings recorded in earlier batches concern internal source text, which this export never ships. A probe run before implementation, over all 128 selected files including the 8 retired, also found no findings in any title, passage, prompt or option.

## Notes for PR 2–PR 5 (not changed here)

- Bank rows omit `parsing_status`, which `questionsInSection` requires (`app/src/data/questions.ts:93`, `:176`–`:185`). The discriminated P5 type and its loader belong to PR 4.
- `app/src/components/pre-grade/PreGradeFill.tsx:116`–`:122` reads the third-from-last qid segment as the provpass, so a P5 qid would display `r1` there. Cosmetic; PR 4.
- `explanation_shard` points at `explanations/p5-<release>.json`, a flat key that fits the content whitelist. The design's `explanations/p5-b19-<release>.json` sketch is left for PR 2 / PR 5 to settle.
- The committed sample manifest pins the exporter's and the roster's sha256 on purpose. Any later edit to `export_product.py`, or a roster rebuild, needs `python3 pipeline/synthetic/infold/export_product.py --sample`, and the sample test fails until it is run.
- ROSTER.md asks the owner to ratify batches 1–13 and to confirm the elf-b3-002 / las-b3-002 topic pair (design §5).

## Progress

- 2026-10-07 [S:ci-9b796|W:hpf-535m|H:research|E:bed27524396778349a5d8e0b72cc0afd0ed7454d] Read the design, the hpf-6afv census, RETIRED.json, the master and every batch 14–19 ruling. Read the qid consumers in the worker and app, and the lint script. Baseline CI selection: 1478 passed, 7 xfailed.
- 2026-10-07 [S:ci-9b796|W:hpf-535m|H:red|E:pipeline/synthetic/infold/tests] Wrote conftest and both test modules first. Red: `ModuleNotFoundError: No module named 'build_roster'`.
- 2026-10-07 [S:ci-9b796|W:hpf-535m|H:green|E:pipeline/synthetic/infold] Implemented `build_roster.py` and `export_product.py`, generated the roster, ROSTER.md and the sample, added the preview `.gitignore` and the CI path. 62 new tests pass; full selection 1540 passed, 7 xfailed.
- 2026-10-07 [S:ci-9b796|W:hpf-535m|H:verify|E:local] Ran the mutation check (14 mutations, all caught), cross-process determinism, the full and approved preview exports and their lint (clean). Moved the preview-only output check into `write_export`. Regenerated the sample after each exporter edit.

## Handoff

- **Ready for review:** an independent review of the exact uncommitted tree, then the owner's ratification of batches 1–13 and of the topic pair in the PR. Committing, pushing and opening the PR are outside this lane.
- **Deviation to confirm:** the `LÄS` qid section token (above).
- **Not claimed:** release readiness. No gate re-certification (`promote.py --require-clean`, M-ECHO, sheet sync) was run or claimed, no explanations exist yet (PR 2), and nothing is activated or deployed.

## Bead note

PR1 export contract implemented, uncommitted. `build_roster.py` → `approval-roster.json` (128 rows; census 120/340 = LÄS 52/136 + ELF 68/204, 8/33 retired; approved 39/121; batches 1–13 pending owner ratification 81/219) + `ROSTER.md`. `export_product.py`: whitelist bank, qid `p5-<unit>-r1-<SECTION>-nnn` with the `LÄS` token (deviation from the design's `LAS`, justified in the worklog); refuses on hash/retired/approval/field/dup-qid/leak/pair/lint/non-determinism. Committed 4-unit sample; full preview gitignored. 62 new tests in CI; 1540 passed, 7 xfailed; lint clean on all 120 units. Evidence: `docs/worklog/hpf-535m.md`.
LANE DONE: hpf-535m

## Review fix round 1

Bead `hpf-c30u` fixes the two blocking findings of the Codex exact-head review of PR #375 (bead `hpf-iycl`, `VERDICT: HOLD` at `ad12bc2`): R1, malformed `revision` values reach the learner bank; R2, output writing follows symlinks out of `infold/preview/`. The fix is uncommitted on top of `ad12bc2`.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c30u`, assignee `gc__implementation-worker-ci-pznzr`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-c30u --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` → `ad12bc277f270d2f212dadbe3591944506e22ab8` on `codex/hpf-535m-infold-export-contract` (tracking origin), with no tracked changes at start.
- **The review worklog could not be read.** This session's sandbox denies `/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/worklogs/hpf-iycl.md` to both the Read tool and Bash. The repro classes come instead from the bead description and the `hpf-iycl` bead note ("R1 P2 malformed revisions leak nested data and invalid qids; R2 P2 output-file symlinks escape preview confinement"). Both repros were rebuilt independently (see the before/after section).
- No git writes and no network. The tracked changes are the five files below plus this worklog. Nothing changed in the candidates, rulings, `RETIRED.json`, `approval-roster.json`, `ROSTER.md`, `app/`, `worker/` or CI.
- Untracked paths were left alone:
  - The `.agents`/`.claude` skill directories, `.codex/` and `.gc/` are untouched.
  - The `.bash_profile` … `.zshrc`, `.idea` and `.vscode` entries that `git status` shows inside the sandbox are `/dev/null` character-device mounts (`c 1,3`) that the sandbox creates. They are not files.
- `gc.check_path` is the same post-close dispatcher check as for `hpf-535m`. This bead names no validator, so this worker did not run it.

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/build_roster.py` | `MAX_REVISION = 99` and `is_revision()`; the build and the continuity check refuse malformed revisions |
| `pipeline/synthetic/infold/export_product.py` | Roster-row validation, a strict `make_qid`, the final `check_schema` gate, and the symlink-safe atomic writer and `--check` reader |
| `pipeline/synthetic/infold/preview/sample/_export-manifest.json` | Regenerated; 4 lines changed: the exporter sha256 and two new gate names |
| `pipeline/synthetic/infold/tests/test_infold_export.py` | 62 new tests |
| `pipeline/synthetic/infold/tests/test_infold_roster.py` | 12 new tests |

### R1: revision and qid integrity

- **Documented bound.**
  - A revision is a plain `int` from 1 to `MAX_REVISION = 99`. `is_revision()` checks `type(value) is int`, so a bool is refused.
  - The bound is documented in the `build_roster.py` docstring and in the exporter's row-field docs.
  - `build_roster()` raises `RosterError` for any `REVISIONS` value outside it. `check_revision_continuity()` refuses a malformed revision on either side instead of comparing it. It used to raise `TypeError` for a string or dict, and silently accept `True` or `0`.
- **Roster validation, where the exporter reads the roster** (`_load_roster`, the finding's `:140`). Each of these raises `ExportError` before selection, so nothing is written:
  - unreadable JSON, including an integer past Python's 4300-digit limit (`ValueError` before);
  - a non-object roster or non-object rows;
  - any row whose fields the exporter reads are missing or have a different exact JSON type (`ROSTER_ROW`): `unit_id`/`section`/`source`/`sha256`/`content_sha256`/`approval` must be str, `question_count`/`revision` int, `retired` bool;
  - any revision outside 1–99.
- **qid at construction.** `make_qid` takes only a valid revision and a number from 1 to 999. It then requires a full match of `QID`:

  ```
  p5-(?:las-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-LÄS|elf-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-ELF)-[0-9]{3}
  ```

  That is ASCII digits only, no leading zero in the revision, and the section literal implied by the unit's prefix. The qid must also fit in `QID_MAX = 60` UTF-16 units (`worker/src/routes/attempts.ts:40`). Anything else raises an `ExportError` that names the qid.
- **Final whole-output schema check.** `check_schema(bank)` is a new gate that runs after the lint, immediately before rendering.
  - The bank must be exactly `BANK_SHAPE`:
    - an object is its exact field list, in order;
    - `[x]` is an array of x;
    - a scalar is its exact JSON type, so a bool is never a number and an object or array never stands where a scalar belongs.
  - `ROW_FIELDS`, `OPTION_FIELDS` and `BANK_FIELDS` are now derived from the shapes, with unchanged values.
  - Value checks on top of the shape:
    - format, source and release;
    - stamp ⇔ preview;
    - every exclusion pair has exactly two ids;
    - per row: `qid` and `exam_id` must equal what `make_qid`/`exam_id` build from the row's own `unit_id`, `revision`, `section` and `number`;
    - per row: answer and option letters are A–D, source is `synthetic`, and the shard belongs to this release.
- **Adjacent fix.** The candidate field gate now requires `q_index` to be an `int`. A JSON `true` used to pass `True == 1` and export `"number": true`.
- `GATES` gains `qid-format` and `bank-schema` (manifest only).

### R2: output confinement

- **Root and path.** `check_out_dir` resolves `PREVIEW_DIR` once and returns `(root, parts)`. `out_dir`, made absolute without resolving (`absolute()`), must lie inside that root with at least one component and no `..`.
- **Directory walk.** `_open_out_dir` opens the root with `O_DIRECTORY | O_NOFOLLOW`, then walks the parts one by one through directory descriptors:
  - each component is lstat-ed: a symlink is refused (`… is a symlink; no export path below pipeline/synthetic/infold/preview/ may be one`), and so is anything that is not a directory;
  - missing components are created, in write mode only;
  - each component is opened with `O_NOFOLLOW`, so a link swapped in after the lstat fails the open.
- **Write.** `write_export` checks everything before the first write:
  - export names must be plain names;
  - the stray-file check is unchanged;
  - every expected output name that exists must lstat as a regular file.

  Each file then goes through `_replace`:
  - create a fresh `.<name>.<random>.tmp` in the same directory with `O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW` and mode `0o666`, so only the umask applies and there is no chmod anywhere;
  - write it and fsync it;
  - `os.replace` it relative to the directory descriptor.

  A rename replaces the directory entry, so neither a symlink nor a hard link at that name is ever written through.
- **`--check`** reads through `read_export`: the same walk, lstat checks and `O_NOFOLLOW` opens. A symlinked output file is refused instead of compared through.

### Tests, red first

- **74 new tests:** 62 in `test_infold_export.py`, 12 in `test_infold_roster.py`.
  - R1:
    - malformed roster revisions `0, -1, True, False, 1.0, 2.5, "1", "r1", None, [1], {"note": "internal"}, 100, 10**30`;
    - a missing revision, and a 5000-digit revision;
    - mistyped roster fields;
    - 12 malformed `make_qid` inputs, including a 63-character qid and non-ASCII digits;
    - the inclusive bounds (`r99`, `nnn` 999, a 60-unit qid);
    - an end-to-end export whose qid would reach 63 characters;
    - 16 schema mutations (nested revision, bool number, array title, nested option text and others);
    - every real export conforming to the schema;
    - the schema gate running on every export;
    - a bool `q_index`;
    - malformed `REVISIONS` failing the roster build, and malformed revisions in the continuity check.
  - R2:
    - a symlinked output file pointing outside the root, dangling, or inside the root (no write at all, outside file unchanged);
    - a symlinked parent directory pointing outside or inside, for both `out` and `out/nested` (nothing written in the target);
    - a hard-linked output file is replaced, not written through;
    - a fresh export consists of regular files with umask-only modes and no temp files left;
    - a `..` escape is refused;
    - `--check` refuses a symlinked sample.
  - Each refusal test matches its own layer's message, for example `roster .*revision`, `is a symlink` and `mistyped field`.
- **First red run in the lane** (tests written, code untouched): 70 failed, 65 passed. One match had passed by accident because pytest's tmp path contains the test name (`…symlinked…`). After tightening it to `is a symlink`: 71 failed, 64 passed.
- **Final suite against the exact `ad12bc2` code:** 72 failed, 64 passed. The setup was `git archive ad12bc2 pipeline/synthetic docs/p5-infold-design.md worker/src app/src`, extracted into the scratchpad with the final test files copied over.
  - The 64 that pass are the 62 original tests plus 2 regression guards that hold on both trees: fresh regular files, and the `..` escape, which `ad12bc2` already refused by resolution.
  - Failure modes on `ad12bc2`:
    - `DID NOT RAISE` for every malformed revision (the bank was exported);
    - `KeyError: 'revision'` for a missing revision;
    - `TypeError: unhashable type` for a dict or list roster field;
    - `ValueError` for the 5000-digit revision;
    - `DID NOT RAISE` for the symlinked-output and hard-link cases.
- **After the fix:**
  - infold: 136 passed;
  - bead VERIFICATION command: **1614 passed, 7 xfailed** (21.69 s), which is the baseline 1540 plus the 74 new tests;
  - baseline before any change: 1540 passed, 7 xfailed (21.54 s).

### Mutation check

Each mutation was applied to the scratch copy of the fixed tree, never the lane, with the infold suite run excluding the three committed-sample tests (any exporter edit changes the pinned sha256). The unmutated scratch tree passes all 136 tests, and every mutation is caught.

| Mutation | Failing tests |
|---|---|
| M1 `_load_roster` without the row-type and revision checks | 19 |
| M2 `make_qid` without validation | 13 |
| M3 `check_schema` call removed from `_build` | 1 |
| M4 `check_schema` emptied | 17 |
| M5 `write_export` without the output-file lstat check | 3 |
| M6 `_open_out_dir` without `O_NOFOLLOW` and without the directory lstat check | 2 |
| M7 `_replace` writing in place (`O_TRUNC`, no temp + rename) | 1 (hard link written through) |
| M8 `read_export` following links | 1 |
| M9 candidate gate accepting a bool `q_index` | 1 |
| M10 build-time `is_revision` check removed | 8 |
| M11 continuity `is_revision` check removed | 4 |
| M12 `..` allowed in `check_out_dir` | 1 (the descriptor walk then really escapes) |

### Before and after, through the real CLI

Both runs used the scratch trees: `ad12bc2`, and the fixed copy with sha256s identical to the lane's.

- **R1.** A roster copy with `las-b19-002` `"revision": {"note": "internal"}`, run with `--roster … --units las-b19-002 --out preview/r1probe`.
  - `ad12bc2` exported 1 unit / 2 questions with qid `p5-las-b19-002-r{'note': 'internal'}-LÄS-001`, exam_id `p5-las-b19-002-r{'note': 'internal'}`, and the nested object as the row's `revision` in the learner bank.
  - The fix printed `REFUSED: roster rows with a missing or mistyped field: ['las-b19-002.revision']` and created no output directory.
- **R2.** `preview/probe/_export-manifest.json` was a symlink to a file outside the tree containing `keep`.
  - `ad12bc2` wrote the bank and then overwrote that outside file with the manifest.
  - The fix printed `REFUSED: …/preview/probe/_export-manifest.json is a symlink; no export path below pipeline/synthetic/infold/preview/ may be one` and exited 1. The outside file still reads `keep`, and the probe directory holds only the link: the bank was not written either.

### Byte identity

| Output | sha256, `ad12bc2` | After the fix |
|---|---|---|
| `preview/sample/p5-bank-sample.json` (committed) | `08938291…6d28` | identical, not in `git diff` |
| `preview/full/p5-bank-preview.json` (local, gitignored, 120 / 340 [PREVIEW]) | `c5938104…9ea2` | identical |
| `preview/approved/p5-bank-preview.json` (local, gitignored, 39 / 121) | `33d9df3b…5a6f` | identical |

- `--check` against the pre-fix local full and approved exports reported only `_export-manifest.json` as differing. Both were then rewritten through the new writer, and the bank hashes above are the rewritten files.
- **Committed sample manifest.** Exactly 4 lines changed: the exporter sha256 `e92b6e37…1e73` → `b370f30c64e87088be1dea89644bda027c4abd94f451d85b9efe7c522210a97e` (the lane's `export_product.py`), plus `qid-format` and `bank-schema` in `gates`. It was regenerated with `export_product.py --sample`, which now goes through the atomic writer. File modes stay `0664`, and no temp file remains.
- **Roster.** `build_roster.py --check` reports it current, with the same summary line as before. The `approval-roster.json` sha256 is unchanged (`9ccfe9a4…dc65`) and `ROSTER.md` is untouched. `build_roster.py` is now `7d44860d…d312`, which no artifact pins.
- **Lint.** `lint_learner_output.py` over `preview/full`, `preview/approved` and `preview/sample` → `learner-output lint: clean — 3 file(s)`.

### Notes for review

- **Defense in depth.** A malformed revision is refused at roster load, and `make_qid` and `check_schema` would refuse it again. The tests pin each layer on its own (M1, M2, M4). Likewise, the rename makes a planted symlink harmless, but the export is still refused (M5).
- **Symlinked prefix.** An output path spelled through a symlinked prefix that resolves to the preview root, such as an absolute path through a symlinked checkout, is now refused. The CLI defaults are built from the resolved `INFOLD_DIR`, and relative paths start from the physical cwd, so neither is affected.
- **Untested race guard.** `O_NOFOLLOW` on the directory walk and on the temp file guards against a race with the lstat checks. Without a race it cannot be tested on its own; M6 removes it together with the lstat check.
- **Not claimed:** anything beyond R1 and R2. There is no commit, push or PR update. Release readiness is as stated in the Handoff above.

### Progress

- 2026-10-07 [S:ci-pznzr|W:hpf-c30u|H:research|E:ad12bc277f270d2f212dadbe3591944506e22ab8] Confirmed the head and read the exporter, the roster builder and the tests. The review worklog is denied by the sandbox, so the repro classes come from the bead and the `hpf-iycl` note. Baseline: 1540 passed, 7 xfailed.
- 2026-10-07 [S:ci-pznzr|W:hpf-c30u|H:red|E:pipeline/synthetic/infold/tests] Wrote the R1 and R2 tests first. Red against untouched `ad12bc2` code: 71 failed (final suite against an exact `ad12bc2` archive: 72 failed, 64 passed).
- 2026-10-07 [S:ci-pznzr|W:hpf-c30u|H:green|E:pipeline/synthetic/infold] Implemented the revision bound, roster-row validation, strict `make_qid`, `check_schema`, the descriptor-walk writer and reader, and the atomic replace. Regenerated the sample manifest. Result: 1614 passed, 7 xfailed.
- 2026-10-07 [S:ci-pznzr|W:hpf-c30u|H:verify|E:scratchpad] Ran 12 mutations (all caught), the CLI before/after for R1 and R2, byte identity of all three banks, `build_roster --check`, and the lint (clean).

### Bead note

Review fix round 1 for PR #375 (hpf-iycl HOLD), uncommitted on ad12bc2. R1: a revision must be an int from 1 to 99 (bool refused), checked in build_roster and where the exporter reads the roster, along with typed roster rows. The qid must match the documented pattern and fit 60 UTF-16 units when built. A final bank-schema gate stops nested or mistyped fields. R2: the preview root is resolved once and walked with O_NOFOLLOW; symlinked files or directories and `..` are refused before any write; each file is written to a temp file and renamed (no chmod, no write through a link), and `--check` reads the same way. 74 red-first tests (72 fail on ad12bc2). 1614 passed, 7 xfailed. All 12 mutations caught. All three banks are byte-identical; the sample manifest changed only in the exporter sha256 and 2 gate names. Evidence: `docs/worklog/hpf-535m.md`.
LANE DONE: hpf-c30u

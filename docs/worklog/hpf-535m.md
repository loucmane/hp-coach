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

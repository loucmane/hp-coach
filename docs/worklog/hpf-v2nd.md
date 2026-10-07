---
bead: "hpf-v2nd"
project: "hpfetcher"
session: "ci-m7pwm"
status: "report_uncommitted"
---

# Worklog — hpf-v2nd

Read-only re-audit of the 81 legacy P5 units (batches 1–13, 219 questions), roster rows `"approval": "pending-owner-ratification"`, against today's gates. It runs before the owner's ratification takes effect (owner 2026-10-07: "ratify them, make sure they are up to par"). Report: [`pipeline/synthetic/infold/AUDIT-batches-1-13.md`](../../pipeline/synthetic/infold/AUDIT-batches-1-13.md).

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` → `hpf-v2nd`, assignee `gc__implementation-worker-ci-m7pwm`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-v2nd --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- **Head.** `git rev-parse HEAD` → `989ccd66ccc269fba92d66b7bf36656bb0458019`, on `codex/hpf-535m-infold-export-contract`. That is the PR #375 head the coordinator named. `git status --porcelain pipeline/ docs/` was empty at the start.
- **No writes outside the report:**
  - no git writes and no network;
  - no candidate, ruling, roster, registry or gate file was edited;
  - the only repo changes are the two deliverables below, both uncommitted.
- **Untracked entries.** The `.bash_profile` … `.zshrc`, `.idea` and `.vscode` entries in `git status` are the sandbox's `/dev/null` mounts (see `hpf-535m.md`). They, `.agents/`, `.claude/skills/`, `.codex/` and `.gc/` were left alone.
- **`gc.check_path`.** It names `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`, the dispatcher's post-close producer check. The bead names no validator, so it was not run.
- **Authentic corpus.** `/home/loucmane/dev/hpfetcher/data/parsed` was readable (27 exam files plus `_index.json`) and was used read-only. No gate was skipped.

## Tools (sha256 recorded before execution; all unmodified at head)

| Path | sha256 |
|---|---|
| `pipeline/synthetic/infold/approval-roster.json` | `9ccfe9a41b0942f50c68496160c2fa9c8e1e6e308be7814e416ca3c047dddc65` |
| `pipeline/synthetic/RETIRED.json` | `5e7a1031d5eff5378f1eb42f64ad919e9231effc274cc0af700b5fb3769315d0` |
| `pipeline/synthetic/infold/export_product.py` | `b370f30c64e87088be1dea89644bda027c4abd94f451d85b9efe7c522210a97e` |
| `pipeline/synthetic/infold/build_roster.py` | `7d44860d9159b32d1352c6350336aa1fe5c33fc894dc02190222d35d68e7d312` |
| `pipeline/synthetic/gates/scripts/mech.py` | `516478b531e83ac7fdc23ae977ff4056ec378e12e6bb4301aeeed6a4748bfcfd` |
| `pipeline/synthetic/gates/scripts/run_mech.py` | `cd4a45188147e1706d7b6a5ebb2413dbeecfce390c554c222ca3511b389e8077` |
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | `76b986534dd90ca21abaaf37dc20b9f54a5cb6c5e7e6bb2295b9333a05ea877b` |
| `pipeline/synthetic/gates/scripts/katex_style_commands.json` | `c1ceaf6ef9c60c5746d653214ecb2d7b6e33c5be76746134b163b01607478a90` |
| `pipeline/synthetic/gates/scripts/promote.py` | `0f31123f2d572b8d73414ca4ba411dc1abebaa1304297bbad0928558b878b2d7` |
| `pipeline/synthetic/gates/scripts/aggregate.py` | `a2c13c99337ef8b8dfe0a7bfe9f3619535d1f6acfa4d8a1eff61c8803aee4f38` |
| `pipeline/synthetic/gates/scripts/vfinal_fold.py` | `6a7abb837b7d402594c205267a944159980025618d90cf2a8261485f4e08c3e1` |
| `pipeline/synthetic/gates/scripts/gkey_resolve.py` | `be80244f675f15f8d780e6c1bd9384f31af1765eacfd790e574cc208b5fcd6c0` |
| `pipeline/synthetic/gates/bands.json` | `e39edcc81acac123b0403e0fdc7254e37eef55b609639a4f959bac868fdef1fe` |
| `pipeline/synthetic/gates/schemas/verdict.schema.json` | `0a5527fd0f328dce1e1f9ddeb86324250e9befa1971a8593871e4655d2e3cb50` |

Scratch directory: `/tmp/claude-1000/-home-loucmane-dev-hpfetcher-worktrees-hpfetcher-lane/8682dc52-cd42-4887-9096-4bbef68d33e4/scratchpad/hpf-v2nd/`, written `$S` below. Nothing in it is part of the deliverable.

## Commands and results

### Roster bytes first

- **Roster freshness.** `python3 pipeline/synthetic/infold/build_roster.py --check` printed `roster: 128 units / 373 questions; retained 120 / 340 (LÄS 52 / 136, ELF 68 / 204); retired 8 / 33; approved 39 / 121; pending owner ratification 81 / 219`, with no `STALE`.
- **Pending ids.** Taken mechanically from the roster with a multiline `rg -U -o` on `"unit_id" … "approval": "pending-owner-ratification"`: exactly the 81 ids.
- **Checklist.** The same pattern with `-r '$5  $4'` printed `<sha256>  <source>` for the 81 rows. That output was saved verbatim as `$S/roster-pending.sha256`.
- **Byte check.** `sha256sum -c $S/roster-pending.sha256` → 81 × `OK`.

### Check 5 (export) and check 2 (lint)

- **Per-unit export, 81 runs:**

  ```
  python3 pipeline/synthetic/infold/export_product.py --include-pending --release preview-audit --units <unit> --out pipeline/synthetic/infold/preview/audit-hpf-v2nd/<unit>
  ```

  All printed `exported 1 units / N questions [PREVIEW] … learner lint clean (S strings); excluded 0 retired, 0 pending`, 219 questions in all.
- **Dry-run, 81 runs.** The same command with `--check` printed `checked 1 units / N questions [PREVIEW] …` for every unit. No `STALE` and no `REFUSED`, so the bytes are identical across processes.
- **Lint.**
  - `python3 pipeline/synthetic/gates/scripts/lint_learner_output.py pipeline/synthetic/infold/preview/audit-hpf-v2nd` → `learner-output lint: clean — 81 file(s)`.
  - With `--strict`, as information: `clean — 81 file(s)`.
- **Independent checks on the banks:**
  - `rg -l '"(rationale|rationales|generator_meta|family|families|repair_log|trap_map|originality_note|serving_constraint|key|q_index|passage|candidate_id|notes|audit|flags|verdicts)":'` over `p5-bank-*.json` → no match;
  - well-formed qids, `p5-(las-b…-r1-LÄS|elf-b…-r1-ELF)-NNN` → 219 matches in 81 files, equal to the 219 `"qid":` fields.
- **Manifest.** `elf-b1-001/_export-manifest.json` pins roster `9ccfe9a4…dc65`, RETIRED `5e7a1031…15d0` and exporter `b370f30c…a97e`, with `"findings": []`.
- **Move to /tmp.** `mv pipeline/synthetic/infold/preview/audit-hpf-v2nd $S/exports`. After the move, `preview/` again holds only `.gitignore`, `approved/`, `full/` and `sample/`, untouched with their 18:40/18:46 times.
  - Lint again at `$S/exports` → `clean — 81 file(s)`.
  - Bank sha256s are unchanged: elf-b1-001 `cfeb8ffd…4092`, las-b7-002 `60cd1b20…fa90`, las-b6-003 `00a4ad0e…d859`, las-b10-002 `d9fd7bed…cbc2`.

### Check 1 (mech)

- **Command.** One run:

  ```
  python3 pipeline/synthetic/gates/scripts/run_mech.py <81 candidates-final paths> --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --out $S/mech-verdicts.jsonl --p5-corpus-dir batches/batch{1..17}/candidates-final batches/batch18/candidates batches/batch19/candidates
  ```

  All 19 directories were spelled out.
- **stderr:** `M-ECHO: indexed 128 shipped unit(s)`, and no `KILL`.
- **Verdicts.** 486 lines: 467 pass, 19 flag, 0 kill.
  - M-SCHEMA, M-BANDS, M-TELL, M-FORM and M-PLAGIARISM pass on 81/81.
  - M-ECHO passes on 62 units and flags 19.
- **The 19 flags:** 36 findings, 28 against retained units and 8 against retired ones. None involves a batch 14–19 unit. They are quoted verbatim per unit in the report.
- **Background for the names:**
  - full names from `rg -o "[A-ZÅÄÖ]… (Lindqvist|Sundqvist|Frisk|Öberg|Ahlgren|Åkerlund|Sundelius|Brandt|Halloran)"`, all on each unit's passage line `:6`;
  - prior record: `adjudication/cross-batch-report.md:181-213` (F6) and `gates/evalset/runs/2026-07-30-m-echo/RESULT.md:111-114`.

### Check 3 (evidence)

- **Promote.**
  - Command, for N = 1–13: `python3 pipeline/synthetic/gates/scripts/promote.py --batch-dir pipeline/synthetic/batches/batchN --candidates-dir …/batchN/candidates-final --verdicts …/batchN/verdicts.jsonl --require-clean`.
  - All 81 pending units PASS.
  - Batches 7 and 8 exit 1, but only for the retired `elf-b7-001`, `elf-b8-001` and `las-b8-001` (`gate-fleet: DEAD (killed_by=G-STEM)`).
  - Batches 2–4 print orphan warnings for never-shipped killed ids.
- **V-FINAL re-derivation.**
  - Command, for N = 1–13: `python3 pipeline/synthetic/gates/scripts/vfinal_fold.py --verdicts-dir …/batchN/verdicts-vfinal --audits-dir …/batchN/audits --candidates-dir …/batchN/candidates-final --out $S/vfinal/batchN.jsonl`.
  - The verdicts equal `reviews/final_verify.jsonl` for 81/81, and so do the notes. Batch 6's 2026-07-23 notes lack the later `gkey_flags` field; the other values match.
- **Batch 1 against its own legs.** `vfinal_fold.py --verdicts-dir …/batch1/verdicts-final …` → same verdicts, with `gkey_records` of 10/2/2/4/4 for the five E1 units (`$S/vfinal/batch1-from-verdicts-final.jsonl`).
- **Leg coverage.**
  - `rg -o` for `G-KEY` and `G-DISTRACTOR` per unit and target in each `verdicts-vfinal/` (batch 1: `verdicts-final/`) shows every pending unit with votes 1 and 2 and at least one G-DISTRACTOR per question.
  - The first G-DISTRACTOR pattern assumed `": "`; compact JSON lines (`":"`) needed `": ?"`, and the corrected run is the one counted.
- **E2 re-resolution.**
  - `rg -n "cannot resolve G-KEY"` in batches 1, 2, 3, 4, 5, 7, 8 and 12 gives 57 records (18/2/5/10/5/10/5/2), every one a vote 1 with target `qN`.
  - Their solver answers were compared with the keys from `rg -n -o '"key": "[A-D]"'` in each `candidates-final` file: 57/57 match, over 38 questions.
  - The resolved vote-2 lines from the same campaign were located per batch: b1 `:23-27`, `:28-31`, `:32-44`; b2 `:43-44`; b3 `:44-48`; b4 `:41-45`; b5 `:46-50`; b7 `:51-55`; b8 `:46-50`; b12 `:61-62`.
- **Currency.**
  - `git log --name-only` on each batch's `candidates-final/` and `audits/` shows the commits that touched them. Only `las-b3-002` and `las-b10-002` changed after their last audit, both in 4791084.
  - `git show 4791084 -- …` gives the diffs: las-b3-002 only added `generator_meta.serving_constraint`; las-b10-002 renamed Ingrid Salomonsson to Ylva Tenglund in the passage (×2) and the q1 prompt.
  - Rationale on record: `batch10/reviews/pedagogy.jsonl:10`.
  - Since 4681b85 (PR #361) no batch 1–13 candidate file has changed (`git log 4681b85..HEAD`). Later commits touched only `RETIRED.json` (79cc292) and `adjudication/real-entity/verdicts-b13-14.json` (b296a8e, on las-b14-002 only).

### Check 4 (real-entity)

- **Coverage.** `rg -n '^ "(las|elf)-b…": \['` over the six `verdicts-*.json` files: all 81 pending ids are keys.
- **Collisions.** `rg -c '"class": "collision"'` gives 4/4/5/0/1/2 = 16, equal to `REPORT.md:11`.
  - 9 pending units carry one: elf-b1-001, las-b1-001, las-b2-002, elf-b3-002, elf-b4-002, elf-b5-002, elf-b7-002, elf-b8-002, las-b12-002. These are exactly the 9 batch 1–13 units changed in 4681b85.
  - Each has a search-log `originality_note` and `audits/<unit>.json:3` CONFIRMED_NOTES.
- **Collision names in the student text.** `rg -o` over the exported banks for every sweep-collision name and the renamed names. No collision name is left in the unit it was found in. The hits are:
  - names that legitimately remain in another unit: elf-b5-001 'Ottilie', las-b10-001 'Salomonsson', las-b3-001 'Sahlberg' (counterpart retired), las-b7-002 'Kvarnby' (swept near);
  - a substring false positive: elf-b10-001 'Verran' inside 'Verrand Tower', swept clear;
  - the one gap: las-b6-003 'Sandviken', which the sweep never classified (R1).
- **Bounded real-place scan.** `rg -o` with a list of real Swedish, Nordic, UK and US places over the exported banks. Each hit was checked against that unit's sweep entries; all are covered except R1. The details are in the report.
- **Not done:** a full entity-level diff of every proper noun against the sweep, and any web verification (no network).

## Commands refused by the worker allowlist

Each was reported and not worked around. The same facts came from the plain `rg`/`git`/repo-CLI forms above and from the Read tool.

1. `python3 -c "import json; …"`, to list las-b3-002's top-level and question keys. Replaced by the exporter's own field gate, which accepted the unit, and by reading the 4791084 diff.
2. An `rg -o` with `.*` and a multi-group `-r` replacement, to tabulate the unresolved G-KEY lines. Replaced by `rg -n "cannot resolve G-KEY"`, which printed the full lines.
3. A `jq --slurpfile …` program, to diff each unit's student-facing proper nouns against its sweep entity names. Replaced by the bounded real-place scan. The full entity-level diff remains unrun and is listed under "Not done" in the report.

## Deviations from the bead text

- **Where the exports went.** The bead said to export "into /tmp". `export_product.py` refuses any `--out` outside `pipeline/synthetic/infold/preview/` (R2 confinement, `check_out_dir`). So the exports went to the gitignored `preview/audit-hpf-v2nd/<unit>/` (`preview/.gitignore:4` `/*`), were linted there, then moved to `$S/exports` under /tmp and linted again.
- **M-ECHO corpus.** The bead asked for "the COMPLETE selected P5 corpus incl. batches 14–19". The corpus was the 19 roster source directories, all 128 roster units. Findings against the 8 retired units are listed, but kept apart from "live" findings.

## Deliverables (uncommitted)

| Path | Content |
|---|---|
| `pipeline/synthetic/infold/AUDIT-batches-1-13.md` | Summary table, per-unit findings with file:line and exact flag text, evidence register, lists (a)/(b)/(c) |
| `docs/worklog/hpf-v2nd.md` | This evidence log |

## Result

| List | Units | Recommendation |
|---|---:|---|
| (a) pass everything | 48 | ratify |
| (b) flags only | 33 | 31 ratify-with-note (2 conditional), 1 fix |
| (c) fails or missing evidence | 0 | — |

- **The fix:** `las-b7-002`. 'Ellen Sundqvist' is also the name of a different person in `las-b4-002`, a full-name law-13 collision the 2026-07-30 scan missed.
- **The conditionals:**
  - `las-b4-002`, on that fix;
  - `las-b6-003`, on a one-entity law-16 check of 'Sandviken'.
- **Evidence-record flags:**
  - E1 (5 batch 1 units): the V-FINAL record was folded without legs that exist in `verdicts-final/`.
  - E2 (8 campaign units): post-rename G-KEY vote 1 was unresolvable as `qN`; re-resolved here, 57/57 match.
  - E3 (las-b10-002): V-FINAL is older than a name-only rename.
- **Background flags:** cross-batch surname reuse (14 more units) and retired-only echoes (2).

## Progress

- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:research|E:989ccd66ccc269fba92d66b7bf36656bb0458019] Read the exporter, roster builder, mech/run_mech, lint, promote/aggregate/vfinal_fold/gkey_resolve, the runbook, the master, the cross-batch report and the real-entity report. Recorded the tool sha256s. Roster `--check` is current.
- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:verify|E:$S/roster-pending.sha256] `sha256sum -c` gave 81 OK. Ran 81 per-unit preview exports and 81 `--check` dry-runs: all accepted, 219 questions. Lint clean on 81 files, default and strict.
- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:verify|E:$S/mech-verdicts.jsonl] run_mech over 81 units with a 128-unit M-ECHO corpus and the authentic corpus: 0 kills, 19 M-ECHO flags (36 findings, 28 live).
- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:verify|E:$S/vfinal] promote `--require-clean` ×13: 81/81 PASS. vfinal_fold re-derivation equals the record for 81/81. Found E1 (batch 1 legs in `verdicts-final/`), E2 (57 unresolved `qN` vote-1 records, all matching the keys) and E3 (las-b10-002).
- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:verify|E:adjudication/real-entity] Sweep coverage 81/81. The 9 collision units were repaired and re-audited; the collision names are gone from the exported strings. The bounded real-place scan found las-b6-003 'Sandviken' unclassified.
- 2026-10-07 [S:ci-m7pwm|W:hpf-v2nd|H:report|E:pipeline/synthetic/infold/AUDIT-batches-1-13.md] Moved the exports to /tmp and linted them again (clean). Wrote the report and this worklog. `preview/` is back to its prior contents.

## Bead note

LANE DONE: hpf-v2nd

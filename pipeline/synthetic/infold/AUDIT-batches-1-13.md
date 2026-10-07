# Audit: legacy P5 batches 1–13 against today's gates

Bead `hpf-v2nd`, 2026-10-07. Read-only re-audit of the 81 `pending-owner-ratification` units (219 questions) in `approval-roster.json`, run before the owner's ratification takes effect ("ratify them, make sure they are up to par"). No candidate, ruling, roster or gate file was edited. Evidence log: [`docs/worklog/hpf-v2nd.md`](../../../docs/worklog/hpf-v2nd.md).

- **Head:** `989ccd66ccc269fba92d66b7bf36656bb0458019` (PR #375, which includes the R1/R2 exporter fixes).
- **Roster bytes:** `approval-roster.json` sha256 `9ccfe9a41b0942f50c68496160c2fa9c8e1e6e308be7814e416ca3c047dddc65`. `build_roster.py --check` reports it current.
- **Candidate bytes:** all 81 match the roster. `sha256sum -c` over a checklist taken mechanically from the roster gives 81 × OK, and every export re-checks sha256 and the content digest.

## Verdict

| Result | Units | Recommendation |
|---|---:|---|
| **(a) Pass all five checks** | 48 | Ratify |
| **(b) Flags only** | 33 | 31 ratify-with-note (2 of them conditional), **1 fix** (`las-b7-002`), 0 retire |
| **(c) Fail or missing evidence** | 0 | — |

Every unit passes the hard checks:
- 0 mech kills;
- 0 learner-lint findings;
- 81/81 promote `--require-clean` PASS;
- 81/81 V-FINAL records present and reproducible;
- 81/81 units covered by the real-entity sweep;
- 81/81 export dry-runs accepted.

The flags fall into six kinds, each explained under per-unit findings:
1. M-ECHO name reuse.
2. One full-name collision, 'Ellen Sundqvist' in `las-b4-002` and `las-b7-002`. The 2026-07-30 cross-batch scan never escalated it.
3. Gaps in how the V-FINAL evidence was recorded (E1, E2). In both, this audit re-checked the substance and it holds.
4. One V-FINAL record older than a name-only rename (E3).
5. One real place, Sandviken in `las-b6-003`, that the sweep never classified as an entity.
6. Two M-ECHO flags against retired units only.

## Summary table

`FLAG(n: k live)` gives n M-ECHO findings, k of them against a retained unit; the rest are against units in `RETIRED.json`, which are never exported. Codes:
- **E1:** batch 1's V-FINAL record was folded without the unit's blind legs (they are in `verdicts-final/`).
- **E2:** post-rename G-KEY vote 1 was never mechanically resolved; this audit compared the answers by hand and all match.
- **E3:** V-FINAL is older than a name-only rename.
- **R1:** a real place in the student text that the sweep did not classify.

The checks:
1. Mech gates.
2. Learner lint on the strings that would be exported.
3. Evidence (promote + V-FINAL).
4. Real-entity (law 16).
5. Export dry-run.

| Unit | Sec | Q | 1 Mech | 2 Lint | 3 Evidence | 4 Real-entity | 5 Export | Recommendation |
|---|---|---:|---|---|---|---|---|---|
| elf-b1-001 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b1-002 | ELF | 5 | PASS | PASS | FLAG(1) E1 | PASS | PASS | ratify-with-note |
| elf-b1-003 | ELF | 1 | PASS | PASS | FLAG(1) E1 | PASS | PASS | ratify-with-note |
| elf-b1-004 | ELF | 1 | PASS | PASS | FLAG(1) E1 | PASS | PASS | ratify-with-note |
| las-b1-001 | LÄS | 4 | PASS | PASS | PASS | PASS (repaired #361) | PASS | ratify |
| las-b1-002 | LÄS | 2 | PASS | PASS | FLAG(1) E1 | PASS | PASS | ratify-with-note |
| las-b1-003 | LÄS | 2 | PASS | PASS | FLAG(1) E1 | PASS | PASS | ratify-with-note |
| elf-b2-001 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b2-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b2-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b2-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b2-002 | LÄS | 2 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| las-b2-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b3-002 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b3-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b3-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b3-001 | LÄS | 4 | FLAG(2: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b3-002 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b3-003 | LÄS | 2 | FLAG(2: 2 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b4-001 | ELF | 5 | FLAG(2: 2 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b4-002 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b4-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b4-002 | LÄS | 2 | FLAG(4: 4 live, 1 full name) | PASS | PASS | PASS | PASS | ratify-with-note, conditional on the las-b7-002 fix |
| las-b4-003 | LÄS | 2 | FLAG(2: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b5-001 | ELF | 5 | FLAG(3: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b5-002 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b5-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b5-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b5-001 | LÄS | 4 | FLAG(3: 2 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b5-002 | LÄS | 2 | FLAG(1: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b5-003 | LÄS | 2 | FLAG(2: 2 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b6-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b6-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b6-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b6-002 | LÄS | 2 | FLAG(1: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b6-003 | LÄS | 2 | PASS | PASS | PASS | FLAG(1) R1 | PASS | ratify-with-note, conditional on a one-entity law-16 check |
| elf-b7-002 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b7-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b7-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b7-001 | LÄS | 4 | FLAG(1: 0 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b7-002 | LÄS | 2 | FLAG(2: 2 live, 1 full name) | PASS | PASS | PASS | PASS | **fix** (rename 'Ellen Sundqvist') |
| las-b7-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b8-002 | ELF | 5 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| elf-b8-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b8-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b8-002 | LÄS | 2 | FLAG(1: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b8-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b9-001 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b9-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b9-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b9-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b9-001 | LÄS | 4 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b9-002 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b9-003 | LÄS | 2 | FLAG(1: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b10-001 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b10-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b10-003 | ELF | 1 | FLAG(1: 1 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b10-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b10-001 | LÄS | 4 | FLAG(3: 3 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| las-b10-002 | LÄS | 2 | FLAG(2: 1 live) | PASS | FLAG(1) E3 | PASS | PASS | ratify-with-note |
| las-b10-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b11-001 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b11-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b11-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b11-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b11-002 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b11-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b12-001 | ELF | 5 | FLAG(2: 2 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b12-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b12-003 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b12-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b12-001 | LÄS | 4 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b12-002 | LÄS | 2 | PASS | PASS | FLAG(1) E2 | PASS (repaired #361) | PASS | ratify-with-note |
| las-b12-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b13-001 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b13-002 | ELF | 5 | PASS | PASS | PASS | PASS | PASS | ratify |
| elf-b13-003 | ELF | 1 | FLAG(1: 0 live) | PASS | PASS | PASS | PASS | ratify-with-note |
| elf-b13-004 | ELF | 1 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b13-001 | LÄS | 4 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b13-002 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |
| las-b13-003 | LÄS | 2 | PASS | PASS | PASS | PASS | PASS | ratify |

## How each check was run

All tools are the files at the pinned head; their sha256s are in the worklog. Gates ran on the exact roster bytes, after the sha256 check.

### 1. Mechanical gates

- **Command:** one `run_mech.py` run over the 81 candidate files.
  - `--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed`: readable, 27 exam files.
  - `--p5-corpus-dir`: all 19 roster source directories, batches 1–17 `candidates-final/` and 18–19 `candidates/`. M-ECHO reported "indexed 128 shipped unit(s)", the complete selection including the 8 retired units. `auto` would have missed batches 18–19.
- **Result:** 486 verdicts (81 × 6) and no kill. The process exited without a `KILL` line.
- **Per gate:**
  - M-SCHEMA, M-BANDS, M-TELL, M-FORM and M-PLAGIARISM pass on 81/81. None of these flag-capable gates raised a flag.
  - M-ECHO passes on 62 units and flags 19, with 36 findings in all. 28 findings concern a retained unit and 8 a retired one. No unit echoes any batch 14–19 unit.

### 2. Learner-output lint (default mode)

- **Why the exports went where they did.** `export_product.py` refuses any `--out` outside `pipeline/synthetic/infold/preview/`: the R2 confinement in this head, `check_out_dir`. So the per-unit exports could not be written to `/tmp` directly.
- **The run, per unit:**
  1. Each unit was exported with `--include-pending --release preview-audit --units <unit>` to the gitignored `preview/audit-hpf-v2nd/<unit>/`.
  2. Each was linted there: `lint_learner_output.py preview/audit-hpf-v2nd` → `learner-output lint: clean — 81 file(s)`. A `--strict` run as information was also clean.
  3. The directory was moved to `/tmp/…/scratchpad/hpf-v2nd/exports` and linted again there → `clean — 81 file(s)`. Bank sha256 values are unchanged, e.g. `elf-b1-001` `cfeb8ffd…4092`.
- **Exporter's own scan.** Its lint gate reported "learner lint clean" on every unit, 1 257 strings in all (each unit's title and passage, plus the prompt and four options of all 219 questions), and every manifest records `"findings": []`.

### 3. Evidence: promote and V-FINAL

- **Promote.** `promote.py --batch-dir batches/batchN --candidates-dir batches/batchN/candidates-final --verdicts batches/batchN/verdicts.jsonl --require-clean` for N = 1–13. That is the explicit candidate directory and merged verdict file that `docs/p5-infold-design.md:102` asks for.
  - All 81 pending units PASS.
  - The only HOLDs are the retired `elf-b7-001`, `elf-b8-001` and `las-b8-001` (`gate-fleet: DEAD (killed_by=G-STEM)`), as the #361 closeout recorded.
  - Batches 2–4 print orphan warnings for killed, never-shipped candidates (`las-b2-001`, `elf-b3-001`, `elf-b4-004`, `las-b4-001`); none is a pending unit.
- **V-FINAL re-derivation.** `vfinal_fold.py` was re-run per batch with `--verdicts-dir verdicts-vfinal --audits-dir audits --candidates-dir candidates-final --out /tmp/…`, never into the batch.
  - The re-derived verdict equals the recorded `reviews/final_verify.jsonl` verdict for 81/81.
  - The note strings are identical too, except batch 6, whose 2026-07-23 records predate the `gkey_flags` field; the values match.
- **Leg coverage.** Checked per question:
  - every pending unit has an `audits/<unit>.json`;
  - every unit has G-KEY votes 1 and 2 and at least one G-DISTRACTOR record per question;
  - batch 1's legs are in `verdicts-final/`, which is E1.
- **Currency.** `git log` on each `candidates-final/<unit>.json` against `audits/<unit>.json`. Only two units changed bytes after their last audit:
  - `las-b3-002` (4791084, PR #356): metadata only, the added `generator_meta.serving_constraint`. No student-facing change, so not a finding.
  - `las-b10-002` (4791084, a name-only rename): E3.

### 4. Real-entity (law 16)

- **Sweep coverage.** All 81 units are keys in `adjudication/real-entity/verdicts-*.json`, the 2026-07-30 whole-bank sweep (PR #360). Lines are in the evidence register below.
- **Collisions.** The sweep found 16 collisions (`REPORT.md:10-11`). 9 pending units carried one, and all 9 were repaired in PR #361 (4681b85). Each repaired unit has:
  - a search-log `originality_note` (GENERATION.md law 16 amendment, `GENERATION.md:203`);
  - a post-rename re-audit `CONFIRMED_NOTES`;
  - none of the collision names left in its exported student strings.
- **Bounded real-place scan.** A list of real Swedish, Nordic, UK and US places was searched in all 81 exported banks, and each hit checked against that unit's sweep entries. Every hit is covered, with one exception: `las-b6-003` 'Sandviken' (R1). The others are:
  - a sweep entity of the unit: Örebro, Härnösand, Stockholm, Narvik, Skaraborg, Umeå, Gävle, Norrland, Jämtlandsfjällen, Storlien;
  - covered inside a sweep entry: Gotland in elf-b4-001's Sabina entry, `verdicts-b4-5-6.json:7`;
  - covered by the campaign search log: 'Tessendale, Ohio' in elf-b1-001, `candidates-final/elf-b1-001.json:146`.

  Hits that were only substrings of swept names (Lundh, Lundqvist, Verrand Tower) were dismissed.
- **Not done:** a full entity-level re-sweep and any web check. No network was available, and the attempt to mechanise the entity diff was refused by the worker allowlist; see the worklog.

### 5. Export contract dry-run

- **Per-unit export.** 81/81 accepted, 219 questions in all. Each runs all 14 gates, including sha256 and content digest, internal metadata and qid format, plus the double-build determinism check.
- **Second process.** `--check` against the written files reports `checked …` for 81/81: the bytes are identical across processes.
- **Independent checks on the banks:**
  - 219/219 qids match `p5-(las-bN-NNN-r1-LÄS|elf-bN-NNN-r1-ELF)-NNN`;
  - no internal key (`rationale`, `generator_meta`, `family`, `repair_log`, `key`, `q_index`, `passage`, `candidate_id`, …) occurs in any bank.
- **Pins.** Every manifest pins roster `9ccfe9a4…dc65`, RETIRED.json `5e7a1031…15d0` and exporter `b370f30c…a97e`.

## Per-unit findings

Units with any flag, in roster order. M-ECHO flag texts are quoted verbatim from the `run_mech.py` output, `/tmp/…/scratchpad/hpf-v2nd/mech-verdicts.jsonl`. Every name below sits on its unit's passage line, `candidates-final/<unit>.json:6`.

### elf-b1-001: E2

- **Recorded V-FINAL:** `batches/batch1/reviews/final_verify.jsonl:1`, "gkey_records=10 gkey_kills=0 gkey_flags=5 … audit=CONFIRMED_NOTES".
- **The flags.** The 5 flags are the post-rename vote-1 G-KEY records at `verdicts-vfinal/verdicts-gkey-resolved.jsonl:1-5` (entityfix) and `:10-14` (entityfix-r2), each "no key found for (elf-b1-001, q:None) — cannot resolve G-KEY". Their target is `q1`…`q5` rather than `q:1`, which `gkey_resolve.py:65` cannot parse.
- **Re-resolved by this audit.** The solver answers C/A/D/B/A equal the roster keys (`candidates-final/elf-b1-001.json:29,53,77,101,125`). Vote 2 is resolved PASS at `:23-27` and `:32-36`.
- **Real-entity.** The 'Fenwick Institute for Lifespan Research' collision (`verdicts-b1-2-3.json:4-6`) was renamed. 'Merritt, Ohio' became 'Tessendale, Ohio' in round 2 (search log `candidates-final/elf-b1-001.json:146`). Re-audit: `audits/elf-b1-001.json:3` CONFIRMED_NOTES.

### elf-b1-002, elf-b1-003, elf-b1-004, las-b1-002, las-b1-003: E1

- **Recorded V-FINAL** (`batches/batch1/reviews/final_verify.jsonl`):

  | Unit | Line | Recorded note |
  |---|---:|---|
  | elf-b1-002 | `:2` | `gkey_records=0 … audit=CONFIRMED_NOTES audit_minor=3` |
  | elf-b1-003 | `:3` | `gkey_records=0 … audit=CONFIRMED` |
  | elf-b1-004 | `:4` | `gkey_records=0 … audit_minor=1` |
  | las-b1-002 | `:6` | `gkey_records=0 … audit_minor=1` |
  | las-b1-003 | `:7` | `gkey_records=0 … audit_minor=1` |

  The fold read `verdicts-vfinal/`, which holds no record for these units. `vfinal_fold.py` does not require legs, only the audit (`vfinal_fold.py:84`).
- **The legs exist.** Fresh blind legs for all five are in `batches/batch1/verdicts-final/`. Every G-KEY record is resolved `q:N` PASS; every G-DISTRACTOR is PASS except las-b1-002 q:2, a flag.

  | Unit | G-KEY vote 1 | G-KEY vote 2 | G-DISTRACTOR |
  |---|---|---|---|
  | elf-b1-002 | `:14-18` | `:35-39` | `:14-18` |
  | elf-b1-003 | `:19` | `:40` | `:19` |
  | elf-b1-004 | `:20-21` | `:41-42` | `:20-21` |
  | las-b1-002 | `:5-6` | `:26-27` | `:5-6` |
  | las-b1-003 | `:7-8` | `:28-29` | `:7-8` |

  G-KEY lines are in `verdicts-gkey-resolved.jsonl`, G-DISTRACTOR lines in `verdicts-gdistractor.jsonl`. elf-b1-004 carries its post-redesign re-gate as the second line.
- **They were added in a0a91b5 (PR #335).** That is also the commit of the last content change for elf-b1-002, elf-b1-004, las-b1-002 and las-b1-003. elf-b1-003 last changed earlier, in 7f3cea5 (PR #332). So every leg set is at least as new as its unit's bytes.
- **Re-folding against `verdicts-final/` reproduces every recorded verdict:** VERIFIED_NOTES with gkey_records=10, VERIFIED with 2, VERIFIED_NOTES with 2, 4 and 4 (`/tmp/…/vfinal/batch1-from-verdicts-final.jsonl`).

### las-b2-002: E2

- **Recorded V-FINAL:** `batches/batch2/reviews/final_verify.jsonl:5`, "gkey_records=6 gkey_kills=0 gkey_flags=2 …".
- **Unresolved vote 1:** `verdicts-vfinal/verdicts-gkey-resolved.jsonl:21-22`, "no key found for (las-b2-002, q:None) — cannot resolve G-KEY". The answers B/D equal the keys at `candidates-final/las-b2-002.json:29,53`. Vote 2 is resolved PASS at `:43-44`.
- **Real-entity.** The collision 'Sörgårdsskolan' (`verdicts-b1-2-3.json:254-256`) became Klöverhagsskolan. The cross-unit reuses 'Kvarnby' and 'Almvik' became Häggnora and Fagerhammar (search log `candidates-final/las-b2-002.json:86`). Re-audit: `audits/las-b2-002.json:3` CONFIRMED_NOTES.

### elf-b3-002: E2

- **Recorded V-FINAL:** `batches/batch3/reviews/final_verify.jsonl:1`.
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:20-24`, same "cannot resolve G-KEY" text. The answers C/A/D/B/C equal the keys at `candidates-final/elf-b3-002.json:29,53,77,101,125`. Vote 2 is resolved PASS at `:44-48`.
- **Real-entity.** 'Aurora' (`verdicts-b1-2-3.json:312-314`) became Nattrand, plus Vaneby Rail, Anneke Verholt and Miles Wrensham (`reviews/pedagogy.jsonl:10`; search log `candidates-final/elf-b3-002.json:162`). Re-audit: `audits/elf-b3-002.json:3` CONFIRMED_NOTES.
- **Context.** Exclusion pair with `las-b3-002`, awaiting the owner's confirmation (ROSTER.md).

### las-b3-001: M-ECHO FLAG(2: 1 live)

- Findings:
  - "name reuse: ['Ahlgren'] already used in las-b5-002 — law 13 forbids reusing invented names across units". Karin Ahlgren here; Petter Ahlgren in las-b5-002.
  - "name reuse: ['Ingrid Sahlberg', 'Sahlberg'] already used in elf-b6-001 — law 13 forbids reusing invented names across units". The counterpart is retired (`RETIRED.json:5`). This was cross-batch F6's hard collision (`adjudication/cross-batch-report.md:188`), resolved when elf-b6-001 was retired.

### las-b3-003: M-ECHO FLAG(2: 2 live)

- Findings:
  - "name reuse: ['Lindqvist'] already used in las-b4-002 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Lindqvist'] already used in las-b5-001 — law 13 forbids reusing invented names across units".
- The people are Harriet Lindqvist here, Petra Lindqvist (las-b4-002) and Vidar Lindqvist (las-b5-001). This is the family the 2026-07-30 scan listed ("Lindqvist / Lindholm … four bylines", `cross-batch-report.md:195`).

### elf-b4-001: M-ECHO FLAG(2: 2 live)

- Findings:
  - "name reuse: ['Frisk'] already used in las-b10-001 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Frisk'] already used in elf-b12-001 — law 13 forbids reusing invented names across units".
- Elias Frisk here; Karl-Otto Frisk in las-b10-001; Owen Frisk in elf-b12-001.

### elf-b4-002: E2

- **Recorded V-FINAL:** `batches/batch4/reviews/final_verify.jsonl:2`.
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:16-20` (entityfix) and `:21-25` (entityfix-r2). The answers C/A/D/B/C equal the keys at `candidates-final/elf-b4-002.json:29,53,77,101,125`. Vote 2 is resolved PASS at `:41-45`.
- **Real-entity.** 'Rundgång' (`verdicts-b4-5-6.json:36-38`) was renamed (search log `candidates-final/elf-b4-002.json:163`). Re-audit: `audits/elf-b4-002.json:3` CONFIRMED_NOTES.

### las-b4-002: M-ECHO FLAG(4: 4 live, 1 full name)

- Findings:
  - "name reuse: ['Lindqvist'] already used in las-b3-003 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Lindqvist'] already used in las-b5-001 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Sundqvist'] already used in las-b5-003 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Ellen Sundqvist', 'Sundqvist'] already used in las-b7-002 — law 13 forbids reusing invented names across units".
- **The full-name collision.** 'Ellen Sundqvist' is an urban-ecology researcher here ("När Ellen Sundqvist och hennes kollegor vid Institutionen för stadsekologi i Örebro…", `candidates-final/las-b4-002.json:6`). In `las-b7-002` the same name belongs to a traffic planner ("Trafikplaneraren Ellen Sundqvist", `batch7/candidates-final/las-b7-002.json:6`, and the q1 prompt at `:10`). Two different people share one full name.
- **It was never escalated.** This is the class the 2026-07-30 scan called a ship-blocker (F6, `cross-batch-report.md:181-213`: Ottilie Brandt, Ingrid Sahlberg). That table missed this pair, and the master never escalated it. M-ECHO first counted it among the 40 "surname family" name findings when it was introduced (`gates/evalset/runs/2026-07-30-m-echo/RESULT.md:111-114`).
- **Shared motif.** Both units also belong to cross-batch F7's "weakest gap" motif group (`cross-batch-report.md:228-232`).
- **Sweep.** Both persons were swept clear (`verdicts-b4-5-6.json:76-79`, `verdicts-b7-8.json:164-167`). Law 16 is not the issue; law 13 is.

### las-b4-003: M-ECHO FLAG(2: 1 live)

- Findings:
  - "name reuse: ['Öberg'] already used in las-b10-002 — law 13 forbids reusing invented names across units". Marika Öberg here, Marianne Öberg there.
  - "name reuse: ['Öberg'] already used in las-b11-001 — law 13 forbids reusing invented names across units". The counterpart is retired (`RETIRED.json:29`).
- The scan had listed it: "Öberg … three bylines", `cross-batch-report.md:193`.

### elf-b5-001: M-ECHO FLAG(3: 1 live)

- Findings:
  - "phrase echo: 41 shared 6-grams with elf-b6-001 — passage may reuse its architecture (law 12) or its phrase families (law 14)", quote "she agrees but only so far". The counterpart is retired (`RETIRED.json:5`).
  - "phrase echo: 29 shared 6-grams with elf-b7-001 — passage may reuse its architecture (law 12) or its phrase families (law 14)", quote "read whole is more divided than". The counterpart is retired (`RETIRED.json:11`).
  - "name reuse: ['Brandt'] already used in elf-b10-003 — law 13 forbids reusing invented names across units". Ottilie Brandt here, Ivar Brandt there.
- elf-b5-001 is the original that the two retired clones copied (master ÄGARBLICK A, `ADJUDICATION-MASTER.md:16-17`).

### elf-b5-002: E2

- **Recorded V-FINAL:** `batches/batch5/reviews/final_verify.jsonl:2`.
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:21-25`. The answers B/A/C/D/B equal the keys at `candidates-final/elf-b5-002.json:29,53,77,101,125`. Vote 2 is resolved PASS at `:46-50`.
- **Real-entity.** 'Verran coast', 'Verran guild' and 'Halden' (`verdicts-b4-5-6.json:136-156`) were renamed (search log `candidates-final/elf-b5-002.json:158`). Re-audit: `audits/elf-b5-002.json:3` CONFIRMED_NOTES.
- **Context.** ÄGARBLICK B: the Ottilie Brandt rename landed in 4791084.

### las-b5-001: M-ECHO FLAG(3: 2 live)

- Findings:
  - "name reuse: ['Lindqvist'] already used in las-b3-003 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Lindqvist'] already used in las-b4-002 — law 13 forbids reusing invented names across units". Vidar Lindqvist here.
  - "phrase echo: 40 shared 6-grams with las-b6-001 — passage may reuse its architecture (law 12) or its phrase families (law 14)", quote "efter en förklaring till varför somliga". The counterpart is a retired clone (`RETIRED.json:17`).

### las-b5-002: M-ECHO FLAG(1: 1 live)

- "name reuse: ['Ahlgren'] already used in las-b3-001 — law 13 forbids reusing invented names across units". Petter Ahlgren here.

### las-b5-003: M-ECHO FLAG(2: 2 live)

- Findings:
  - "name reuse: ['Sundqvist'] already used in las-b4-002 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Sundqvist'] already used in las-b7-002 — law 13 forbids reusing invented names across units".
- Märta Sundqvist here.

### las-b6-002: M-ECHO FLAG(1: 1 live)

- "name reuse: ['Åkerlund'] already used in las-b8-002 — law 13 forbids reusing invented names across units". Gunnel Åkerlund here, Ingrid Åkerlund there. The scan listed it: `cross-batch-report.md:194`.

### las-b6-003: R1

- **The sentence:** "En liten uppföljning som pedagogen Ellen Boström gjorde vid en grundskola i Sandviken" (`candidates-final/las-b6-003.json:6`). Sandviken is a real Swedish town.
- **What the sweep has.** The unit's entry lists only Ellen Boström and Marianne Sjökvist (`verdicts-b4-5-6.json:386-399`). The entity file mentions Sandviken only inside Boström's role (`entities-b4-5-6.json:332`). The town was never classified.
- **The same town elsewhere.** In `las-b12-002` the sweep ruled Sandviken SHIP-BLOCKING, because that passage attached a specific fabricated fact about the town and an identifiable private individual (`verdicts-b11-12.json:394-397`). It treated a real city used as a bare locator for an invented institute as 'near' (`verdicts-b11-12.json:391`).
- **Here,** an unnamed school hosts an invented person's small study, which reads as the bare-locator case. This audit had no network, so it could not verify that.

### elf-b7-002: E2

- **Recorded V-FINAL:** `batches/batch7/reviews/final_verify.jsonl:2`.
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:21-25` and `:26-30`. The answers C/B/D/A/B equal the keys at `candidates-final/elf-b7-002.json:29,53,77,101,125`. Vote 2 is resolved PASS at `:51-55`.
- **Real-entity.** 'Northern Assurance Office' (`verdicts-b7-8.json:42-44`) was renamed (search log `candidates-final/elf-b7-002.json:163`). Re-audit: `audits/elf-b7-002.json:3` CONFIRMED_NOTES.

### las-b7-001: M-ECHO FLAG(1: 0 live)

- "phrase echo: 30 shared 6-grams with las-b8-001 — passage may reuse its architecture (law 12) or its phrase families (law 14)", quote "hon en besvärande möjlighet är att".
- The counterpart is the retired clone of this unit (`RETIRED.json:23`; master ÄGARBLICK A, `ADJUDICATION-MASTER.md:18`).

### las-b7-002: M-ECHO FLAG(2: 2 live, 1 full name)

- Findings:
  - "name reuse: ['Ellen Sundqvist', 'Sundqvist'] already used in las-b4-002 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Sundqvist'] already used in las-b5-003 — law 13 forbids reusing invented names across units".
- The full-name collision is described under las-b4-002. The name occurs at `candidates-final/las-b7-002.json:6` (passage) and `:10` (q1 prompt).
- **Context.** 'Kvarnby' is a real Malmö district, swept 'near' (`verdicts-b7-8.json:152-155`). Its reuse with las-b2-002 was cleared by the #361 rename there.

### elf-b8-002: E2

- **Recorded V-FINAL:** `batches/batch8/reviews/final_verify.jsonl:2`.
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:21-25`. The answers B/C/A/D/B equal the keys at `candidates-final/elf-b8-002.json:29,53,77,101,125`. Vote 2 is resolved PASS at `:46-50`.
- **Real-entity.** 'Bellwether' (`verdicts-b7-8.json:224-226`) was renamed (search log `candidates-final/elf-b8-002.json:163`). Re-audit: `audits/elf-b8-002.json:3` CONFIRMED_NOTES.

### las-b8-002: M-ECHO FLAG(1: 1 live)

- "name reuse: ['Åkerlund'] already used in las-b6-002 — law 13 forbids reusing invented names across units". Ingrid Åkerlund here.

### las-b9-003: M-ECHO FLAG(1: 1 live)

- "name reuse: ['Sundelius'] already used in las-b10-001 — law 13 forbids reusing invented names across units". Petra Sundelius here, Marit Sundelius there. The scan listed it: `cross-batch-report.md:196`.

### elf-b10-003: M-ECHO FLAG(1: 1 live)

- "name reuse: ['Brandt'] already used in elf-b5-001 — law 13 forbids reusing invented names across units". Ivar Brandt here. The scan listed it: `cross-batch-report.md:197`.

### las-b10-001: M-ECHO FLAG(3: 3 live)

- Findings:
  - "name reuse: ['Frisk'] already used in elf-b4-001 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Sundelius'] already used in las-b9-003 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Frisk'] already used in elf-b12-001 — law 13 forbids reusing invented names across units".
- Karl-Otto Frisk and Marit Sundelius here.

### las-b10-002: M-ECHO FLAG(2: 1 live), E3

- **M-ECHO:**
  - "name reuse: ['Öberg'] already used in las-b4-003 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Öberg'] already used in las-b11-001 — law 13 forbids reusing invented names across units". The counterpart is retired (`RETIRED.json:29`).
- **E3, the rename.** 4791084 (PR #356) changed student-facing text after V-FINAL: 'Ingrid Salomonsson' became 'Ylva Tenglund' in the passage (twice) and in the q1 prompt. That was ÄGARBLICK B.
- **E3, what is older.** The unit's audit (`audits/las-b10-002.json`, last changed 6382d4f, PR #351) and its V-FINAL legs predate the rename. #356 changed no file in `batch10/verdicts-vfinal/`; it only re-folded `reviews/final_verify.jsonl:6`.
- **E3, what was recorded.** The rename record says "keys, options, stems (beyond the name), traps and key_spread untouched, so no G-KEY/G-DISTRACTOR re-gate is implied. Mech gates pass on both files (M-SCHEMA/M-BANDS/M-TELL/M-FORM, --no-plagiarism)" (`batches/batch10/reviews/pedagogy.jsonl:10`).
- **Today.** Today's full mech run, M-PLAGIARISM included, passes, and the sweep covers 'Ylva Tenglund' (`verdicts-b9-10.json:352`).

### elf-b12-001: M-ECHO FLAG(2: 2 live)

- Findings:
  - "name reuse: ['Frisk'] already used in elf-b4-001 — law 13 forbids reusing invented names across units";
  - "name reuse: ['Frisk'] already used in las-b10-001 — law 13 forbids reusing invented names across units".
- Owen Frisk here.

### las-b12-002: E2

- **Recorded V-FINAL:** `batches/batch12/reviews/final_verify.jsonl:6`, "gkey_records=6 gkey_kills=0 gkey_flags=2 …".
- **Unresolved vote 1:** `verdicts-gkey-resolved.jsonl:30-31`. The answers C/A equal the keys at `candidates-final/las-b12-002.json:29,53`. Vote 2 is resolved PASS at `:61-62`.
- **Real-entity.** 'Sandviken' here was a SHIP-BLOCKING collision (`verdicts-b11-12.json:394-396`) and was renamed (search log `candidates-final/las-b12-002.json:89`). Re-audit: `audits/las-b12-002.json:3` CONFIRMED_NOTES.

### elf-b13-003: M-ECHO FLAG(1: 0 live)

- "name reuse: ['Halloran'] already used in elf-b8-001 — law 13 forbids reusing invented names across units". Dev Halloran here.
- The counterpart is retired (`RETIRED.json:35`). No retained unit uses Halloran: elf-b7-002 lost it in the #361 rename.

### Context on clean units (not findings)

- **las-b1-001.** Its post-repair blind legs are fully resolved: clean-rerun2 vote 1 at `batch1/verdicts-vfinal/verdicts-gkey-resolved.jsonl:19-22`, and votes 2 at `:28-31` and `:37-44`. The older unresolved lines `:6-9` and `:15-18` are stale copies from the same campaign. The #361 commit records that the fabricated vote-1 lines were quarantined.
- **las-b2-003.** ÄGARBLICK D: q1's 'bäst' stem was left to the owner's eye. The third redesign and its V-FINAL legs and audit landed together in 4791084, so the evidence is current. This audit does not re-judge the stem.
- **las-b3-002.** ÄGARBLICK C. Its exclusion pair with elf-b3-002 awaits the owner's confirmation (ROSTER.md). The 4791084 change after its audit is metadata only.

## Evidence register (checks 3 and 4, every unit)

How to read the columns:
- **Promote today:** the `--require-clean` run above. All 81 PASS.
- **Recorded promote:** the batch's own record of `--require-clean` exiting 0:
  - batch 1: `batch1/ADJUDICATION.md:2`;
  - batch 2: `batch2/STATUS.md:50`;
  - batches 3–13, in `batchN/STATUS.md`: b3 `:5`, b4 `:3`, b5 `:28`, b6 `:27`, b7 `:23`, b8 `:31`, b9 `:22`, b10 `:17`, b11 `:16`, b12 `:22`, b13 `:17`.
  - The #361 closeout's "FULL GATE SWEEP … 1,2,3,4,5,6,9,10,11,12,13 exit 0; 7 and 8 hold only retired units" is in commit 4681b85.
- **V-FINAL:** `batchN/reviews/final_verify.jsonl:<line>` and its verdict, which the re-derivation reproduces.
- **Sweep:** the line of the unit's key in `adjudication/real-entity/verdicts-<file>.json`.

| Unit | V-FINAL | Sweep |
|---|---|---|
| elf-b1-001 | b1 `:1` VERIFIED_NOTES | `b1-2-3:2` (collision repaired) |
| elf-b1-002 | b1 `:2` VERIFIED_NOTES | `b1-2-3:22` |
| elf-b1-003 | b1 `:3` VERIFIED | `b1-2-3:30` |
| elf-b1-004 | b1 `:4` VERIFIED_NOTES | `b1-2-3:50` |
| las-b1-001 | b1 `:5` VERIFIED_NOTES | `b1-2-3:70` (collision repaired) |
| las-b1-002 | b1 `:6` VERIFIED_NOTES | `b1-2-3:108` |
| las-b1-003 | b1 `:7` VERIFIED_NOTES | `b1-2-3:134` |
| elf-b2-001 | b2 `:1` VERIFIED_NOTES | `b1-2-3:160` |
| elf-b2-002 | b2 `:2` VERIFIED | `b1-2-3:186` |
| elf-b2-003 | b2 `:3` VERIFIED_NOTES | `b1-2-3:206` |
| elf-b2-004 | b2 `:4` VERIFIED | `b1-2-3:226` |
| las-b2-002 | b2 `:5` VERIFIED_NOTES | `b1-2-3:240` (collision repaired) |
| las-b2-003 | b2 `:6` VERIFIED_NOTES | `b1-2-3:272` |
| elf-b3-002 | b3 `:1` VERIFIED_NOTES | `b1-2-3:304` (collision repaired) |
| elf-b3-003 | b3 `:2` VERIFIED_NOTES | `b1-2-3:330` |
| elf-b3-004 | b3 `:3` VERIFIED_NOTES | `b1-2-3:356` |
| las-b3-001 | b3 `:4` VERIFIED_NOTES | `b1-2-3:376` |
| las-b3-002 | b3 `:5` VERIFIED_NOTES | `b1-2-3:420` |
| las-b3-003 | b3 `:6` VERIFIED_NOTES | `b1-2-3:452` |
| elf-b4-001 | b4 `:1` VERIFIED | `b4-5-6:2` |
| elf-b4-002 | b4 `:2` VERIFIED_NOTES | `b4-5-6:34` (collision repaired) |
| elf-b4-003 | b4 `:3` VERIFIED | `b4-5-6:54` |
| las-b4-002 | b4 `:4` VERIFIED | `b4-5-6:74` |
| las-b4-003 | b4 `:5` VERIFIED_NOTES | `b4-5-6:94` |
| elf-b5-001 | b5 `:1` VERIFIED | `b4-5-6:108` |
| elf-b5-002 | b5 `:2` VERIFIED_NOTES | `b4-5-6:134` (collision repaired) |
| elf-b5-003 | b5 `:3` VERIFIED | `b4-5-6:166` |
| elf-b5-004 | b5 `:4` VERIFIED | `b4-5-6:180` |
| las-b5-001 | b5 `:5` VERIFIED | `b4-5-6:194` |
| las-b5-002 | b5 `:6` VERIFIED_NOTES | `b4-5-6:214` |
| las-b5-003 | b5 `:7` VERIFIED_NOTES | `b4-5-6:240` |
| elf-b6-002 | b6 `:2` VERIFIED_NOTES | `b4-5-6:286` |
| elf-b6-003 | b6 `:3` VERIFIED | `b4-5-6:306` |
| elf-b6-004 | b6 `:4` VERIFIED | `b4-5-6:326` |
| las-b6-002 | b6 `:6` VERIFIED | `b4-5-6:372` |
| las-b6-003 | b6 `:7` VERIFIED | `b4-5-6:386` (Sandviken unclassified) |
| elf-b7-002 | b7 `:2` VERIFIED_NOTES | `b7-8:28` (collision repaired) |
| elf-b7-003 | b7 `:3` VERIFIED | `b7-8:60` |
| elf-b7-004 | b7 `:4` VERIFIED_NOTES | `b7-8:80` |
| las-b7-001 | b7 `:5` VERIFIED_NOTES | `b7-8:100` |
| las-b7-002 | b7 `:6` VERIFIED_NOTES | `b7-8:150` |
| las-b7-003 | b7 `:7` VERIFIED | `b7-8:176` |
| elf-b8-002 | b8 `:2` VERIFIED_NOTES | `b7-8:222` (collision repaired) |
| elf-b8-003 | b8 `:3` VERIFIED_NOTES | `b7-8:242` |
| elf-b8-004 | b8 `:4` VERIFIED_NOTES | `b7-8:256` |
| las-b8-002 | b8 `:6` VERIFIED_NOTES | `b7-8:308` |
| las-b8-003 | b8 `:7` VERIFIED_NOTES | `b7-8:340` |
| elf-b9-001 | b9 `:1` VERIFIED_NOTES | `b9-10:2` |
| elf-b9-002 | b9 `:2` VERIFIED_NOTES | `b9-10:34` |
| elf-b9-003 | b9 `:3` VERIFIED_NOTES | `b9-10:48` |
| elf-b9-004 | b9 `:4` VERIFIED_NOTES | `b9-10:62` |
| las-b9-001 | b9 `:5` VERIFIED_NOTES | `b9-10:76` |
| las-b9-002 | b9 `:6` VERIFIED_NOTES | `b9-10:126` |
| las-b9-003 | b9 `:7` VERIFIED_NOTES | `b9-10:158` |
| elf-b10-001 | b10 `:1` VERIFIED_NOTES | `b9-10:184` |
| elf-b10-002 | b10 `:2` VERIFIED_NOTES | `b9-10:228` |
| elf-b10-003 | b10 `:3` VERIFIED_NOTES | `b9-10:254` |
| elf-b10-004 | b10 `:4` VERIFIED_NOTES | `b9-10:262` |
| las-b10-001 | b10 `:5` VERIFIED_NOTES | `b9-10:276` |
| las-b10-002 | b10 `:6` VERIFIED_NOTES | `b9-10:350` |
| las-b10-003 | b10 `:7` VERIFIED_NOTES | `b9-10:376` |
| elf-b11-001 | b11 `:1` VERIFIED_NOTES | `b11-12:2` |
| elf-b11-002 | b11 `:2` VERIFIED_NOTES | `b11-12:46` |
| elf-b11-003 | b11 `:3` VERIFIED_NOTES | `b11-12:66` |
| elf-b11-004 | b11 `:4` VERIFIED_NOTES | `b11-12:74` |
| las-b11-002 | b11 `:6` VERIFIED_NOTES | `b11-12:156` |
| las-b11-003 | b11 `:7` VERIFIED_NOTES | `b11-12:182` |
| elf-b12-001 | b12 `:1` VERIFIED_NOTES | `b11-12:208` |
| elf-b12-002 | b12 `:2` VERIFIED_NOTES | `b11-12:246` |
| elf-b12-003 | b12 `:3` VERIFIED_NOTES | `b11-12:260` |
| elf-b12-004 | b12 `:4` VERIFIED_NOTES | `b11-12:274` |
| las-b12-001 | b12 `:5` VERIFIED_NOTES | `b11-12:294` |
| las-b12-002 | b12 `:6` VERIFIED_NOTES | `b11-12:374` (collision repaired) |
| las-b12-003 | b12 `:7` VERIFIED_NOTES | `b11-12:406` |
| elf-b13-001 | b13 `:1` VERIFIED_NOTES | `b13-14:2` |
| elf-b13-002 | b13 `:2` VERIFIED_NOTES | `b13-14:40` |
| elf-b13-003 | b13 `:3` VERIFIED_NOTES | `b13-14:60` |
| elf-b13-004 | b13 `:4` VERIFIED_NOTES | `b13-14:80` |
| las-b13-001 | b13 `:5` VERIFIED_NOTES | `b13-14:100` |
| las-b13-002 | b13 `:6` VERIFIED_NOTES | `b13-14:168` |
| las-b13-003 | b13 `:7` VERIFIED_NOTES | `b13-14:218` |

## Lists

### (a) Pass everything: ratify (48)

- **Batch 1:** las-b1-001
- **Batch 2:** elf-b2-001, elf-b2-002, elf-b2-003, elf-b2-004, las-b2-003
- **Batch 3:** elf-b3-003, elf-b3-004, las-b3-002
- **Batch 4:** elf-b4-003
- **Batch 5:** elf-b5-003, elf-b5-004
- **Batch 6:** elf-b6-002, elf-b6-003, elf-b6-004
- **Batch 7:** elf-b7-003, elf-b7-004, las-b7-003
- **Batch 8:** elf-b8-003, elf-b8-004, las-b8-003
- **Batch 9:** elf-b9-001, elf-b9-002, elf-b9-003, elf-b9-004, las-b9-001, las-b9-002
- **Batch 10:** elf-b10-001, elf-b10-002, elf-b10-004, las-b10-003
- **Batch 11:** elf-b11-001, elf-b11-002, elf-b11-003, elf-b11-004, las-b11-002, las-b11-003
- **Batch 12:** elf-b12-002, elf-b12-003, elf-b12-004, las-b12-001, las-b12-003
- **Batch 13:** elf-b13-001, elf-b13-002, elf-b13-004, las-b13-001, las-b13-002, las-b13-003

Ratifying las-b2-003 also accepts its ÄGARBLICK D 'bäst' stem. Ratifying las-b3-002, with elf-b3-002, should come with the owner's word on their topic pair.

### (b) Flags only: recommendation per unit (33)

| Unit(s) | Flag | Recommendation | Why |
|---|---|---|---|
| **las-b7-002** | M-ECHO full-name collision 'Ellen Sundqvist' with las-b4-002 | **fix**: rename its 'Ellen Sundqvist' (passage and q1 prompt) | Two different people under one invented full name is the class the 2026-07-30 scan made a ship-blocker. That class got ÄNDRA for elf-b5-002 and las-b10-002, and in both the later unit was renamed. This is the later unit, its other flag (Sundqvist with las-b5-003) goes with the rename, and the two units already share a motif. The rename changes student-facing content, so the unit needs revision 2 in `REVISIONS`, a re-gate and its own ruling. |
| las-b4-002 | M-ECHO: the same full name; surnames Lindqvist ×2, Sundqvist | ratify-with-note, conditional on the las-b7-002 rename | Once las-b7-002 is renamed, only cross-batch surname reuse is left. If the owner prefers to rename here instead, swap the two recommendations. |
| las-b3-001, las-b3-003, elf-b4-001, las-b4-003, elf-b5-001, las-b5-001, las-b5-002, las-b5-003, las-b6-002, las-b8-002, las-b9-003, elf-b10-003, las-b10-001, elf-b12-001 | M-ECHO cross-batch surname reuse with different given names; on elf-b5-001, las-b5-001, las-b3-001 and las-b4-003 also findings against retired units | ratify-with-note | Law 13 forbids this for new units (`GENERATION.md:156`). These units predate the law and nobody required a repair. M-ECHO counted the families when it was introduced ("name findings unchanged (40 — the real surname families)", `RESULT.md:111-114`). The scan listed Öberg, Åkerlund, Lindqvist, Sundelius and Brandt (`cross-batch-report.md:193-197`), and the master escalated only same-batch or full-name collisions. None is same-batch. The cost is a mild "synthetic tell"; no key or answer depends on a name. The batch15+ name registry stops new reuse. A rename would push each unit to r2 with a re-gate and a new ruling. |
| las-b7-001, elf-b13-003 | M-ECHO against a retired unit only | ratify-with-note | The counterparts (las-b8-001, elf-b8-001) are in RETIRED.json and are never exported or served. |
| elf-b1-002, elf-b1-003, elf-b1-004, las-b1-002, las-b1-003 | E1 | ratify-with-note | The fresh blind legs (G-KEY ×2, G-DISTRACTOR) exist and all pass. They are no older than each unit's last content change (PR #335, or #332 for elf-b1-003). Re-folding against them reproduces every recorded verdict. Only the recorded derivation points at an empty directory. Optional housekeeping, not done here: re-derive batch 1's `final_verify.jsonl` from a merged leg set. |
| elf-b1-001, las-b2-002, elf-b3-002, elf-b4-002, elf-b5-002, elf-b7-002, elf-b8-002, las-b12-002 | E2 (collision repaired in #361) | ratify-with-note | Including las-b1-001's stale copies, 57 unresolved vote-1 records cover 38 questions, and all 57 answers equal the roster keys. Vote 2 is resolved PASS on the renamed bytes, G-DISTRACTOR was re-run, and every re-audit is CONFIRMED_NOTES. The collision names are absent from the exported strings. Optional housekeeping: re-run `gkey_resolve.py` with `q:N` targets. |
| las-b10-002 | E3; M-ECHO Öberg | ratify-with-note | The change after V-FINAL is a name-only rename. It was recorded with its reasoning, and no key, option or distractor changed. Today's full mech run, the lint and the export are clean, and the sweep covers the new name. For strict exact-bytes V-FINAL, re-run G-KEY ×2 and the audit; this is cheap. |
| las-b6-003 | R1: 'Sandviken' not classified | ratify-with-note, conditional on a one-entity law-16 check | By the sweep's own precedent this is a bare locator ('near'), not the las-b12-002 pattern. It still needs a recorded check, and this audit had no network. If the check finds a collision, fix by swapping to an invented town (r2). |

### (c) Fails or missing evidence (0)

None. Every pending unit has:
- a promote PASS today and a recorded promote clean;
- a V-FINAL record that reproduces;
- blind legs and an audit;
- sweep coverage;
- an accepted export.

## Notes outside the 81 rows

- **Pipeline gaps.** These are not unit defects, but they explain E1 and E2:
  - `vfinal_fold.py` accepts a V-FINAL with no G-KEY or G-DISTRACTOR records (it requires only the audit, `vfinal_fold.py:84`).
  - `gkey_resolve.py` turns an unparseable target into a minor flag (`gkey_resolve.py:65-79`) instead of refusing it.
  - The schema's `target` pattern is deliberately not enforced (`merge_verdicts.py:126-130`).
  - Worth a hardening bead.
- **Provenance.**
  - `final_verify.jsonl` in batches 1–5, 7, 8 and 12 was regenerated in #361 (2026-08-09) but keeps `"date": "2026-07-30"`.
  - Batch 6's records use the older note format.
- **Exporter.** `--out /tmp` is refused by design (R2). An audit run of this kind needs a gitignored `preview/` subdirectory, which here was moved to `/tmp` afterwards.
- **Not claimed:**
  - no LLM gate was re-run;
  - no entity was web-verified;
  - no full entity-level re-sweep was done;
  - nothing was regenerated or edited;
  - no ratification is implied.

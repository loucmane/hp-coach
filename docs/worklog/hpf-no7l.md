---
bead: "hpf-no7l"
project: "hpfetcher"
session: "ci-26tex"
status: "implemented_uncommitted"
---

# Worklog — hpf-no7l

P5 infold PR 2: a reviewed Layer 2 pilot for six approved LÄS/ELF units, and the export gate that pairs a release's bank with its explanation shard. Spec: `docs/p5-infold-design.md` §4 row 2 and §D (owner-approved), with §C for identity and the shard key.

## Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-no7l`, assignee `gc__implementation-worker-ci-26tex`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-no7l --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` and `git rev-parse origin/main` both returned `bba0799140a9043d1bec7666ca49ad0718a44ba0` (detached).
- No git writes and no network. Nothing changed under `app/`, `worker/` or `app/public/`, nothing went to R2, and `app/scripts/sync-dataset.sh` was not run. No candidate, ruling, roster or registry file was edited; `docs/p5-infold-design.md` is unchanged.
- The untracked runtime and skill paths present at start (`.agents/`, `.claude/skills/…`, `.codex/`, `.gc/` and the sandbox's dotfile mounts) are untouched.
- `gc.check_path` is `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`, the same post-close dispatcher check as for hpf-535m. This bead names no validator, so this worker did not run it.

## Deliverables (uncommitted)

| Path | Change |
|---|---|
| `data/explanations/p5-pilot.json` | New: the pilot shard, 19 reviewed Layer 2 entries keyed by exported qid, in canonical form |
| `pipeline/synthetic/infold/export_product.py` | `--explanations` and `--pilot`; the shard gates; `explanation_shard` set only when a validated shard is included |
| `pipeline/synthetic/infold/tests/test_infold_explanations.py` | New: 112 tests |
| `pipeline/synthetic/infold/tests/test_infold_export.py` | 3 small edits for the new reference rule and `build_rows` signature (below) |
| `pipeline/synthetic/infold/preview/sample/` | Regenerated with `export_product.py --sample`: the 12 rows' `explanation_shard` is now `null`; the manifest has the new bank and exporter sha256 and `"explanations": null` |
| `docs/worklog/hpf-no7l.md` | New: this evidence file |

CI needs no change: `.github/workflows/ci.yml:30` already runs `pipeline/synthetic/infold/tests`, which now holds the new module.

## Pilot set

The PR 1 sample (bead hpf-535m) plus two units: an ELF long passage, and a ratified legacy LÄS unit at revision 2, so that an `r2` qid is keyed in the shard. All six are `approved` in the roster, none is retired, and the pilot holds no exclusion pair, so it can also be exported with `--single-session`.

| Unit | Section | Shape | Questions | qids | framework_id |
|---|---|---|---:|---|---|
| `las-b7-002` (r2) | LÄS | short debate | 2 | `p5-las-b7-002-r2-LÄS-001`, `-002` | LAS-TYPE-001, LAS-TYPE-003 |
| `las-b14-002` | LÄS | long review | 4 | `p5-las-b14-002-r1-LÄS-001` … `-004` | LAS-TYPE-001, -001, -003, -004 |
| `elf-b18-001` | ELF | long passage | 5 | `p5-elf-b18-001-r1-ELF-001` … `-005` | ELF-TYPE-001, -001, -002, -005, -004 |
| `elf-b18-002` | ELF | cloze, 5 gaps | 5 | `p5-elf-b18-002-r1-ELF-001` … `-005` | none |
| `elf-b19-003` | ELF | short text | 1 | `p5-elf-b19-003-r1-ELF-001` | ELF-TYPE-001 |
| `las-b19-002` | LÄS | short debate | 2 | `p5-las-b19-002-r1-LÄS-001`, `-002` | LAS-TYPE-003, LAS-TYPE-001 |

19 questions: LÄS 8, ELF 11. Shard and bank order follow the roster: `las-b7-002`, `las-b14-002`, `elf-b18-001`, `elf-b18-002`, `elf-b19-003`, `las-b19-002`. `export_product.PILOT_UNITS` pins the set.

## The shard

- **Location and key.** `data/explanations/p5-pilot.json`, the design's location (§4 row 2). It is a plain `{qid: Explanation}` object in the shape `loadExamExplanations` expects (`app/src/data/explanations.ts:141`): no header and no `_meta`. A bank exported with it names it by the content key `explanations/p5-pilot.json`, which fits the worker's flat-key whitelist (`worker/src/routes/content.ts:28`).
- **Fields.** Exactly the app's `Explanation` fields that the bead lists (`app/src/data/explanations.ts:68`): `solution_path`; `steps[{n, title, text, tier}]`, numbered 1 to k; `distractors[{letter, why_tempting, why_wrong}]`, one per wrong option in letter order; `technique`; `pitfall` (string or null); `framework_id` when a Layer-1 entry fits. `pregrade_tactic` is not part of the P5 contract, so the app falls back to the section default (`app/src/data/explanations.ts:98`).
- **Authoring.** Each entry was written from the passage and the unit's rationale, which served as source only. The key argument became `solution_path` and 4–5 ordered steps: what the question asks, the passage sentence it turns on, quoted verbatim, a paraphrase, the options, the verdict. Each wrong option got its own `why_tempting` and `why_wrong`, describing the option as worded. LÄS is in Swedish, ELF in English, and every entry quotes its passage. No trap label, gate name, family or unit id appears in learner text, and no rationale sentence is reproduced. Three passages that stayed too close to rationale wording were found in review and rewritten (see Second-reader review).
- **framework_id.** Each id was checked against `frameworks/las_taxonomy.json` and `frameworks/elf_taxonomy.json`, and matches the question's trigger: "enligt texten" / "we are told" is direct detail (TYPE-001), "implied" is inference (ELF-TYPE-002), "main" is main idea (ELF-TYPE-004), stance and attitude questions are TYPE-003 / ELF-TYPE-005, and "Varför tar recensenten upp …" is rhetorical function (LAS-TYPE-004). The five gap questions have none. No Layer-1 entry covers gap filling: ELF-TYPE-008 is about the meaning of an expression already in the text, not choosing the missing word, and `ELF-CLOZE-001` is a generation family, not a framework id.
- **Canonical form.** The file is byte for byte what the exporter renders: entries in bank order, fields in the order above, `json.dumps(…, ensure_ascii=False, indent=2)` plus one newline. So the file under review is the file that ships.

## Exporter

- **The bank's reference.** A row's `explanation_shard` is now the key of the shard this export validated and wrote beside the bank, or `null` when the export carries no explanations. PR 1 wrote `explanations/p5-<release>.json` on every row, which left a reference to an unchecked or missing shard in every bank. `check_schema` accepts only the release's key or null, and all rows must agree. After it, `_build` refuses rows whose reference does not match whether a shard is included (`rows reference explanation shard(s) …`).
- **`--explanations`** reads `data/explanations/p5-<release>.json`. The path is derived from the release, so the bank's key and the validated file cannot diverge. The export is refused, writing nothing, on:
  - a shard that is missing, a symlink or not a regular file, empty or blank, not UTF-8, not JSON (including a byte-order mark), that repeats a key, that holds NaN or Infinity, or that is not a non-empty object keyed by qid;
  - a missing entry for any exported qid, or an entry under any other key (another revision, another unit, an authentic qid, `_meta`);
  - an entry whose fields are not exactly the contract above. That covers `_meta`, `rationale`, `pregrade_tactic`, missing fields, non-string or empty text, a step `n` that is not an int (a bool is refused) or not 1..k in order, a tier other than `essential`/`detail`, and distractor letters that are not exactly the wrong options in order (missing, duplicated, `E`, lowercase or the key);
  - a `framework_id` that is null, not a string, unknown, of another section, or a generation family;
  - learner text carrying an internal label: a Layer-1 or generation-family id (`[a-z]{3}-[a-z]{4,6}-[0-9]{3}`, case-insensitive), a unit id (so any qid), or an exported unit's family label or question-family label;
  - unbalanced MathText delimiters (U+E000 / U+E001);
  - rationale text: a rationale, a paragraph or a sentence of 40+ characters from any exported unit that is not that unit's own student text (an explanation may quote the passage);
  - any default-mode learner-output lint finding (`LINT.scan_text`, the same private instance the bank uses) in any string of the shard;
  - a shard that is valid but not in canonical form (the first differing line is reported).
- **Pairing.** The export writes `p5-bank-<release>.json`, `p5-<release>.json` and `_export-manifest.json`. The manifest's `explanations` block binds the shard (`path`, `key`, `source`, `sha256`, `entries`), the sha256 of every framework file it was checked against, and the explanation lint (tool, mode, strings checked, findings). `gates` adds the nine explanation gates. Without a shard the block is `null` and the gate list is PR 1's.
- **CLI.** `--explanations` works with any release and selection. `--pilot [--check]` exports `PILOT_UNITS` as release `pilot` with its shard to `pipeline/synthetic/infold/preview/pilot/`, which the existing `preview/.gitignore` keeps local (`git check-ignore -v` → `preview/.gitignore:4:/*`). Like `--sample`, it takes no other selection or output option.
- **Small API change.** `build_rows(entry, unit, explanation_shard)` takes the reference instead of the release, which it no longer needs. The PR 1 test that wraps it now passes `*args` through.

## Rationale content judged wrong or unclear (not copied)

Rationales were used as source. These points were wrong, imprecise or internal, and the explanations say what the passage supports instead:

- `las-b7-002` q2/C: the rationale says the author "medger men avfärdar" the land objection. The author concedes it ("Det är sant") and only limits its consequence: the most dangerous point should still be fixed first. The label `detail_as_main` does not fit either. The trap is taking a conceded objection for the author's conclusion.
- `las-b7-002` q1/A and q2/A: both are labelled `reversed_causality`. q1/A swaps which group grew, and q2/A is the view the author attacks. No causal arrow is reversed in either.
- `las-b14-002` q1/D and q2/B: labelled `reversed_causality`, where the mechanisms are a polarity inversion of a stated limitation and the collapse of the two-key rule. This was already recorded as residual (b) in the unit's `pedagogy_adjudication`.
- `las-b14-002` q1/B: "ett vedertaget tillägg" overstates "vanligen en åttondel". The explanation says only that the text gives a usual level and says nothing about the parish meeting setting it.
- `las-b14-002` q2/D: the claim that sole responsibility for the accounts "motsägs av tvånycklarsystemet" conflates the keys, which govern opening the granary, with bookkeeping. The explanation rests on the stated election by the parish meeting and the two-person rule.
- `las-b14-002` q3/A: described as an attribution reversal (`half_right_conjunction`). The trap is lexical: "förbigår" (passes over) against the text's "i förbigående" (in passing), for a reform Grimlund himself hints at.
- `las-b19-002` q1/B: calls the short ladder one of "två skötselfel". The text only says it ends half a metre above the water. The explanation uses the missing defibrillator and the purchase list instead.
- `las-b19-002` q1/C: "den vanligaste invändningen mot textens linje" is an unsupported claim. q1/A's "en högre avgift skulle förstärka … förflyttning" is the rationale's own extrapolation. Neither is used.
- `las-b19-002` q2/B: paraphrases the option's "svår att mäta" as "omöjlig att fastställa", which is stronger than the option. The explanation keeps the option's wording.
- `elf-b18-001` q1/A: says the survey "settled" where the force comes from. The survey located the roots, and the force attribution is Askerholt's own cautious "we think". The explanation says her findings point clearly to the layer under the stones and that her caution is not an admission that the question is open.
- `elf-b18-001` q5/B: calls B's second half "false", although the old remedies do keep failing. The explanation says B turns the text into a story of failure while most of it reports a remedy that held on 25 of 31 streets.
- `elf-b18-002` gap 1: "thematically level – nothing separates them" is more confident than the set supports. The unit's own `gstem_r1_q1_disposition` records this. Not used.
- `elf-b19-003` D: "the passage says nothing about matching" is false: the passage says "the pots seldom match". This lane first carried the claim over. The second reader caught it (below), and the explanation now says the text never claims the pots were picked to match the house.
- `las-b7-002`, `las-b14-002`, `las-b19-002` and `elf-b18-001`: rationale wording such as "hedgad" and inline trap labels is internal and was never carried over.

## Second-reader review

The 19 entries were reviewed by an independent, read-only second reader (a general-purpose subagent of this session). It had the six candidates and the two framework files and checked grounding, option meaning, Swedish and English quality, pedagogy, framework fit and internal language.

**Verdict.** All 19 entries state the unit's key. Each distractor list covers exactly the three wrong options. Every `framework_id` fits its question type, and the cloze unit correctly has none. Every quoted passage span is verbatim, and no label or pipeline talk reaches learner text.

**Findings.** The reviewer found 3 errors and 34 minor issues. Each was checked against the passage before it was applied, and all 37 were accepted.

- **Errors:**
  - `elf-b19-003` D said the text "never mentions matching", but the passage says "the pots seldom match". The claim came from the unit's rationale.
  - `elf-b18-001` q3 D said the watering tubes "made no measurable difference". The text limits that to the deep soil.
  - `elf-b18-002` gap 3, step 3 said no distractor completes "the moral high ___". "Moral high horse" is informally attested; it fails on the verb "hold", which the distractor card already said.
- **Too close to rationale wording:** `las-b14-002` q4/A, `elf-b18-001` q3 step 5 and `elf-b18-002` gap 4/D. They passed the mechanical leak gate, which only catches verbatim rationale sentences, and were rewritten.
- **Precision:**
  - hedges restored ("most of the lifting", "en del av badandet");
  - voices kept apart (`elf-b18-001` q4/A);
  - a step that pointed to step 2 for a fact step 2 did not state (`las-b14-002` q2);
  - what the footnote actually covers (`las-b14-002` q3);
  - option D's own wording (`las-b14-002` q4, step 4).
- **Language:**
  - "beröm av" → "berömmer";
  - "tillskriver den den andra" → "lägger … i den andras mun";
  - "kommer in först" → "nämns inte förrän";
  - a verbless step;
  - "Det är X. Svaret är X." varied.

Before the review, this lane had made three precision fixes of its own: "31 procent av gästnätterna", "a stack rebuilt in 1961", and "antyder" for Grimlund's two explanations.

After the fixes the shard is still canonical, lint is clean in default and strict mode, and the suite passes (below). The leak gate cannot judge paraphrase. Review stays necessary, and claims taken from a rationale need checking against the passage.

## Verification

- **Baseline, before any change:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1638 passed, 7 xfailed** (22.08 s). pytest 7.4.4.
- **Red first.** The new module and the two changed PR 1 assertions were written before the exporter changed.
  - New module: collection error, `AttributeError: module 'export_product' has no attribute 'PILOT_UNITS'`.
  - PR 1 modules: **2 failed, 158 passed** (`row["explanation_shard"] is None`, and the missing `shard_key`).
  - With the exporter implemented but no shard yet: **82 failed, 15 errors, 175 passed**. Every pilot test refused with `explanation shard data/explanations/p5-pilot.json does not exist`, and the regenerated sample was still stale.
- **Green.** Infold suite: **272 passed** (160 + 112). Bead VERIFICATION command on the final tree, after the review fixes: **1750 passed, 7 xfailed** (26.00 s), i.e. the baseline plus 112.
- **Learner-output lint, default mode, on the pilot shard:** `python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations/p5-pilot.json` → `learner-output lint: clean — 1 file(s)`, **0 findings**. `--strict` is also clean. The shard plus the written exports (`preview/pilot`, `preview/sample`) → `clean — 4 file(s)`.
- **Exports.** `export_product.py --pilot` → `exported 6 units / 19 questions …; learner lint clean (107 strings); 19 explanations in p5-pilot.json, lint clean (421 strings)`. `--sample` → 4 units / 12 questions, 68 strings, unchanged apart from the null references.
- **sha256 on the final tree:**
  - `data/explanations/p5-pilot.json` `5f998bb089e5be1e5c33ac22be9276b65eb0312da4251ca250ba12fece102393`. The written `preview/pilot/p5-pilot.json` has the same sha256: the shipped shard is the reviewed file.
  - `export_product.py` `8e4cbbe73ca6f28552e3e1c9d570a13c4778b07dddbf50ddcef554d4fb840ede`, the value the regenerated sample manifest pins.
  - `preview/sample/p5-bank-sample.json` `393ad81710b9865f5164a3e6a8495a3fb0740b4da3697e3c9d42d66a14e77987`.
  - `preview/pilot/p5-bank-pilot.json` (local) `2c7e47dd853eb9656575ca16e7a3f45e80401f0bda788201126cd724058eaa77`.
  - `approval-roster.json` is unchanged (`e31eba3603de4053606e20d48c2d805f05fbb1e1b9b4009c0261cdb43078b58d`).
- **Determinism.**
  - Every export double-builds and compares byte for byte, shard included. A shard that changes between the two builds is refused (test).
  - A subprocess export of the pilot under `PYTHONHASHSEED=0` and `4242` gives the same sha256 for all three files as the in-process export.
  - `--sample --check` passes.
- **Mutation check.** A scratch copy (`git archive HEAD` of `pipeline/synthetic`, the design doc, `worker/src`, `app/src` and `frameworks`, with the lane's changed files overlaid) passes all 272 infold tests unmutated. Each mutation was applied to the scratch exporter alone, the suite run without the three tests that pin the exporter's own sha256, and the mutation reverted. The scratch exporter is byte-identical to the lane's afterwards (`cmp`). All 15 are caught:

  | Mutation | Failing tests |
  |---|---:|
  | M1 missing-entry check removed | 1 |
  | M2 unknown-key check removed | 6 |
  | M3 distractor-letter comparison removed | 7 |
  | M4 framework-id catalog/section check removed | 6 |
  | M5 internal-label check removed | 5 |
  | M6 rationale-leak check removed | 2 |
  | M7 explanation lint removed | 3 |
  | M8 canonical-bytes check removed | 5 |
  | M9 duplicate-key parser guard removed | 1 |
  | M10 reference-iff-shard check removed | 2 |
  | M11 bank-schema reference rules removed | 3 |
  | M12 math-delimiter check removed | 2 |
  | M13 step-numbering check removed | 3 |
  | M14 entry field whitelist relaxed | 3 |
  | M15 shard symlink refusal removed | 1 |

  The mutation run used the pilot shard as it stood before the review edits. Those edits touched only the shard's text, and the exporter is byte-identical (sha256 above), so the table stands.

## Notes for PR 3–PR 5 and the owner

- **Offline readers of `data/explanations/`.** Every non-`_` JSON file there is read by these scripts, which will now see the P5 entries:
  - `pipeline/synthetic/las/scripts/common.py:55` (`load_las_explanations`: every `-LÄS-` qid);
  - `pipeline/synthetic/elf/scripts/build_families.py:67` (every `-ELF-` qid into the ELF family maps);
  - `pipeline/frameworks/extract.py:70`;
  - `scripts/backfill_framework_id.py:97`, whose `mirror_to_public` copies every file to `app/public/explanations/`.

  The first three would fold synthetic items into authentic-corpus statistics that feed generation. Before anyone reruns them, they should skip `p5-` qids or `p5-*.json`. This bead does not change them.
- **Publishing.** `app/scripts/sync-dataset.sh` mirrors all of `data/explanations/` into `app/public/explanations/` (`rsync -a --delete`), and the deploy's `scripts/content-sync.mjs` uploads every `^[A-Za-z0-9_-]+\.json$` there to R2. The next sync would therefore publish `p5-pilot.json`. It is inert without a bank and without a P5 resolver: `extractExamId` returns null for every P5 qid (`app/src/data/explanations.ts:133`). Whether it ships before PR 5 is a release decision.
- **framework_id and mastery.** Once PR 4 resolves P5 explanations, `SessionPlayer` will tag P5 attempts with these framework ids (`peekExplanation`, `app/src/data/explanations.ts:205`), and the worker folds tags into mastery. Design §E keeps P5 out of shared mastery, so PR 3's source filter must be in place first.
- **MathText fixtures.** Design §4 row 2's "MathText render fixtures" are app-side tests, outside this bead (the app is PR 4). The export now refuses unbalanced math delimiters, and the pilot uses no math.
- **The shard key.** The design sketched `explanations/p5-b19-<release>.json`. A release spans batches (this pilot draws from batches 7, 14, 18 and 19), so the key is `explanations/p5-<release>.json`, with source `data/explanations/p5-<release>.json`. This settles the item hpf-535m left for PR 2 and PR 5.

## Progress

- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:research|E:bba0799140a9043d1bec7666ca49ad0718a44ba0] Read the design, LAYER2-RENDERING.md, the app's explanation type, the schema, the exporter and its tests, the frameworks and the six candidates. Baseline: 1638 passed, 7 xfailed.
- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:red|E:pipeline/synthetic/infold/tests] Wrote `test_infold_explanations.py` and the PR 1 test edits first. Red: collection error, 2 PR 1 failures.
- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:green|E:pipeline/synthetic/infold/export_product.py] Implemented the shard gates, `--explanations`, `--pilot` and the reference rule. Pre-shard: 82 failed, 15 errors.
- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:author|E:data/explanations/p5-pilot.json] Authored the 19 entries. Canonical on the first export; regenerated the sample. 272 infold passed; 1750 passed, 7 xfailed.
- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:verify|E:scratchpad] Ran 15 mutations (all caught), lint default and strict (clean), and cross-process determinism.
- 2026-10-07 [S:ci-26tex|W:hpf-no7l|H:review|E:data/explanations/p5-pilot.json] Second-reader review: 3 errors and 34 minor issues, all checked against the passages and applied. The shard is still canonical and lint clean. Final: 1750 passed, 7 xfailed.

## Handoff

- **Ready for review:** an independent review of the exact uncommitted tree, then the owner's read of the 19 explanations. Committing, pushing and opening the PR are outside this lane.
- **To confirm:**
  - the nullable `explanation_shard` (a contract change to PR 1's bank);
  - the canonical-bytes requirement on shards;
  - the shard key `explanations/p5-<release>.json`.
- **Not claimed:**
  - release readiness: nothing is activated, synced or deployed;
  - semantic certification beyond the review recorded here: lint is necessary, not sufficient (LAYER2-RENDERING.md);
  - explanations for the other 114 units.

## Bead note

P5 PR2 Layer-2 pilot implemented, uncommitted on bba0799: data/explanations/p5-pilot.json holds 19 reviewed entries (LÄS sv, ELF en) for las-b7-002 (r2), las-b14-002, elf-b18-001, elf-b18-002 (cloze, no framework_id), elf-b19-003 and las-b19-002, canonical bytes, lint clean (default and strict). export_product.py: --explanations pairs a bank with data/explanations/p5-<release>.json and refuses missing/extra qids, wrong distractor letters, bad framework ids, internal labels, rationale text, unbalanced math, lint findings, malformed/empty/non-canonical shards; explanation_shard is now null without a validated shard (sample regenerated); --pilot preset. 112 red-first tests; 1750 passed, 7 xfailed; 15/15 mutations caught; second-reader review applied (3 errors, 34 minor). Evidence: docs/worklog/hpf-no7l.md.
LANE DONE: hpf-no7l

## Review fix round 1 (bead hpf-gcrh)

The Codex exact-head review of PR #376 (bead hpf-c8k8, at `28b3702`) returned **HOLD** with three P2 blockers: internal ids that render in learner text get past the export gate, and two explanations rule a wrong option out with an argument that does not exclude it (las-b19-002 Q2 option B, elf-b18-002 gap 4 option D). This round fixes all three. Re-reading all 19 entries for the same class of error found eight more such arguments: six in this lane's re-read, two by an independent second reader. All are fixed. 13 fields changed across 9 entries: 9 why_wrong texts and 4 steps.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-gcrh`, assignee `gc__implementation-worker-ci-qozr1`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-gcrh --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` → `28b3702b8bde16839996f6b29cc734d7d7453922` on `codex/hpf-no7l-infold-explanations-pilot`.
- No git writes and no network. Nothing under `app/`, `worker/` or `app/public/`. No candidate, roster, ruling or framework file was edited (`approval-roster.json` still `e31eba36…`). The untracked runtime, skill and sandbox paths are untouched.
- **The review's worklog** (`/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/worklogs/hpf-c8k8.md`) is outside this lane's sandbox: reading it was denied. The exact repros came from the reviewer's own probe script and summaries, which were read but neither run nor changed:
  - `/tmp/hpf-c8k8-probes.py`;
  - `/tmp/hpf-c8k8-probe-summary.json`: 31 probes, 4 accepted that should have been refused;
  - `/tmp/hpf-c8k8-render-summary.json`.

  The bead's description and the hpf-c8k8 close note supplied the content findings.
- `gc.check_path` sha256 is still `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. This bead names no validator, so none was run.

### 1. Gate: internal ids in rendered text

**The bypass.** All four accepted probes put an id into an explanation's `technique` as `Se <payload>.`, in a form that renders as the whole id but is not stored as one:

| Probe | Payload | Renders as |
|---|---|---|
| invisible framework ID | `LAS-TY<U+200B>PE-001` | LAS-TYPE-001 |
| KaTeX framework ID | `<U+E000>\text{LAS-TY}\text{PE-001}<U+E001>` | LAS-TYPE-001 |
| invisible unit ID | `las-b<U+200B>7-002` | las-b7-002 |
| KaTeX unit ID | `<U+E000>\text{las-b}\text{7-002}<U+E001>` | las-b7-002 |

The render summary confirms that both KaTeX payloads show the full id with no KaTeX error.

The old gate had four gaps:
- `INTERNAL_ID` matched only the stored string.
- It was a hand-written shape (`[a-zåäö]{3}-[a-z]{4,6}-[0-9]{3}`, `(las|elf)-b…`).
- It needed ASCII hyphens and word boundaries.
- The bank's learner text had no id check at all: titles, passages, prompts and options.

**The fix** (`export_product.py`):
- **Ids are derived, not listed** (`internal_ids`). Every Layer-1 entry id in `frameworks/*.json` and every unit id in the roster stands for its series:
  - the id's first run, its section prefix, is kept as it is;
  - each later run of letters becomes any letters, and each run of digits any digits;
  - each separator becomes a hyphen or an underscore.

  This gives ten series today: DTK, ELF, KVA, LAS, MEK, NOG, ORD and XYZ `<prefix>-<letters>-<digits>`, plus `las`/`elf-<letters><digits>-<digits>`. They cover:
  - every catalog id, and unlisted ones such as LAS-TYPE-99;
  - the generation family ELF-CLOZE-001;
  - every unit id, and so every qid and exam_id.

  A new catalog file or roster row is covered as soon as it exists.
- **Text is read as it renders** (`learner_views`). Each learner string is checked as stored and in each of the learner-output lint's own rendered views (`LINT._views`):
  - invisible characters dropped;
  - right-to-left override runs undone;
  - NFKC;
  - KaTeX groups between U+E000 and U+E001 joined;
  - Markdown and HTML markup interpreted, as defense in depth.

  Each view is then folded (`fold`): NFKD, combining marks and format characters dropped, every Unicode dash (Pd) and minus sign turned into a hyphen, and case folded. An id counts wherever it stands, also run into a word. The exporter and the lint therefore read one rendering.
- **Labels.** Each exported unit's family and question-family labels are matched on the same folded views.
- **Both texts.** A new gate, `bank-internal-label` (`check_bank_labels`), checks every title, passage, prompt and option. It runs after `check_bank` and before the learner lint. The explanation gate (`internal-label`) uses the same matcher on every learner field.
- **Metadata is exempt.** These fields hold ids by design and are not checked: `framework_id` and the distractor letters in the shard; `qid`, `exam_id`, `unit_id` and `explanation_shard` in the bank.
- **Every export now reads the frameworks.** The manifest binds them once, as a top-level `frameworks` list, which moved out of the `explanations` block. `conftest.make_tree` copies them into every throwaway tree, and `shard_tree` no longer copies them itself.

**Tests, written red first.** New and changed tests:

| Test | Cases | Red against the 28b3702 exporter |
|---|---:|---|
| `test_the_review_label_probes_are_refused`: the review's nine label probes, verbatim | 9 | the 4 bypasses (the other 5 were already refused, 3 of them by lint) |
| `test_an_internal_id_is_refused_in_any_spelling_and_learner_field`: 34 near variants, each in one of the seven learner fields in turn | 34 | 21 (list below); the 13 the old regex caught stay as guards |
| `test_an_internal_label_in_bank_text_is_refused`: 9 leaks × title, passage, prompt, option | 36 | 36 |
| `test_ordinary_words_beside_a_section_name_are_not_internal_ids` | 1 | passes on both: a false-positive guard |
| `test_the_id_series_come_from_the_catalogs_and_the_roster` | 1 | red: the old hand shape refused QQQ-NOTE-042 although no catalog uses QQQ |
| `test_every_catalog_entry_and_roster_unit_id_is_an_internal_id` | 1 | red (new API) |
| `test_ids_in_metadata_fields_are_not_learner_text` | 1 | red (new API) |
| the two manifest tests (`frameworks` at top level; `bank-internal-label` in `gates`) | 2 | red |

The 21 near variants the old regex let through:
- dashes and minus signs: U+2010, U+2011, en dash, em dash, minus sign;
- invisible and compatibility characters: full-width letters, soft hyphen, word joiner, a combining accent, a right-to-left override;
- ids run into their surroundings: `_LAS-TYPE-001_`, `LAS-TYPE-001-frågan`, `LAS-TYPE-001s`, `seLAS-TYPE-001`;
- other separators and lengths: underscore separators, a two-digit number;
- unit ids and qids: a unit id with en dashes or underscores, a qid with U+2010;
- KaTeX: `\mathrm` and `\text` groups, and a `\textcolor` group.

The 13 it already caught:
- case and accents: lower case, title case, `LÄS-`;
- surrounding punctuation: parentheses, quotation marks;
- unlisted ids: an unlisted ELF entry, a DTK entry, ELF-CLOZE-001;
- unit ids and qids: an upper-case unit id, a unit outside the export, a retired unit, a qid, an exam_id.

Infold suite at each stage:
- **Red**, before the exporter changed: 62 failed, 289 passed.
- **Green**: 351 passed after the change, then 355 once the generation-family bank leak was added. That leak pins series generalization; see M5 below.
- **Final test files against the 28b3702 exporter**, in the scratch tree below: 69 failed, 286 passed. That is the 62, plus the 4 generation-family bank cases, plus the 3 committed-sample checks.

**No false positives.** The full approved and pending exports (120 units, 340 questions) pass the new bank gate, through the existing `approved_export` and `pending_export` fixtures. So does the pilot shard.

**Mutation check.** A scratch tree was built from `git archive HEAD` of `pipeline/synthetic`, `frameworks`, `data/explanations/p5-pilot.json`, `worker/src`, `app/src` and `docs`, with this lane's changed files overlaid. It passes all 355 infold tests unmutated. Each mutation was applied to the scratch exporter alone, and the suite was run without the three committed-sample tests, which pin the exporter's own sha256. The mutation was then reverted. All 11 are caught:

| Mutation | Failing tests |
|---|---:|
| M1 rendered views dropped (stored text only) | 9 |
| M2 dashes and minus signs not folded | 11 |
| M3 combining marks and format characters kept by `fold` | 2 |
| M4 bank-text gate not called | 36 |
| M5 later letter runs kept literal (no series generalization) | 4 |
| M6 a word boundary required before an id | 1 |
| M7 unit series from the exported units only, not the roster | 1 |
| M8 catalog ids not used | 49 |
| M9 bank gate without the family labels | 4 |
| M10 `framework_id` checked as learner text | 18 + 16 errors |
| M11 no case folding | 5 |

Under M3, only the accent cases fail. The zero-width cases are still refused, because the lint's plain view drops invisible characters as well; that redundancy is deliberate. Afterwards the scratch exporter was byte-identical to the lane's (`cmp`), and the scratch tree passed 355 tests. The mutation run used the shard as it stood before the second reader's edits. Those edits touched only shard text, and the exporter is unchanged since (sha256 below), so the table stands.

### 2. las-b19-002 Q2 (key A)

The question asks what the text says about the camper-van site (”ställplatsen för husbilar”). Option B: ”Betalningsviljan visade sig svår att mäta.”

- **B why_wrong, before:** Texten redovisar ett bestämt mätvärde, 31 procent (steg 2). Betalningsviljan gick alltså att mäta, och B stämmer inte med texten.
- **B why_wrong, after:** Om betalningen vid ställplatsen säger texten att kommunens uppföljning ”landade på en betalningsgrad om 31 procent av gästnätterna” (steg 2). Texten nämner inga svårigheter att mäta och inget förbehåll om siffran, så B lägger till något som inte står i texten.
- **Step 4, before:** A uttrycker samma andel från andra hållet. B säger att betalningsviljan var svår att mäta, men kommunen fick fram en tydlig siffra. C gör 31 procent till nästan alla, och det som D påstår nämns inte i texten.
- **Step 4, after:** A uttrycker samma andel från andra hållet. B talar om svårigheter att mäta betalningsviljan, men några sådana nämns inte i texten. C gör 31 procent till nästan alla, och det som D påstår står inte heller i texten.

**Why.** A figure that was obtained does not show it was easy to obtain: "hard to measure" is not "impossible to measure". B is wrong because the text says nothing about any difficulty in measuring. It reports the follow-up's figure as a plain result, quoted verbatim, and B adds a claim the text does not make. B's why_tempting, the other steps, the technique, the pitfall and the key are unchanged.

### 3. elf-b18-002 gap 4 (key B, "Eventually")

The frame: "So the kitchen waits. ___(4)___, somebody cracks – nearly always the same somebody, the one who minds the mess a little more than the rest and minds it first." Option D: "Ironically".

- **D why_wrong, before:** Irony needs an unexpected outcome. After the notice, the rota and the complaining have all failed, somebody giving in is the predictable end.
- **D why_wrong, after:** The gapped sentence holds no twist for “Ironically” to mark. Somebody cracking is simply how the waiting ends, and the sentence itself explains who gives in: “the one who minds the mess a little more than the rest and minds it first”. That person gives in first because they mind the mess most, which overturns nothing set up earlier. What the gap must supply is the link in time between the waiting and its end (step 2).

**Why.** A predictable outcome can still be ironic: the same paragraph has one, where the first person to complain has, by complaining, volunteered, so the aim is defeated by its own means. Irony fails here because of the text around the gap:
- the cracking is simply how "So the kitchen waits" ends;
- the sentence explains who gives in by what drives them: they mind the mess most;
- nothing set up earlier is overturned;
- the gap's job is the time link that step 2 already names.

The first rewrite said "no word of contrast" and "cause and effect, not a contradiction". The second reader showed that neither decides anything: the gap is itself the connective slot, and the paragraph's real irony is also cause and effect. Both phrases were removed. No step, technique or pitfall used the predictability argument. D's why_tempting and the key are unchanged.

### 4. Re-read of all 19 entries: eight more arguments that did not exclude their option

All 57 distractor explanations, and the steps that compare options, were re-read against the passages. This lane found items 1–6: six why_wrong texts, and one step repeating one of them, that argued from something that does not rule the option out. The second reader (below) found items 7 and 8 and tightened several of this lane's first rewrites. The texts below are final.

1. **las-b7-002 Q2 C** (key B). Option C: ”Eftersom marken sällan finns där den behövs är fler sammanhängande cykelvägar i praktiken ogenomförbara.”
   - **Before:** Författaren medger invändningen men drar inte slutsatsen att sammanhängande stråk är ogenomförbara. Tvärtom ska den farligaste punkten åtgärdas först även när marken inte räcker (steg 3).
   - **After:** Författaren medger visserligen att marken sällan finns där den behövs (”Det är sant”), men drar bara slutsatsen att verkligheten ”ibland” tvingar fram kompromisser – inte att sammanhängande stråk är ogenomförbara. Tvärtom vill författaren att kommunerna bygger ”långa, obrutna stråk”, och även där marken inte räcker bör den farligaste punkten åtgärdas först (steg 2–3).
   - **Why:** Fixing the worst point first fits C just as well: one could do that even if connected routes were infeasible. So the old "Tvärtom" was not a contrary. What excludes C is that the author concedes the premise ("Det är sant") but draws only "ibland" compromises from it, and argues for "långa, obrutna stråk" (fourth paragraph). This lane's first rewrite said the author concedes "bara" the compromises. The second reader corrected that, and the modal to the passage's "bör".
2. **las-b14-002 Q1 B** (key C). Option B: ”Tillägget utöver lånet bestämdes av sockenstämman varje år, efter hur skörden det året hade utfallit.”
   - **Before:** Texten säger ingenting om att sockenstämman bestämde tillägget eller att det ändrades med skörden. Den anger bara att det vanligen var en åttondel, alltså en återkommande nivå (steg 2).
   - **After:** Om tillägget säger texten bara att det vanligen var en åttondel och att också det betalades i råg (steg 2). Vem som bestämde det, och om det berodde på hur skörden blev, står ingenstans – B lägger till båda delarna.
   - **Why:** "Usually an eighth" does not exclude a rate set each year. "Vanligen" even allows the rate to vary, so "alltså en återkommande nivå" did not count against B. B is wrong because the text never says who set the rate or that it depended on the harvest. The phrase "berodde på hur skörden blev" replaced "följde skörden", which could be read in time, and the surcharge was paid at harvest.
3. **las-b14-002 Q2 D** (key A). Option D: ”Föreståndaren utsågs av prästen bland socknens största jordägare och svarade ensam för räkenskaperna.”
   - **Before:** Texten säger att föreståndaren valdes av sockenstämman, inte av prästen (steg 2). Prästen nämns bara i samband med att magasinen byggdes. Ordningen lade inte heller magasinet i en enda persons händer: det fick bara öppnas när två personer var på plats.
   - **After:** Texten säger att föreståndaren valdes av sockenstämman, inte av prästen (steg 2), och prästen nämns bara i samband med att magasinen byggdes. Att föreståndaren ensam svarade för räkenskaperna står inte heller i texten: ordningen säger att varje utlåning skulle skrivas in samma dag, men inte vem som skulle göra det.
   - **Why:** The two-person rule governs opening the granary, not the accounts. The hpf-no7l re-verification note had already flagged this as non-blocking. D is already wrong about who chose the steward; the accounts claim is simply not in the text.
4. **elf-b18-001 Q3 B** (key A). Option B: "The gauge readings taken on them have been falling year by year."
   - **Before:** The text reports no falling trend. The streets have “stayed within tolerance”, and the reading in the eighth year was “the same figure as the year before”.
   - **After:** The text reports no trend in the readings. That the flags have “stayed within tolerance” means they are still within the accepted limit, not that the readings are going down, and the one reading the text quotes, on the oldest celled pavement, was “the same figure as the year before”.
   - **Why:** A state cannot rule out a change: falling readings would also be within tolerance. What excludes B is that no trend is reported and the one reading quoted is unchanged.
5. **elf-b18-001 Q3 C** (key A), with step 4. Option C: "Their roots appear to have moved down into the loose loam below."
   - **Before:** Nobody has looked. The surveys see only the stones, and Askerholt will sign her name to nothing below them (step 2). Saying that the roots “appear to have” moved does not turn an unobserved claim into something the text implies. The writer’s remark that the thin beds were “apparently not worth the climb” is itself cautious, and it says nothing about roots moving down into the loam.
   - **After:** The text leaves open where the roots on these streets are, and it names the opposite possibility: “For all we know, the bedding on the good streets is filling with root that has not yet found its strength” (step 2). That is root up in the bedding, not down in the loam. The writer’s remark that the thin beds were “apparently not worth the climb” can rest only on the stones – exactly the limit Askerholt points out.
   - **Step 4, before:** B invents a trend, C claims a result nobody has looked for, and D brings back an idea from the first paragraph that the text has already set aside.
   - **Step 4, after:** B invents a trend, C says the roots seem to have gone down although the text leaves open where they are, and D brings back an idea from the first paragraph that the text has already set aside.
   - **Why:** "Nobody has looked" does not by itself stop an inference. The old text also said the "not worth the climb" remark says nothing about roots moving down, although it does hint that they stayed below the bedding. What excludes C is that Askerholt explicitly names the opposite possibility, and that the remark can rest only on the stones, which is the very limit she points out. This lane's first step-4 rewrite said "C settles where the roots are", which ignores C's hedge ("appear to have"); the second reader caught it.
6. **elf-b19-003 D** (key A). Option D: "They were picked to match the ridge tiles and the brickwork of the house below."
   - **Before:** The text never says that the pots were picked to match the house. It notes instead that “the pots seldom match”, and that householders bought ornament “to tell their own door from thirty identical ones” – to stand out, not to blend in.
   - **After:** The text never says that the pots were picked to match the house. It says that builders’ yards sold “whatever was in stock”, that a stack rebuilt in 1961 “carries what came off the lorry”, and that householders bought ornament “to tell their own door from thirty identical ones” – to stand out, not to blend in.
   - **Why:** "The pots seldom match" is about the pots matching one another, not the house. The text's own account of where pots came from does bear on D: stock, the lorry, and ornament bought to stand out.
7. **elf-b18-001 Q1 C** (key B), with step 4. Found by the second reader. Option C: "Her digs showed the soil further down to be bare of living root."
   - **Before:** The text says “almost nothing alive”, not nothing at all. By calling the soil “bare of living root”, C claims more than the text does (step 2).
   - **After:** Her team was mapping roots, and half a metre down it found “almost nothing alive” – very little, but not nothing. “Bare of living root” means no living root at all, so C claims more than the text does (step 2).
   - **Step 4:** "C turns “almost nothing alive” into none at all" now ends "into no living root at all".
   - **Why:** "Not nothing at all" answered "nothing alive", but C says "bare of living root". The argument holds only once "alive" is read as the roots the team was mapping, and the new text says so.
   - **Residual for the owner:** the unit's own margin here is thin. The passage goes on: "The roots were somewhere else." That leans toward C. The key and the item are approved content and unchanged.
8. **elf-b18-001 Q5, step 4** (key C). Found by the second reader.
   - **Before:** "C names both halves. A is a detail from the first paragraph, B gets the outcome of the trial wrong, and D is a topic the text never raises."
   - **After:** "C names both halves. A is a detail from the first paragraph, B turns the text into a story of failure although most of it is about a remedy that has largely worked, and D is a topic the text never raises."
   - **Why:** B never mentions the trial, and its why_wrong already grants that "the old remedies do keep failing". What is wrong with B is the weight it gives the failures, which the new step states as its why_wrong does.

**Checked and unchanged.** Each of the other 48 distractor explanations rules its option out in one of three ways: a direct contradiction with the passage, the passage not saying it, or, for the cloze gaps, a fixed expression the option cannot complete. Gap 4 C ("Presumably") is kept: the writer cannot present the cracking as a guess while stating who nearly always cracks.

### Second-reader review

An independent, read-only second reader (a general-purpose subagent of this session) checked the shard against the six candidates. It had `git diff` of the shard, and was told to treat the candidates' rationales as source notes, not authority.

- **The rewritten fields.** It checked each of the ten rewritten fields for truth against the passage, verbatim quotes, an argument that excludes the option as worded, agreement with the key and the other steps, and language. It returned 7 PASS and 3 ISSUE:
  - gap 4 D's "no word of contrast" and "cause and effect" (section 3);
  - las-b7-002 Q2 C's "medger bara" and "ska" (item 1);
  - elf-b18-001 Q3 step 4's "settles" (item 5).
- **All 19 entries.** It re-read every entry for the same error class and found items 7 and 8.
- **Wording nits, all applied:**
  - "Den nämner" → "Texten nämner" in las-b19-002 Q2 B, so that "Den" cannot be read as "uppföljningen";
  - "följde skörden" → "berodde på hur skörden blev";
  - a verbatim lower-case "stayed within tolerance" quote;
  - "can rest only on the stones" for "is read from the stones alone", since the text never says what the remark rests on.
- **No other false claims.** It found none about the passages in the 19 entries: paragraph numbers, figures and quoted spans all checked out.

Each finding was checked against the passage before it was applied.

### Verification (final tree)

- **Learner-output lint on the shard.** `python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations/p5-pilot.json` → `learner-output lint: clean — 1 file(s)`, **0 findings**. `--strict` is also clean.
- **Explanation gate on the pilot.** `python3 pipeline/synthetic/infold/export_product.py --pilot` → `exported 6 units / 19 questions …; learner lint clean (107 strings); 19 explanations in p5-pilot.json, lint clean (421 strings)`. `--pilot --check` passes.
- **Sample.** `--sample --check` passes after `--sample` regenerated the manifest.
- **CI selection.** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1833 passed, 7 xfailed** (29.64 s). That is the baseline 1750 plus 83 new tests: 47 in `test_infold_explanations.py` and 36 in `test_infold_export.py`. The infold suite alone has 355.
- **Determinism.** The existing double-build checks pass, and so do the cross-process reproductions of the pilot and the sample (`PYTHONHASHSEED` 0 and 4242).
- **sha256:**
  - `data/explanations/p5-pilot.json` `fd96f43f2bfb810bcf5c3c48ca46fc5e8e8bb47b116097d0135b203582143cc5`. The written `preview/pilot/p5-pilot.json` has the same sha256: the shipped shard is the reviewed file.
  - `export_product.py` `d3a02213c8bf76fe2a7ff8e36c50b0cfbed485cb32a4da66de6b1a01d171449b`, the value the regenerated sample manifest pins.
  - `preview/sample/_export-manifest.json` `7037f584f5752cc9ed1bf8e07b2a723d22150f137ed867aa111f2c560879f313`. New: the `frameworks` binding, the exporter sha256 and the `bank-internal-label` gate.
  - `preview/sample/p5-bank-sample.json` `393ad81710b9865f5164a3e6a8495a3fb0740b4da3697e3c9d42d66a14e77987`, unchanged.
  - `preview/pilot/p5-bank-pilot.json` (local) `2c7e47dd853eb9656575ca16e7a3f45e80401f0bda788201126cd724058eaa77`, unchanged.
  - `approval-roster.json` `e31eba3603de4053606e20d48c2d805f05fbb1e1b9b4009c0261cdb43078b58d`, unchanged.
- **Changed files**, all uncommitted:
  - `pipeline/synthetic/infold/export_product.py`
  - `pipeline/synthetic/infold/tests/conftest.py`
  - `pipeline/synthetic/infold/tests/test_infold_explanations.py`
  - `pipeline/synthetic/infold/tests/test_infold_export.py`
  - `pipeline/synthetic/infold/preview/sample/_export-manifest.json`
  - `data/explanations/p5-pilot.json`
  - this worklog

### Progress (round 1)

- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:research|E:/tmp/hpf-c8k8-probes.py] Claimed and verified hpf-gcrh at 28b3702. The review worklog was denied by the sandbox, so the repros came from the reviewer's probe script and summaries: 4 accepted rendered-id leaks.
- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:red|E:pipeline/synthetic/infold/tests] Wrote the review probes, the near variants, the bank-text, derivation and metadata tests. Red: 62 failed, 289 passed.
- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:green|E:pipeline/synthetic/infold/export_product.py] Derived id series, the lint's rendered views plus fold, and the `bank-internal-label` gate; the manifest binds the frameworks. Regenerated the sample. 1829 passed, 7 xfailed.
- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:content|E:data/explanations/p5-pilot.json] Rewrote las-b19-002 Q2 B and step 4, and elf-b18-002 gap 4 D. The re-read found six more.
- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:verify|E:scratchpad] Ran 11 mutations, all caught. Added the generation-family bank leak to pin series generalization (M5).
- 2026-10-07 [S:ci-qozr1|W:hpf-gcrh|H:review|E:data/explanations/p5-pilot.json] The second reader found 3 issues in this lane's rewrites, 2 more errors of the class and 4 wording nits, all applied. Final: lint clean, the pilot gate passes, 1833 passed, 7 xfailed.

### Bead note (round 1)

PR #376 review fix round 1 (hpf-c8k8 HOLD) implemented, uncommitted on 28b3702. The export gate now refuses internal ids as they render, in bank text and in every explanation learner field. The id series are derived from frameworks/*.json and the roster; text is read in the learner-output lint's views (invisible characters dropped, KaTeX groups joined, RLO undone) and folded for case, accents, dashes and minus signs. framework_id and the bank's key fields stay allowed. The four review bypasses and 21 near variants were red first. las-b19-002 Q2 B and step 4 and elf-b18-002 gap 4 D are rewritten from the passage. The re-read and a second reader fixed eight more arguments that did not exclude their option (las-b7-002 Q2 C, las-b14-002 Q1 B and Q2 D, elf-b18-001 Q1 C, Q3 B and C, Q5 step 4, elf-b19-003 D). Shard lint clean, pilot gate passes, 1833 passed, 7 xfailed, 11 of 11 mutations caught. Evidence: docs/worklog/hpf-no7l.md.
LANE DONE: hpf-gcrh

### Notes and limits

- **What the gate does not cover.** It reads spelling and rendering variants. It does not fold homoglyphs, such as a Cyrillic А written for a Latin A: those are letters of another script, not a rendering of the id.
- **Coupling to the lint.** `learner_views` calls the lint's internal `_views`. The exporter already loads a private instance of that module, and the KaTeX and right-to-left tests pin the dependency (M1).
- **A raw invisible character in an existing test.** `test_a_shard_with_a_byte_order_mark_is_refused` (`test_infold_explanations.py`) holds a literal U+FEFF in its source. It predates this round and is left as it is; a non-blocking follow-up could spell it `"\N{BYTE ORDER MARK}"`. This round's new tests write every special character with a `\N{…}` escape or `chr()`.
- **Ready for review.** An independent exact-tree review of these changes. Committing and pushing are outside this lane.

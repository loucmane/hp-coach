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

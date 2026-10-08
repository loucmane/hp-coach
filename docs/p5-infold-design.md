# P5 infold: approved reading units in HP-Coach

**APPROVED by the owner 2026-10-07 ("ok infold", bead hpf-nxj0):** decisions A–G as recommended below, the disclosure wording in B as proposed, and the batch1–13 approval roster to be ratified in PR 1 (export contract). Activation and deployment of any release still need separate operator authorization (F). *Correction to the draft:* the batch18/19 CI hold cited in §2/§F/§5 was resolved by PR #372 (six internal-metadata labels added to the lint vocabulary; CI green, merged as `e4ce2a3`).

*Original status line:* **Draft for owner approval · hpf-6afv · 2026-10-07.** Recommendations below are proposals, not implementation authority. Research snapshot: detached `6a4511431652d0b66fd1ea2523807f286f3d772d`; evidence and reproducible census: `docs/worklog/hpf-6afv.md:13`.

> **⚠ AMENDED 2026-10-08 — see [Amendment 1](#amendment-1-2026-10-08-läs-and-elf-switch-to-p5) at the end.** Decisions A, B, D, E, the loader/flow clauses of C, and the phased plan below are superseded where the amendment says so; the rest of C, and F and G, stand.

## 1. Goal and non-goals

Deliver owner-approved LÄS/ELF reading units as clearly disclosed practice, with useful explanations and trustworthy progress. This implements runbook step 14, after owner adjudication (`pipeline/synthetic/BATCH-RUNBOOK.md:60`, `:72`). Preserve the product's zero-knowledge reading protocols, ambition of 2.0 and low-friction ADHD-PI experience: one next action, visible progress, optional explanatory depth (`.taskmaster/docs/prd.txt:46`, `:59`, `:63`, `:96`, `:113`, `:217`).

Scope is importing existing P5 content, not implementing the frozen PRD's deferred all-section, dual-model generator or its deferred teach-back lesson pipeline (`.taskmaster/docs/prd.txt:479`, `:519`). Those dated descriptions do not describe today's P5 artifacts. “Genererat pass” currently composes authentic questions; it does not generate new text (`CLAUDE.md:122`; `app/src/lib/mock.ts:255`). No new generation, calibration claims, production deployment or historical-content rewriting is proposed in this design task.

## 2. Inventory and approval evidence

**120 retained units / 340 questions: LÄS 52 / 136, ELF 68 / 204.** Counted from batches 1–17 `candidates-final/`, and batches 18/19 `candidates/`, excluding every `RETIRED.json` ID. Each cell is **units / questions**; cloze gaps count as questions. All row counts and individual file:line evidence are recorded at `docs/worklog/hpf-6afv.md:67`, `:92`.

| Batch | LÄS | ELF | Retired units / questions |
|---|---:|---:|---:|
| 1 | 3 / 8 | 4 / 12 | 0 / 0 |
| 2 | 2 / 4 | 4 / 12 | 0 / 0 |
| 3 | 3 / 8 | 3 / 7 | 0 / 0 |
| 4 | 2 / 4 | 3 / 11 | 0 / 0 |
| 5 | 3 / 8 | 4 / 12 | 0 / 0 |
| 6 | 2 / 4 | 3 / 7 | 2 / 9 |
| 7 | 3 / 8 | 3 / 7 | 1 / 5 |
| 8 | 2 / 4 | 3 / 7 | 2 / 9 |
| 9 | 3 / 8 | 4 / 12 | 0 / 0 |
| 10 | 3 / 8 | 4 / 12 | 0 / 0 |
| 11 | 2 / 4 | 4 / 12 | 1 / 4 |
| 12 | 3 / 8 | 4 / 12 | 0 / 0 |
| 13 | 3 / 8 | 4 / 12 | 0 / 0 |
| 14 | 3 / 12 | 2 / 10 | 1 / 5 |
| 15 | 3 / 8 | 4 / 12 | 0 / 0 |
| 16 | 3 / 8 | 4 / 12 | 0 / 0 |
| 17 | 3 / 8 | 4 / 12 | 0 / 0 |
| 18 | 3 / 8 | 4 / 12 | 0 / 0 |
| 19 | 3 / 8 | 3 / 11 | 1 / 1 |
| **Total** | **52 / 136** | **68 / 204** | **8 / 33** |

This is the brief's approved-content inventory, **not a certification that 340 questions are export-ready**. Explicit later owner rulings cover the retained 39 units / 121 questions in batches 14–19; batch17's reopened approval was restored and batch19's seventh unit retired (`pipeline/synthetic/batches/batch14/ADJUDICATION.md:689`, `:711`; `pipeline/synthetic/batches/batch15/ADJUDICATION.md:701`, `:739`; `pipeline/synthetic/batches/batch16/STATUS.md:168`; `pipeline/synthetic/batches/batch17/STATUS.md:199`; `pipeline/synthetic/batches/batch18/STATUS.md:127`; `pipeline/synthetic/batches/batch19/STATUS.md:145`).

The other 81 / 219 are legacy shipped inventory: batch13 says COMPLETE, while the whole-bank master records recommendations rather than an owner response (`pipeline/synthetic/batches/batch13/STATUS.md:1`; `pipeline/synthetic/ADJUDICATION-MASTER.md:45`; census at `docs/worklog/hpf-6afv.md:67`). Ratify an exact-file approval roster before export. Retirement wins even where later prose approves `elf-b14-002`; do not silently reinstate it (`pipeline/synthetic/RETIRED.json:2`, `:41`; `pipeline/synthetic/batches/batch14/ADJUDICATION.md:693`).

## 3. Owner decisions

### A. Where students encounter P5

**Options:** (1) Opt-in P5 practice inside LÄS/ELF drills: familiar navigation, but requires source-aware selection. (2) A separate “Övningstexter” set: clearest pilot boundary, with another entry point. (3) Mix into drills, diagnostic, adaptive review and Provpass: widest availability, largest measurement and selection risk.

**Recommend 1**, initially default off, with one saved “Ta med övningstexter” preference. This follows the PRD's initial opt-in intent without adopting its automated threshold for default-on (`.taskmaster/docs/prd.txt:514`). Keep diagnostic and both Provpass modes authentic-only; enable P5 mistake replay with the pilot, but defer automatic adaptive offers and fresh P5 adaptive selection. Today diagnostic shares the bank, ordinary reading drills pick individual questions, replay resolves IDs, and adaptive review uses framework examples (`app/src/lib/diagnostic.ts:45`; `app/src/lib/drill.ts:114`; `app/src/lib/replay.ts:28`; `app/src/routes/drill.tsx:232`, `:540`).

Select a whole P5 passage and its ordered questions, budget by unit rather than truncating at a question quota, and persist that plan for resume. Enforce exclusion pairs across every relevant picker: the owner forbids combining `las-b18-001`/`las-b19-001` in a test or adaptive session; conservatively keep them apart in drills/replay too (`pipeline/synthetic/batches/batch18/STATUS.md:141`).

### B. Student disclosure

**Options:** (1) Badge only: compact, leaves authorship unclear. (2) Persistent badge plus brief inline explanation: clear with little interruption. (3) Modal before every unit: conspicuous, adds repeated friction.

**Recommend 2. Proposed exact copy:** **“ÖVNINGSTEXT”** above each passage, beside the question when the passage is offscreen, and in feedback/replay. At each unit's first display: **“Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.”** On entry/results: **“Dina svar räknas som träning men påverkar inte ditt uppskattade HP-resultat.”** No modal; keep disclosure outside the passage and retain it in focus mode. Do not promise that every name is fictional: the accepted Stintbury/Saintbury near-collision remains recorded (`pipeline/synthetic/batches/batch18/STATUS.md:129`).

The runbook names the frame; gate docs refer to owner-ratified copy without supplying its full wording. Confirm whether existing copy should replace this proposal (`pipeline/synthetic/BATCH-RUNBOOK.md:74`; `pipeline/synthetic/gates/README.md:220`; search evidence `docs/worklog/hpf-6afv.md:24`). UI stays Swedish and ELF content stays English (`CLAUDE.md:180`).

### C. Data path, identity and retirement

**Options:** (1) Export into the authentic bank/index: fewer loading changes, broad exposure risk. (2) Deterministically export a separate P5 file using the app's question fields plus explicit unit/provenance metadata: isolated rollout with one additional loader. (3) Serve raw candidates: least conversion, exposes internal evidence and mismatched fields. **Recommend 2.**

The running app reads per-exam arrays through `_index.json`, not the historical `hp_question_bank.json` path; `Question` lacks `source` and requires `provpass` (`app/src/data/questions.ts:77`, `:124`; historical path `CLAUDE.md:141`). Proposed flow:

`ratified roster + selected candidate bytes − RETIRED → reviewed Layer 2 + deterministic exporter → versioned P5 assets → contentFetch → opted-in drill/replay`

Use a build-time `pipeline/synthetic/export_product.py` and an internal approval manifest with candidate hashes, owner-ruling references and gate evidence. Whitelist `title`, passage→`context`, `prompt`, `options`, key→`answer`, `section`, q_index→`number`, plus `source: "synthetic"`, `unit_id`, revision and explanation-shard reference. Preserve passage, byline, glossary, option order and cloze numbering exactly; these are part of the approved unit (`pipeline/synthetic/GENERATION.md:258`). Never ship `generator_meta`, raw rationales, family maps, repair logs or audit notes.

Proposed qid: `p5-las-b19-001-r1-LAS-001`; stable across rebuilds, new revision for a changed passage/question/key. Use a synthetic `exam_id` namespace and `provpass: null` in a discriminated product type, never invent an authentic sitting. The suffix remains compatible with section extraction and fits the current 60-character API limit (`worker/src/lib/section.ts:11`; `worker/src/routes/attempts.ts:40`). Add explicit P5 explanation resolution: today's resolver requires a real provpass token (`app/src/data/explanations.ts:122`).

Export proposed flat keys `data/p5-bank-<release>.json`, `data/p5-active.json` and `explanations/p5-b19-<release>.json`. Mirror locally to `app/public/`; production uses the existing authenticated R2 path and sync seam, whose whitelist forbids nested paths (`app/src/data/contentSource.ts:4`; `app/scripts/sync-dataset.sh:12`; `worker/src/routes/content.ts:23`). Keep the authentic index unchanged; add P5 only to explicit practice loaders. Version bank and explanations together; publish the active manifest last. Make that manifest non-cacheable, since existing content responses cache for an hour (`worker/src/routes/content.ts:49`).

Retire at unit level: remove every sibling qid from selection, deny new attempts for revoked IDs, and revalidate saved plans on start/resume/submit. Preserve historical answers and show **“Den här övningstexten har tagits ur bruk.”** Exclude retired mistakes from due counts without falsely marking them learned. A rollback must retain the latest retirement denylist.

### D. Explanations and the export contract

**Options:** (1) Copy rationale prose into `solution_path`: cheap, leaks authoring language. (2) Prepare reviewed structured Layer 2 entries before deterministic export: more editorial work, predictable feedback. (3) Generate explanations at runtime: fresh responses, uncontrolled latency and quality. **Recommend 2.** Raw rationales are explicitly source material, not student text (`pipeline/synthetic/LAYER2-RENDERING.md:3`).

Map the key argument to `solution_path` and ordered `steps`; map each of the three wrong choices to `{letter, why_tempting, why_wrong}`. Author `technique`, optional `pitfall`, and a verified existing `framework_id`; a generation family is not automatically a framework ID. These are the actual app fields, rather than the older PRD sketch (`app/src/data/explanations.ts:27`, `:68`; `.taskmaster/docs/prd.txt:125`). Keep explanations Swedish for LÄS, English for ELF (`pipeline/explanations/schema.py:79`). Review that rewriting preserves each option's meaning; do not blindly split rationale sentences.

Require one explanation per exported qid, correct distractor coverage, valid framework references and **zero default learner-output lint findings on the final student strings**, including bank text and explanation fields. Fail on missing/malformed/empty input. Lint is mandatory, not semantic approval (`pipeline/synthetic/LAYER2-RENDERING.md:14`, `:28`, `:48`). Keep metadata in internal artifacts, not hidden under `_meta` in shipped JSON. Render through existing MathText: plain text plus KaTeX, not Markdown/HTML (`app/src/components/MathText.tsx:128`; `app/src/components/drill/PedagogyPanel.tsx:399`).

### E. Stats, ability and mistakes

**Options:** (1) Separate P5 effort/learning from authentic assessment: honest baseline, split aggregates. (2) Downweight P5 in shared estimates: more data, requires calibration evidence and a defensible weight. (3) Equal weight: simplest, treats uncalibrated material as equivalent. **Recommend 1; no arbitrary weighting.**

Current stats count recent attempts into section and weekly scores; Elo filters session kind, not provenance. Tagged attempts also update mastery (`worker/src/routes/me.ts:231`, `:276`, `:358`; `worker/src/lib/fit.ts:205`; `worker/src/routes/attempts.ts:116`). Add server-validated source/revision from a trusted exported qid registry to persisted attempts; never trust a client-supplied `official` flag. Classify legacy authentic IDs from the existing roster, keep unknown IDs out of assessment, and preserve all history.

Count P5 minutes, completions and consistency as practice; report P5 accuracy separately. Keep authentic `bySection` score inputs, weekly score trend, confidence samples, `useAbility`, `useItemStats` fit, normering and Provpass scoring unchanged by P5 attempts. Advance the fitter's watermark even when excluding them (`app/src/api/hooks/useStats.ts:37`; `app/src/api/hooks/useItemStats.ts:23`; `app/src/lib/scoring.ts:89`, `:334`; `app/src/lib/normering.ts:92`; `worker/src/lib/fit.ts:205`).

Allow labeled P5 mistakes and deliberate replay with source preserved. Initially exclude them from automatic hot-trap counts and shared mastery transitions; retain tags for a later separately evaluated practice signal. This matters because current adaptive offers count repeated framework mistakes (`app/src/lib/adaptiveReview.ts:75`). An unavailable P5 file must not block authentic practice or inflate the playable replay count.

### F. Export gates and rollback

**Options:** (1) Trust a final-directory name or old PASS: fast, no evidence binding. (2) Require a reproducible export with current hashes, owner dispositions and gates: auditable. (3) Regenerate/review everything: expensive and changes already approved content. **Recommend 2.**

Before activating any release, require:

- Exact candidate hashes and explicit owner approval; `RETIRED.json` exclusion; `promote.py --require-clean` evidence with explicit candidate directory and merged verdict file. Missing stages HOLD; promotion does not substitute for owner approval (`pipeline/synthetic/gates/scripts/promote.py:7`, `:88`, `:119`; `pipeline/synthetic/BATCH-RUNBOOK.md:72`).
- Sheet synchronization and assembly dispositions, with documented historical exceptions only. Batches 18/19 use `candidates/` and lack some historical sheets; do not claim those were checked (`pipeline/synthetic/gates/scripts/check_sheet_sync.py:12`; `pipeline/synthetic/gates/scripts/check_assembly_dispositions.py:9`; `pipeline/synthetic/batches/batch18/STATUS.md:151`).
- Mechanical schema/bands/form checks, authentic-corpus plagiarism check, and M-ECHO against the complete selected P5 corpus, explicitly including batch18/19. `auto` only finds `candidates-final/`; M-ECHO is flag-only, so require written dispositions and Law-16 real-entity evidence rather than interpreting a zero process exit as clearance (`pipeline/synthetic/gates/scripts/run_mech.py:27`; `pipeline/synthetic/gates/scripts/mech.py:551`; `pipeline/synthetic/batches/batch15/ADJUDICATION.md:713`).
- Final Layer 2 lint, referential integrity, exclusion-pair checks, deterministic output and no internal metadata. Reconcile the recorded batch18/19 CI hold before implementation/release; this offline design does not establish its resolution (`pipeline/synthetic/batches/batch18/STATUS.md:167`; `pipeline/synthetic/batches/batch19/STATUS.md:191`).

Bind evidence to candidate, explanation and exporter versions; changed answer-bearing bytes require renewed review. For new gate execution, honor the runbook's current-stack eval requirement (`pipeline/synthetic/BATCH-RUNBOOK.md:8`). Roll back via P5 disable/previous compatible manifest, retain the latest revocations and all attempt history, and refresh eligibility at session boundaries and grading. Already delivered browser bytes cannot be recalled; server rejection and refresh bound further use. Release activation/deployment needs separate operator authorization.

### G. Copyright posture

**Options:** (1) Publish P5 as independently authored HP-Coach practice with provenance, similarity checks and disclosure under the existing product policy. (2) Seek a specific rights review before any commercial P5 release: added assurance, added lead time. **Recommend 1 for implementation planning**, and reassess rights before a materially broader distribution/commercial use.

Treat these as our authored practice texts, not UHR questions or evidence of UHR endorsement. Do not claim that synthetic generation proves originality or exclusive copyright. Keep real-entity checks and authentic-text similarity checks; fictional attribution and copied expression remain separate concerns (`pipeline/synthetic/GENERATION.md:269`; `pipeline/synthetic/gates/scripts/mech.py:264`; `pipeline/synthetic/RETIRED.json:12`). The local PRD records UHR copyright, uncertainty over third-party commercial permission, and the owner's decision that this is not a public-launch blocker; that decision does not grant a new licence (`.taskmaster/docs/prd.txt:799`). This is a repository-policy proposal, not a new legal clearance.

## 4. Phased implementation after approval

| Small PR | Changes | Acceptance tests |
|---|---|---|
| 1 — Export contract | Ratified approval roster, revisions, retirement/exclusion rules and deterministic exporter; generate preview artifacts only. Resolve recorded evidence/CI prerequisites. | Reproduce census; reject missing approval, changed hashes, retired IDs, duplicate qids and internal metadata; identical reruns. |
| 2 — Layer 2 pilot | Reviewed explanations for a small approved LÄS/ELF sample including cloze, in `data/explanations/`; export allowlist and lint gate. | Every answer/foil grounded; valid tags; lint rejects leaked labels; MathText render fixtures preserve prose/math and glossary. |
| 3 — Provenance and metrics | Worker attempt schema/registry, source-filtered stats/fit/mastery, compatible hooks; feature remains off. | Adding synthetic answers changes effort only; authentic score/ability/trends remain identical; unknown/revoked IDs fail closed; migration and fit-watermark tests. |
| 4 — Reader integration | P5 loader/explanation resolver, opt-in section drills, unit grouping, labels, mistakes/replay, saved-plan retirement handling. | Authentic-only diagnostic/Provpass; no forbidden pairs; reload/resume; unavailable shard; retired due-count handling; keyboard/mobile disclosure checks. |
| 5 — Release packaging | Paired bank/explanation assets, local sync/R2 packaging, non-cacheable active manifest and rollback controls; owner-reviewed pilot then remaining eligible units. | Local/API payload parity; partial release cannot activate; rollback cannot revive retirements; production bundle contains no private source metadata. Deployment remains separately authorized. |

## 5. Open owner questions

Approve A–G individually or with overrides. Confirm the exact disclosure wording, initial opt-in surface and exclusion from automatic adaptive/mastery signals. Ratify the legacy batch1–13 approval roster and preserve `elf-b14-002` retirement unless explicitly reversed in later work. Confirm the earlier topic-pair spacing recommendation when building the roster (`pipeline/synthetic/ADJUDICATION-MASTER.md:28`). Require evidence resolving the recorded batch18/19 CI hold before any infold implementation; gate success and content approval must remain distinct.

---

## Amendment 1 (2026-10-08): LÄS and ELF switch to P5

**Owner direction 2026-10-08** (beads hpf-94i5 pause, this amendment): the product will not serve the authentic, copyrighted UHR reading questions. **LÄS and ELF switch to P5 synthetic units now**; ORD, MEK, XYZ, KVA, NOG and DTK keep their authentic questions until synthetic versions exist. **P5 answers count toward the projected score now**, clearly labelled as not yet calibrated. This supersedes the earlier framing of P5 as opt-in extra practice. The 2026-07-11 decision (PRD §9.2) that copyright is not a launch blocker is narrowed accordingly for LÄS/ELF; the other sections are unchanged for now.

| | Original decision (2026-10-07) | Amended (2026-10-08) |
|---|---|---|
| **A** Where P5 appears | Opt-in inside LÄS/ELF drills, default off; diagnostic and Provpass authentic-only | **LÄS/ELF drills, Provpass and the diagnostic use P5 only.** Authentic LÄS/ELF questions, passages and explanations are no longer served to students. No opt-in setting. Whole passages, never split; exclusion pairs (e.g. las-b18-001 / las-b19-001) enforced in every picker. |
| **B** Disclosure | Badge + inline note; "Dina svar räknas som träning men påverkar inte ditt uppskattade HP-resultat." | Keep the persistent **ÖVNINGSTEXT** badge and the authorship note (»Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.«). Replace the results line with a caveat wherever an LÄS/ELF-based estimate is shown: **»Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.«** |
| **D** Explanations | 19-question pilot, the rest later | **Every exported P5 question needs a reviewed Layer-2 explanation before the switch** (340 questions; 19 done in PR #376). This is now on the critical path. Same format and export gate as the pilot. |
| **E** Stats | P5 kept out of every authentic assessment input | **P5 answers feed section scores, the weekly trend, ability, Provpass scoring and the HP-scale projection now.** Provenance stays server-side (`authentic` / `synthetic` / `unknown`, never client-trusted) and every synthetic contribution is marked `uncalibrated` in the data so it can be recalibrated later (e.g. against users' real HP results or anchor items) without losing history. Unknown ids still fail closed. Mastery/framework progress and adaptive-review counts may take P5 answers where the item has a valid framework_id. |
| **C** Data path | Separate P5 export; flow ending in `contentFetch → opted-in drill/replay`; "keep the authentic index unchanged; add P5 only to explicit practice loaders" | **Data path, ids, versioning, R2/manifest delivery and unit-level retirement unchanged** (separate deterministic P5 export, revisioned qids, synthetic `exam_id`, `provpass: null`). **Superseded:** the flow now ends in `contentFetch → LÄS/ELF drills, Provpass, diagnostic and replay`, and P5 is the **only** LÄS/ELF source for every picker, not an opt-in practice loader. The authentic index stays in the repository and R2 but its LÄS/ELF entries are no longer selected for students (ORD/MEK/quant entries unchanged). |
| F, G | — | Unchanged. |

**Revised phased plan** (replaces §4):

| PR | Bead | Changes |
|---|---|---|
| 1 — Export contract | hpf-535m | Shipped (PR #375). |
| 2 — Explanations pilot | hpf-no7l | Shipped (PR #376). |
| 2b — Explanations for all P5 questions | new | Reviewed Layer-2 entries for the remaining 321 questions, in batches, each through the export gate and a language/correctness review. |
| 3 — Provenance + uncalibrated scoring | hpf-94i5 (rescoped) | Server-side provenance; P5 counted in assessment with an `uncalibrated` marker; caveat data exposed to the app. Migration SQL committed, **not applied** (database application is operator-authorized). |
| 4 — LÄS/ELF switch | hpf-8s3r (rescoped) | LÄS/ELF drills, Provpass and diagnostic serve P5 only; authentic LÄS/ELF removed from student delivery; ÖVNINGSTEXT badge, authorship note and estimate caveat; replay and retirement handling. |
| 5 — Release packaging | hpf-itny | As before; activation and deployment separately authorized. |

**Owner answers (2026-10-08):**
1. *Provpass reuse with a smaller LÄS/ELF pool:* accepted for now — the remedy is more P5 batches, not reusing authentic content. Batches 20–23 (staged on `backup/p5-batch20-23-wip`, beads hpf-ldjj / hpf-mjml / hpf-l77g / hpf-be9e) therefore matter for pool size and come after the infold in the queue.
2. *Removal scope:* **stop serving only.** Authentic LÄS/ELF questions, passages and explanations stay in the repository, `data/` and R2; the product simply no longer serves them to students. No deletion.



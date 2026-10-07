---
bead: "hpf-6afv"
project: "hpfetcher"
session: "ci-t39q6"
status: "design_ready_pending_owner"
---

# Worklog — hpf-6afv

## Findings

- 2026-10-07: Read the operator's brief at `/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/briefs/hpf-6afv.md:1`. This is a design-only assignment; only this note and `docs/p5-infold-design.md` may be created, uncommitted. The later operator instruction supersedes the pool startup instructions: no GC, network, servers, git writes or source changes during this assignment.
- Snapshot: read-only `git rev-parse HEAD origin/main` returned `6a4511431652d0b66fd1ea2523807f286f3d772d` twice; `git symbolic-ref -q --short HEAD` returned no branch (detached). Initial untracked runtime/skill paths were present under `.agents/skills`, `.claude/skills`, `.codex/` and `.gc/`; they are unrelated and preserved.
- Product intent: zero prior knowledge, target 2.0, ADHD-PI support (`CLAUDE.md:83`; `.taskmaster/docs/prd.txt:46`, `:59`, `:63`). Layer 1 reading protocols and Layer 2 distractor explanations precede adaptive intervention (`.taskmaster/docs/prd.txt:96`, `:113`, `:140`); single-action home and concept-to-drill flows are in `:217`, `:239`, `:262`. The frozen PRD is product evidence, not active task authority (`CLAUDE.md:194`).
- Historical scope distinction: deferred all-section generator is described at `.taskmaster/docs/prd.txt:479`; deferred lesson generation at `:519`. The newer P5 runbook requires owner adjudication and reserves product import for step 14 (`pipeline/synthetic/BATCH-RUNBOOK.md:8`, `:60`, `:72`). Do not repeat the historical claim that `pipeline/synthetic/` does not exist as a current fact.
- Current data path: parsed exam arrays are mirrored into app assets (`app/scripts/sync-dataset.sh:23`, `:39`), then `loadBank()` reads `data/_index.json` and the named files (`app/src/data/questions.ts:124`). Local filesystem checks found `data/hp_question_bank.json` and `data/parsed/` absent in this lane, `data/explanations/` present, and 27 exams in `app/public/data/_index.json`. These are snapshot observations, not production-service checks.
- Content transport: local assets versus authenticated R2 are selected by `contentFetch` (`app/src/data/contentSource.ts:4`, `:63`); sync source and deployment intent are documented at `app/scripts/sync-dataset.sh:12`. The worker permits only flat ASCII JSON keys under `data/` and `explanations/` and caches privately for one hour (`worker/src/routes/content.ts:23`, `:49`).
- Product type lacks provenance and requires a real-pass-shaped `provpass` (`app/src/data/questions.ts:77`). Regular reading drills sample individual questions, unlike DTK blocks (`app/src/lib/drill.ts:114`). Provpass's `pickSynthetic` is an authentic-question composite today, with passage grouping but no content-source filter (`CLAUDE.md:122`; `app/src/lib/mock.ts:143`, `:255`). Diagnostic currently defaults to ten questions sampled across sections (`app/src/lib/diagnostic.ts:21`, `:45`), rather than the PRD's full-half vision (`.taskmaster/docs/prd.txt:204`).
- Replay resolves mistake question IDs through the bank and skips missing questions (`app/src/lib/replay.ts:28`); resumed repetition also resolves stored IDs (`app/src/routes/repetition.tsx:154`). Adaptive detection uses at least three recent mistakes per framework (`app/src/lib/adaptiveReview.ts:22`, `:84`); its drill pool is drawn from framework `example_questions` (`app/src/routes/drill.tsx:555`). Adding a P5 JSON file alone does not integrate these paths.
- Stats risk: `useStats` consumes worker aggregates used for projected score (`app/src/api/hooks/useStats.ts:37`); all recent attempts feed section and weekly aggregates without a content-source test (`worker/src/routes/me.ts:231`, `:276`, `:358`). `scoring.ts:89` derives section score and `:334` weekly score. `useItemStats`/`useAbility` expose the nightly Elo output (`app/src/api/hooks/useItemStats.ts:1`); the fitter filters session kind but not content source (`worker/src/lib/fit.ts:205`). Normering derives authentic-pass scores from official half tables, with a linear fallback (`app/src/lib/normering.ts:1`, `:92`).
- Persistence risk: attempts accept question IDs up to 60 characters and no source field (`worker/src/routes/attempts.ts:37`); tagged answers also update mastery (`:116`). Section extraction depends on the question ID suffix (`worker/src/lib/section.ts:11`). Source separation must reach persistence, fit, score trends and mastery before a P5 answer can be recorded.
- Candidate structure: the contract defines whole-unit title/passage, glossary and byline embedded in passage, four choices, key, and one rationale string explaining every choice (`pipeline/synthetic/GENERATION.md:246`, `:258`, `:263`). `generator_meta` carries internal provenance and the question-family map (`:269`). The census found all 373 question objects have `q_index`, `prompt`, `options`, `key`, `rationale`; actual top-level keys also include `repair_log`. Export must use a whitelist, not serialize the candidate object. ELF cloze prompts are `Gap (n)` (`pipeline/synthetic/batches/batch18/candidates/elf-b18-002.json:10`); preserve gap-to-question correspondence.
- Explanations: the current store is keyed by qid and uses `solution_path`, structured `steps`, per-distractor `why_tempting`/`why_wrong`, `technique`, `pitfall`, optional `framework_id` (`app/src/data/explanations.ts:27`, `:68`, `:112`). The qid-to-file resolver currently searches for authentic provpass tokens (`:122`). Rendered pedagogy uses MathText (`app/src/components/drill/PedagogyPanel.tsx:207`, `:399`, `:442`), which inserts only KaTeX HTML and otherwise renders React text (`app/src/components/MathText.tsx:128`). Explanation steps are Swedish, English for ELF (`pipeline/explanations/schema.py:79`).
- Disclosure search: `rg -n 'ÖVNINGSTEXT'` over product/docs/pipeline text found the frame named in the runbook and gate documentation, but no complete student-facing copy in the inspected product surfaces. The gate docs refer to owner-ratified copy without providing it (`pipeline/synthetic/gates/README.md:220`; `pipeline/synthetic/gates/adjudication-package.md:68`). Exact copy in the design is therefore proposed for owner confirmation, not represented as previously approved wording.
- Approval evidence: batches 14/15 have later owner rulings that supersede their pending STATUS headings (`pipeline/synthetic/batches/batch14/ADJUDICATION.md:689`, `:711`; `pipeline/synthetic/batches/batch15/ADJUDICATION.md:701`, `:739`). Batch16 is 7/7 approved (`pipeline/synthetic/batches/batch16/STATUS.md:168`); batch17's reopened package was restored (`pipeline/synthetic/batches/batch17/STATUS.md:199`); batch18 is 7/20 and batch19 6/19 after retirement (`pipeline/synthetic/batches/batch18/STATUS.md:127`; `pipeline/synthetic/batches/batch19/STATUS.md:145`). These explicitly documented, retained batches total 39 units / 121 questions. Batches 1–13 contribute 81 / 219 retained legacy units/questions: their master document records recommendations, not the owner's response (`pipeline/synthetic/ADJUDICATION-MASTER.md:45`), while e.g. batch13 is recorded COMPLETE/shipped (`pipeline/synthetic/batches/batch13/STATUS.md:1`). The brief treats these as the approved inventory, but export should require a ratified exact-file approval roster; filesystem presence and promote PASS alone are insufficient proof.
- Retirement precedence: all eight IDs in `pipeline/synthetic/RETIRED.json:4` are subtracted, including `elf-b14-002` despite the later approval wording in `pipeline/synthetic/batches/batch14/ADJUDICATION.md:693`. Do not infer reinstatement. The registry explicitly requires every import to exclude these IDs (`pipeline/synthetic/RETIRED.json:2`).
- Standing selection rule: never combine `las-b18-001` and `las-b19-001` in a test pass or adaptive session (`pipeline/synthetic/batches/batch18/STATUS.md:141`; `pipeline/synthetic/batches/batch19/STATUS.md:165`). Earlier master recommendation also flags the `las-b3-002`/`elf-b3-002` topic pair (`pipeline/synthetic/ADJUDICATION-MASTER.md:28`); retain as a conservative exclusion pair pending roster ratification.
- Export readiness is unproven here. Batch18/19 record an unresolved historical CI vocabulary failure (`pipeline/synthetic/batches/batch18/STATUS.md:167`; `pipeline/synthetic/batches/batch19/STATUS.md:191`). Their sheet check needed a historical directory adapter and did not check absent blind/distractor sheets (`pipeline/synthetic/batches/batch18/STATUS.md:151`). No network CI lookup or gate re-certification was performed for this design. These are release prerequisites to reconcile, not grounds to invent new approval or alter history.
- Legal posture is reported only from local product policy: `.taskmaster/docs/prd.txt:799` records UHR rights and the owner's decision that this does not block public-facing work, with reassessment for material changes in distribution/commercial scope. No external legal verification was attempted under the no-network brief.

## Decisions

- 2026-10-07: Draft recommendations, not approved implementation decisions. Recommend separate versioned P5 assets, opt-in section practice, unit-preserving selection, mandatory reviewed Layer 2 output, and explicit provenance before any learner exposure. Keep authentic assessment and practice effort as separate metrics.
- Treat inventory as a reproducible content census, with approval provenance and export readiness recorded separately. Exclude every retirement mechanically. Leave legacy approval attestation and conflicting historical statements visible for owner review.
- Keep raw generator metadata, rationale history and gate evidence internal. Specify proposed student copy without claiming that full wording has already been approved. Do not implement the deferred generator or lesson pipeline.

## Progress

- 2026-10-07 [S:ci-t39q6|W:hpf-6afv|H:research|E:6a4511431652d0b66fd1ea2523807f286f3d772d] Confirmed detached snapshot; inspected product policy, loading, selection, feedback, persistence, scoring and P5 evidence using read-only commands.

### Inventory method and results

Read exactly `batches/batch1` through `batch17` from `candidates-final/*.json`; read batch18/19 from `candidates/*.json`. Count one unit per JSON file and `len(questions)` per unit. Subtract IDs in `pipeline/synthetic/RETIRED.json:4`; never fall back to a different directory, infer missing slots, count intermediate copies or count cloze gaps twice. Source pointers below identify the `questions` array in every selected file.

Reproduce in memory from the repository root (stdlib only; no imports from project code, writes, or network):

```python
import json
from pathlib import Path
root = Path('pipeline/synthetic')
retired = json.loads((root / 'RETIRED.json').read_text())['retired']
for n in range(1, 20):
    folder = 'candidates' if n in (18, 19) else 'candidates-final'
    files = sorted((root / 'batches' / f'batch{n}' / folder).glob('*.json'))
    assert files
    counts = {section: [0, 0] for section in ('LÄS', 'ELF')}
    for path in files:
        unit = json.loads(path.read_text())
        if unit['candidate_id'] in retired:
            continue
        count = counts[unit['section']]
        count[0] += 1
        count[1] += len(unit['questions'])
    print(n, counts)
```

| Batch | LÄS retained units / questions | ELF retained units / questions | Removed units / questions |
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

Raw selected files: **128 units / 373 questions**. Removed: **8 / 33**. Retained: **120 / 340**. LÄS: **52 / 136**. ELF: **68 / 204**. Candidate IDs and per-unit question indices are unique; all retirement IDs resolve in the selected source directories.

### Per-file census evidence

| Candidate file and questions-array line | Questions | Disposition |
|---|---:|---|
| `pipeline/synthetic/batches/batch1/candidates-final/elf-b1-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/elf-b1-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/elf-b1-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/elf-b1-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/las-b1-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/las-b1-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch1/candidates-final/las-b1-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/elf-b2-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/elf-b2-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/elf-b2-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/elf-b2-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/las-b2-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch2/candidates-final/las-b2-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/elf-b3-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/elf-b3-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/elf-b3-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/las-b3-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/las-b3-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch3/candidates-final/las-b3-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch4/candidates-final/elf-b4-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch4/candidates-final/elf-b4-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch4/candidates-final/elf-b4-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch4/candidates-final/las-b4-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch4/candidates-final/las-b4-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/elf-b5-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/elf-b5-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/elf-b5-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/elf-b5-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/las-b5-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/las-b5-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch5/candidates-final/las-b5-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch6/candidates-final/elf-b6-001.json:7` | 5 | retired |
| `pipeline/synthetic/batches/batch6/candidates-final/elf-b6-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch6/candidates-final/elf-b6-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch6/candidates-final/elf-b6-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch6/candidates-final/las-b6-001.json:7` | 4 | retired |
| `pipeline/synthetic/batches/batch6/candidates-final/las-b6-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch6/candidates-final/las-b6-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/elf-b7-001.json:7` | 5 | retired |
| `pipeline/synthetic/batches/batch7/candidates-final/elf-b7-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/elf-b7-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/elf-b7-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/las-b7-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/las-b7-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch7/candidates-final/las-b7-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch8/candidates-final/elf-b8-001.json:7` | 5 | retired |
| `pipeline/synthetic/batches/batch8/candidates-final/elf-b8-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch8/candidates-final/elf-b8-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch8/candidates-final/elf-b8-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch8/candidates-final/las-b8-001.json:7` | 4 | retired |
| `pipeline/synthetic/batches/batch8/candidates-final/las-b8-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch8/candidates-final/las-b8-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/elf-b9-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/elf-b9-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/elf-b9-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/elf-b9-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/las-b9-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/las-b9-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch9/candidates-final/las-b9-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/elf-b10-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/elf-b10-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/elf-b10-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/elf-b10-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/las-b10-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/las-b10-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch10/candidates-final/las-b10-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/elf-b11-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/elf-b11-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/elf-b11-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/elf-b11-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/las-b11-001.json:7` | 4 | retired |
| `pipeline/synthetic/batches/batch11/candidates-final/las-b11-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch11/candidates-final/las-b11-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/elf-b12-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/elf-b12-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/elf-b12-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/elf-b12-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/las-b12-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/las-b12-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch12/candidates-final/las-b12-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/elf-b13-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/elf-b13-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/elf-b13-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/elf-b13-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/las-b13-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/las-b13-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch13/candidates-final/las-b13-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch14/candidates-final/elf-b14-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch14/candidates-final/elf-b14-002.json:7` | 5 | retired |
| `pipeline/synthetic/batches/batch14/candidates-final/elf-b14-003.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch14/candidates-final/las-b14-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch14/candidates-final/las-b14-002.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch14/candidates-final/las-b14-003.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/elf-b15-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/elf-b15-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/elf-b15-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/elf-b15-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/las-b15-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/las-b15-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch15/candidates-final/las-b15-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/elf-b16-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/elf-b16-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/elf-b16-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/elf-b16-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/las-b16-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/las-b16-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch16/candidates-final/las-b16-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/elf-b17-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/elf-b17-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/elf-b17-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/elf-b17-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/las-b17-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/las-b17-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch17/candidates-final/las-b17-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch18/candidates/elf-b18-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch18/candidates/elf-b18-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch18/candidates/elf-b18-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch18/candidates/elf-b18-004.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch18/candidates/las-b18-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch18/candidates/las-b18-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch18/candidates/las-b18-003.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch19/candidates/elf-b19-001.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch19/candidates/elf-b19-002.json:7` | 5 | retained |
| `pipeline/synthetic/batches/batch19/candidates/elf-b19-003.json:7` | 1 | retained |
| `pipeline/synthetic/batches/batch19/candidates/elf-b19-004.json:7` | 1 | retired |
| `pipeline/synthetic/batches/batch19/candidates/las-b19-001.json:7` | 4 | retained |
| `pipeline/synthetic/batches/batch19/candidates/las-b19-002.json:7` | 2 | retained |
| `pipeline/synthetic/batches/batch19/candidates/las-b19-003.json:7` | 2 | retained |

### Design review and validation

- 2026-10-07 [S:ci-t39q6|W:hpf-6afv|H:design|E:docs/p5-infold-design.md] Wrote the English design with Swedish UI copy, a 19-batch inventory, seven decisions with concrete alternatives/trade-offs/recommendations, five proposed PRs and owner questions. Approximately 2,400 words; detailed evidence is kept here.
- 2026-10-07: Citation correction to the earlier adaptive-pool finding: `app/src/routes/drill.tsx:555` is the multi-trap picker. The adaptive detour specifically routes through the framework parameter at `app/src/routes/drill.tsx:232` and resolves `example_questions` at `app/src/routes/drill.tsx:540`. The design cites those exact locations. The earlier shortened `scoring.ts:89` reference means `app/src/lib/scoring.ts:89`.
- 2026-10-07 [S:ci-t39q6|W:hpf-6afv|H:verify|E:local-document-checks] Recomputed every inventory row independently and matched all 19 rows in both files. Checked 255 full file:line references for existence/range, then corrected the two worklog anchors and adaptive picker citation by inspection. Verified balanced Markdown fences, no trailing whitespace, unchanged detached HEAD, and no tracked or staged changes. `git status --short` shows only the two requested new documents beyond the original runtime/skill artifacts. No app tests or export gates run: this task changes documentation only and does not certify product release readiness.

## Handoff

- Design is ready for owner review. Deliverables: `docs/p5-infold-design.md` and this evidence note; both remain uncommitted.
- Base/reviewed repository head: `6a4511431652d0b66fd1ea2523807f286f3d772d`. No implementation head exists because no source code was changed. Review disposition: author self-review and local document/census checks completed; independent review and owner approval are not claimed.
- Next action: owner reviews decisions A–G. Any later implementation must establish exact-file approval provenance, preserve all retirements and standing exclusion rules, and resolve recorded export-gate prerequisites. Nothing here closes or changes Beads state, authorizes deployment, or establishes external legal clearance.
- The operator's lane-specific instruction places the final note here rather than in the vault worklog. No GC command, network call, server or git mutation was performed after that instruction.

## Bead note (pending)

Drafted docs/p5-infold-design.md: seven owner decisions, phased PRs and cited evidence. Census: 120 retained units / 340 questions (52/136 LÄS; 68/204 ELF), excluding all eight retirements. Recommends opt-in drills, separate P5 assets, reviewed Layer 2 and authentic-score isolation. Legacy approval attestation and recorded CI hold remain export prerequisites. Citation/census checks pass; only the two requested docs created, uncommitted. Owner approval required before implementation.
LANE DONE: hpf-6afv

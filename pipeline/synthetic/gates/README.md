# Synthetic passage gate harness (P5)

The quality-gate system that stands between generated LÄS/ELF passages and
students. Generation happens elsewhere (`pipeline/synthetic/las/`,
`pipeline/synthetic/elf/` — owned by the generation analysts). This directory
owns **trustworthiness**: nothing reaches the adjudication queue, and nothing
reaches a student, that has not survived every gate below.

Owner bar for the arc: *SOTA, exceeding expectations.* The design principle
here is **cheap-lethal-first**: run the checks that are cheapest and most
decisive earliest, so a doomed candidate dies before any expensive LLM gate
is spent on it.

## The harness is a test suite where some tests are prompts

The project never calls LLM APIs directly — bulk LLM work runs through the
in-session agent harness. So a "gate" is one of two things:

- a **mechanical gate**: committed Python that code can decide alone
  (`scripts/mech.py`), or
- a **prompt gate**: a precise, self-contained document
  (`prompts/G-*.md`) that a **fresh agent with no other context** executes
  against one candidate, emitting a structured JSON verdict.

Both kinds emit the identical verdict shape (`schemas/verdict.schema.json`),
so aggregation (`scripts/aggregate.py`) is purely mechanical.

## Flow

```
                 generation analysts (las/ , elf/)
                              │  candidate-item JSON  (schemas/candidate-item.schema.json)
                              ▼
        ┌─────────────────────────────────────────────┐
        │ 1. MECHANICAL   scripts/run_mech.py          │  cheap, deterministic, no LLM
        │    M-SCHEMA → M-BANDS → M-PLAGIARISM          │  ── any kill ▶ DEAD (stop) ──┐
        └─────────────────────────────────────────────┘                              │
                              │ survivors                                             │
                              ▼                                                       │
        ┌─────────────────────────────────────────────┐                              │
        │ 2. LETHAL CORRECTNESS   (prompt gates)       │                              │
        │    G-KEY (blind solve ×2) → G-STEM →         │  ── any kill ▶ DEAD (stop) ──┤
        │    G-DISTRACTOR                              │                              │
        └─────────────────────────────────────────────┘                              │
                              │ survivors                                             │
                              ▼                                                       │
        ┌─────────────────────────────────────────────┐                              │
        │ 3. LANGUAGE   (prompt gates, 3 votes each)   │                              │
        │    LÄS ▶ G-SPRÅK   |   ELF ▶ G-ENG           │  ── ≥2 kill votes ▶ DEAD ────┤
        └─────────────────────────────────────────────┘                              │
                              │ survivors (0–1 kill vote)                             │
                              ▼                                                       │
        ┌─────────────────────────────────────────────┐                              │
        │ 4. AUTHENTICITY   G-REGISTER (prompt gate)   │  ── kill ▶ DEAD ─────────────┤
        │    comparative vs exemplar_pool              │                              │
        └─────────────────────────────────────────────┘                              │
                              │ survivors                                             ▼
                              ▼                                                  batch kill log
        ┌─────────────────────────────────────────────┐                       (audits the gates)
        │ 5. AGGREGATE   scripts/aggregate.py          │
        │    SURVIVED_CLEAN | SURVIVED_FLAGGED         │
        └─────────────────────────────────────────────┘
                              │
                              ▼
              adjudication package  (adjudication-package.md)
                              │
                              ▼
                    OWNER: Godkänn / Avvisa / Ändra
```

## Gate inventory & kill rules

| # | gate | kind | scope | kill rule |
|---|------|------|-------|-----------|
| 1 | **M-SCHEMA** | python | passage | any structural lethal (missing field, not exactly A–D, key not among options, dup option text) → **kill** |
| 2 | **M-BANDS** | python | passage | length/stat outside `bands.json` band → **kill** when `calibrated:true`, else **flag** |
| 3 | **M-PLAGIARISM** | python | passage | exact shared n-gram ≥ `ngram_kill` with authentic corpus → **kill**; 8-gram containment > `containment_flag` → **flag**. Excludes the candidate's own source passage (eval items only) |
| 4 | **G-KEY** | prompt ×2 | per question | blind solver's answer ≠ key, or `NONE`/`MULTIPLE_DEFENSIBLE`, on **either** vote → **kill** |
| 5 | **G-STEM** | prompt | per question | structural leak (form-answerable options/stem) or pure factual recall → **kill**; world-knowledge answerability with substantive distractors, or partial blind-elimination → **flag** (authentic keys are often globally true — that is test design, not a defect) |
| 6 | **G-DISTRACTOR** | prompt | per question | any distractor defensibly correct → **kill**; merely-attractive distractor → **flag** |
| 7 | **G-SPRÅK** | prompt ×3 | passage (LÄS) | native-register audit; per vote any lethal finding → vote=kill. **≥2 kill votes → kill**; exactly 1 → **flag** |
| 8 | **G-ENG** | prompt ×3 | passage (ELF) | same as G-SPRÅK for academic-magazine English |
| 9 | **G-REGISTER** | prompt | passage | reads as non-HP (wrong genre / manufactured tidiness / alien question style) vs exemplars → **kill**; edge-of-range → **flag** |

**Aggregation rule (single source of truth: `scripts/aggregate.py`).** Any
lethal-gate kill (gates 1–6, 9) ⇒ DEAD. Language gate (7 or 8): ≥2 of 3 kill
votes ⇒ DEAD, exactly 1 ⇒ SURVIVED_FLAGGED. Any flag anywhere ⇒ at best
SURVIVED_FLAGGED. Missing a required verdict with nothing killed ⇒ INCOMPLETE
(never ship). A lethal kill legitimately terminates a candidate's pipeline
early, so downstream verdicts absent *after* a kill are not INCOMPLETE.

### Why these numbers

- **G-KEY ×2, either kills.** A wrong key is the one defect that teaches a
  falsehood; the cost of killing a good item is one regenerated passage, the
  cost of shipping a wrong key is a student mis-taught. Asymmetric, so err
  toward killing: two independent blind solvers, either mismatch is fatal. A
  wrong key survives only if two independent experts make the *same* mistake.
- **Language gates 3 votes, threshold 2.** Native-register judgment is real
  but noisy — a single reviewer both misses subtle calques and occasionally
  over-convicts idiomatic-but-unusual prose. Three independent votes with a
  majority-kill threshold cut both error directions; the lone dissenter is not
  discarded but carried to adjudication as a flag, so a real defect one
  reviewer caught still reaches the owner.
- **G-REGISTER single run.** Batch 1 uses the simple comparative version (a
  full discrimination panel is descoped per plan); one run that must read the
  exemplars keeps it honest without over-investing before the register bar is
  proven.

## Roles

- **Generation analysts** (`las/`, `elf/`): produce candidate-item JSON;
  **fill `bands.json`** (measure the authentic corpus, set `calibrated:true`);
  set the plagiarism thresholds. Until they do, M-BANDS only flags.
- **Gate orchestrator** (in-session, per batch): strips `_seed`, runs the
  stages in order, dispatches prompt gates to fresh agents, aggregates,
  builds the adjudication package. Runbook below.
- **Owner**: final adjudication (`Godkänn/Avvisa/Ändra`) on survivors.

## Orchestration runbook — how a Batch-1 run flows

Precondition: the gate stack has a **passing eval run** no older than any
gate change and no older than 30 days (`evalset/run-protocol.md`). If not,
run and pass the eval first; a failing eval **freezes** the stack.

1. **Ingest.** Collect the batch's candidate JSONs into one `batch_dir/`.
   Validate each against `schemas/candidate-item.schema.json`. Strip any
   `_seed` block (belt-and-suspenders; only eval items have one).
2. **Stage 1 — mechanical.**
   `python3 scripts/run_mech.py batch_dir/*.json --parsed-dir <repo>/data/parsed --out batch_dir/verdicts.jsonl`.
   Candidates with a mechanical kill are done (DEAD); do not spend LLM gates
   on them.
3. **Stage 2 — lethal correctness.** For each surviving question, dispatch
   three fresh agents: two `prompts/G-KEY.md` (votes 1–2, key withheld) and
   one each `prompts/G-STEM.md`, `prompts/G-DISTRACTOR.md`. Convert G-KEY
   solver reports to verdicts (answer vs key) and append all to
   `verdicts.jsonl`. A question that dies drops its whole candidate.
4. **Stage 3 — language.** For each still-surviving passage dispatch **three**
   fresh agents of the section's language gate (`G-SPRÅK.md` for LÄS,
   `G-ENG.md` for ELF), votes 1–3. Append verdicts.
5. **Stage 4 — authenticity.** For each survivor dispatch one
   `prompts/G-REGISTER.md` agent, handing it the section+length-matched
   `exemplar_pool` qids from `evalset/manifest.json` to load and compare.
6. **Aggregate.**
   `python3 scripts/aggregate.py batch_dir/verdicts.jsonl --candidates-dir batch_dir --json batch_dir/report.json`.
7. **Package.** Build the adjudication artifact
   (`adjudication-package.md`) from `report.json` + the candidate files +
   exemplars, one card per SURVIVED item, flagged first.
8. **Kill log.** Emit the DEAD list with killing gate + finding for the batch
   audit trail (feeds the generation analysts' failure-mode review).

Agents run in parallel within a stage (independent per candidate/question),
serialized across stages (a stage only runs on the prior stage's survivors —
that is the cost-saving order). Every dispatched agent gets ONLY its gate doc
+ the permitted slice of the candidate; never the key (except G-DISTRACTOR),
never another gate's verdict, never `_seed`.

## Pre-registered Batch-1 acceptance criteria (template)

Fill and freeze BEFORE running Batch 1 so the outcome cannot be rationalized
after the fact. GO-for-Batch-2 requires all of:

```
Batch 1 acceptance — pre-registered <date>, gates git SHA <sha>
  eval gate:        eval run <date/SHA> PASSED (0 authentic false-kills,
                    100% seeded kill-by-intended-gate)              [ ]
  batch size:       N = ____ candidates generated
  survival:         SURVIVED (clean+flagged) rate  ≥ ____ %   actual ____ %  [ ]
                    (a floor guards against a generator so weak the gates
                    reject nearly everything — that is a generation problem,
                    not a win for the gates)
  clean rate:       SURVIVED_CLEAN rate            ≥ ____ %   actual ____ %  [ ]
  lethal kills:     no surviving item overturned by the owner on a lethal
                    dimension (wrong key / double key / passage-independent /
                    non-native language) ............................ MUST = 0 [ ]
  owner adjudication: of SURVIVED items, Godkänn rate ≥ ____ %  actual ____ % [ ]
                    Avvisa reasons reviewed for a gate blind spot ....... [ ]
  family health:    no generation family contributes > ____ % of DEADs
                    without a documented cause ......................... [ ]
  residue logged:   every Ändra edit + every owner-caught defect the gates
                    missed filed as a gate or seed improvement .......... [ ]

GO for Batch 2 iff: eval gate PASSED AND owner-overturned lethal count = 0
AND Godkänn rate ≥ threshold AND every owner-caught miss has a filed fix.
The single hard stop is "owner-overturned lethal = 0": the gates exist to
make that number zero. If the owner catches even one lethal defect the gates
passed, Batch 2 waits until that hole is closed (new seed + gate fix + eval
rerun).
```

## Files

```
gates/
├── README.md                         # this file
├── adjudication-package.md           # owner-facing card design
├── bands.json                        # analyst-filled length/stat/plagiarism contract (PLACEHOLDER)
├── schemas/
│   ├── candidate-item.schema.json    # the unit that flows through the stack
│   └── verdict.schema.json           # the shape every gate emits
├── prompts/                          # prompt gates — each executable by a fresh agent
│   ├── G-KEY.md  G-STEM.md  G-DISTRACTOR.md
│   ├── G-SPRAK.md  G-ENG.md  G-REGISTER.md
├── scripts/
│   ├── mech.py                       # M-SCHEMA / M-BANDS / M-PLAGIARISM
│   ├── run_mech.py                   # batch runner for the mechanical stage
│   ├── aggregate.py                  # THE aggregation/kill rule
│   ├── load_evalset.py               # materialize eval batch (authentic from bank, seeds stripped)
│   ├── score_eval.py                 # the gate on the gates
│   └── tests/test_mech.py            # python3 -m pytest tests/
└── evalset/
    ├── manifest.json                 # authentic qids + seeded list + exemplar pool (frozen)
    ├── run-protocol.md               # when to rerun, thresholds, freeze rule
    └── seeded/*.json                 # 15 authored defect items (+ 1 hard negative)
```

## Out of scope here

- **Generation** — `las/` and `elf/` (sibling analysts).
- **ÖVNINGSTEXT / synthetic-content disclosure copy** — owner-ratified, lives
  with the product surface; not a gate concern.
- **Gate A discrimination panel** (full authenticity panel) — descoped for
  Batch 1; G-REGISTER is the simple comparative version.

# Batch runbook — running a P5 generation batch end to end

The orchestrator's playbook for turning "generate N more units" into an
adjudication package. Extracted from the Batch-1 run (`batches/batch1/`) and the
eval proving + Opus-certification rounds (`gates/evalset/runs/`). The generator
authoring laws live in `GENERATION.md`; this doc is the *process* around them.

**Standing invariant:** nothing is gated by a gate stack — model *or* prompts —
that has not passed its most recent required eval run
(`gates/evalset/run-protocol.md`) **and that eval run is no older than 30 days**
(run-protocol drift trigger 5 — re-run even with no gate change). This is
**Stage 0** below, a hard go/no-go before any batch. Nothing reaches a student
without owner adjudication.

---

## Model tiering (owner directive 2026-07-21)

Bulk P5 work — generation AND gate execution — runs on **Opus** subagents to
conserve Fable usage. Opus was **certified** as a gate executor on 2026-07-21
(`gates/evalset/runs/2026-07-21-opus-cert/`): 0/15 authentic false kills, 14/14
right-gate seed kills, near-exact parity with the Fable benchmark. **Fable
stays the orchestrator** — dispatch, aggregation, scoring, verification,
shipping.

> A gate **model** change is a gate change: re-run the eval and archive the
> result under `gates/evalset/runs/<date>-<label>/` before gating a batch with
> the new model. Same for any gate **prompt** edit.

---

## The end-to-end sequence

```
0. EVAL GATE  confirm the current gate stack passed its eval AND run ≤30 days old
                (else re-run the eval, archive under gates/evalset/runs/) — no batch otherwise
1. GENERATE   Opus generator agents, one per unit-type, GENERATION.md contract
                → gen-*.json in a scratch batch dir (candidate_id = "PLACEHOLDER")
2. ASSEMBLE   assign collision-free candidate_ids from a shared counter
                → batches/batch<N>/candidates/(las|elf)-b<N>-<nnn>.json
3. MECH       run_mech.py over candidates/*.json (schema, bands, anti-plagiarism)
                → early kills die here before any LLM spend
4. GATE FLEET 11 Opus judges (blind where required) over candidates/ survivors;
                gkey_resolve.py converts blind solves to kills → verdicts-*.jsonl
5. AGGREGATE  merge verdicts → aggregate.py + score_eval.py (killed_by union, lang ≥2 = kill)
6. PACKAGE    ADJUDICATION.md: passage + questions + key + per-unit judge flags
7. OWNER      Godkänn / Ändra / Avvisa per unit
8. (later PR) approved units → product bank under the ÖVNINGSTEXT frame
```

Stages 3→5 are cheap-lethal-first: mechanical gates kill doomed candidates
before the expensive judge fleet runs.

---

## Stage 1 — generator dispatch template

One Opus agent per unit-type (LÄS-long, LÄS-short ×2, ELF-long, ELF-cloze +
shorts — mirror Batch 1's four generators, or split finer). Each agent's brief:

```
You are a P5 Batch-<N> GENERATOR for HP-Coach: author <SPEC: e.g. ONE LÄS long
unit — 750–1135 words, 4 questions>. Everything you write is judged by a proven
adversarial gate stack; author accordingly.

READ FIRST (the contracts):
- pipeline/synthetic/GENERATION.md          (the ten laws + self-check — binding)
- pipeline/synthetic/<las|elf>/blueprint-template.md  (structural spec)
- pipeline/synthetic/<las|elf>/families.md            (families for your questions)
- pipeline/synthetic/gates/bands.json                 (hard stat bands, <class>)
- pipeline/synthetic/gates/schemas/candidate-item.schema.json  (output format)

Follow GENERATION.md's ten laws exactly — each names the gate that kills a
violation. Pick families: <LIST>. Engineer the corpus-dominant traps
(<overgeneralisation/reversed-causality for LÄS | quantifier-upgrade +
attribution-swap for ELF | collocation-misfit + polarity-mirror for cloze>).
Self-blind-solve skeptically before committing; rewrite any two-way item.

OUTPUT: <scratch>/batch<N>/gen-<slug>.json per the schema (rationale per
question = why-key + why-each-distractor; per-question family + generator_meta
{origin:"batch<N>-generator", model:"claude-opus-4-8", date:"<DATE>"}), plus
gen-<slug>.NOTES.md. Leave candidate_id as a placeholder — the orchestrator
assigns the real id (do NOT number it yourself).

No repo writes. NEVER touch ports 5173/8787. Anti-park: serial foreground.
Final report: topic, families, self-solve outcome, band compliance, file paths.
```

## Stage 2 — assemble with collision-free ids

Batch 1's generators each numbered from `-001`, colliding (`las-b1-001` used
twice). **Assign ids centrally** from one counter per section per batch, and
rewrite `candidate_id` in each file as you copy it into
`batches/batch<N>/candidates/`. Copy the NOTES.md and (later) verdicts alongside.

## Stage 3 — mechanical gates

**Run mech (and every judge in Stage 4) against the renumbered
`candidates/*.json`, NOT the scratch `gen-*.json`** — `aggregate.py` joins
verdicts to candidates strictly on `candidate_id`, so gating must happen after
Stage 2 has written the collision-free ids into `candidates/`.

```
run_mech.py batches/batch<N>/candidates/*.json --parsed-dir data/parsed --out batches/batch<N>/verdicts/verdicts-mech.jsonl
```
`data/parsed/` is untracked (primary checkout only) — always pass `--parsed-dir`.
All authentic-format units should pass; a schema/band/plagiarism kill here is a
generation defect to fix before spending judges.

## Stage 4 — the gate fleet (11 Opus judges)

Dispatch these as parallel Opus agents. **Dispatch unit:** one fresh agent per
gate (per vote) covering all candidates is acceptable at batch scale; the hard
independence requirements are that **G-KEY run A and run B are separate agent
contexts**, the **three G-SPRÅK / G-ENG votes are separate agents**, and **no
gate agent ever sees a key** (only G-DISTRACTOR reads keys, with rationales
stripped). **All prompt-gate agents strip the answer key from what they read**
(contamination rule) — build blind sheets with:

```
jq 'del(.questions[].key, .questions[].rationale, .questions[].generator_meta, .questions[].family)
    | del(.key, .rationale, .family, .generator_meta)'
```
then **verify zero occurrences of `key|rationale|generator_meta|family`** before
reading. Stripping `generator_meta` matters — it carries the per-question family
map and leaks authentic-vs-synthetic origin (learned in the Opus cert run). If a
blind sheet is contaminated, the agent **self-halts and reports** — re-dispatch
fresh (this fired correctly in Batch 1 and the eval).

| gate | count | prompt | notes |
|---|---|---|---|
| G-KEY | ×2 (run A, B) | `gates/prompts/G-KEY.md` | blind solve; emit `verdict:"pass"` + `solver_answer`; **orchestrator** compares to key (see below) |
| G-STEM | ×1 | `G-STEM.md` | revised contract: structural-leak/recall = kill, world-knowledge = flag |
| G-DISTRACTOR | ×1 | `G-DISTRACTOR.md` | **different sheet** — key KEPT, only rationale/generator_meta stripped (`jq 'del(.questions[].rationale, .questions[].generator_meta) \| del(.rationale, .generator_meta)'`); it compares distractors against the keyed answer. Kill only genuinely defensible 2nd answers |
| G-SPRÅK | ×3 votes | `G-SPRAK.md` | LÄS only; ≥2 kill votes = DEAD |
| G-ENG | ×3 votes | `G-ENG.md` | ELF only; ≥2 kill votes = DEAD |
| G-REGISTER | ×1 | `G-REGISTER.md` | grounds against corpus exemplars loaded from data/parsed |

Each agent appends its verdict lines (schema: `gates/schemas/verdict.schema.json`)
to a distinct `verdicts-<gate>.jsonl`, `executed_by "claude-opus-4-8/<GATE>"`.
Multi-question units emit one verdict line per question, `target:"q:<n>"`.

**G-KEY comparison is a mandatory, scripted substep — not orchestrator
discipline.** Executors emit `verdict:"pass"` + committed `solver_answer` (or a
self-kill on `MULTIPLE_DEFENSIBLE`/`NONE_DEFENSIBLE`); a blind solver never sees
the key, so aggregation alone would let a wrong key survive. Resolve it before
aggregating:

```
gkey_resolve.py batches/batch<N>/verdicts/verdicts-gkey-*.jsonl \
  --candidates-dir batches/batch<N>/candidates \
  --out batches/batch<N>/verdicts/verdicts-gkey-resolved.jsonl
```
It loads each key, rewrites any `solver_answer ≠ key` (and any
`MULTIPLE_/NONE_DEFENSIBLE`) to a lethal `verdict:"kill"`, and normalizes the
verdict field. Aggregate the **resolved** file, not the raw G-KEY files.

## Stage 5 — aggregate + score

Gates append to distinct `verdicts-<gate>.jsonl` files; `aggregate.py` reads one
file, so **merge first** (using the resolved G-KEY file, not the raw ones):

```
cat batches/batch<N>/verdicts/verdicts-mech.jsonl \
    batches/batch<N>/verdicts/verdicts-gkey-resolved.jsonl \
    batches/batch<N>/verdicts/verdicts-g{stem,distractor,sprak-*,eng-*,register}.jsonl \
    > batches/batch<N>/verdicts.jsonl
aggregate.py batches/batch<N>/verdicts.jsonl --candidates-dir batches/batch<N>/candidates --json report.json
score_eval.py --report report.json --expectations <expectations>   # eval runs only
```

`aggregate.py` emits one of four statuses per candidate — the full lattice:
- **DEAD** — any lethal-gate kill, OR a language gate with **≥2 kill votes**
  (its `killed_by` is unioned with lethal gates — a lethal kill must not shadow a
  language-majority kill). Never ships.
- **INCOMPLETE** — a required verdict record is missing (and nothing killed it).
  **Never ships** — investigate the missing gate, do not treat as a pass. The
  required set per candidate: 3 mechanical (M-SCHEMA/M-BANDS/M-PLAGIARISM), 2
  G-KEY + G-STEM + G-DISTRACTOR per question, the 3 section-appropriate language
  votes (G-SPRÅK for LÄS / G-ENG for ELF), and G-REGISTER.
- **SURVIVED_FLAGGED** — no kill, but a single dissenting language vote or any
  flag. Goes to adjudication with the flags surfaced.
- **SURVIVED_CLEAN** — no kills, no flags.

## Stage 6 — adjudication package

Build `batches/batch<N>/ADJUDICATION.md`: a summary line (kills, G-KEY
blind-solve agreement, gate tallies), then per unit — the judge flags collected
and file-attributed, the title, the full passage, and every question with the
key marked and each option listed. Phone-first; flag MAJOR items explicitly.
Deliver it to the owner as a rendered file; accept free-form verdicts
(`godkänn alla utom X`, `ändra X: …`, `avvisa Y`).

Kills, if any, are archived with their autopsy (the killing gate's finding) —
those feed the next batch's generation prompt as negative examples.

---

## Standing gotchas (do not relearn these)

- **candidate_id namespace is an invariant, not a hope.** Assign ids centrally
  (Stage 2) BEFORE any gate runs, and build **every** gate input (mech,
  blind sheets, the G-DISTRACTOR sheet, the G-REGISTER sheet) from the
  renumbered `candidates/*.json` so each verdict is stamped with the assigned id.
  `aggregate.py` now prints a loud WARNING for any verdict id not in
  `candidates/` (they would otherwise drop silently and drag candidates to
  INCOMPLETE) — treat that warning as a stop-and-fix, not a nuisance. (Batch 1's
  archived verdicts still carry `gen-*` stem ids and do **not** join to its
  renumbered candidates — a known wart, harmless because Batch 1 is
  adjudication-frozen; the renumber-first rule exists so Batch 2 onward can't
  repeat it.)
- **Question cap is 5** — schema + `mech.py` were raised from 4 (ELF long/cloze
  are invariantly 5). Options-per-question stays exactly 4.
- **`data/parsed/` is untracked** — pass `--parsed-dir` explicitly from worktrees.
- **Blind-sheet jq must strip nested fields** (`.questions[].key`,
  `.questions[].rationale`) AND top-level `key/rationale/family/generator_meta`.
- **Anti-park** in every agent brief: no launch-and-wait; serial foreground.
- **Worktree/port discipline** (see `.claude/skills/dispatch-wave`): absolute
  paths for mutations; never touch dev ports 5173/8787; `fuser -k` not `pkill`.
- **Eval before gating** on any gate model/prompt change; archive the run.

## History

- `batches/batch1/` — 7 units / 20 questions, **0 kills**, first owner
  adjudication. Opus generators + Opus-certified judges.
- `gates/evalset/runs/2026-07-20-pass/` — gate stack certified (Fable judges).
- `gates/evalset/runs/2026-07-21-opus-cert/` — Opus judges certified.

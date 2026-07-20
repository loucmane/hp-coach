# Eval-set run protocol — the gate on the gates

Gates are LLM systems. LLM systems drift: a prompt tweak, a model swap, a
temperature change can turn a reliable killer into a rubber stamp without any
error being thrown. This eval set is the regression suite that catches that.
**No batch may be gated by a gate stack that has not passed its most recent
required eval run.**

## What the eval set is

- **15 authentic items** (8 LÄS, 7 ELF), referenced by qid in
  `manifest.json` and loaded from `data/parsed/*.json` at runtime by
  `scripts/load_evalset.py` — never copied into the repo (UHR copyright).
  They are real HP items and **must all SURVIVE** (clean or flagged). A DEAD
  verdict on any of them is a false positive.
- **15 seeded-defect items** authored in `seeded/*.json`, each with a
  documented `_seed` block naming its intended kill-gate. All but one **must
  die**, killed by the intended gate. The exception is the **hard negative**
  (`las-b0-013`) — attractive distractors, no real defect — which **must
  survive**; it catches gates that over-fire.

## Defect → intended-kill-gate map

| candidate      | section | defect                                                   | intended kill-gate |
|----------------|---------|----------------------------------------------------------|--------------------|
| las-b0-001     | LÄS     | wrong key (passage supports A, key says C)               | G-KEY              |
| elf-b0-002     | ELF     | wrong key (passage supports B, key says D)               | G-KEY              |
| las-b0-003     | LÄS     | passage-independent stem (general-knowledge date)        | G-STEM             |
| elf-b0-004     | ELF     | double key (distractor D also defensible)                | G-DISTRACTOR       |
| las-b0-005     | LÄS     | calques: *spenderade tid*, *ta plats framför*            | G-SPRÅK            |
| las-b0-006     | LÄS     | BIFF word-order error in subordinate clause              | G-SPRÅK            |
| las-b0-007     | LÄS     | register break: spoken/blog Swedish                      | G-SPRÅK (+G-REGISTER) |
| las-b0-008     | LÄS     | agreement/definiteness: *det tyst läsande*, *det stora tystnaden* | G-SPRÅK   |
| elf-b0-009     | ELF     | Swedish-interference English: *on a conference*, *informations*, false-friend *eventually* | G-ENG |
| las-b0-010     | LÄS     | malformed options (dup letter A, no D)                   | M-SCHEMA           |
| las-b0-011     | LÄS     | verbatim lift from host-2022-verb1-LÄS-011               | M-PLAGIARISM       |
| elf-b0-012     | ELF     | non-HP register: clickbait listicle                      | G-REGISTER (+G-ENG)|
| las-b0-013     | LÄS     | HARD NEGATIVE — no defect, attractive distractors        | NONE (must PASS)   |
| las-b0-014     | LÄS     | double key (distractor B also defensible)                | G-DISTRACTOR       |
| las-b0-015     | LÄS     | subtle non-word *slipen* + calque *bokför sig självt*    | G-SPRÅK            |

The seeds deliberately isolate one failure mode each: the language seeds
(005–008, 015) carry a **correct** MCQ so that a kill there proves G-SPRÅK
fired, not G-KEY; the correctness seeds (001–004, 014) carry **clean
language**. This is what makes a per-gate diagnosis possible.

## When to rerun (required)

Rerun the FULL eval, and pass it, before gating any batch, whenever ANY of:

1. A gate prompt doc (`prompts/*.md`) changes — even a wording tweak.
2. The model or sampling settings used to execute any gate change.
3. A mechanical gate script (`scripts/mech.py`, thresholds in `bands.json`)
   changes.
4. The aggregation rule (`scripts/aggregate.py`) changes.
5. More than 30 days have passed since the last passing run (drift guard).

## Asserted thresholds (enforced by `scripts/score_eval.py`)

- **Authentic false-kills: 0.** Any authentic item going DEAD fails the eval.
  (Over-firing on the hard negative counts here too.)
- **Seeded kill-by-intended-gate rate: 100%.** Every non-hard-negative seed
  must go DEAD, and the killer must be the intended gate (or the documented
  secondary). A seed that dies by the *wrong* gate is `FAIL(wrong-gate)` — the
  defect died but the intended gate was not exercised, so it is not proven
  working.

## What failing the eval means

**The gate stack is FROZEN.** Do not run batches through it. Diagnose:

- Authentic false-kill → the responsible gate's kill bar is too aggressive.
  Loosen the prompt's severity guidance or the mechanical threshold, rerun.
- Seed survived → the responsible gate's bar is too lax, or the seed is
  weaker than intended. Strengthen the prompt; if the seed was ambiguous,
  fix the seed (and bump `manifest.json` `version`).
- Wrong-gate kill → acceptable safety-wise but the intended gate is unproven;
  investigate why the intended gate missed it.

Record every run (date, git SHA of the gates dir, model tags, score table)
in the batch's run log. A batch's acceptance evidence must cite the eval run
that authorized its gate stack.

## Known placeholder noise (not failures)

`bands.json` ships `calibrated: false` with PLACEHOLDER bands narrower than
the real corpus. On the current eval, authentic items draw M-BANDS **flags**
(e.g. `mean_sentence_words=35.1`, `paragraph_count=17`) — real HP passages
legitimately exceed the guessed bands. Flags do not kill and do not fail the
eval; they are the standing reminder that the LÄS/ELF analysts must measure
and fill `bands.json`, after which M-BANDS graduates from flag to kill.

## Running it

```bash
cd pipeline/synthetic/gates
# 1. materialize the eval batch (authentic loaded from the bank, seeds stripped of _seed)
python3 scripts/load_evalset.py --out-dir /tmp/evalrun --parsed-dir <repo>/data/parsed
# 2. mechanical stage
python3 scripts/run_mech.py /tmp/evalrun/las-*.json /tmp/evalrun/elf-*.json  # NOT *.json — expectations.json is metadata, not a candidate --parsed-dir <repo>/data/parsed --out /tmp/evalrun/verdicts.jsonl
# 3. LLM stages: dispatch each prompts/*.md against each item per the README
#    orchestration runbook; append every agent's JSON verdict to verdicts.jsonl
# 4. aggregate + score
python3 scripts/aggregate.py /tmp/evalrun/verdicts.jsonl --candidates-dir /tmp/evalrun --json /tmp/evalrun/report.json
python3 scripts/score_eval.py --report /tmp/evalrun/report.json --expectations /tmp/evalrun/expectations.json
```

`score_eval.py` exits non-zero on eval failure — wire it as the go/no-go
check before any batch run.

> `data/parsed` is untracked (present only in the primary checkout), so pass
> `--parsed-dir` explicitly when running from a git worktree.

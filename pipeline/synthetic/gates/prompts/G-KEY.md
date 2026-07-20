# G-KEY — blind solve (lethal, per question, 2 independent votes)

The strongest single gate for MCQ content: an expert solver answers the
question **without ever seeing the intended key**. If the solver's answer
disagrees with the generator's key, the item dies. No appeal at this stage —
a surviving wrong key is the one defect that directly teaches a student a
falsehood.

## Contamination rule (absolute)

The executing agent must receive ONLY the material in "Input" below. It must
NOT receive: the key, the generator's rationale, any other gate's verdict,
the `_seed` block, or the fact that the item is synthetic vs authentic
(eval-set runs mix both). If you (the executing agent) can see a key or
rationale anywhere in your context, STOP and report the run as contaminated
instead of solving.

## Input (pasted by the orchestrator)

- `candidate_id`, `target` (`q:<n>`), `vote` (1 or 2)
- `section` (LÄS or ELF)
- The passage (title + full text)
- The question prompt and its four options A–D — **key withheld**

## Procedure

1. Read the passage completely, as a top-scoring HP examinee would.
2. Answer the question strictly from the passage. For each option, decide:
   supported / contradicted / not addressed.
3. Commit to exactly one answer **before writing anything else**. Hedging is
   itself a signal:
   - If two or more options are genuinely defensible from the passage, answer
     `MULTIPLE_DEFENSIBLE` and quote the passage support for each.
   - If no option is defensible, answer `NONE_DEFENSIBLE` and say why the
     best near-miss still fails.
4. Write a 2–4 sentence justification citing the passage verbatim (LÄS:
   quote in Swedish; ELF: quote in English; justification prose in English).

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-KEY",
  "target": "q:1",
  "vote": 1,
  "solver_answer": "A | B | C | D | NONE_DEFENSIBLE | MULTIPLE_DEFENSIBLE",
  "justification": "…with verbatim passage quotes…",
  "executed_by": "<agent/model tag>"
}
```

Note: this gate's agents emit a **solver report**, not a verdict — they
cannot know the key. The orchestrator converts it mechanically:

- `solver_answer == key` → verdict `pass`.
- `solver_answer != key`, or `NONE_DEFENSIBLE` / `MULTIPLE_DEFENSIBLE` →
  verdict `kill` (severity `lethal`, finding quote = the solver's answer +
  justification).
- Contaminated run → discard and re-dispatch with a fresh agent.

Both votes must pass. Two independent votes (fresh agents, no shared
context) cut solver-slip noise without letting a wrong key through: a wrong
key survives only if two independent experts make the same mistake.

## Calibration

This gate is on the eval set: it must pass all authentic items and kill all
wrong-key seeds (see `../evalset/run-protocol.md`). If it fails eval, the
gate is frozen — do not run batches with it until fixed.

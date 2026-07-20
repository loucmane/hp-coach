# G-DISTRACTOR — double-key hunt (lethal, per question, 1 run)

Runs only on questions that already passed both G-KEY votes, so the key is
now known-good. This gate attacks from the other side: **is any distractor
also defensibly correct?** A double-keyed item punishes exactly the strong
reader who sees the second defensible answer — the worst possible failure
for a coaching product targeting 2.0.

## Contamination rule

The agent receives the key (it must — the job is to argue for the OTHER
options). It must NOT receive the generator's rationale, other gate
verdicts, or `_seed`.

## Input (pasted by the orchestrator)

- `candidate_id`, `target` (`q:<n>`), `section`
- The passage (title + full text)
- The question prompt, four options, and **the key**

## Procedure

You are counsel for the distractors. For each of the three non-key options,
build the strongest good-faith case that it is a correct answer to the
prompt, citing the passage verbatim.

Then judge each case against the HP standard: the key must be **clearly
best**, not merely "best on balance after a debate". Classify each
distractor:

- `DEFENSIBLE` — a well-prepared examinee could select it and, shown the
  facit, could reasonably file a complaint with passage citations. The case
  survives a skeptical reading of the exact prompt wording.
- `ARGUABLE` — the case needs a strained reading, ignores a delimiter in the
  prompt ("enligt författaren", "i första hand", "främst", paragraph scope),
  or rests on outside knowledge. Attractive but beatable.
- `CLEAN` — clearly wrong; no serious case exists.

Also check the reverse failure: if your strongest distractor case is in fact
*stronger* than the key's own support, say so explicitly — that is a kill
even though G-KEY passed.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-DISTRACTOR",
  "target": "q:1",
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major", "quote": "<distractor text>", "note": "the case for it, with verbatim passage citations"}
  ],
  "per_option": {"A": "DEFENSIBLE | ARGUABLE | CLEAN", "B": "…", "C": "…", "D": "KEY"},
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping (apply it yourself):

- Any `DEFENSIBLE` distractor → `kill` (severity `lethal`).
- Any `ARGUABLE` distractor → `flag` (severity `major`) with the case
  attached — good distractors SHOULD be attractive; adjudication decides.
- All `CLEAN` → `pass`. Note for adjudication (not a gate failure): three
  CLEAN-and-limp distractors make an item trivially easy — mention it in the
  note field of a `minor` finding if so.

## Calibration

Must kill the double-key seeds and pass authentic items. Authentic HP
distractors are deliberately attractive: if this gate kills authentic items,
your `DEFENSIBLE` bar is set too low — recalibrate against the complaint
standard, not against "I felt tempted".

# G-STEM — passage-independence check (lethal, per question, 1 run)

A reading-comprehension question that can be answered **without reading the
passage** measures general knowledge or test-wiseness, not reading. HP items
never allow this. If the question is answerable passage-blind, it dies.

## Contamination rule

The executing agent must NOT receive the passage. Input is the question
only. It must also not receive the key, rationale, other verdicts, or
`_seed`. If a passage is visible in your context, report contamination
instead of executing.

## Input (pasted by the orchestrator)

- `candidate_id`, `target` (`q:<n>`), `section`
- The question prompt and its four options A–D — **no passage, no key**

## Procedure

1. Attempt to answer using only the stem, the options, and general
   knowledge. Try honestly and hard — you are the adversary here.
2. Apply every test-wiseness lever a coached examinee would:
   - General/world knowledge that makes one option clearly true or three
     clearly false.
   - Option logic: one option semantically contains the others; three
     options cluster and one stands apart; grammatical mismatch with the
     stem; the only hedged/qualified option among absolutes.
   - Stem leakage: the prompt itself restates the answer.
3. Classify:
   - `ANSWERABLE` — you can pick the correct-looking option with clearly
     better-than-chance confidence (as a rule of thumb: you would bet on it
     at 2:1 against the field). State which option and why.
   - `PARTIALLY` — you can eliminate 2+ options passage-blind, materially
     better than chance but not decided. State which eliminations and why.
   - `NOT_ANSWERABLE` — options remain genuinely indistinguishable without
     the passage.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-STEM",
  "target": "q:1",
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major", "quote": "<the option text or stem phrase that leaks>", "note": "why it is guessable"}
  ],
  "blind_classification": "ANSWERABLE | PARTIALLY | NOT_ANSWERABLE",
  "blind_pick": "A | B | C | D | null",
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping (apply it yourself):

- `ANSWERABLE` → `kill` (severity `lethal`).
- `PARTIALLY` → `flag` (severity `major`) — survives to adjudication with
  your elimination argument attached.
- `NOT_ANSWERABLE` → `pass`, findings `[]`.

Honesty note: a lucky guess is not `ANSWERABLE`. Kill only when you can
articulate the mechanism that makes the option identifiable. The orchestrator
spot-checks kills against the key; a blind pick that is *wrong* demotes the
finding to `flag`.

## Calibration

On the eval set this gate must kill the passage-independent seeds and pass
authentic items (authentic HP stems occasionally allow partial elimination —
`flag` on an authentic item is acceptable, `kill` is an eval failure).

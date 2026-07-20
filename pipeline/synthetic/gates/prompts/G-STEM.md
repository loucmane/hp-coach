# G-STEM — passage-independence check (lethal, per question, 1 run)

A reading-comprehension question must measure reading. This gate hunts for
items whose stem/options give the answer away **by form** or that test
**pure recall** instead of comprehension. It does NOT punish items whose
correct answer happens to be true in the real world — most good
reading-comprehension keys are (see Calibration).

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
2. Diagnose the MECHANISM behind any blind answerability. The mechanism,
   not the fact that you found an answer, decides the verdict:

   **Structural leaks (KILL).** The item is answerable by pure form —
   no passage could rescue it:
   - Option-cluster tells: three options cluster and one stands apart;
     one option semantically contains the others; the only
     hedged/qualified option among absolutes.
   - Absurdly remote distractors: options a test author would only write
     as filler (wrong century, wrong domain, category errors), leaving
     the key alone in the plausible set.
   - Stem leakage: the prompt itself restates or entails the answer;
     grammatical mismatch eliminates options.

   **Pure factual recall (KILL).** The question is a general-knowledge
   lookup with no comprehension component — a date, a name, a standalone
   fact about a named figure or event. Anyone with the fact answers
   without any text; the "passage" is decoration.

   **World-knowledge answerability (FLAG, not kill).** You can pick the
   likely key because you know the domain, BUT the distractors are
   substantively plausible positions and the question is still a genuine
   comprehension question that a passage would ground. This is normal
   test design, not a defect — route it to adjudication with your
   reasoning. Be suspicious of your own structural claims here: "three
   options argue one way, one the other" is often domain reasoning
   wearing a structural costume. It only counts as a structural tell if
   a reader with NO domain knowledge would see the asymmetry from form
   alone.

3. Classify:
   - `STRUCTURAL_LEAK` — answerable by form alone (mechanism above).
     State which option and the tell.
   - `RECALL_ONLY` — pure factual-recall question, no comprehension
     component. State the fact that decides it.
   - `WORLD_KNOWLEDGE` — you can name a best pick via domain knowledge,
     but the distractors are substantive and the question is real
     comprehension work. State your pick and the knowledge you used.
   - `PARTIALLY` — you can eliminate 2+ options passage-blind, materially
     better than chance but not decided. State which eliminations and why.
   - `NOT_ANSWERABLE` — options remain genuinely indistinguishable
     without the passage.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-STEM",
  "target": "q:1",
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major", "quote": "<the option text or stem phrase that leaks>", "note": "the mechanism — why it is answerable blind"}
  ],
  "blind_classification": "STRUCTURAL_LEAK | RECALL_ONLY | WORLD_KNOWLEDGE | PARTIALLY | NOT_ANSWERABLE",
  "blind_pick": "A | B | C | D | null",
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping (apply it yourself):

- `STRUCTURAL_LEAK` or `RECALL_ONLY` → `kill` (severity `lethal`).
- `WORLD_KNOWLEDGE` or `PARTIALLY` → `flag` (severity `major`) — survives
  to adjudication with your reasoning attached.
- `NOT_ANSWERABLE` → `pass`, findings `[]`.

Honesty note: a lucky guess is not a leak. Kill only when you can
articulate a mechanism that works WITHOUT the passage and WITHOUT domain
expertise. The orchestrator spot-checks kills against the key; a blind
pick that is *wrong* demotes the finding to `flag`.

## Calibration

**Authentic HP items very often have globally-true keys.** The exam builds
questions on real expository texts, so the correct reading of the passage
usually coincides with what is true in the world; a frontier-knowledge
solver can therefore "answer" a large share of any authentic
reading-comprehension corpus blind. That is normal test design, not a
defect — and it is exactly the over-fire that froze the stack in the
2026-07-20 eval run, where this gate killed 13/13 synthetic seeds, 2
authentic items, and the hard negative by equating "a knowledgeable solver
can guess the key" with passage-independence.

Worked contrasts (from that run's actual verdicts):

- **KILL (pure recall)** — `las-b0-003`, quote *"Omkring år 1900"*, note:
  "Pure factual recall: Ebenezer Howard published his garden-city vision
  c.1898-1902. World knowledge alone decides it; D (1990s) is absurd for
  the historical figure." Correct kill under the new bar too: a date
  lookup about a named figure with an absurdly remote distractor — recall
  plus structure, zero comprehension.

- **FLAG (world knowledge / partial)** — authentic `elf-b00-010`, note:
  "World knowledge of the Pantheon lets one eliminate B … and lean toward
  A …, but the exact key is not decided blind." Distractors substantive,
  passage genuinely needed to decide — `flag`, routed to adjudication.
  This was the correctly calibrated behavior.

- **Was KILL, must be FLAG** — hard negative `las-b0-013`, note: "This is
  literally Elinor Ostrom's Nobel-winning thesis against Hardin. Anyone
  who knows Ostrom picks A without the passage; B/D are opposite
  positions, C a lesser point." The mechanism named is domain expertise;
  B/D being "opposite positions" makes them substantively plausible
  stances in a live scholarly debate, not filler. A passage-grounded
  question whose key matches published scholarship = `WORLD_KNOWLEDGE` →
  `flag`. Same trap in authentic `las-b00-007`, killed as an
  "option-cluster leak" ("three cluster, one stands apart") — but the
  claimed cluster (which factors argue for vs against an uprising) is
  only visible to someone reasoning about the domain; from form alone the
  four options are parallel. Domain reasoning in a structural costume →
  `flag` at most.

On the eval set this gate must kill the structural/recall seed
(`las-b0-003`) and pass or at most flag every authentic item and the hard
negative — a `kill` on any of those is an eval failure.

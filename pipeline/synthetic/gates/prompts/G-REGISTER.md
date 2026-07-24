# G-REGISTER — HP authenticity check (lethal, per passage, 1 run)

Last prompt gate. Everything upstream verified the item is *correct* and
*well-written*; this gate asks the remaining question: **does it read as an
HP passage?** A flawless magazine feature can still be wrong for the exam —
wrong genre, wrong intellectual temperature, wrong relationship between
passage and questions. This is the simple comparative version (a
discrimination panel against real exemplars is descoped for Batch 1).

## Contamination rule

No key rationale, no other verdicts, no `_seed`. The agent DOES load real
exemplars from the corpus — that is the point of this gate.

## Input (pasted by the orchestrator)

- `candidate_id`, `section`
- The full candidate: title, passage, questions with options (keys withheld
  — question *style* is judged, not correctness)
- Three exemplar qids for the same section and comparable length class,
  drawn from `../evalset/manifest.json` (`exemplar_pool`); the agent loads
  their full text from `data/parsed/<exam_id>.json` at runtime. Never judge
  from memory of "what HP is like" — read the exemplars first, every run.

## Procedure

1. Read all three exemplars end to end. Note concretely: subject-matter
   type, how the text opens, argumentative vs descriptive stance, density
   of names/dates/particulars, how much the author's voice shows, how the
   questions attach to the text (main idea / detail / inference / attitude
   mix; how literal the option wording is vs the passage).
2. Read the candidate the same way.
3. Judge each dimension: would this candidate sit unremarked inside a
   provpass next to those three?
   - **Genre & source-plausibility** — reads like an excerpt from a real
     Swedish kulturtidskrift/populärvetenskap piece (LÄS) or a real English
     magazine/journal (ELF)? Or like content written to be a test passage
     (topic-sentence symmetry, one-claim-per-paragraph tidiness, no
     digressions, no concrete residue of a real world)?
   - **Intellectual temperature** — HP passages assume an educated adult
     reader: real tension or complication, not a school-essay exposition of
     a settled fact.
   - **Question style** — prompts phrased like HP prompts (delimiters like
     *"enligt författaren"*, *"vad är textens huvudtanke"*); options in HP's
     paraphrase register, not verbatim passage strings; the question mix
     plausible for the passage length.
### Cloze-format scope rule (owner decision 2026-07-24)

If the candidate is a **numbered-gap cloze** — structurally: the passage
contains inline numbered gaps (`___(1)___` …) and each question's options are
single words or short phrases that fill a gap — then the gap FORMAT itself is
**outside this gate's jurisdiction**. The cloze is a deliberate HP-Coach
product-design family (its student-facing frame discloses that these are
practice texts, not exam replicas), and "authentic HP has no cloze section"
is therefore not a finding. Do NOT kill or flag a cloze for being a cloze,
for its gap notation, or for its option sets being single lexical items.

Everything else about a cloze remains fully in jurisdiction and is judged
against the exemplars exactly as for any candidate: the PASSAGE's genre and
source-plausibility (magazine-grade prose vs manufactured filler), its
intellectual temperature, the register of the option words relative to the
passage, and test-manufactured tidiness in the prose. A cloze whose passage
reads like a listicle, a blog, or content-shaped filler dies here like any
other candidate.

4. Record a comparative note per dimension, citing at least one exemplar
   by qid.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-REGISTER",
  "target": "passage",
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major | minor", "quote": "<verbatim from candidate>", "note": "dimension: contrast with exemplar <qid>"}
  ],
  "exemplars_used": ["qid", "qid", "qid"],
  "comparative_note": "2-4 sentences: where the candidate sits relative to the three exemplars",
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping (apply it yourself):

- `kill` (severity `lethal`) — a well-prepared examinee would notice this is
  not a real HP text: wrong genre, test-manufactured tidiness throughout,
  question style alien to the section.
- `flag` (severity `major`) — passes as HP but sits at the edge of the
  exemplar range (unusually uniform rhythm, thinner concrete detail);
  adjudication decides.
- `pass` — indistinguishable in kind from the exemplars.

## Calibration

Must pass authentic items (they ARE the register — killing one is the
clearest possible eval failure), must kill the non-HP-register seeds
(blog/listicle tone, reader address, manufactured tidiness) **including a
register-broken cloze**, and must NOT kill a cloze for its format (the cloze
calibration items in the eval supplement assert both directions).

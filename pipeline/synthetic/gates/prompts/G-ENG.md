# G-ENG — academic-magazine English audit (language gate, ELF only, 3 independent votes)

ELF passages imitate the register of the authentic section's sources:
edited English from academic-adjacent magazines and journals (The Economist,
Scientific American, New Scientist, LRB-style essays, textbook prose).
Adversarial brief: **find anything a professional native-English editor at
such a publication would strike.** The audience is Swedish examinees — so
Swedish-interference errors are the highest-value target, because the
generator works in a Swedish-dominant context and its errors will cluster
there.

## Contamination rule

Input is the passage plus questions/options text ONLY. No key rationale, no
other verdicts, no `_seed`, no other votes. Each of the 3 votes is a fresh
agent.

## Input (pasted by the orchestrator)

- `candidate_id`, `vote` (1–3)
- Title, passage, all question prompts + option texts

## Procedure — hunt in this order, sentence by sentence

1. **Swedish interference** — article errors (Swedish drops articles where
   English requires them: *"she is teacher"*, *"discussed at meeting"*);
   false friends (*eventually* for *eventuellt/possibly*, *actual* for
   *aktuell/current*, *rest* for *rest/remainder misuse*); Swedish
   compounding pressed into English (*"research results show"* chains where
   English prefers of-phrases); *"also"* in Swedish *också* positions.
2. **Grammar** — subject–verb agreement, tense sequencing, countability
   (*informations*, *researches*, *evidences*), preposition choice
   (*discuss about*, *married with*), dangling modifiers.
3. **Idiom and collocation** — correct words, wrong pairing: *do a
   decision*, *strong rain*, *raise the question of* misuses. If an editor
   would pause, record it.
4. **Register coherence** — one register throughout: serious-magazine
   expository prose. Convict on: contractions in formal exposition where the
   surrounding tone is academic, sudden informality (*a whole bunch of*),
   direct reader address out of keeping with the genre, AI-essay boilerplate
   (*"In conclusion, it is important to note that…"*, *"delve"*,
   *"tapestry"*, *"multifaceted"* stacking), marketing cadence.
5. **Authenticity of texture** — authentic ELF sources have bylines' habits:
   concrete detail, named researchers/places, hedged claims, occasional dry
   wit. Convict prose that is grammatically perfect but textureless
   (uniform sentence rhythm, no concrete anchors, symmetric paragraph
   openings) — record as register findings.

For every conviction: **verbatim quote**, class (1–5), why an editor strikes
it, and the natural rewrite.

## Severity — decide per finding

- `lethal` — a native professional writer would not produce it: grammar
  errors, article errors, false friends, unmistakable Swedish interference.
- `major` — grammatical but off: collocation misses, register breaks,
  AI-boilerplate tells, texturelessness.
- `minor` — house-style-level taste.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-ENG",
  "target": "passage",
  "vote": 1,
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major | minor", "quote": "<verbatim>", "note": "class N: why; editor's rewrite: '…'"}
  ],
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping per vote: any `lethal` → `kill`; only `major`/`minor` →
`flag`; none → `pass`. The orchestrator aggregates the 3 votes (2+ kills =
dead; 1 kill = flagged). Vote alone; do not soften.

## Calibration

Must kill the non-native-English seeds and pass authentic ELF passages.
Authentic ELF texts are professionally edited English — a conviction against
one is an eval failure unless it is an OCR/parsing artifact (record as such;
protocol adjudicates).

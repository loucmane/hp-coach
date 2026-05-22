# XYZ-trap richer-content authoring — style guide

You're authoring the new fields for XYZ trap entries in
`app/public/frameworks/xyz_traps.json`. Four subagents are working in
parallel; this guide keeps the voice consistent across all 55 entries
and aligned with the KVA + NOG pilot voice.

## XYZ structure (different from KVA and NOG)

XYZ is **matematisk problemlösning** — open-ended math problems with
five multiple-choice options (A–E). Unlike KVA (compare I vs II) and
NOG (which statements suffice?), XYZ is straight problem-solving:
the student must compute the answer and match it to one of the options.

The student's task: read the problem, do the math, pick the option.
Traps fire when: a sign flip is missed, a formula is misremembered, a
constraint is overlooked, the wrong operation is performed.

## The four new fields

Every entry already has `pattern_description`, `why_it_occurs`,
`common_distractor_signature`, `countermeasure`, and `example_questions`.
You add four optional fields:

1. **`tldr`** — one-line summary that pulls the gist forward as a
   kicker. ~10–15 Swedish words, em-dash structure:
   `<premise> — <consequence>`. The student must absorb the trap in
   3 seconds.

2. **`recognition_cue`** — the textual or structural feature in an XYZ
   problem that should trigger an alarm bell. Single Swedish sentence,
   ~25–35 words. Often quotes example phrasings or names structural
   patterns (e.g. "när ett uttryck innehåller -(a+b)", "när en
   olikhet multipliceras med ett negativt tal").

3. **`worked_example`** — a structured 4-beat narrative grounded in a
   real corpus problem. Look at 1–2 of the entry's `example_questions`
   to make this concrete. Object shape:
   ```json
   {
     "setup": "Förenkla / Lös / Beräkna <real problem premise>.",
     "trap_thinking": "Studenten <wrong move> → får <wrong value> och väljer <wrong letter>.",
     "correct_thinking": "<corrected reasoning showing the right move>.",
     "answer": "<letter> — <one-line: rätt värde och kort skäl>."
   }
   ```
   XYZ answer letters are A–E. Each beat is one sentence to one
   paragraph; the whole worked example reads in ~30 seconds.

4. **`counter_example`** — a single sentence describing one *modification*
   to the setup that kills the trap. Format: `Om problemet istället
   <added constraint>, då <result> — <consequence>.`

All four fields are Swedish prose strings.

## Swedish voice

- **No English calques.** Specifically forbidden:
  - "när att <infinitiv>" — direct translation of "when to <verb>"
  - word-for-word translations from English math idioms
- Use HP corpus vocabulary:
  - "uttrycket", "ekvationen", "olikheten", "polynomet"
  - "tecknet", "termen", "faktorn", "exponenten"
  - "tillämpa formeln", "förenkla", "lösa ut"
- "Studenten" is the standard subject in `trap_thinking`.
- "Vi" or imperative for `correct_thinking` — match the existing
  `countermeasure` tone for the entry.

## Worked-example grounding

You MUST consult at least one of the entry's `example_questions` from
`app/public/data/{exam_id}.json`. The qid format is
`{exam_id}-{provpass}-{section}-{number}`, e.g.
`host-2017-kvant1-XYZ-005` lives in `app/public/data/host-2017.json`
with that qid. Read the question's `prompt`, `options`, and `answer`
— your worked_example's answer letter MUST match the corpus answer.

## Style reference

The KVA pilot exemplar at `audit/_kva_traps_scale/PILOT_EXEMPLAR.json`
shows the gold-standard register. Read it before writing your first
entry. Adapt the worked_example shape for XYZ — no "Jämför I med II"
framing; XYZ is "Beräkna X" or "Lös för X" or "Förenkla X".

## Anti-patterns

- Don't make every `tldr` use the same syntactic shape.
- Don't make every `setup` start with the same verb — vary "Förenkla",
  "Lös", "Beräkna", "Givet att…", "I uttrycket…".
- Don't write generic worked examples — ground in the corpus.
- No markdown / bullets / `**bold**`.
- No LaTeX subscripts like `k_{1}`. Use Unicode (k₁) only if essential;
  prefer plain numerals like `k1` or rewrite to avoid subscript.

## Output

Write your assigned entries to `audit/_xyz_traps_scale/output_{A,B,C,D}.json`
as a JSON array of objects:

```json
{
  "id": "XYZ-TRAP-XXX",
  "tldr": "...",
  "recognition_cue": "...",
  "worked_example": { "setup": "...", "trap_thinking": "...", "correct_thinking": "...", "answer": "..." },
  "counter_example": "..."
}
```

After writing, re-read the file to confirm all assigned IDs are present.

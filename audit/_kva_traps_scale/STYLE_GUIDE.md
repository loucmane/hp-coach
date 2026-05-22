# KVA-trap richer-content authoring — style guide

You're authoring the new fields for KVA trap entries in
`app/public/frameworks/kva_traps.json`. Three subagents are working
in parallel; this guide keeps the voice consistent across all 35
entries.

## The four new fields

Every entry already has `pattern_description`, `why_it_occurs`,
`common_distractor_signature`, `countermeasure`, and `example_questions`.
You add four optional fields:

1. **`tldr`** — one-line summary that pulls the gist forward as a kicker.
   ~10–15 Swedish words, written as a single sentence with an em-dash
   structure: `<premise> — <consequence>`. The reader must be able to
   absorb the trap in 3 seconds.

2. **`recognition_cue`** — the textual or structural feature in a problem
   that should trigger an alarm bell. Written as a single Swedish sentence
   starting with a *noun phrase* describing what to look for in the
   problem. Often quotes example phrasings in `"..."`. ~25–35 words.

3. **`worked_example`** — a structured 4-beat narrative grounded in a
   real corpus problem. Look at 1–2 of the entry's `example_questions`
   to make this concrete. Object shape:
   ```json
   {
     "setup": "Givet att <real problem premise>. Jämför I: <X> med II: <Y>.",
     "trap_thinking": "Studenten <wrong reasoning> → väljer <wrong letter>.",
     "correct_thinking": "<corrected reasoning showing the both-cases / counter-example>.",
     "answer": "<letter> — <one-line justification>."
   }
   ```
   KVA's 4 answer letters are A (I > II), B (I < II), C (I = II),
   D (informationen är otillräcklig). Each beat is one sentence to one
   paragraph; the whole worked example reads in ~30 seconds.

4. **`counter_example`** — a single sentence describing one *added*
   constraint (`x > 0`, a numeric anchor, a tightened inequality) that
   kills the trap. Format: `Om problemet <adds constraint>, då <result>
   — <consequence for the answer>.`

All four fields are optional in the schema — but please author all
four for every assigned entry. The schema treats them as optional only
so the renderer doesn't crash on legacy entries.

## Swedish voice

- **No English calques.** The eyebrow above `recognition_cue` reads
  "IGENKÄNNINGSTECKEN" — a single Swedish noun. Write the field body in
  natural Swedish. **Forbidden patterns:**
  - "när att <infinitiv>" — direct translation of "when to <verb>"; not
    grammatical. Use "när problemet…" or "när du ser…" instead.
  - "är att <noun>" as a stand-in for "is to be"
  - Word-for-word translations from English math idioms
- Use HP exam vocabulary: "informationen är otillräcklig", "förhållandet
  är inte fastlagt", "villkoret", "påståendet". These are the actual
  Swedish phrasings the corpus uses.
- "Studenten" is the standard subject in `trap_thinking` (the trap-walker).
- "Vi" or imperative for `correct_thinking` is fine — match the existing
  `countermeasure` tone for the entry.

## Worked-example grounding

You MUST consult at least one of the entry's `example_questions` before
writing `worked_example`. The exam files live at
`app/public/data/{exam_id}.json` — the qid format is
`{exam_id}-{provpass}-{section}-{number}` so e.g.
`host-2017-kvant1-KVA-021` is in `app/public/data/host-2017.json` with
that qid.

Read the question's `prompt` and `options` to keep your worked-example
faithful: same numbers, same structural setup, same correct answer
letter. If the corpus problem doesn't cleanly illustrate the trap
(rare), invent a faithful analogue but keep it in the same numeric
register.

## Anti-patterns to avoid

- **Plagiarism by template.** Do NOT make every `tldr` use the same
  syntactic shape; do NOT make every `setup` start with "Givet att…".
  Vary the openings.
- **Generic worked examples.** "Antag x = 5" without grounding in the
  corpus is weak — the reader can tell. Use the corpus numbers.
- **Pedagogical drift.** Stay on the *trap*. The `correct_thinking`
  shows the trap-aware reasoning, not a textbook derivation.
- **Markdown / list bullets.** All four fields are prose strings.
  No `**bold**`, no `*italic*`, no `1.` lists. Use em-dash, colon, or
  line-internal parens for structure.

## Output

Write your assigned entries to
`audit/_kva_traps_scale/output_{A,B,C}.json` as a JSON array of
objects, each with shape:

```json
{
  "id": "KVA-TRAP-XXX",
  "tldr": "...",
  "recognition_cue": "...",
  "worked_example": { "setup": "...", "trap_thinking": "...", "correct_thinking": "...", "answer": "..." },
  "counter_example": "..."
}
```

That's it — just the four new fields, keyed by id. The merger
script will inject them into the canonical kva_traps.json.

After writing, sanity-check your output by re-reading the file and
confirming all assigned IDs are present.

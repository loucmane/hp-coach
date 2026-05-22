# NOG-trap richer-content authoring — style guide

You're authoring the new fields for NOG trap entries in
`app/public/frameworks/nog_traps.json`. Two subagents are working in
parallel; this guide keeps the voice consistent across all 25 entries
and aligned with the KVA pilot voice.

## NOG structure (different from KVA — read first)

NOG is **datasufficiens** ("data sufficiency"). Each question gives a
question stem plus **two statements** labeled (1) and (2). The
five answer letters mean:

- **A** — frågan kan besvaras med information **i (1) men ej i (2)**
- **B** — frågan kan besvaras med information **i (2) men ej i (1)**
- **C** — frågan kan besvaras med information **i (1) tillsammans med (2)** (but neither alone)
- **D** — frågan kan besvaras med information **i (1) och (2) var för sig** (each alone suffices)
- **E** — frågan kan **ej** besvaras genom de båda påståendena

A NOG trap is almost always about **sufficiency**, not about computing
the answer itself — the student declares a statement sufficient when
it isn't, or insufficient when it is. The worked example must surface
this distinction.

## The four new fields

Every entry already has `pattern_description`, `why_it_occurs`,
`common_distractor_signature`, `countermeasure`, and
`example_questions`. You add four optional fields:

1. **`tldr`** — one-line summary that pulls the gist forward as a kicker.
   ~10–15 Swedish words, em-dash structure: `<premise> — <consequence>`.

2. **`recognition_cue`** — the textual or structural feature in a NOG
   problem that should trigger an alarm bell. Single Swedish sentence,
   ~25–35 words. Often quotes example phrasings or names structural
   patterns (e.g. "när påståendet upprepar en känd sats", "när bara
   en marginal i en 2×2-tabell ges").

3. **`worked_example`** — a structured 4-beat narrative grounded in a
   real corpus problem. Look at 1–2 of the entry's `example_questions`
   to make this concrete. Object shape:
   ```json
   {
     "setup": "Frågan: <stem>. (1) <statement 1>. (2) <statement 2>.",
     "trap_thinking": "Studenten <wrong sufficiency call> → väljer <wrong letter>.",
     "correct_thinking": "<corrected sufficiency analysis showing what each statement actually pins down>.",
     "answer": "<letter> — <one-line: vad räcker/inte räcker>."
   }
   ```
   The `setup` must include the question stem AND both statements (or
   a faithful summary thereof). The `correct_thinking` should explicitly
   test each statement's sufficiency in turn, then both together.

4. **`counter_example`** — a single sentence describing one *modification*
   to the statements (or stem) that flips the answer letter. Format:
   `Om utsaga (X) istället sade <Y>, då <result> — <consequence for the answer>.`

All four are Swedish prose strings. The schema treats them as optional,
but please author all four for every assigned entry.

## Swedish voice

- **No English calques.** Specifically forbidden:
  - "när att <infinitiv>" — direct translation of "when to <verb>"; ungrammatical
  - word-for-word translations from English math idioms
- Use HP corpus vocabulary:
  - "påståendet" (the statement)
  - "räcker tillsammans men inte var för sig" (suffices together but not alone)
  - "låser inte" (doesn't pin down)
  - "informationen är otillräcklig" (the information is insufficient)
- "Studenten" is the standard subject in `trap_thinking`.
- "Vi" or imperative for `correct_thinking` is fine — match the existing
  `countermeasure` tone for the entry.

## Worked-example grounding

You MUST consult at least one of the entry's `example_questions` before
writing `worked_example`. The exam files live at
`app/public/data/{exam_id}.json` — the qid format is
`{exam_id}-{provpass}-{section}-{number}` so e.g.
`var-2025-kvant2-NOG-017` is in `app/public/data/var-2025.json` with
that qid.

Read the question's `prompt`, the two statements (usually in the
prompt or context), and the `answer` letter. Your worked-example's
answer letter MUST match the corpus answer.

## Style examples (KVA pilot for register reference)

```
tldr: "Kvadratlikhet låser inte tecknet — x² = y² öppnar både x = y och x = −y."
recognition_cue: "När problemet jämför kvadrater (x² = y², 'kvadraterna är lika', a² ger b²) eller drar kvadratrot ur en variabel."
worked_example.setup: "Givet att x² = 9 och inga andra villkor på x. Jämför I: x med II: 3."
worked_example.answer: "D — informationen är otillräcklig."
counter_example: "Om problemet lägger till 'x > 0' (eller 'x ≠ 0 och x är positivt'), då är tecknet låst och fällan är död — x = 3 unikt, svaret blir C."
```

For NOG, adapt the worked_example shape:

```
setup: "Frågan: hur många kvinnor är vänsterhänta? (1) 30 % av kvinnorna är vänsterhänta. (2) Det finns 60 kvinnor i gruppen."
trap_thinking: "Studenten ser att (1) ger andelen och (2) ger antalet, drar slutsatsen att vardera räcker — väljer D."
correct_thinking: "(1) ensam: bara en andel, ingen total → otillräcklig. (2) ensam: ingen andel → otillräcklig. Båda tillsammans: 0,30 · 60 = 18 → räcker. Endast tillsammans."
answer: "C — krävs båda påståendena tillsammans."
```

## Anti-patterns

- Don't make every `tldr` use the same syntactic shape.
- Don't make every `setup` start with "Frågan:…" — vary openings.
- Don't write generic worked examples ("antag a = 5") — ground in the corpus.
- No markdown / bullets / `**bold**` — all four fields are prose strings.
- Don't conflate NOG with KVA framing — the worked example is about
  *sufficiency*, not about *comparing two quantities*.

## Output

Write your assigned entries to
`audit/_nog_traps_scale/output_{A,B}.json` as a JSON array of
objects, each with shape:

```json
{
  "id": "NOG-TRAP-XXX",
  "tldr": "...",
  "recognition_cue": "...",
  "worked_example": { "setup": "...", "trap_thinking": "...", "correct_thinking": "...", "answer": "..." },
  "counter_example": "..."
}
```

After writing, re-read the file to confirm all assigned IDs are
present.

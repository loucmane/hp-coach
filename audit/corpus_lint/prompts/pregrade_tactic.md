# Pre-grade tactic authoring

For every Variant-C explanation in the corpus, author a per-question
`pregrade_tactic: {handle, move}` object — surfaced in the SPA's
pre-grade right column to give the student a named strategy hint at
the moment of attack.

The reader is a 17-year-old Swedish HP candidate with ADHD-PI,
currently in zero-knowledge mode (target 2.0). Write for them, not
for a linguist.

## What you're producing

```json
{
  "handle": "Substitutionsstrategin",
  "move": "Frågan ger ett villkor mellan variablerna — byt ut den ena överallt så att uttrycket bara har en variabel kvar."
}
```

Two fields:

- **`handle`** (3 words max, Capitalized Noun Phrase)
  A NAMED STRATEGY. The reader should be able to recognize it next
  time. Reuses across questions where the strategy genuinely applies
  build vocabulary — that's the goal. Examples that work:
    - `Substitutionsstrategin` (KVA/XYZ)
    - `Extremvärdestestet` (KVA)
    - `Stamordskartan` (ORD — etymology decomposition)
    - `Kollokationskontrollen` (MEK — fixed phrases)
    - `Ekokällan` (LÄS — find the exact text echo)
    - `Konnotationsfingret` (ORD — positive/neutral/negative)
    - `Variabeldefinitionen` (XYZ — "what does x really represent")

- **`move`** (1 sentence, 15-25 words, plain Swedish)
  Tell the student WHAT TO DO. Concrete verb. No jargon. No
  references to specifics that would leak the answer.
  Good: *"Pröva extremvärden — 0, 1, lika stora värden — innan du räknar."*
  Bad (leaks): *"Sätt a = 2 och se vad som händer."*
  Bad (jargony): *"Identifiera headwordets register och välj alternativ med matchande pragmatik."*

## Sourcing the tactic

For each entry, read:
1. `question.prompt` (and `question.options`, `question.context` if
   present) — what's actually being asked
2. `technique` (the existing post-grade strategy summary) — this is
   the truthful answer for "what's the move." Distill its essence
   into a pre-grade-safe `handle` + `move`.
3. `steps[0].text` — usually frames the problem and signals what to
   look for first

Then produce the tactic. If the technique field is well-named already
(e.g. "Substitutionsstrategin: ..."), use the same handle for
consistency across questions. If the technique describes a strategy
without naming it, name it yourself in plain Swedish.

## Banned vocabulary

These words leaked into the earlier hash-rotated catalog and the user
called them out. Don't use them.

- **headword** → "ordet i frågan" / "ordet du jämför med" / "frågeordet"
- **register** (in the linguistic sense) → "ton" / "stil"
- **kollokation** alone → "ord som hör ihop" / "fasta uttryck"
- **denotation/konnotation** → "betydelse" / "känsla / laddning"
- **pragmatik / morfologi / etymologi** → describe the move plainly

## False positives to skip

If an entry has no clear strategy beyond "know what the word means"
(common in trivial ORD questions), still author a tactic — make it
about HOW you recognize the meaning (etymology, sound, formal/casual,
context-of-use). Don't write "kolla i ordboken" or "kolla vad ordet
betyder" — that's not coaching.

## Output

For each exam, modify `data/explanations/<exam>.json` in place. For
every entry where `_meta.recipe == "variant-c-ultra-granular"`, add a
`pregrade_tactic` field. Leave the rest of the entry untouched.

Validate every modified entry against `pipeline/explanations/schema.py
::validate_explanation` before writing the file.

**Save every 5 entries.** A rate-limit storm losing 100 entries of
work is a real risk; checkpointing makes the dispatch resilient.

**Idempotent.** If `pregrade_tactic` is already present, skip the
entry. This makes reruns cheap.

## Voice anchor

Same as Variant-C: imperative `du`, calm coaching, named-strategy
first then move. Not motivational (no "you can do this!"). Not
academic (no "the metalexical register of the headword..."). The
register is "a confident tutor whispering the strategy frame just
before you act."

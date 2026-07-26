# gen-elf-cloze — "Holding the Line" (queueing culture)

**Format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE (held)
**Topic (batch-9 exclusive):** the unwritten rules of standing in line — and how much of the
order is actually supplied by the shape of the room rather than by the politeness of the
people in it.

## Genre / topic rationale

Society commentary is the natural home for an etiquette topic, and the blueprint pairs
commentary with BrE house style. The argumentative arc is `claim → counterexample →
qualified verdict`: a queue looks like a triumph of manners (¶1 opening); the evidence
actually points at room design (¶2); and the verdict inverts the moral reading altogether —
what holds a line is not courtesy but legibility, and the collapse case proves it (¶3).

Law 1 (particulars, never textbook theses): the passage is anchored on invented particulars —
Ingrid Mautner, three winters, four European cities, ticket halls / bakeries / ferry
gangways, the two-sided counter versus the roped corridor. No real researcher, publication
or famous thesis (no Goffman, no "civil inattention") is invoked; the design-over-manners
claim is argued from the passage's own invented observation study.

Law 9 (no manufactured tidiness): ¶2 deliberately undercuts its own finding — Mautner's
cities "were few", her winters "were cold", and cold weather "shortens everybody's temper".
That residue does not point at any answer.

## Gap architecture

House shape follows the gate-passed reference `batch8/candidates/elf-b8-002.json`:
`___(n)___` inline, `q_index n` ↔ `prompt "Gap (n)"`, one-word POS-uniform options,
≥2 shape-matched to the key per gap.

| gap | type | key | option set (shape) | planted trap |
|---|---|---|---|---|
| 1 | collocation | D `conventions` | con-…-ions plural abstract nouns | collocation_misfit ×3 — *convictions* (held, not obeyed), *concessions* (granted, not obeyed), *connections* (sense) |
| 2 | collocation + syntax | B `assumption` | -umption nouns | collocation_misfit — only *assumption* takes the that-clause; *resumption* takes "of", *consumption* / *gumption* fail on sense |
| 3 | connective | A `Accordingly` | sentence-initial connective adverbs | wrong_logic ×3 — concessive (*Admittedly*, *Nevertheless*) and contrastive (*Conversely*) where the frame demands consequence |
| 4 | polarity | C `courtesy` | -ity/-esy abstract nouns | polarity_mirror — "is not ___ at all" + downstream "cold, impatient" bait a skimmer into *hostility*; *curiosity* / *vanity* are sense misfits |
| 5 | collocation + polarity mirror | D `legible` | -(l)igible adjectives | polarity_mirror *illegible* (would reverse the collapse); *eligible* / *negligible* sense misfits |

Blueprint gap-type quota satisfied: ≥1 collocation (1, 2, 5), ≥1 polarity (4, with 5 carrying
a mirror distractor), ≥1 connective (3).

Gap 5 is deliberately load-bearing on ¶1: "Newcomers **read** the shape of a line" plants the
reading metaphor that only `legible` completes, so the last gap cannot be solved from the
local clause alone.

Gap 3 is the one gap that requires tracking the argument rather than the phrase: the
preceding sentence is the *evidence* (ambiguous counter → more disputes), the gapped
sentence is the *conclusion*, so only a consequential connective works. `Admittedly` is the
live trap because a skimmer reads "the room does the moral work" as a concession against the
writer, when it is in fact the writer's own thesis.

## Self-blind-solve

Solved cold from the passage alone, arguing each non-keyed option:

1. **D** — "obeyed conventions" is the only existing collocation; the three con-…-ions
   rivals fail on what can be obeyed. Single.
2. **B** — only *assumption* licenses "a shared ___ **that** everybody present will…".
   Syntactic, not merely semantic; single.
3. **A** — tested by substitution against the previous sentence. Concessive and contrastive
   readings both require the claim to cut against the writer's line; it does not. Single.
4. **C** — the negation frame demands the warm quality being denied, and the next sentence
   supplies the disproof of *hostility* directly. Single.
5. **D** — *illegible* inverts, the other two are off-sense; the ¶1 "read the shape"
   metaphor fixes *legible*. Single.

No gap came out two-way. Keys spread **D / B / A / C / D** — no positional tell.

## Mechanical self-check (run_mech.py, all five gates)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.
Measured: passage 335 tokens (cloze band 228–401), 3 paragraphs (1–4),
mean sentence 25.8 words (13.1–34.8), prompts 2 tokens (cloze 1–15),
all options 1 token, option-length ratio 1.0 per gap.
Sentence lengths vary from a 4-word verdict ("They are usually enough.") to 40+-word
subordinated sentences, per law 7.

Spelling variety: BrE throughout — *behavioural*, *drily*, *queue/queued*; no AmE-only forms.

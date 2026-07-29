# gen-elf-cloze — "Agreed, Unread" (batch 12)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE (`behaviour`)
**Family:** ELF-CLOZE-001 · **Keys:** C / A / D / B / C

## Why this topic and this cut of it

"Nobody reads terms and conditions" is a truism, and a passage that merely
asserted it would be a textbook thesis (law 1). The cut taken here is the
*rebuttal of the obvious explanation*: a fictional timing study finds a median
of eleven seconds, blames length, then shortens the document to one plain page
and watches the median climb only to twenty-two seconds. The real finding is
about resignation rather than impatience — the contract is not negotiable, so
reading buys nothing — and it closes on a narrow legal complaint rather than an
indignant one. All figures, the researcher (Iris Hallenbeck), the columnist
(Petra Vanterpool) and the study itself are invented; no real firm, statute,
regulator or published experiment appears, so no outside knowledge helps.

Deliberate residue (law 9): the "flicker of guilt", "the better part of an
hour", and the three-clause aside "The firms disclose; the words are on the
page; nobody is lied to" carry no gap and are never reused. The passage also
declines the tidy verdict — Hallenbeck "stops well short of calling the practice
deceptive" — so the argument does not resolve into a moral.

Sentence rhythm is deliberately uneven: a 34-word opening period, then the
verbless fragment "Long enough to find the button; not long enough to reach the
second clause.", then two seven-word verdict sentences in paragraph 2.

## Gap architecture

House shape follows the gate-passed `elf-b8-002`: `___(n)___` inline, one
question per gap, prompt `Gap (n)`, single-word POS-uniform options, ≥2
shape-matched to the key per set.

| gap | type | key | option set | discriminator |
|---|---|---|---|---|
| 1 | collocation | **account** (C) | accord / discount / account / recount | only `account` takes *give any ___ of*; `accord` and `discount` are topic-thematic (agreement, consumer commerce) but have no such frame; noun `recount` means a re-tally, never a retelling |
| 2 | connective | **Naturally** (A) | Naturally / Consequently / Conversely / Ultimately | the sentence concedes the expected explanation that the later *But* overturns — concessive, not causal (`Consequently`), not adversative (`Conversely`), not terminal (`Ultimately`) |
| 3 | polarity | **decisive** (D) | dismissive / excessive / ineffective / decisive | *far from ___* inverts; the evidence (11 s → 22 s, "still did not read") makes brevity non-settling, so the gap holds the positive pole. `ineffective` is the polarity mirror a skimmer grabs |
| 4 | collocation | **concede** (B) | accede / concede / precede / recede | only `concede` governs a *that*-clause; `accede` is thematically tempting (to agree) but is intransitive with *to*; `precede`/`recede` fail on sense and complement |
| 5 | collocation | **formality** (C) | finality / neutrality / formality / banality | countability plus sense: *but a ___* needs a count noun, and the appositive gloss ("preserves the form of choice while quietly emptying it of content") is the dictionary entry for *a formality* |

Gap-type budget per the blueprint: ≥1 collocation (3 of them), ≥1 polarity
(gap 3, contrastive *far from* frame), ≥1 connective/adverb (gap 2). ✔

## Self-blind-solve

Solved each gap from the frame alone, arguing actively for each distractor.

- **Gap 1** — `accord` is the strongest rival because the paragraph is about
  agreeing; killed on the frame, since *give an accord of* does not exist and an
  accord is a settlement, not a report.
- **Gap 2** — `Ultimately` is the strongest rival, but the length explanation is
  the paragraph's *opening* position and is rejected two sentences later, so
  nothing about it is a final upshot.
- **Gap 3** — the deliberate hazard. `ineffective` can be argued for one beat
  (reading time *did* double), but the sentence is introduced by "But" as a
  rebuttal of the length explanation, and the two following sentences state that
  people still did not read. "Far from ineffective" would make the experiment
  support the position it is cited against. Single answer survives.
- **Gap 4** — `accede` is the near-miss; blocked by the *that*-clause, which it
  cannot take.
- **Gap 5** — `banality` is the near-miss (the act is routine), but a banality is
  a trite *remark*, and the appositive defines a procedural gesture.

**One defensible answer per gap; no rewrite needed.** Keys spread C/A/D/B/C — no
column, no positional tell. All options are single words, so no length tell is
structurally possible (M-TELL/M-BANDS ratio 1.0 everywhere).

## Bands (measured)

passage 339 words (cloze band 228–401; blueprint target 300–410) · 4 paragraphs
(1–4) · 18 sentences, mean 18.8 words (13.1–34.8) · prompts 2 words (cloze 1–15) ·
options 1 word each (cloze 0–4) · option ratio 1.00 (cap 2.36).
`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.

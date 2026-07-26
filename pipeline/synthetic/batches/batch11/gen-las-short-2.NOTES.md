# gen-las-short-2 — "Timmar ute är inget innehåll"

**Topic (batch11 exclusive):** utomhuspedagogik i förskolan.
**Unit type:** LÄS short (2 questions). **family:** `utomhuspedagogik-forskola-essa-short`.

## Genre and topic rationale

`sakprosa / debatt_opinion` with an **essayistic voice** (`sub_voice: essä` in
`generator_meta`): the piece opens on a concrete scene from the writer's own
department rather than on a thesis, moves through a study, and only then states
its stance. That keeps it clearly distinct from the batch's other LÄS-short unit
(a straight framing-claim debatt) while staying inside the blueprint's allowed
`fine_genre` values.

The topic is distant from every batch 1–10 subject. The nearest neighbours are
the school-libraries unit (school organisation, but staffing of a collection,
not what happens during an activity) and the playground-surfaces unit (physical
outdoor material, no pedagogy or measurement critique); the study-circle unit is
adult voluntary education. None of them touches early-years practice, the
accounting of activity time, or the group-size threshold this unit turns on.

The angle was chosen so the passage can carry a **finding that defeats the
obvious dose–response intuition**: total time outdoors did not covary with
anything, while preparation did — and only below a group-size threshold. That
funds Q1 and blocks a passage-blind solver, because "more time outdoors → more
of everything good" is exactly what general knowledge predicts, and it is
offered as option A. The whole-text message funds Q2, so the two questions draw
on different material.

Against manufactured tidiness (law 9): the researcher states plainly what she
cannot show (preparation and staff qualification are confounded in her
material), one department breaks the pattern completely and she says she has no
explanation for it, the preparation has a named cost taken from documentation
time and some staff resented the trade, and the writer admits her own department
fails at this in November and that some of the best of what happens outdoors
should not be planned at all. The passage ends signed, not on a flourish or a
question.

**Frame:** title lives in the `title` field only; byline `— Gunilla Åkerhielm,
förskollärare och handledare` last inside `passage`; one glossary entry
(`kvalitetsberättelse`) for a word that does occur in the text (first
paragraph). All entities fictional: Anneli Bergkvist, Högskolan i Torneby,
Ekbacken, Gunilla Åkerhielm. No famous thesis is anchored — no real curriculum
document, no named outdoor-learning tradition, no real research programme.

## Planted targets

- **P2 finding** (directional, scoped, with an explicit null): total outdoor
  time "samvarierade inte alls" with children's questions; departments that went
  out *with a prepared focus* saw more questions; but only in groups of at most
  fourteen children, and in larger groups staff time went to clothing and
  conflicts. Direction (preparation → questions) and scope (group size) are
  separately invertible; the null result is what makes the dose–response
  distractor live rather than absurd.
- **P3 residue**: the confound (prepared departments also had more qualified
  staff, "går inte att skilja åt"), the unexplained outlier Ekbacken (large
  hilly yard, no preparation, highest figures), and the documentation-time cost.
  All three exist to be mis-imported by a distractor.
- **P1 + P4 + P5 stance**: the logged hour is a bookkeeping entry; a February
  hour with twenty children and a substitute is not a May hour in the woods, yet
  they count the same; if anything is to be measured it should be children per
  adult and whether anyone has thought about where they are going.

## Trap architecture

**Q1 — `detalj_ospecificerad`** ("Vad kom Anneli Bergkvist fram till …?");
key **B**.
- A `plausible_worldknowledge` in dose–response form — more hours, more
  questions. Undismissable without the passage; killed only by the explicit
  "samvarierade inte alls".
- C `reversed_causality` — the same two quantities, arrow flipped: departments
  where children already asked a lot tended to plan more. Made more tempting by
  the passage's own admission that a confound exists, which invites the reader
  to suspect the causal story. Deliberately hedged ("tenderade"), so the
  qualified-looking option is the wrong one.
- D `overgeneralisation` carried by surface echo — the yard is mentioned exactly
  once, in the one case the researcher cannot explain; "berodde helt på" turns
  an unexplained exception into the whole explanation.
- Hedge balance: the key is a scoped but confident claim while C is the hedged
  option, so "pick the qualified answer" scores zero here.

**Q2 — `huvudbudskap_syfte`** ("Vilket påstående överensstämmer bäst med
texten?"); key **D**. **Law 11 governs this item** — no distractor is
verbatim-true:
- A `detail_as_main` with an **upgraded attribution** — the passage says
  preparation and staff qualification cannot be separated in the material, so
  claiming the study *showed* qualification was decisive is the opposite of what
  is written, not a faithful sub-point.
- B `overgeneralisation` — absolute quantifiers ("alltid", "inte något
  lärande") and contradicted by the closing concession that some of what happens
  outdoors cannot and should not be planned.
- C `half_right_conjunction` / concession-as-conclusion — the November admission
  is real, but the inference about feasibility is one the writer never draws;
  the hedging ("tycks", "knappast") is what disguises the overreach. Also keeps
  the qualified option on the wrong side in this question too.
- The key spans P1 (the logged figure says nothing), P2 (the two conditions) and
  P4–P5 (measure adults per child and intent instead of hours) — no distractor
  spans more than one paragraph.

## Self-blind-solve

Solved both questions from the passage alone, arguing actively for every
non-keyed option.

- **Q1 = B, single defensible.** A dies on "Den sammanlagda tiden utomhus
  samvarierade inte alls med den siffran"; C reverses a direction the passage
  states explicitly and would require the confound to be a causal claim, which
  the researcher declines to make; D is killed by "helt", since Ekbacken is
  named as the case *without* an explanation and the other departments differed
  on preparation. No second option survives.
- **Q2 = D, single defensible.** A contradicts "de två sakerna går inte att
  skilja åt"; B is refused by the final concession about the unplannable; C is
  an inference the writer's own concession does not license — she says her
  department fails in November, not that outdoor pedagogy is unworkable then.
  Checked specifically for a second *fully true* option (the law-11 failure
  mode): there is none — every distractor carries a locatable flaw.

## Band compliance (measured with `mech.py` helpers)

Passage 387 words, 24 sentences, mean 16.1 w/sentence, 6 paragraphs — inside the
LÄS-short bands (188–588 words; mean 10.1–36.5; paragraphs 1–20) and inside the
blueprint's tighter authoring target (290–500, ~400). Prompt lengths 11 and 6
words (band 3–31). Option lengths 17/17/17/15 and 14/17/15/14 (max 23);
option-length ratios 1.13 and 1.21 (cap 5.25). The key is not the single longest
option in either question. Key letters B, D — spread.

`run_mech.py` on this file: **M-SCHEMA / M-BANDS / M-TELL / M-FORM /
M-PLAGIARISM all pass**, no findings.

# gen-las-short-1 — "Skyltarna är det billiga i grannsamverkan"

**Topic (batch11 exclusive):** grannsamverkan mot brott.
**Unit type:** LÄS short (2 questions). **family:** `grannsamverkan-brottsforebyggande-debatt-short`.

## Genre and topic rationale

`sakprosa / debatt_opinion`, opening move = framing-claim, first person present,
normative reasoning carried by an explicit stance plus two concessions — the
blueprint's debatt preset. The topic is distant from every batch 1–10 subject.
The nearest neighbours are the crisis-preparedness unit (household readiness,
no organisation-versus-symbol angle and no policing) and the street-names /
public-clocks units (municipal artefacts, not municipal service design). None of
them touches neighbourhood crime prevention, resident reporting behaviour, or
the sign-versus-person distinction this unit turns on.

The angle was chosen so the passage can carry a **counter-intuitive empirical
finding** — the metric everyone reaches for (burglary counts) barely moved,
while the one nobody budgets for (tips reaching the police) rose sharply. That
finding funds Q1 and is the reason a knowledgeable but passage-blind solver
cannot answer it: general knowledge says "neighbourhood watch reduces
burglary", which is precisely the distractor. The writer's stance funds Q2, so
the two questions do not compete for the same sentences.

Against manufactured tidiness (law 9): the study has a case its own author
cannot explain (a signs-only area where burglaries fell two years running), the
comparison areas were picked after the fact and the passage says so, two rental
areas yielded nothing measurable at all, the researcher refuses the strong
reading ("Vi mäter uppmärksamhet, inte brottslighet"), the increased attention
carries a named cost (tips about couriers and tradespeople, complaints the
municipality had to handle), and the writer concedes an entire class of
burglaries her proposal cannot touch. The eighteen-month claim about groups
withering is explicitly marked as anecdote, not research. The passage ends
signed, not on a flourish or a question.

**Frame:** title lives in the `title` field only; byline `— Ellinor Wredberg,
trygghetssamordnare i Vallsäter kommun` last inside `passage`; one glossary
entry (`trygghetsmätning`) for a word that does occur in the text (final
paragraph). All entities fictional: Petra Nyhlén, Almnäs högskola, Vallsäter
kommun, Ellinor Wredberg. No famous thesis is anchored — in particular the
passage avoids any real evaluation of Swedish grannsamverkan or any
broken-windows-style thesis a knowledgeable solver could answer from.

## Planted targets

- **P2 finding** (hedged, directional, scoped): where groups met *physically at
  least twice a year*, tips to the police rose sharply, while the fall in
  reported burglaries was too weak to separate from the comparison areas. Two
  outcome variables that move in *different* degrees — the structure that makes
  a clean swap-distractor possible. Scope: clearest in low-turnover villa areas;
  unmeasurable in two high-turnover rental areas.
- **P3 exception**: chat-group-only areas — message volume grew, tips to the
  police did not. Built to be mis-imported as a positive result, and to make an
  actor-swap (messages inside the group vs. tips reaching the police) available.
- **P4 stance + concessions**: the objection is explicitly *not* about too
  little money but about what the money buys — signs, stickers and folders
  rather than the person who convenes the group. Concession: travelling
  burglary groups ignore signs and no coordinator can fix that — immediately
  refused as grounds for abstention ("Det är ändå inget skäl att låta bli").

## Trap architecture

**Q1 — `detalj_ospecificerad`** ("Vad visade Petra Nyhléns uppföljning …?");
key **B**.
- A `overgeneralisation` — "samtliga områden … oavsett bebyggelse". Absolutises
  a scoped result; killed by the two rental areas where nothing could be
  measured.
- C `reversed_causality` (outcome swap) — the two measured quantities are
  exchanged: burglaries fell clearly, tips stayed flat. This is the strongest
  distractor by design: it is exactly what a passage-blind reader expects a
  neighbourhood-watch study to find. It is also *confident*, not absolutised, so
  it cannot be dismissed by quantifier-spotting.
- D `scope_shift` + actor shift — hedged ("tycktes"), answers the chat-group
  paragraph, and moves the growing number from messages inside the group to
  tips reaching the police.
- Hedge balance: the key is qualified, but so is D, and A/C are confident. The
  "pick the hedged one" heuristic returns a 50/50 between B and D.

**Q2 — `forfattarens_hallning`** ("Vilken kritik riktar textförfattaren …?");
key **C**.
- A `reversed_causality` on the stance axis — she is made to argue the opposite
  budget priority. Live for a passage-blind reader because "too much on
  coordinators, too little on what reaches people" is the standard municipal
  complaint.
- B `detail_as_main` with an over-conclusion — takes the travelling-groups
  concession and promotes it to "verkningslösa", which the passage explicitly
  refuses in the next sentence.
- D `scope_shift` carried by lexical echo — `trygghetsmätning` is a real word in
  the passage, but it appears as a result she cites, never as a measurement
  problem she doubts. Deliberately over-hedged ("tycks sakna underlag") so that
  here the *qualified* option is the wrong one, inverting Q1's polarity.
- Law 11 does not formally bind (this is a hållning stem, not a "bäst"-stem),
  but no distractor is verbatim-true anyway: each carries one nameable flaw —
  inverted direction, promoted concession, unheld position.

## Self-blind-solve

Solved both questions from the passage alone, arguing actively for every
non-keyed option.

- **Q1 = B, single defensible.** C is a direct contradiction of "den var så svag
  att den inte gick att skilja"; A is contradicted by the two rental areas; D is
  contradicted by "antalet tips som nådde polisen förändrades inte". No second
  option survives.
- **Q2 = C, single defensible.** A inverts the sentence "Kommunen bekostar
  skyltar … men inte den person"; B is refused verbatim by "Det är ändå inget
  skäl att låta bli"; D asserts a doubt about the trygghetsmätning that the text
  never expresses — it cites the measurement approvingly.

## Band compliance (measured with `mech.py` helpers)

Passage 400 words, 23 sentences, mean 17.4 w/sentence, 6 paragraphs — inside the
LÄS-short bands (188–588 words; mean 10.1–36.5; paragraphs 1–20) and inside the
blueprint's tighter authoring target (290–500, ~400). Prompt lengths 17 and 11
words (band 3–31). Option lengths 17/19/20/17 and 18/13/14/13 (max 23);
option-length ratios 1.18 and 1.38 (cap 5.25). The key is **not** the longest
option in either question. Key letters B, C — spread.

`run_mech.py` on this file: **M-SCHEMA / M-BANDS / M-TELL / M-FORM /
M-PLAGIARISM all pass**, no findings.

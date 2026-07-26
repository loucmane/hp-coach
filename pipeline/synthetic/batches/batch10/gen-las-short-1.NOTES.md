# gen-las-short-1 — "Hyllorna är inte skolbiblioteket"

**Topic (batch10 exclusive):** skolbibliotekens roll och bemanning.
**Unit type:** LÄS short (2 questions). **family:** `skolbibliotek-bemanning-debatt-short`.

## Genre and topic rationale

`sakprosa / debatt_opinion`, opening move = framing-claim, first person present,
normative modality (*bör*), explicit stance carried by an explicit concession —
the preset the blueprint attaches to debatt. The topic is distant from every
batch 1–9 subject: the nearest neighbours are the study-circle/folkbildning unit
(adult voluntary education, no institution-staffing angle) and the
discarded-notebooks/archives unit (collections as objects, not as a staffed
service). Neither touches school organisation, municipal budget priority, or the
person-versus-collection distinction this unit turns on.

The angle was chosen because it lets the passage carry a **counter-intuitive
empirical finding** — the staffed library changed what *teachers* did, while
lending, the metric everyone reaches for, barely moved — inside an argumentative
frame. The finding funds Q1; the writer's stance funds Q2; the two questions
therefore do not compete for the same sentences.

Against manufactured tidiness (law 9): the study has an exception that undercuts
it (shared librarians produced no change at all), the researcher declines to call
it proof, the material is admitted to be four municipalities in one county, and
the writer concedes two things her own proposal cannot fix (class size, planning
time) plus one case where it plainly does not apply (a sixty-pupil school). The
passage ends signed, not on a flourish or a question.

**Frame:** title in the `title` field only; byline `— Marianne Öberg,
skolbibliotekarie` last inside `passage`; one glossary entry (`bestånd`) for a
word that does occur in the text (twice). All entities fictional: Ingrid
Salomonsson, Bjurhamns högskola, Rydstad, Marianne Öberg. No famous thesis is
anchored — in particular the passage avoids any real reading-crisis or
literacy-policy thesis a knowledgeable solver could answer from.

## Planted targets

- **P2 finding** (hedged, directional, scoped): where a trained librarian was on
  site *minst tre dagar i veckan*, teaching *tycktes* change — SO teachers began
  building source-criticism into their own courses; lending differed *less than
  expected*; the pattern was clearest at högstadiet and harder to read at
  lågstadiet. Hedge ("tycktes"), direction (staffing → teacher planning) and
  scope (stage, threshold of days) are all separately invertible.
- **P3 exception**: at schools sharing one librarian across three or four units
  nothing changed and the time went to keeping the collection in order — a
  paragraph built to be mis-imported as the study's main difference.
- **P4 stance + P5 concessions**: the objection is not *too little money* but
  *money spent on stock instead of on a person*; the concessions (a librarian
  cannot shrink classes or create planning time; a sixty-pupil school cannot
  carry a full-time post) are strong enough to be weaponised as distractors.

## Trap architecture

**Q1 — `enligt_texten_detalj`** ("Vad visade … Salomonssons undersökning …?"); key **C**.
- A `reversed_causality` — schools where teachers already worked with source
  criticism more often recruited a librarian. Live for a passage-blind reader
  (selection effects are the standard objection to such a study) and the
  passage's own admission that the material is thin makes it feel invited; but
  the study reports what happened *where the staffing was*, never a direction
  from teaching practice to hiring, so nothing licenses it.
- B `surface_lexical_echo` + `scope_shift` — reuses "hålla samlingen i ordning"
  from P3 and promotes it to the study's principal difference. Wrong paragraph
  and wrong sample: that clause describes only the shared-librarian schools,
  where *no* change appeared.
- D `overgeneralisation` — "både utlåningen" and "samtliga stadier" absolutise a
  finding the passage limits twice over (lending differed less than expected;
  the lågstadiet picture was harder to interpret).

**Q2 — `forfattarens_hallning`** ("Vilken kritik riktar skribenten mot kommunens
satsning …?"); key **B**.
- A stance-level `reversed_causality` — demands a bigger appropriation, exactly
  the reading the text disowns in a sentence ("Min invändning är inte att
  kommunen satsade för lite"). Tempting because the surrounding tone is
  critical and a reader running on gist expects a funding complaint.
- C `detail_as_main` on a concession — the sixty-pupil school is the writer's own
  admission of a limit, turned into an accusation the municipality never makes.
- D `plausible_worldknowledge` — untrained staff minding the library beside a
  teaching load is a familiar real complaint in Swedish school debate, but the
  passage says nothing about who in practice minds the room in Rydstad; its
  charge is that *nobody* is assigned.

No distractor in either item is verbatim-true (law 11): each carries one nameable
flaw — a flipped arrow, an imported paragraph, an absolutised scope, a disowned
position, a concession converted into an accusation, an unheld complaint.

**Hedge balance (law 10, M-FORM):** Q1's key is measured ("oftare") and so are
two of its distractors ("vanligare", "främst"); only D is absolute. Q2's key
carries **no** hedge at all — it is the confident, specific claim — while the
absolutiser ("omöjligt") sits in a distractor. Across the unit "pick the
qualified option" and "pick the correct option" do not line up. M-FORM passes.

**Length tell (M-TELL):** key is never the single longest option (Q1 longest = B
at 21 tokens vs key 19; Q2 longest = A at 19 vs key 18). M-TELL passes.

## Self-blind-solve

Solved both from the passage alone, arguing actively for each non-keyed option.

- **Q1 → C, single.** The only sentence describing what the study *showed* is the
  P2 finding; C paraphrases it with the hedge and the direction intact. A is the
  same content with the arrow reversed and is nowhere asserted. B is refuted by
  the sentence saying no change appeared where the librarian was shared. D is
  refuted twice (lending; lågstadiet). No second defensible reading.
- **Q2 → B, single.** The writer states the criticism in two consecutive
  sentences; B paraphrases them. A is contradicted verbatim in the text; C
  reverses who holds the sixty-pupil point; D adds a fact the passage never
  supplies. No second defensible reading.

## Mechanical self-check (run_mech.py, corpus `data/parsed`)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.
Passage 314 tokens (short band 188–588), 20 sentences, mean 15.7 words
(band 10.1–36.5), 6 paragraphs; sentence lengths range 6–39 tokens, so the
rhythm varies as real prose does. Option lengths 14–21 tokens (band ≤23);
option-length ratio well inside 5.25. Key letters spread C / B.

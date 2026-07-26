# gen-elf-cloze — "The Last Flourish" (batch 11)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE (held; overt markers `cheque`, `catalogue`)
**Topic:** the disappearing handwritten signature — what a bank's old signature cards actually tested, and what screen-captured signing gained and lost.

## Why this genre and topic

Commentary was picked over science journalism because the topic's interest is
social, not technical: the question is what a signature was *for*, and what
disappears when the test that replaced it is, on its own narrow terms, better.
The arc is the commentary arc from the blueprint — claim (the cards tested
habit, not shape) → counterexample (the new screen test is genuinely better at
matching hands) → qualified verdict (better at the narrow question, silent on
the human one). That shape is what makes the polarity gap at (4) bite: the
paragraph *concedes* before it qualifies, so the negative-pole word cannot fill
the gap even though the passage's mood is elegiac.

Anti-plagiarism: Halberg Savings Bank, Marit Solberg and Ellen Ravnsborg are
invented; no real bank, archive, standard or study is named, and no famous
thesis is leaned on. The signature-card practice is described in the passage's
own terms rather than attributed to any source. M-PLAGIARISM passes clean
against `data/parsed`.

## Trap architecture, gap by gap

| gap | type | key | traps |
|---|---|---|---|
| 1 | collocation / sense | **B** forgery | mockery (sense misfit: a travesty, not a faked hand), perjury (wrong domain + not countable in this sense), trickery (uncountable — `a trickery` is not English; the deception theme makes it the tempting shape-match) |
| 2 | collocation (particle discrimination) | **C** gave away | gave out (distributed / failed), gave up (abandoned — needs an animate subject, and would mean the imitator was handed over), gave off (emitted heat, light, smell) |
| 3 | connective | **D** Nevertheless | Consequently (asserts cause where the sentence reverses the paragraph), Meanwhile (temporal; no second time-frame), Incidentally (marks an aside, but the claim is the paragraph's verdict and is immediately evidenced) |
| 4 | polarity | **A** improvement | **impoverishment = polarity_mirror** (the elegiac register pulls the skimmer to the negative pole, but `Yet` after a sentence granting the screen is "plainly the better test" cannot introduce a refusal to call the change a *loss*), endorsement = surface_word_match (a signature on the back of a cheque *is* an endorsement — right domain, wrong sense), entrenchment = collocation_misfit (no `a straightforward entrenchment`) |
| 5 | collocation | **B** carrying | shifting (`shift one's weight` — physical, wrong sense), gaining (`gain weight` — real collocation, inverted meaning), pulling (`pull one's weight` — needs the possessive, means do one's share) |

All four options in every gap are POS-uniform; gaps 1, 4 and 5 are suffix- or
shape-matched (`-ery/-ury`, `-ment`, `-ing`), and gap 2 shares a single head
verb across all four options — the maximum available shape match. Gap-type
coverage required by the blueprint is met: three collocation gaps, one
connective gap, one polarity gap.

Deliberate planting in the passage, not retrofitting: the `Yet` before gap (4)
and the concession sentence in front of it exist *only* to make the polarity
gap single-keyed; the "slow down and the line goes even" chain exists to force
an involuntary-revelation verb at (2); the disputed cases in the ledgers exist
to make the concession at (3) load-bearing rather than an aside.

## Self-blind-solve

Solved all five gaps from the passage alone, arguing actively for each
non-keyed option:

- (1) The only live competitor is *mockery*, which is grammatical with the
  article; it dies on sense — the clerk is deciding whether a name was written
  by someone else, and a mockery is not a document. Single key.
- (2) *gave up* is the one that can be argued (an imitator "gives up"), but the
  subject of the gap is *that evenness*, an abstraction, which cannot abandon
  or surrender anything, and the sentence is about detection. Single key.
- (3) *Consequently* was tested hardest: the preceding clause is a success, the
  gapped sentence a failure verdict, so no causal reading survives. Single key.
- (4) The dangerous option is *impoverishment*, because a reader who has only
  skimmed the elegy will read the passage as a lament. Held to the frame, the
  `Yet` immediately after "it is plainly the better test" forces a concessive
  contrast, and a refusal to call the change a loss is not a contrast with a
  concession that it is better — it is the same direction. Single key.
- (5) All three distractors form real collocations with *weight*; only
  *carrying* means "having force", which is what "long after it has stopped ___
  any weight" needs alongside "demanded all the same". Single key.

Result: **no two-way gap**; no rewrite required after the pass.

## Bands (measured with `mech.tokenize` / `mech.sentences`)

passage 340 words (cloze band 228–401) · 4 paragraphs (1–4) ·
mean sentence 30.9 words (13.1–34.8) · prompt 2 words (cloze 1–15) ·
options 1–2 words (cloze 0–4) · option ratio 1.00 (cap 2.36).
`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.

Keys spread **B / C / D / A / B** — no column, no positional tell.

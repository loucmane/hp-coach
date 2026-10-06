# gen-elf-cloze — batch19 authoring notes

**Unit** ELF cloze, 5 single-word gaps, society commentary.
**Family** `ELF-CLOZE-001 / allotment-waiting-list-inheritance-society-commentary-cloze`
**Title** Somebody Else’s Rhubarb
**candidate_id** `PLACEHOLDER` (orchestrator assigns at renumber).

---

## 1. Lane choice

The brief offered three topics. I took **(b) allotment waiting lists as a study
in patience and inheritance** and rejected the other two on graze grounds,
evidenced by `grep -ril` over `batches/*/candidates-final/*.json` plus batch18's
generated files:

- **(a) the second-hand bookshop pricing pencil.** Its lane word *second-hand*
  is the head of a shipped family name (`ELF-CLOZE-001 /
  repair-economy-secondhand-resale-society-commentary-cloze`, elf-b4-002), and
  the pencil-price argument — what a revisable price promises — would have had
  to carry a resale-value theme alongside it, i.e. straight into elf-b4-002's
  subject. *bookshop*, *pencil* and *flyleaf* return zero hits bank-wide, so the
  objects are fresh; the argument is not.
- **(c) the unwritten seating law of café regulars.** This grazes elf-b9-002
  (`queueing-culture-unwritten-rules`) head-on — an unwritten rule between
  strangers, enforced by nobody — and *café* already appears in elf-b1-002,
  elf-b4-002, elf-b15-002 and elf-b16-002.
- **(b) allotment waiting lists.** *allotment* appears nowhere in any shipped
  **passage**; the only two bank hits are inside `generator_meta` prose
  (las-b4-002's topic string "allotment-garden fences", a Swedish
  hedgehog-ecology unit, and elf-b17-002's clone_note quoting it). *rhubarb*
  returns zero hits bank-wide.

The lane is also positioned *against* elf-b9-002 rather than beside it: this
list is **written, numbered, published and arithmetical**, which is the exact
inverse of the unwritten-rule lane, and the word *queue* is kept out of the unit
entirely.

## 2. Passage design

- **Genre** society_commentary; **spelling variety** BrE, held throughout.
- **Arc** claim → counterexample → qualified verdict, realised as
  *written rule against grown practice*: published arithmetic → the clause, and
  the mechanism that actually moves the list → what a plot called *vacant*
  actually carries → the succession the clause cannot reach, and one name at the
  top the rules have not been used against.
- **Thesis shape** deliberately not "the metric measures the wrong thing", not
  "the obsolete thing came back", not batch16's conventional-view-refused, not
  batch17's inventory-with-a-locked-drawer, not batch18's notice-and-escalation.
  The passage takes no side: the minutes are *not approving, but not censorious
  either*, and it closes on a rule that has simply not been used.
- **Coda** no aphorism, no "not A, but B" chiasmus, no verdict, no gesture by a
  characterised person, no measurement-book close (batch18 records that motif as
  saturated). The unit stops on a six-word statement and leaves the case open.
- **Non-tidiness** the passage carries residue that points nowhere: the plum
  tree planted too near the boundary, the concrete path from the seventies, the
  strawberry bed under couch grass, "It is not affectionate and it is not quite
  a joke." Nothing in paragraph 3 serves the argument of paragraph 4.
- **Names** one invented proper name in the whole unit (the byline). No
  toponym, no institution, no invented firm, no survey, no statistic attributed
  to anybody, no researcher, no direct speech. The secretary, the older hands,
  the tenant in her eighties and the nephew are roles, not characters.
- **Title shape** a possessive noun phrase built on an indefinite pronoun —
  a shape no shipped ELF unit uses, and not the capped "The + modifier + noun".

## 3. Gap table

| gap | type | POS | frame | key | distractors |
|---|---|---|---|---|---|
| 1 | collocation | noun | "to take the long ___" | **view** (C) | outlook, gaze, sight |
| 2 | **connective** | sentence adverb | "___, a plot cannot be inherited." | **Strictly** (B) | Increasingly, Curiously, Privately |
| 3 | collocation | plural noun | "waiting for dead men’s ___" | **shoes** (A) | coats, gloves, boots |
| 4 | **polarity** | predicative adj. | "not approving, but it is not ___ either" | **censorious** (D) | gracious, cautious, anxious |
| 5 | collocation | past participle | "The rule has not been ___." | **invoked** (C) | summoned, provoked, evoked |

Budget 3 collocation / 1 polarity / 1 connective (blueprint §2 minimum met).
POS spread over four word classes. Key string **CBADC** — all four letters used,
no column, does not default to A, and matches no shipped cloze key string.

**Connective ordinal = 2**, rolled from the permitted set {2,3,5} (batch18 used
4, batch17 used 1, batch16 used 4, batch15 used 5). Its key is a
**precision/formality** adverb — a fifth connective class after concessive
(b15), causal (b16), expectation (b17) and temporal (b18).

## 4. Trap architecture

**Gap 1 — collocation.** Three seeing-and-prospect nouns plus the abstract
near-synonym. *outlook* is the strongest lure because "a long-term outlook" is
real and sits in the same field; *sight* has a genuine near-collocation behind
it (*long sight*, *long-sighted*); *gaze* is available to the ear because "a
long gaze" is good English as a noun phrase. None takes the frame **take the
long ___**.

**Gap 2 — connective, precision class.** *Strictly* marks a statement as true of
the written rule and not of the practice; the paragraph immediately calls the
clause undisputed, and paragraph 4 delivers the practice (helper → digging →
tenancy in his name → one line in the minutes). *Increasingly* is the sharpest
lure — a reader primed by a twelve-year wait accepts a sentence about pressure
growing — but nothing dates the clause or reports a change. *Curiously* asserts
surprise the passage refuses. *Privately* inverts paragraph 1 twice ("Nothing
here is hidden: the order is numbered") and mislocates the one private thing on
the site, which is the phrase the older hands use, not the rule.

**Gap 3 — collocation.** *boots* is the designed near-miss: English does put
boots in adjacent idioms (*fill someone's boots*, *die with one's boots on*),
both chiming with succession and with death. The proverb is nevertheless fixed
on **shoes** (verified — see §8). *coats* has a thematic pull (the classic
inherited garment, and the passage is about inheritance); *gloves* borrows from
*the gloves are off* / *handle with kid gloves*. No idiom of waiting attaches to
any of the three.

**Gap 4 — polarity.** *gracious* is the polarity_mirror: same side of the scale
as *approving*, so the "but … either" has no contrast to carry. *cautious* and
*anxious* fail on **axis** rather than pole — they measure care and worry, not
approval — and *cautious* has a second defeater, since a committee that gives a
transfer exactly one line is being careful, not careless. The frame was
strengthened during drafting from "neither approving nor ___" to "not approving,
but it is not ___ either" precisely because *cautious* was judged too defensible
under the weaker construction.

**Gap 5 — collocation.** *evoked* is the strongest lure in the unit: one letter
from the key, same Latin root, confused by fluent speakers as well as learners.
*summoned* has a real semantic pull (summoning is a calling-upon, and committees
do summon — people and meetings, never their own rules); *provoked* takes
reactions, not regulations.

## 5. GRAMMAR GUARD (a batch18 cloze died on this)

Every completed sentence was read aloud with each of the four options inserted.

- **Gap 1** "to take the long outlook / gaze / view / sight" — four bare noun
  phrases after *the long*; no number or agreement issue.
- **Gap 2** each adverb precedes a full finite clause ("a plot cannot be
  inherited") and each is attested sentence-initially with a comma. **None
  triggers subject–verb inversion** — this is why the drafted candidates
  *Barely*, *Solely* and *Wholly* were dropped: they either force inversion or
  cannot modify a stative clause.
- **Gap 3** "waiting for dead men’s shoes / coats / gloves / boots" — four plural
  nouns after a plural possessive, all agreeing.
- **Gap 4** "the tone of that line is not approving, but it is not gracious /
  cautious / anxious / censorious either" — four predicative adjectives inside a
  negated copula closed by *either*, parallel in every case with the participial
  adjective *approving*, and **all four are predicable of a tone** ("a cautious
  tone", "an anxious tone" are both real English — they fail on axis, not on
  grammar or collocation).
- **Gap 5** "The rule has not been summoned / provoked / invoked / evoked" —
  four past participles in a present-perfect passive with a singular subject.

In every set all four options parse and exactly one is idiomatic.

## 6. RULE 11 — cross-question option-set audit

Run over the five option sets **alone**, with no passage and no stems in view.

```
1  outlook  gaze     view      sight        (seeing / prospect nouns)
2  Increasingly Strictly Curiously Privately (-ly sentence adverbs)
3  shoes    coats    gloves    boots        (plural worn articles)
4  gracious cautious anxious   censorious   (-ous manner adjectives)
5  summoned provoked invoked   evoked       (past participles; 3 of 4 in -oked)
```

**Content lemmas appearing in ≥2 sets: NONE.** The sets are lexically disjoint
and conceptually disjoint (prospect; the formality of a rule; succession by
death; approval; applying a regulation), so no key can be corroborated from
another question's options.

**Against shipped cloze options** (batch16/17/18 checked by name as the brief
requires, and in fact all thirteen shipped cloze units plus batch18's generated
one were dumped and compared): **none of the twenty option words has been used
before, in any position, in any shipped cloze unit.** The burned connective
inventory in particular (However, Yet, Instead, Moreover, Namely, Thereafter,
Accordingly, Furthermore, Nonetheless, Correspondingly, Consequently,
Conceivably, Conversely, Concurrently, Predictably, Arguably, Ostensibly,
Similarly, Eventually, Presumably, Ironically, Likewise, Besides, Thus,
Naturally, Ultimately, Admittedly, Meanwhile, Nevertheless, Incidentally,
Historically, Otherwise, Indeed) is entirely avoided.

**Against the passage:** no option word occurs anywhere in the title or passage,
so no gap is answerable by surface-matching the text.

## 7. RULE 12 and rules 10/13

- **RULE 12** every prompt is the bare referential label `Gap (n)`. A prompt of
  that form predicates nothing and cannot entail an option.
- **Rule 10 (hedge balance)** gaps 1, 3 and 5 are lexical-idiom gaps where
  hedging is not in play at all — no option is qualified or absolute, so
  "pick the moderate option" returns nothing. Gap 4 is engineered *against* the
  heuristic: the key is the severe word and **both** cautious-sounding options
  are wrong. Gap 2 is the single gap whose key (*Strictly*) is itself a
  qualifying adverb. **Net: the heuristic selects the key in 1 of 5 — under the
  half-unit ceiling.**
- **Rule 13 / M-FORM** no option anywhere in the unit carries an absolutizer
  from the completed family (always/never/every/all/only/none/entirely/
  impossible/proves/guarantees/certainly/nothing/nobody/"no one"/nowhere/
  everyone/everybody/everything + the Swedish set), so the strip-the-absolutes
  shape cannot arise. M-FORM passes clean.

## 8. Self-blind-solve

Solved from the passage alone, arguing actively for each non-keyed option.

| gap | verdict | the argument that kills the runner-up |
|---|---|---|
| 1 | single | *outlook* is the only real contender; "take the long outlook" has no reading, and the fixed phrase is "take the long view" |
| 2 | single | *Increasingly* needs a trend; the text says "That is the clause, and nobody disputes it" and dates nothing |
| 3 | single | *boots* needs "waiting for dead men's boots" to be an attested variant; it is not (checked) |
| 4 | single | *cautious* was the live risk under the earlier "neither … nor" frame; the rewritten "not approving, but not ___ either" makes the same-scale contrast obligatory, and the one-line minute shows the committee being careful rather than careless |
| 5 | single | *evoked* is one letter away but calls up memories and images, not regulations |

Adversarial floor: with the passage removed, the five option sets give a blind
solver nothing — no set shares a lemma with another, and no option appears in
the passage. Blind performance is at chance (1-in-4 per gap).

**Idiom verification for gap 3** (recorded because a key depends on it): exact-phrase
web search `"dead men's shoes" idiom meaning waiting for promotion` returned
Collins English Dictionary, The Free Dictionary (entries for both *dead men's
shoes* and *waiting for dead men's shoes*), wordhistories.net and
phrases.org.uk, all glossing it as advancement that can come only when a
post-holder dies or retires, and **none recording a "boots" variant**.

## 9. LAW 16 / RULE 14 — name log (summary; full log in `originality_note`)

Only one invented proper name in the unit: **Lettice Thrusselby** (byline).

- **Positive control first, same endpoint, same session.** en.wikipedia
  CirrusSearch exact phrase `"Pellew"` → `totalhits=701` (Edward Pellew 1st
  Viscount Exmouth; Viscount Exmouth; Sir Edward Pellew Group of Islands; HMS
  Pellew (1916)). Endpoint live, so a zero is informative.
- `"Thrusselby"` → 0. `"Lettice Thrusselby"` → 0. `"Lettice"` alone → 810
  (Knollys, Digby, Galbraith): the given name is real and historically borne,
  which is what a plausible given name should be; the law-16 test is the full
  pair, which is clean.
- **Null control on the web index:** `"Robert Brindlow"` → no bearer, only
  near-miss names (Brindley, Bristow, Brudenell, Brerewood, of Bridlington) —
  the shape a genuine zero takes here.
- `"Thrusselby"` (exact-quoted web) → no bearer, no place; near names only
  (Thrussell — a real surname; Thrussington; Thruscross; Thrupp; Thrumpton).
- **Place probe with positive control:** OSM Nominatim `q=Flarken&countrycodes=se`
  → 10 places (control passes); `q=Thrusselby&countrycodes=gb` → **0**;
  `q=Thrusselby` worldwide → **0**. The *-by* ending was probed deliberately
  because RULE 14 records batch16's "Skarpbo", a real hamlet OSM knew and
  Wikipedia did not.
- **Rejected before use, recorded so the rejections are auditable:** *Grimshall*
  (0 wiki hits, no web bearer, but rejected anyway — it sits two letters from
  the very common real surname Grimshaw and the addendum bars near-duplicates);
  *Yarnfold*, *Wrangborne* (0 hits; unused).
- **Tool disclosure:** WebSearch was available and used first for the
  English-person checks, per rule 4; Wikipedia and Nominatim were queried
  directly over HTTPS with a descriptive User-Agent and ≥1 s between calls. No
  index errored and no fallback was needed. **The name is FLAGGED FOR V-FINAL
  RE-VERIFICATION, not certified.**
- Rules 8/9 checked: *Lettice* appears in none of the 231 + batch17's 14 +
  batch18's 11 used given names; *Thrusselby* collides with no excluded full
  pair, surname or toponym, and is not a one-letter variant of any of them.

## 9b. Cross-lane sweep (batch19 siblings)

Run against the other batch19 lane files present at the time of writing
(`gen-elf-long`, `gen-elf-short-1`, `gen-elf-short-2`, `gen-las-debatt`,
`gen-las-essa`, `gen-las-long`):

- **Given names** Lettice vs Meredith, Silas, Clement, Ambrose, Delphine,
  Garrick, Bengta, Enar, Margit — no collision.
- **Surnames** Thrusselby vs Ockendale, Ludderby, Nabbsworth — no collision.
- **Toponyms** this unit has none; the only sibling toponym is Draystow.
- **Topics/families** no overlap (grain-dryer fires; chimney-pot height;
  receiving-house window hours; bathing-jetty fee debate; telephone-directory
  job titles; bog-iron bloomery).
- **One surface collision found and removed:** the draft opened its list at
  "Sixty-one names are on it", which echoed `gen-elf-long`'s title
  *Sixty-One Fires*. The figure was changed to **fifty-eight**; the token count
  is identical, so the measured stats below are unaffected.

## 10. Measured stats and mechanical result

Measured with `mech.py` `tokenize`/`sentences`:

| stat | value | band |
|---|---|---|
| passage_words | **398** | cloze 228–401 (brief/blueprint 300–401) |
| paragraph_count | **4** | 1–4 |
| sentences | 25 | — |
| mean_sentence_words | **15.92** | 13.1–34.8 |
| sentence-length sd | **7.24** | blueprint floor 7 |
| sentence lengths | 5 … 32 | — |
| prompt_words | 2 each | cloze 1–15 |
| option_words | 1 each | cloze 0–4 |
| option_length_ratio | 1.00 | cap 2.36 |

```
python3 gates/scripts/run_mech.py batches/batch19/gen-elf-cloze.json \
  --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed \
  --p5-corpus-dir auto batches/batch18/candidates
```
→ **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass**, zero findings.

Note on the command form: `run_mech.py` only expands the literal `auto` when it
is the **sole** `--p5-corpus-dir` argument, so the invocation above indexes
batch18's 7 candidates and treats `auto` as a (non-existent) path. The run was
therefore **repeated with `--p5-corpus-dir auto` alone**, indexing the full
**114-unit** shipped bank — all six gates pass there too, zero findings.

## 11. Open items for adjudication

1. **Law-16 name flag.** `Lettice Thrusselby` is flagged for V-FINAL
   re-verification as the addendum requires. All queries in §9 and in
   `originality_note` are re-runnable and none asserts a check not performed.
2. **Gap-type budget** is 3 collocation / 1 polarity / 1 connective, the same
   split as batch17's cloze. Variety is carried by POS order, the new connective
   class, the rolled ordinal and the passage architecture rather than by the
   budget. Two further polarity gaps were drafted and rejected for admitting a
   second defensible option; both are recorded in `gap_type_budget_note`.
3. **`dead men's shoes`** is a real, dictionary-attested proverb rather than an
   invented phrase. That is deliberate — cloze keys in this family are ordinary
   fixed English (cf. batch17's *foregone conclusion*, *take them at their
   word*) — and it is not a law-1 famous-thesis anchor: it carries no factual
   claim a knowledgeable solver could answer from.

---

## Appendix A — fleet-repair-1 (2026-09-01): rule-11 and rule-12 re-audits

The repaired unit lives at `batches/batch19/candidates/elf-b19-002.json`. This
file, `gen-elf-cloze.json`, is the pre-repair generator artifact and is left as
written, per the batch18 convention.

### What changed

| # | Gate | Change |
|---|---|---|
| 1 | G-REGISTER **major** | Byline credential tail cut. Was: *"– Lettice Thrusselby writes on land and neighbours for a county monthly."* Now: *"– Lettice Thrusselby"*. It was the fourth consecutive columnist-credential frame in the lane. |
| 2 | G-DISTRACTOR flag, gap 3 | Option D **`boots` → `hats`**. *Boots* carries live modern succession idiom of its own (*step into / fill a dead man's boots*, *die with one's boots on*), which made the wrong answer defensible on its own footing rather than merely available to the ear. *Hats* stays in the worn-article family and forms no idiom in the frame. |
| 3 | G-ENG minor | *"The first summer goes on working out which to keep."* → *"The first summer is spent working out which to keep."* |
| 4 | Gap-2 weakness | Discourse anchor strengthened by one clause on either side of the existing sentence: *"That is the clause, and nobody disputes it."* → *"That is the clause as written, and nobody disputes it or finds it odd."* |

On (4): the gate's finding was that *Curiously* and *Increasingly* both parse
idiomatically in the frame and that the key was selected only by discourse a
sentence and a half later. **`as written`** names the letter-of-the-rule reading
that *Strictly* encodes, so the key is now selected **positively** and not
merely by elimination; **`or finds it odd`** closes *Curiously* in as many
words. *Increasingly* is still carried on the pre-existing ground — the passage
dates nothing and reports no change in how the clause is applied — and that is
recorded here as a **carry, not a claim of a new anchor**. *Privately* remains
closed by paragraph 1's *"Nothing here is hidden"*.

Rationale sync: gap 2 (three spans — the *Increasingly* quote, the *Curiously*
sentence, and the key's positive anchor) and gap 3 (the option-D paragraph,
rewritten for *hats* with the withdrawal of *boots* recorded in it).

### RULE 11 — cross-question option-set audit (re-run mechanically, post-repair)

Script over the five option sets alone, function-word stop list, no passage and
no stems in view. **Content lemmas appearing in two or more sets: NONE.** The
sets remain lexically and conceptually disjoint:

| gap | set | field |
|---|---|---|
| 1 | outlook / gaze / view / sight | nouns of seeing and prospect |
| 2 | Increasingly / Strictly / Curiously / Privately | sentence-initial `-ly` adverbs |
| 3 | shoes / coats / gloves / **hats** | plural worn articles |
| 4 | gracious / cautious / anxious / censorious | `-ous` manner adjectives |
| 5 | summoned / provoked / invoked / evoked | past participles (three in `-oked`; *summoned* is not) |

No key can be corroborated from another gap's options. The surface-match check
was re-run programmatically over the **repaired** title and passage: none of the
twenty option words occurs in either, and the replacement `hats` is likewise
absent (`'hats' in tokenize(passage) → False`, as `'boots'` was).

### RULE 12 — stem-entailment audit (post-repair)

Every prompt is the bare referential label `Gap (n)`. A prompt of that form
predicates nothing about the gap and therefore cannot entail, favour or exclude
any option; the whole solving load sits on the frame in the passage. Unchanged
by this round, and re-confirmed against the repaired option sets.

### Hedge map, unchanged by the repair

Gaps 1, 3 and 5 are lexical-idiom gaps on which hedging is not in play; gap 4 is
engineered against the heuristic (the key is the severe word, both cautious
options are wrong); gap 2 is the one gap whose key is itself a qualifying
adverb. Pick-the-qualified therefore selects the key in **1 of 5** — under the
half-unit ceiling. No option anywhere carries an M-FORM absolutizer, and `hats`
adds none.

### Post-repair measurements and gate run

Passage **395** words (ELF cloze band 228–401; blueprint/brief 300–401),
**4** paragraphs (band 1–4), **25** sentences, mean **15.80** (band 13.1–34.8),
population SD **7.25** (blueprint floor 7), sentence lengths 5–32. Prompts 2
tokens (cloze band 1–15); options 1 token (band 0–4); option length ratio
**1.00** against the 2.36 cap. Pre-repair, for the record: 398 words, 25
sentences, mean 15.92, SD 7.24.

`run_mech.py` with `--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed`:
**M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM — all pass, zero
findings**, both with `--p5-corpus-dir auto` (114 shipped units) and with every
`batches/*/candidates-final` directory listed explicitly plus
`batches/batch18/candidates` (**121 units indexed**).

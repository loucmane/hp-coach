# gen-elf-cloze – "Past the Brewery" (batch 16)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE
**Family:** `ELF-CLOZE-001 / landmark-directions-etiquette-society-commentary-cloze`
**Keys:** D / B / C / A / B

## Topic, and why this cut of it

Domain lane: fresh everyday-society commentary. Of the four brief candidates I
took **the etiquette of giving directions by landmark** – specifically what the
landmarks actually encode, why such directions fall apart when passed on, and
what the refusal to say "I don't know" costs the person who asked.

The other three were rejected before drafting, for the record:

- **the communal laundry-room rota** – the physical twin of batch15's
  `village-noticeboard-pruning` (a shared surface in a common room, an unwritten
  rule, a rota nobody voted for) and a second graze on
  `queueing-culture-unwritten-rules` (b9). Double graze; dropped.
- **the wedding guest book** – a paper artefact whose evidentiary job is not the
  one you assume, filled in by hand. That is
  `disappearing-handwritten-signature` (b11) with a marquee over it.
- **hotel breakfast-buffet etiquette** – closest to
  `cinema-concessions-economics` (b10): the social economics of food at a venue
  where the pricing is not what it appears to be. Too near.

Graze check on the chosen topic. `grep -ril` over `batches/*/candidates-final/*.json`
for *landmark*, *wayfind*, *signpost*, *breakfast*, *buffet*, *laundry*,
*launderette*, *guest book*, *wedding*, *asking the way* returns two incidental
hits and no lane: `elf-b5-002` uses "her last sure landmark" once, inside
dead-reckoning navigation at sea, and `elf-b1-002` has a board-game café in a
former launderette. Every named-out cloze exclusion (analogue leisure, cinema
concessions, signatures, T&C, handshake, four-day week, sleeper trains, repair
economy, phone calls, queueing, noticeboards) is clear.

Two adjacent lanes were steered away from on purpose:

- `queueing-culture-unwritten-rules` (b9) owns *the unwritten rule everybody
  obeys without a warden*. This piece has no rule and no compliance – it is
  about a reflex, and the reflex misfires.
- `decline-of-the-personal-phone-call` (b8) owns *the retreat from talking to
  people*. There is no telephone in this passage, no screen, and no claim that
  anything is declining or reviving. That also keeps the unit off the saturated
  cloze thesis shape (see below).

## Architecture – diffed against the shipped cloze bank

**Law 15 / brief, held from batch15:** no invented firm, no survey, no headline
statistic, no researcher and no cautious auditor. Batch15's notes count nine of
the then-ten cloze units as anchored on a named investigating figure (six of
those paired with an invented institution); batch15 itself dropped the genre, so
with it the bank stands at nine of eleven, and this unit keeps it dropped.
The only figures here are an unnamed person answering on the pavement and an
unnamed shopkeeper who has started pointing.

**Law 15 / brief, held from batch15:** the connective gap is off ordinals 2–3.
Batch15 moved it to 5; this unit puts it at **4** – a third position for the
slot – and makes its key **causal** rather than concessive, so it repeats
neither batch15's *Nonetheless* nor any of that unit's four options.

**Law 12 (no architectural clones):**

| dimension | shipped mould | this unit |
|---|---|---|
| thesis shape | "the obsolete thing came back" (b1 board-game cafés, b3 sleeper trains, b4 resale, b13 handshake); b15 = mechanism-is-the-point + uncheckability | conventional-view-**rejected**-then-relocated: the folk charge (sentimentality) is refused flat, and a duller cost is substituted |
| opening move | b15 opens on a described object (a metre of cork in a frame) | second-person imperative: the reader is sent up the road |
| custodian slot | b15 has one man with the key who prunes the board | nobody enforces anything; the shopkeeper's correction is private and uncopied |
| hinge | b15: none of it can be checked | measurement never comes up; the cost is stated plainly and priced in minutes |
| objection | b15 concedes the indictment | this piece **refuses** the usual complaint and names a different one |
| coda | b15 ends on a single card left pinned | ends on an arm going back indoors – no verdict, no aphorism, no "not A but B" |
| paragraphs / toponym | b15: 3 paragraphs, named village (Denhollow) | 4 paragraphs, **no place name at all** |

**Law 13 casting.** One invented name in the whole unit (the byline). No given
name from the 214-name exclusion list, no repeat inside the unit, no surname
from any shipped unit (`grep` for *Orrenshaw* and *Kester* over
`batches/*/candidates-final/` returns nothing). Byline gender is male, inverting
batch15's female columnist.

**Law 9 (no manufactured tidiness).** Concrete residue that does not serve the
thesis: the chemist's unit is now a barber's; the beer was bad; the bus station
is still a bus station; the river warning; the shopkeeper nobody has copied; the
few visitors who go home with something to say. Nothing resolves – the practice
is neither defended nor reformed.

**Law 15 surface quotas.** Title is a three-word prepositional phrase
(**Past the Brewery**), not "The + modifier + noun". Numeric register mixed:
1998, eleven flats, thirty years, twenty minutes, four or five times a week.
Byline present but shaped differently from batch15's ("from a monthly column on
English towns" rather than a job title).

## Gap architecture

House shape follows the gate-passed `elf-b13-002` / `elf-b15-002`: `___(n)___`
inline, five gaps → five `questions[]`, prompts `Gap (n)`, single-word
POS-uniform options with all four shape-matched to the key, byline attached to
the final paragraph.

**Gap-type budget: 3 collocation, 1 polarity, 1 connective** (blueprint §2
requires ≥1 of each). POS across the five is mixed – noun, verb, noun,
sentence-initial connective adverb, noun.

| gap | type / POS | key | option set | trap mechanics |
|---|---|---|---|---|
| 1 | collocation / noun | **nature** | juncture / fixture / texture / **nature** | four common `-ture` nouns; shape gives no purchase. `second nature` locks, and the sentence before it supplies the sense (one breath, speaker already moved off). *fixture* is the thematic lure – a vanished brewery everyone steers by is exactly a local fixture – but the ordinal cannot take it. *texture* is the vague-metaphor misfit; *juncture* is idiomatic only in *at this juncture* and is not even grammatical here |
| 2 | collocation / verb | **travel** | commute / **travel** / journey / migrate | four intransitive motion verbs in the same form, all flattered by a passage about getting from A to B. Only *travel* carries the figurative "transfers well or badly" reading, and the next sentence spells the mechanism out (passed to a second stranger, shape kept, meaning lost). *journey* is the strongest lure – the nearest synonym, and literally on-topic – but has no figurative use; *migrate* and *commute* are pure collocation misfits |
| 3 | **polarity** / noun | **hostility** | docility / futility / **hostility** / civility | fully suffix-rhymed `-ility` set. Contrast is doubled: the sentence before says admitting ignorance "would have cost nothing and saved the twenty minutes", the gapped sentence opens "Here, though", and the clause after the gap names the trade ("being wrong over being thought cold"). *civility* = **polarity_mirror**: the warm-pole reading of a shrug as restraint, and precisely the pole the frame rules out – no town trades accuracy to avoid being thought civil. *futility* = surface_word_match on the wasted twenty minutes; *docility* is a social-manner word with no support |
| 4 | **connective** | **Consequently** | **Consequently** / Conceivably / Conversely / Concurrently | four formal sentence-initial `Con-` adverbs, one class, no register separation. The social cost established above produces the reflex answer below: the relation is plainly causal. *Conversely* demands an inversion that is not there; *Concurrently* asserts simultaneity between a pressure and a general truth; *Conceivably* hedges a clause containing a flat "always" |
| 5 | collocation / noun | **stride** | gait / **stride** / pace / step | four short nouns from the vocabulary of walking – maximally on-theme after four paragraphs of directions. `take it in one's stride` locks, and the clause after the semicolon confirms the sense by naming the minority who do not absorb it. *step* is the sharpest trap (*in step*, *a spring in their step* prime it, and *take it in their step* is not English); *pace* is baited by *at their own pace*; *gait* collocates with nothing |

## Self-blind-solve

Solved all five cold from the gapped passage, arguing every non-key option out
loud before accepting the key. **No gap needed a rewrite for double-keying**;
two option sets were upgraded for lure quality (below).

- **(1) nature.** Argued *fixture* hardest, because the passage has spent four
  sentences establishing exactly the thing English calls a local fixture. It
  dies on grammar, not on sense: the ordinal *second* cannot govern it without
  an article, and with one it means the next match in a season. *texture* and
  *juncture* have no reading at all. Single answer.
- **(2) travel.** Argued *journey* hardest – it is the nearest synonym and the
  passage is literally about journeys. But *journey* as a verb is
  literal-intransitive only and has never taken a quality adverb in the
  "transfers badly" sense, which is the reading the following sentence forces.
  Single answer.
- **(3) hostility.** The gap I re-argued twice, since the set is fully
  rhymed and gives no shape purchase. *civility* survives until you read the
  clause after the gap: the town is trading accuracy against being thought
  cold, so the gap has to name what the town fears, and being thought civil is
  not it. *futility* is baited by the twenty wasted minutes but names an
  outcome, not a construal of a gesture. Single answer.
- **(4) Consequently.** *Conversely* is the option a skimmer will take on the
  strength of the "though" two sentences earlier, but the inversion has already
  happened by then; what follows the gap is the result, not the opposite.
  *Conceivably* is refuted by the "always" inside its own sentence. Single
  answer.
- **(5) stride.** *step* is the trap I expect to draw the most wrong picks,
  because two real English phrases prime it and the possessive frame looks
  right. It is simply not the idiom. Single answer.

**Upgrades made during the solve** (recorded because they changed the file):
gap 1's *stature* was swapped for **fixture**, because *stature* was thematically
inert and *fixture* is the word the passage's own material reaches for – a
stronger collocation_misfit. Gap 3 was drafted as an adjective set
(*hostile / civil / futile / docile*) and converted to `-ility` nouns: adjectives
are more freely predicable of a gesture, and *futile* / *docile* became weakly
defensible readings of a shrug, whereas *futility* / *docility* do not name a
social construal the frame can accept.

**Result: exactly one defensible option per gap.** Keys **D / B / C / A / B** –
all four letters used, no column, no positional tell, not defaulting to A. Every
option is a single word, so no length tell is structurally possible, and no set
pairs a word with its own antonym (the "spot the odd one out" shape that made
`elf-b13-002` q4 arguable at G-DISTRACTOR).

## Hedge map (addendum rule 10)

The "pick the qualified/moderate option" heuristic selects the key in **0 of 5**
questions, well under the half-unit ceiling.

- Gaps 1, 2, 5 are lexical-idiom gaps: no option is hedged or absolute, so the
  heuristic returns nothing at all.
- Gap 3 is the explicit break on the noun axis: the moderate, socially warm
  option (**civility**) is wrong and the strong negative term is the key.
- Gap 4 is the explicit break on the connective axis: the cautious, speculative
  connective (**Conceivably**) is wrong and the flat, unqualified causal
  connective is the key.

## Bands (measured with `mech.py` tokenize/sentences, not estimated)

passage **388 words** (ELF cloze band 228–401; blueprint 300–410) · **4
paragraphs** (band 1–4; batch15 used 3) · 23 sentences, mean **16.87 words**
(band 13.1–34.8) · within-passage sentence-length **sd 9.09** (blueprint floor
7), lengths running **3 to 35** words – "It is not." against a 35-word opening
period · prompts 2 tokens each (cloze band 1–15) · options 1 token each (cloze
band 0–4) · option length ratio **1.00** (cap 2.36).

Note for anyone re-measuring: the sentence splitter keys on `[.!?]` + space +
uppercase, so the sentence beginning `___(4)___` folds into the one before it
(an underscore is not uppercase), and the byline folds into the last sentence of
paragraph 4. Both are expected and are already inside the figures above.

`run_mech.py` against `data/parsed` + all 100 shipped units:
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass**, zero findings on every gate.

```
python3 gates/scripts/run_mech.py batches/batch16/gen-elf-cloze.json \
  --p5-corpus-dir auto --parsed-dir <repo>/data/parsed
```

## Language and typography

BrE held throughout: *high street*, *chemist*, *swimming baths*, *retail park*,
*pavement*, *level crossing*, *shopkeeper*. No AmE-only form appears anywhere
(no *sidewalk*, *drugstore*, *downtown*, *grade crossing*) and no `-ize` spelling
occurs in passage, prompts or options.

Dash rule (addendum §3): the only en dashes (U+2013) in the file are the byline
marker and one in `generator_meta.key_letters`; **no em dash anywhere**,
verified programmatically. Apostrophes are curly (U+2019) – one instance,
*barber's*. No direct quotation is used: the one reported sentence ("if you
reach the river, you have gone too far") is introduced by a colon and left
unquoted, so no quotation marks appear at all.

Repetition swept for the G-ENG class-4 tell that flagged `elf-b12-002`
("quietly" twice in 300 words). Three drafting fixes were made for it: *turned
away* → *moved off* (to stop *turned*/*turning* colliding inside one clause),
*Only the bus station still answers to its own name* → *Only the bus station is
still a bus station* (to drop a fourth *answer*), and *the person hearing it* →
*whoever hears it* (to break a three-part "the person X-ing" tic). What remains
is topic vocabulary carrying its own weight: *brewery* ×3, *answer* ×4,
*turning* ×3 in a piece about directions, and the deliberate *bus station /
bus station* repetition that is the joke of that line.

## Names – see `generator_meta.originality_note` for the full search log

**Tool disclosure (addendum rule 4).** The exact-phrase WebSearch budget for
this session was already exhausted (200/200) before the first name query, so
every check was run with **Exa web/people search only** – no Wikipedia query and
no WebSearch was run. The kept name is therefore **flagged for V-FINAL
re-verification, not certified**.

**Kept:** *Kester Orrenshaw* (byline; the only invented proper name in the
unit). Exa people search confirms *Kester* as a real but uncommon English given
name with many bearers and no bearer of the target full name; the surname query
returned exactly one bearer, *Molly Orrenshaw*, a private individual in a 2013
memorial roll – no bearer in journalism, column-writing or publishing, which is
this character's own field.

**Rejected during the sweep, recorded so the rejections are auditable:**

- **Ollerby** (byline candidate 1) – a Kipling character, *Mrs. Ollerby*, in the
  1926 story *On the Gate*, plus Swedish grave-record bearers and a dairy-science
  abstract co-author. Rejected on the existing-fictional-name collision, the same
  ground on which batch15 rejected *Ockmarsh*.
- **Wendersley** (byline candidate 2) – a named house at Pilgrims Close,
  Westhumble (registered office of a live UK company), a second house of the name
  in Kent, and a genealogical bearer.
- **Norbray** (byline candidate 3) – a live UK company, and decisively
  *William John Norbray Liddall*, real author of *The Place Names of Fife and
  Kinross* (1896): a real person in place-name scholarship, which is adjacent to
  this unit's own subject.
- **Marsdyke** (town candidate) – *Sam Marsdyke* is the narrator of Ross Raisin's
  *God's Own Country* (2008). Prominent fictional bearer; rejected.
- **Brackhall** (town candidate) – a Suffolk Heritage Explorer monument
  ("Brackhall or Brockley Green"), a Hartlepool locality, and parish-register
  bearers.
- **Ketterwell** (town candidate) – rejected on inspection, without a query, as
  one letter from the real North Yorkshire village Kettlewell. This is a
  reasoning rejection and is labelled as such in the log; no search was run.

After three toponym rejections the setting was left **unnamed** rather than risk
a fourth unverified coinage. That is a deliberate law-16 risk reduction and a
law-15 surface variation at the same time: every shipped cloze unit named a
place, and this one names none. The `originality_note` claims only what Exa
returned and states the limit in its own text rather than papering over it.

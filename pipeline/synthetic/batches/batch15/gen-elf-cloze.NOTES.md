# gen-elf-cloze – "Drawing Pins" (batch 15)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE
**Family:** `ELF-CLOZE-001 / village-noticeboard-pruning-society-commentary-cloze` · **Keys:** C / A / D / B / C

## Topic, and why this cut of it

Domain lane: a fresh everyday-society commentary topic. Chosen: **the public
noticeboard in a village reading room** – specifically what it coordinates and
what the monthly pruning that keeps it readable actually costs.

Graze check against the 93 shipped families. No unit in the bank touches
noticeboards, small ads, or community bulletin surfaces (`grep -ril "notice
board\|noticeboard\|bulletin board\|pinboard\|small ads"` over
`batches/*/candidates*/*.json` returns nothing). The named-out cloze
exclusions (analogue leisure, cinema concessions, handwritten signatures,
terms & conditions, the handshake, four-day week, sleeper trains, repair
economy, the personal phone call, queueing culture) are all clear.

Two adjacent lanes were checked and deliberately steered away from:

- `queueing-culture` (b9) owns "the unwritten rules everybody obeys without a
  warden". This unit is **not** about a norm being obeyed; the board's rule is
  enforced by one man and the piece is about what his enforcement costs.
- `archival-silence-local-history` owns "what the record fails to hold tells
  you more than what it holds". The obvious noticeboard essay – the board as
  an index of unmet need – would have grazed it, so it is not written. The
  argument here runs the other way: the board records nothing on purpose, and
  the not-recording is the mechanism, not a silence to be read.

Three of the five brief candidates were rejected before drafting, for the
record: *why people still print photographs* grazes `analogue-leisure-commentary`
(b1) head-on; *doorbells and the unannounced visit* is the physical twin of
`decline-of-the-personal-phone-call` (b8); *splitting a restaurant bill* is
`queueing-culture`'s essay in a restaurant. *The paper receipt* was the runner-up
but sits close to `disappearing-handwritten-signature` (b11) – both are
"the paper artefact whose evidentiary job is not the one you assume".

## Architecture – deliberately off the shipped cloze mould

Law 15 retires the **invented-firm-plus-cautious-auditor** genre, and the
shipped cloze bank leans on it hard: nine of the ten cloze units (all but
`elf-b1-002`) are anchored on a named investigating figure – researcher,
analyst, archivist or consultant – and six of those pair the figure with an
invented firm or institution (Aldermere, Halden Rail, Rundgång, Bellwether,
Halberg Savings, Larkmoor), a headline statistic, and an expert who is "wary
of reading too much into" it.
This unit has **no firm, no survey, no statistic and no hedging expert**. Its
only figure is a caretaker with a jam jar, and nothing in the piece is
measured – that is the argument.

Law 12 (no architectural clones): the saturated cloze thesis shape is *the
obsolete thing came back* (b1 board-game cafés, b3 sleeper trains, b4 resale,
b13 the handshake). This one is **mechanism-is-the-point** and never claims a
revival. The move sequence is object → unwritten rule → who enforces it →
what the cards are actually for → why asking is cheap → none of it is
checkable → the objection is **conceded, not defeated** → a single concrete
card. The skeptic slot is empty: nobody in the piece defends the board, and
the writer does not either.

Law 12 coda rule: no aphoristic two-sentence close, no "not A, but B"
chiasmus at the end. The piece stops on the piano card. (The one "not A but B"
construction is mid-passage and load-bearing – it is the polarity gap's frame.)

Law 15 surface quotas: title is a flat two-word noun phrase (**Drawing Pins**),
not "The + modifier + noun"; numeric register is mixed (a metre, first Monday,
a fortnight, four, 2014, more than a decade); the **connective gap sits at
ordinal 5**, where every shipped cloze put it at ordinal 2 or 3.

Law 13 casting: the meticulous rule-enforcer is a **man** (Wilf Braddick) and
the observing byline is a **woman** (Verity Padgham) – the inverse of the
careful-woman/overconfident-man pattern the whole-bank scan found 18 of 18.
No given name repeats inside the unit; neither name appears in the batch15
registry or among the 173 surnames M-ECHO indexes from `candidates-final/`.

Law 9 (no manufactured tidiness): the choir with four tenors, the guttering
card, and the woman who stopped teaching in 2014 are concrete residue that
does not serve the thesis. The passage concedes in its own voice that the
arrangement is indefensible and never recovers the concession.

## Gap architecture

House shape follows the gate-passed `elf-b13-002`: `___(n)___` inline, five
gaps → five `questions[]`, prompts `Gap (n)`, single-word POS-uniform options,
all four shape-matched to the key per gap, byline attached to the final
paragraph. Gap-type budget: **3 collocation, 1 polarity, 1 connective**
(blueprint §2 requires ≥1 of each). POS across the five is deliberately mixed
– verb, noun, noun, verb, connective – rather than four nouns.

| gap | type / POS | key | option set | trap mechanics |
|---|---|---|---|---|
| 1 | collocation / verb | **spares** | serves / saves / **spares** / spoils | s- verbs, same tense and person. `spare someone’s feelings` is the fixed idiom; negated through "nobody’s" it says the rule is applied unsoftened. *saves* is the strongest lure – a near-synonym of *spare* in adjacent frames (*save someone the trouble*, *save face*) that does not exist in this one. *serves* takes a purpose or an interest, not feelings. *spoils* takes a surprise or a child and never means "wound" |
| 2 | collocation / noun | **shrift** | **shrift** / thrift / drift / shift | suffix-rhymed -ift nouns, all four real and common. `get short shrift` locks, and the clause after it supplies the measure (a fortnight against a whole summer). *shift* is the standard eggcorn for this idiom; *thrift* is thematically baited by "a price on it"; *drift* lives in *catch my drift*, never after *short* |
| 3 | **polarity** / noun | **indifference** | interference / deference / inference / **indifference** | fully suffix-rhymed -ference set, so shape separates nothing. "not neighbourliness but ___" is contrastive: the gap must oppose neighbourliness, and the next two sentences say how ("has not been refused… has only gone unread"). *deference* = **polarity_mirror**: the warm social virtue a skimmer reaches for after "neighbourliness", i.e. the same pole the frame rules out. *interference* names an intrusion where the passage describes neighbours doing nothing; *inference* is a reasoning term with no purchase |
| 4 | collocation / verb | **comes** | carries / **comes** / cuts / counts | one-syllable c- verbs. `come to nothing` locks and pays off the preceding sentence about nothing being written down. *counts* is the sharpest trap in the unit: the real idiom is *count **for** nothing*, and the frame supplies "to". *carries* belongs to *carry weight*; *cuts* to *cut to the chase* |
| 5 | **connective** | **Nonetheless** | Accordingly / Furthermore / **Nonetheless** / Correspondingly | four formal sentence-initial connectives, one class, no register separation. The sentence before convicts the board ("indefensible on ordinary grounds"); the gapped sentence reports that nobody has replaced it and the cards "still go up as they always have". *Accordingly* reverses the arrow – indefensibility is a reason **to** replace, not to leave alone. *Furthermore* wants a second count in the indictment, and undisturbed continuation is not one. *Correspondingly* asserts a proportional relation nothing supports |

## Self-blind-solve

Solved all five cold from the gapped passage alone, arguing each non-key option
aloud before accepting the key.

- **(1) spares.** Argued *saves* hardest, since it is a genuine near-synonym of
  *spare* elsewhere; the idiom for withholding kindness is fixed as *spare
  someone’s feelings*, and no context can rescue the other three because the
  discriminator is purely lexical. Single answer.
- **(2) shrift.** *shift* is the attractive misform and is simply not English;
  *thrift* is baited by the money frame and collocates with nothing after
  *short*. Single answer.
- **(3) indifference.** The hardest gap to build and the one I re-argued twice.
  The set gives no shape purchase at all, so the only route is the inversion
  the frame imposes plus the two sentences after it. *deference* survives
  until you ask what the following sentences describe – non-response, not
  respect. Single answer.
- **(4) comes.** *counts* is the trap I expect to draw the most wrong picks and
  it dies on the preposition. Single answer.
- **(5) Nonetheless.** **Rewritten during self-solve.** The first draft ended
  the preceding sentence on "…and there is no version of it that would survive
  a committee", which made *Accordingly* readable ("since no formal version
  would work, nobody proposes one") – a second defensible option. The
  committee clause was cut and "still" was added after the gap, so the gapped
  sentence now plainly reports persistence against the indictment and only the
  concessive survives. Re-solved after the rewrite: single answer.

**Result: exactly one defensible option per gap after one rewrite (gap 5).**
Keys spread C / A / D / B / C – all four letters used, no column, no positional
tell. All options are single words, so no length tell is structurally possible,
and no option set pairs a word with its own antonym (the "spot the odd one out"
shape that made `elf-b13-002` q4 arguable at G-DISTRACTOR).

## Bands (measured with `mech.py` tokenize/sentences, not estimated)

passage **382 words** (ELF cloze band 228–401; blueprint 300–410) · **3
paragraphs** (band 1–4) · 20 sentences, mean **19.1 words** (band 13.1–34.8;
corpus cloze mean 20.3) · within-passage sentence-length **sd 14.1** (blueprint
floor 7; corpus cloze 9.2) with lengths running 3 to 51 words – three-word
verdict sentences ("Nothing is signed.") set against a 51-word closing period ·
prompts 2 tokens (cloze band 1–15) · options 1 token each (cloze band 0–4) ·
option length ratio 1.00 (cap 2.36).

`run_mech.py` against `data/parsed` + all 93 shipped units:
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass**, zero findings on every gate.

## Language and typography

BrE held throughout: *noticeboard*, *metre*, *fortnight*, *guttering*,
*neighbourliness*, *churchyard*. No AmE-only form and no -ize spelling appears
in the passage, prompts or options.

Dash rule (addendum §3): spaced **en dash** (U+2013) for the one parenthetical
and for the byline; **no em dash anywhere in the file**, including
`generator_meta`. Apostrophes are curly (U+2019), matching the authentic ELF
corpus – a character census over `data/parsed` ELF contexts gives 2 176 curly
apostrophes and 1 151 en dashes against 5 em dashes. No direct quotation is
used, so the quotation-mark question does not arise.

Repetition swept for the G-ENG class-4 tell that flagged `elf-b12-002`
("quietly" twice in 300 words): *nobody* appears three times, twice of them as
a deliberate anaphoric pair ("Nobody writes down… nobody writes down"), and the
third instance is inside the gap-1 frame; *card* recurs as the topic noun; the
jam jar is a single deliberate callback.

## Names – see `generator_meta.originality_note` for the full search log

Kept: **Denhollow** (village), **Wilf Braddick** (keeps the key), **Verity
Padgham** (byline). Each was checked by Wikipedia full-text search and Exa
web/people search on 2026-08-25; none has a bearer of the full name, and
neither surname has a bearer in the character's own field (community
administration for Braddick, journalism for Padgham).

Rejected during the sweep, recorded so the rejections are auditable rather
than invisible: **Draywell** (DRAYWELL PROPERTIES LTD, live UK company
04811415), **Ockmarsh** (an existing fictional toponym in Broodcomb Press
fiction), **Thrapwell** (attested Somerset parish-register surname),
**Wrackford** (Dorset locality plus 19th-c. surname), **Trennick** (real
Cornish place name), **Verity Ashlock** (two real journalists surnamed
Ashlock – a real bearer in the byline's own field).

The `originality_note` claims only what those two indexes returned. No national
trade register was consulted beyond what the cited results surfaced, and that
limit is stated in the note itself rather than papered over.

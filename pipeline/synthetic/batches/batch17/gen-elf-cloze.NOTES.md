# gen-elf-cloze – "Ninety Days" (batch 17)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE
**Family:** `ELF-CLOZE-001 / lost-property-office-counter-trust-society-commentary-cloze`
**Keys:** B / D / A / C / D

## Topic, and why this cut of it

Domain lane: fresh everyday-society commentary. Of the four brief candidates I took
**the lost-property office** – specifically the counter, where property is handed
back on a spoken description alone, and the locked drawer where that stops.

The other three were rejected before drafting, for the record:

- **the paper calendar on the kitchen wall** – the brief flagged this one for a
  distance check, and it fails it twice. It is `disappearing-handwritten-signature`
  (b11) with the bank taken out: a paper artefact that persists against a digital
  successor, kept for a reason other than the one it advertises. It also grazes
  `analogue-leisure-commentary` (b1), which is the bank's original
  paper-comforts-in-a-digital-age lane, and it would put the piece on the
  saturated "the obsolete thing came back" thesis shape. Dropped.
- **the etiquette of the shared garden fence** – `queueing-culture-unwritten-rules`
  (b9) owns the unwritten rule strangers obey without a warden, and a fence
  between neighbours is that rule with a boundary drawn on it. `las-b4-002`
  additionally works allotment-garden fences (in Swedish, but the topic string is
  there). Dropped.
- **the spare room and what it says about hospitality** – no exclusion collision,
  but thin on concrete residue: an unused room generates almost no verifiable
  particulars, and without an institution behind it the piece becomes an essay
  about a feeling. That is the wrong shape for a cloze, which needs dense,
  checkable frames around five gaps.

**Graze check on the chosen topic.** `grep -ril` over
`batches/*/candidates-final/*.json` for *lost property*, *lost-property*,
*lost and found*, *spare room*, *garden fence*, *paper calendar*, *umbrella*
and *hospitality* returns exactly three files, none of them a lane:

| file | match | what it actually is |
|---|---|---|
| `las-b4-002` | *garden fence* | generator_meta topic string, "allotment-garden fences" – a Swedish hedgehog-ecology unit |
| `elf-b14-002` | *umbrella* | gate jargon in audit metadata: the `umbrella_decoy` trap tag |
| `elf-b14-003` | *umbrella* | gate jargon: the "main-idea umbrella tell" |

The object *umbrella* appears in no shipped passage, and no shipped unit mentions
lost property in any form. All twelve named-out cloze exclusions (analogue
leisure, cinema concessions, signatures, T&C, handshake, four-day week, sleeper
trains, repair economy, phone calls, queueing, noticeboards, landmark
directions) are clear.

Three adjacent lanes were steered away from on purpose:

- `disappearing-handwritten-signature` (b11) owns *the verification ritual
  examined historically* – a bank basement, an archivist, 1908 signature cards,
  what the third signature proved, replacement by screens. This unit has no
  history, no archive, no technology and no successor to compare against; it
  never asks what anything *proves* about a person's identity, and it names no
  investigating figure at all.
- `queueing-culture-unwritten-rules` (b9) owns *the unwritten rule obeyed without
  a warden*. This office's central rule is written, posted and arithmetical
  (ninety days, then the charity shop), and nobody is obeying anything.
- `repair-economy-secondhand-resale` (b4) owns *the after-market for used goods*.
  Here the charity shop and the saleroom are one clause of a disposal chain and
  carry no argument whatever.

## Architecture – diffed against the shipped cloze bank

**Law 15 / brief, held:** no invented firm, no institute, no survey, no headline
statistic, no researcher and no cautious auditor. This unit goes further than
b15/b16 and contains **no named or characterised human being at all** – the staff
appear only as "no one", "nobody there" and "anyone behind the counter". That
also keeps it clear of b15's custodian-with-the-key slot: the drawer is locked
and the key-holder is never mentioned.

**Brief / law 15:** the connective gap is at **ordinal 1**, a position no shipped
cloze has used (b15 used 5, b16 used 4; the brief bars 2 and 3). It sits at the
fourth sentence of paragraph 1, so it has three sentences of upstream context.
Its key is an **expectation** adverb – a third connective class after b15's
concessive (*Nonetheless*) and b16's causal (*Consequently*) – and none of its
four options appears in either unit.

**Law 12 (no architectural clones):**

| dimension | shipped mould | this unit |
|---|---|---|
| thesis shape | "the obsolete thing came back" (b1, b3, b4, b13); b15 = mechanism + uncheckability; b16 = folk charge refused, duller cost substituted | **no thesis is staged at all** – no "the usual complaint is", no "it is not", no refutation. An inventory whose evaluative content sits in its asides |
| opening move | b15 opens on a described object; b16 on a second-person imperative | a rule and a disposal chain, stated flat |
| custodian slot | b15: one man with the key | nobody is named, characterised or credited; the key-holder is never mentioned |
| hinge | b15: none of it can be checked; b16: the cost is priced in minutes | the drawer – and the piece explicitly declines to settle what it means |
| objection | b15 concedes the indictment; b16 refuses it | there is no objection, because there is no claim to object to |
| coda | b15: a card left pinned; b16: an arm going back indoors | a fact about a printed box the size of a stamp. No aphorism, no "not A, but B", no verdict, no human gesture |
| paragraphs / toponym | b15: 3 paragraphs, named village; b16: 4 paragraphs, no place name | 3 paragraphs, no place name (see below) |

**Law 13 casting.** One invented name in the whole unit (the byline). No given
name from the 231-name exclusion list and no near-duplicate of one; no surname
or full pair from the 274-pair list. Byline gender female, inverting b16's male
columnist. The byline *construction* is also varied: a bio-line ("writes about
civic life for a regional weekly") rather than b16's "from a monthly column on…".

**Law 9 (no manufactured tidiness).** Residue that does not serve any argument:
the second question is often about a pocket; a ring in a paper envelope; the
number 14; keys kept past the rule in a tin because nobody can throw away a
stranger's front door; the finder's name in a box the size of a stamp. The
drawer question is raised and left open – deliberately unresolved.

**Law 15 surface quotas.** Title is a **bare numeral phrase** (*Ninety Days*) – a
shape no shipped ELF unit uses, and not "The + modifier + noun". Numeric register
mixed across spelled-out, digit and route number: *ninety*, *twice*, *fifty
pounds*, *two*, *the number 14*. Gap-type budget is 3 collocation / 1 polarity /
1 connective (blueprint §2 minimum met), and gap POS spans **four** word classes
against b16's three.

## Gap architecture

House shape follows the gate-passed `elf-b13-002` / `elf-b15-002` / `elf-b16`
cloze: `___(n)___` inline, five gaps → five `questions[]`, prompts `Gap (n)`,
single-word POS-uniform options, byline attached to the final paragraph.

| gap | type / POS | key | option set | trap mechanics |
|---|---|---|---|---|
| 1 | **connective** / sentence adverb | **Predictably** | Ostensibly / **Predictably** / Arguably / Conversely | four formal sentence-initial adverbs, all `-ly`, two `-ably`; one class, no register separation. Upstream: an umbrella is worth less than the fare back, and the person who lost it worked that out by the second stop. Downstream: the rack is cleared twice a year and the room once. Unfetched umbrellas pile up, so the schedule is exactly what the arithmetic leads you to expect. *Conversely* demands an inversion that is not there; *Ostensibly* posits a seeming/reality gap the passage never opens; *Arguably* hedges a plain operational schedule (and is the rule-10 break) |
| 2 | collocation / verb (past participle) | **given** | written / counted / put / **given** | four bare participles that all take particles. `give something up for lost` is the only idiom that fits `___ it up for lost`. *written* is the strongest lure (*written it off as lost* is real; *write up* means compose a report); *put* is lured by *put it down as lost*; *counted* by *counted it as lost* and *count up* |
| 3 | collocation / noun | **word** | **word** / honour / face / trust | four short credibility nouns, every one on-theme. `take someone at their word` locks, and the clause before it stages exactly that act. *face* is the sharpest trap – *take it at face value* is the right idea in the wrong shape, and the idiom cannot be split; *honour* is lured by *on their honour* and *word of honour*; *trust* is pure surface_word_match on the passage's own subject |
| 4 | **polarity** / adjective | **searching** | obliging / reassuring / **searching** / forgiving | four `-ing` adjectives of manner-towards-a-person; shape gives no purchase. The contrast is stated twice: "Everywhere else in the room a description is enough. At the drawer it is not". *searching questions* is the collocation the negative pole demands. *forgiving* = **polarity_mirror**, the lenient pole the frame has just ruled out; *obliging* is predicable of a person, not a question, and sits at the warm pole; *reassuring* soothes a claimant the drawer exists to test |
| 5 | collocation / noun | **conclusion** | resolution / decision / conviction / **conclusion** | fully suffix-rhymed `-ion` set of settled-outcome nouns. *foregone* is a defective adjective that collocates with exactly one noun. *decision* is the most plausible-sounding non-word; *resolution* is right-suffix, right-family and collocates with nothing here; *conviction* pulls extra because its legal sense sits near the courtroom register where *foregone conclusion* is most often heard |

## Self-blind-solve

Solved all five cold from the gapped passage, arguing every non-key option out
loud before accepting the key. **No gap needed a rewrite for double-keying.**

- **(1) Predictably.** Argued *Conversely* hardest, because "worth less than the
  fare back" has a concessive feel and a skimmer may expect a turn. It dies on
  what actually follows: clearing the umbrella rack more often than the room is
  the *outcome* of nobody coming back, not its opposite. *Arguably* dies on the
  sentence type – a clearing schedule is not a contestable proposition.
  *Ostensibly* needs a seeming/reality gap the passage never opens. Single answer.
- **(2) given.** Argued *written* hardest: *written it off as lost* is real,
  frequent and semantically identical. It dies on the particle – the frame
  supplies *up*, and *write up* is to compose a report. *put* dies the same way
  (*put it down as lost*, but *put it up for* takes sale or auction). Single answer.
- **(3) word.** Argued *face* hardest, because *at face value* is exactly the act
  being described and the frame looks close enough. But the idiom is fixed on
  *value* and cannot be split around a possessive: *at their face* has no reading.
  *honour* is the near-miss from the same field; *trust* is the theme word, which
  is the whole reason it is in the set. Single answer.
- **(4) searching.** The gap I re-argued twice, since the set is fully rhymed.
  *forgiving* survives until you read the "it is not" – the drawer is where the
  description stops being enough, so the questions there must be *harder*, not
  gentler. *reassuring* fails the same test; *obliging* is not predicable of a
  question at all. Single answer.
- **(5) conclusion.** Argued *decision* hardest, because "a foregone decision" is
  the kind of string a non-native ear accepts without protest and the semantic
  field is right. *foregone* simply does not take it. Single answer.

**Upgrades made during the solve** (recorded because they changed the file):
gap 5's frame was *before the tag is dry* → **before the ink is dry**, to drop a
fifth *tag* from a 365-word passage (the G-ENG class-4 repetition tell that
flagged `elf-b12-002`); *a bag of keys* → *a set of keys*, so it agrees with the
tin two sentences later; *People are asked to describe the thing* → *Whoever
turns up describes the thing*, to cut a third *asked*; and *Nobody is asked* →
*No one is asked*, to cut a third *Nobody*.

**Result: exactly one defensible option per gap.** Keys **B / D / A / C / D** –
all four letters used, no column, no positional tell, not defaulting to A, and
the string matches no shipped cloze unit's key sequence. Every option is a single
word, so no length tell is structurally possible, and no set pairs a word with
its own antonym (the "spot the odd one out" shape that made `elf-b13-002` q4
arguable at G-DISTRACTOR).

## Hedge map (addendum rule 10)

The "pick the qualified/moderate option" heuristic selects the key in **0 of 5**
questions, well under the half-unit ceiling.

- Gaps 2, 3, 5 are lexical-idiom gaps: no option is hedged or absolute, so the
  heuristic returns nothing at all.
- **Gap 1** is the explicit break on the connective axis: the cautious, hedging
  adverb (**Arguably**) is wrong and the flat expectation adverb is the key.
- **Gap 4** is the explicit break on the adjective axis: all three soft options
  (**forgiving**, **obliging**, **reassuring**) are wrong and the strict term is
  the key.

## Bands (measured with `mech.py` tokenize/sentences, not estimated)

passage **365 words** (ELF cloze band 228–401; blueprint 300–410) · **3
paragraphs** (band 1–4; b16 used 4) · 17 sentences, mean **21.47 words**
(band 13.1–34.8) · within-passage sentence-length **sd 9.49** (blueprint floor
7), lengths running **9 to 48** words · prompts 2 tokens each (cloze band 1–15) ·
options 1 token each (cloze band 0–4) · option length ratio **1.00** (cap 2.36).

Note for anyone re-measuring: the splitter keys on `[.!?]` + space + uppercase,
so the sentence beginning `___(1)___` folds into the one before it (an underscore
is not uppercase) – that is the 48-word figure – and the byline folds into the
last sentence of paragraph 3. Both are expected and already inside the numbers
above.

`run_mech.py` against `data/parsed` + all 107 shipped units:
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass**, zero findings on every gate.

```
python3 gates/scripts/run_mech.py batches/batch17/gen-elf-cloze.json \
  --p5-corpus-dir auto --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed
```

## Language and typography

BrE held throughout: *lost-property office*, *charity shop*, *saleroom*, *bin
bag*, *crime number*, *fifty pounds*, and *honour* as an option. Checked
programmatically: none of *lost and found*, *sidewalk*, *downtown*, *trash*,
*thrift*, *apartment*, *elevator*, *color*, *organize*, *realize* or *gotten*
occurs in title, passage, prompts, options or rationales, and no `-ize`/`-yze`
spelling occurs there. (Several of those forms do appear inside
`generator_meta`, where they are listed as the forms being excluded and as grep
terms – metadata, not unit content.)

Dash rule (addendum §3): **no em dash (U+2014) anywhere in the file**, verified
programmatically. The seven en dashes (U+2013) are three in the passage (the
umbrella parenthetical, twice, and the byline marker) and four inside
`generator_meta` prose. Apostrophes are curly (U+2019) throughout –
*umbrella’s*, *stranger’s*, *finder’s* – with no straight apostrophe in the
passage. No direct quotation is used, so no quotation marks appear at all.

Repetition swept for the G-ENG class-4 tell. After the four drafting fixes listed
above, what remains is topic vocabulary carrying its own weight: *umbrella* ×4,
*tag* ×4, *counter* ×3, *room* ×4, *keys* ×3 in a piece about a room full of
objects behind a counter.

## Names – see `generator_meta.originality_note` for the full search log

**Tool disclosure (addendum rule 4).** Exact-phrase **WebSearch was attempted
first and refused**: the session budget was already exhausted (200/200) before
the first name query. The batch17 two-index fallback was then attempted and was
only partly available – **Mojeek returned HTTP 403** to the fetch tool (two
attempts) and the **Firecrawl index returned HTTP 401** (unauthenticated). Every
check was therefore run on **one index only, Exa web search**; no Brave, Mojeek,
Wikipedia or national-register query was run. The kept name is **flagged for
V-FINAL re-verification, not certified.**

**Kept:** *Georgina Chalkwright* (byline; the only invented proper name in the
unit).

- *Chalkwright* is a real but rare English surname attested **only** in
  genealogical and parish material: Charles Chalkwright (East Dean by
  Chichester, 1818 marriage); John and Isabella Chalkwright (Dulwich/Camberwell,
  c.1795–1899, WikiTree); Ann Chalkwright (married 1791, Christ Church Newgate
  Street); Mary Chalkwright, widow, d. 1909, the Almshouses, Epsom; "J
  Chalkwright" in a Surrey History Centre accession of Carew family papers,
  1859–67; the surname in the 1861 West Ham census (FreeCEN) and in the
  Findmypast surname index. **No bearer in journalism, column-writing,
  publishing or any contemporary public role** – the character's own field is
  clear.
- The **full pair** returned no bearer. The two hits for the exact phrase were
  coincidental co-occurrences: a WikiTree "Explore More" list containing both
  *Hannah Georgina (Quealch) Featherbe* and *Isabella (Chalkwright) Percival*,
  and a genealogy blog page mentioning Georgina Hogarth in an unrelated Dickens
  paragraph.

**Rejected during the sweep, recorded so the rejections are auditable:**

- **Aldercott** (byline-surname candidate) – a real GB locality (Aldercott,
  Torridge, Devon, findthatpostcode IPN0000879), Aldercott Farm at Pancrasweek,
  an entry in Keith Briggs's English place-name `-cott` survey, a 1912 Stucley
  estate sale catalogue, **and** live bearers of the surname including Merrill
  Aldercott (2021 RCMP news release) and Dr Andrew Aldercotte (Rutgers
  pollination ecologist). Rejected on both counts.
- **Merricombe** (byline-surname candidate) – Merricombe, Laceys Lane, Niton,
  Isle of Wight; Merricombe at Brithem Bottom, Cullompton; an 1841 Slapton
  census place; and, decisively, **a real person**, Toby Merricombe, named in the
  1928 Queensland Auditor-General's Yarrabah Mission inmate accounts. Rejected.
- **Colverbridge** (toponym candidate) – the Nottingham English Place-Names
  Portal source record `go519`, "Colverbridge 1557 Val 92, 1630 Inq": a genuine
  attested historical English place name. Rejected.

After that rejection **no replacement toponym was coined**. Rather than risk a
half-verified place name on a one-index budget, the setting was left unnamed –
the town is never named, the office is located only by common nouns ("behind the
bus station"), and the single proper-noun-adjacent detail is a bus route number.
This repeats b16's law-16 risk reduction; the surface is varied instead on title
shape, paragraph count, connective-gap ordinal and gap-POS spread.

`originality_note` claims only what Exa returned, and names the WebSearch,
Mojeek and Firecrawl failures in its own text rather than papering over them.

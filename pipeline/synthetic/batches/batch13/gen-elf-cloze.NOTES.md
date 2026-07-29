# gen-elf-cloze — "The Offered Hand" (batch 13)

**Block format:** `cloze_5gap` · **Genre:** society_commentary · **Spelling variety:** BrE (`lift lobbies`, no AmE-only forms)
**Family:** ELF-CLOZE-001 · **Keys:** C / D / A / B / D

## Why this topic and this cut of it

Assigned topic: why we still shake hands. The obvious essay — hygiene versus
tradition — is a stateable outside thesis, so the passage refuses it (law 1).
It instead reports one invented consultancy's spring survey (Larkmoor, running
since 2016) and, more importantly, what its interviews record: people describe
the half-second as *a small test*, not as a warm ritual. The argument the
passage ends on is passage-specific — a handshake, unlike a nod, forces an
answer, so it closes the opening of an encounter rather than leaving it open.
Nothing in it can be answered from general knowledge about greetings or
contagion.

Distance from the neighbouring batch-11/12 topic *phone calls*: that unit was
about a contact channel falling out of use; this one is about a physical
gesture that came *back* against the guidance that replaced it, and the payload
is what the gesture settles, not what people avoid. Larkmoor is a survey firm
rather than a market-research house, its instrument is interviews rather than a
halved-share statistic, and the arc runs indefensible-but-persistent → what
people say it does → why nothing else does it.

Law 9 (no manufactured tidiness): the second paragraph concedes that every
alternative is cleaner, Vandermeer explicitly refuses to say why the cleaner
options lost, and the clipboard sentence is residue that serves nothing. The
piece ends on a hedge ("may be the scarcest thing"), not a verdict.

## Gap architecture

House shape follows the gate-passed `elf-b8-002`: `___(n)___` inline, five
gaps → five `questions[]`, prompts `Gap (n)`, POS-uniform single-word options,
≥2 shape-matched to the key per gap, byline attached to the final paragraph.
Gap-type budget satisfied: 3 collocation, 1 connective, 1 polarity.

| gap | type | key | option set | trap mechanics |
|---|---|---|---|---|
| 1 | collocation | **consigned** | assigned / designed / consigned / resigned | suffix-rhymed `-signed` verbs. `consign X to the past` is the lock. *assigned* takes the same preposition but not this object; *designed* is thematically near "guide" and shape-identical; *resigned* needs a reflexive object ("resigned herself to"), so the frame breaks |
| 2 | connective | **Yet** | Likewise / Besides / Thus / Yet | the sentence before ends on the substitutes succeeding ("the drill held"); the gapped sentence reverses it. *Thus* asserts a consequence the clauses cannot support; *Likewise* claims a parallel case that does not exist; *Besides* adds in the same direction where the paragraph turns |
| 3 | collocation | **explanation** | explanation / exclamation / exploration / expectation | shape-matched `ex-…-ation` nouns. `owe someone an explanation` is the lock; *owe an exclamation / exploration* are not English, and *expectation* is raised or met, never owed — and is held by the other party, so it fails on sense as well |
| 4 | **polarity** | **untroubled** | unrehearsed / untroubled / uneventful / troubled | "is seldom ___" inverts polarity. *troubled* = polarity_mirror: the skimmer matches the uneasy evidence to the negative word, but "seldom troubled" asserts the opposite of what respondents report. *unrehearsed* = surface_word_match on "rehearsed" three words later, plus quantifier_upgrade — the text says only "a few" rehearse. *uneventful* grades an episode for incident, the wrong dimension |
| 5 | collocation | **close** | clause / course / cause / close | shape-matched `cl-/c-` nouns. `bring something to a close` is the lock and pays off the paragraph's "either way an answer now exists". *clause* borrows the negotiating flavour; *course* exists in "run its course" / "in due course" but not after "bring … to a"; *cause* collocates with "take up" and "bring … to court", not with a half-second |

The polarity gap is deliberately the one where the surrounding lexis pulls
hardest the wrong way: both *troubled* and *unrehearsed* have an echo inside the
same sentence, so a word-matching solver has two attractive wrong answers and
only the inversion test separates them.

## Self-blind-solve

Solved all five gaps from the passage alone, arguing each non-key option aloud.

- **(1)** Only "consign to the past" exists as an idiom; the other three break
  on the preposition or on the object. Single answer.
- **(2)** The contrast is structural, not stylistic — the preceding clause
  reports success and the gapped clause reports its reversal. No causal,
  additive or parallel reading survives. I checked *Besides* hardest, since a
  columnist can pile on; it fails because nothing is being piled on.
- **(3)** "owe" is the constraining verb. *expectation* was the strongest rival
  and dies on both collocation and direction of ownership.
- **(4)** The hardest gap and the one I re-argued twice. *troubled* reads right
  until the "seldom" is applied; *unrehearsed* survives the inversion but not
  the quantifier ("a few", not most). Only *untroubled* fits both the inversion
  and the evidence. Single answer confirmed.
- **(5)** "bring … to a close" is the only completion. *course* is the rival
  and has no such frame.

**Result: exactly one defensible option per gap; no rewrite needed.** Keys
spread C/D/A/B/D — no column, no positional tell. All options are one word, so
no length tell is possible.

## Bands (measured with `mech.py` tokenize/sentences)

passage **333 words** (cloze band 228–401; blueprint 300–410) · **3 paragraphs**
(1–4) · 14 sentences, mean **23.8 words** (13.1–34.8) · prompts 2 words (cloze
1–15) · options 1 word each (cloze 0–4) · option ratio 1.00 (cap 2.36).
Sentence lengths run from 6 to 47 words — high variance, verdict sentences
("Nothing about the gesture is easy to defend.") set against long subordinated
ones.

**`run_mech.py` self-check: M-SCHEMA / M-BANDS / M-TELL / M-FORM /
M-PLAGIARISM all pass.**

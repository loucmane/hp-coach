# gen-elf-short-1 — "The Plug Door" (ELF short_text_1q)

## Topic / genre rationale

**Topic:** why bank vault doors were round for roughly sixty years — and why the
usual explanation is wrong. The passage's claim is that the roundness bought a
*tapered plug seat*, not the strength of the circle: pressure from outside drove
the door deeper into its matching taper instead of opening a gap, and a square
door's corners were where a bar or a charge could get purchase. Coda: the shape
died when the threat changed, since a drill does not care about corners.

**Genre:** `history_essay`, BrE (the blueprint pairs history/commentary with
BrE). Register is the dry technical-history voice — a flat opening verdict, a
four-word sentence, one long subordinated mechanism sentence, a concessive
"Nor was it…", and a closing historical turn.

**Novelty check against batches 1–9.** The used list has elevators, submarine
cables, road markings, hotel key cards, lighthouses and self-healing concrete —
several engineering-history topics, none about safes, vaults, locks or door
mechanics. The nearest neighbour is the hotel key-card unit (batch 8: access
control), but that is a systems/administration story about who can open a door,
whereas this is a materials-and-forces story about why a door cannot be opened.
No vocabulary overlap.

**Fictional entities:** Ivar Brandt (byline). No real bank, manufacturer,
inventor or publication is named — deliberately, since this topic has famous
real firms attached to it, and naming one would trip the entity-distance check
in `elf/anti-plagiarism.md` and hand a knowledgeable solver an outside anchor
(law 1).

**Spelling variety: BrE**, held throughout the passage and all four options
(*guidebooks*, *crowbar*, *a charge of powder*, *a question of mass*). No AmE
spellings and no AmE-only lexis anywhere.

## Structure

141 tokens (blueprint short band 105–160; `bands.json` short_text 101–368), one
paragraph plus the byline line, 5 sentences, mean 28.2 words with a 5-word
verdict sentence ("The reason was the seat.") against a ~60-word mechanism
sentence — the sentence-length variance the blueprint asks for. Denser concrete
residue than the length suggests: two dates, two tool types, two door types, one
explicit rejection of a popular belief, one explicit rejection of a mass
explanation.

## Planted trap architecture (q1, ELF-TYPE-001)

Stem: *"According to the text, what made the round vault door hard to force?"* —
corpus-attested "According to the text, …" detail form (law 5). The stem names
the setup (a round door was hard to force) and withholds the mechanism, which is
what the item measures; it entails nothing about which of the four mechanisms is
the passage's.

| opt | role | trap |
|---|---|---|
| A | distractor | **contradiction + outside intuition** — heavy vault doors are the popular image, but the text states the opposite: "the plug doors of that period were often lighter than the slab doors they replaced" |
| **B** | **key** | paraphrase of the taper-and-seat sentence: force from outside "drove it further into its seat rather than opening one" |
| C | distractor | **outside_knowledge + surface_word_match** — the passage does put "a charge of powder" in the reader's mind, but it uses explosives to explain why a *corner* is a weakness; blast deflection by a curved face is never claimed |
| D | distractor | **the rejected guidebook belief** — "not, as the guidebooks like to say, because a circle is the strongest shape" |

**Why D is the load-bearing distractor.** It is what most readers already
believe, it is the answer a passage-blind solver gives, and it is refuted by the
passage's *first* clause rather than by anything technical. The item therefore
measures whether the candidate read the correction, which is exactly what a
short 1q text should test. Every distractor names a genuinely plausible
engineering mechanism a passage-blind reader cannot dismiss on absurdity —
mass, blast deflection, even load distribution are all real properties of real
vault doors. Each is defeated only by the text.

## Hedge balance and length

No option carries a hard absolutizer, so M-FORM's "key is the sole measured
option" shape cannot arise, and "strip the absolutes" answers nothing. The key
is the *confident, specific* mechanism claim rather than the hedged one —
deliberately, per law 10's warning that "correct" and "qualified" must not line
up across the corpus. Option token counts 27 / 22 / 22 / 26, ratio 1.23 (cap
2.36); the key is **not** the longest option (A is). All four options open with
the same "Its <noun>:" frame so they are grammatically parallel and no option
stands out by shape.

## Self-blind-solve result

Read the passage cold, then argued for each option:

- **A** — blocked outright: the passage says the plug doors were *lighter*.
- **B** — supported by the mechanism sentence; the taper is stated twice ("ground
  to a shallow taper", "a matching taper in the frame") and its consequence is
  spelled out.
- **C** — tempting because powder is mentioned, but the passage's account of
  powder is that it needs a *gap to work in*; nothing about deflection or force
  spreading appears. Not defensible from the text.
- **D** — explicitly denied in the first sentence.

**Outcome: single defensible answer (B).** No rewrite needed after this pass.

## Mechanical self-check

`run_mech.py`: **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-PLAGIARISM pass** — no findings on any gate. (M-TELL does not fire on a 1q
unit by construction; the length balance above was checked by hand anyway.)

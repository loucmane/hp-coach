# gen-elf-short-1 — "Reading the Grass" (stadium mowing stripes)

**Format:** `short_text_1q` · **Genre:** society_commentary (sports notebook column) ·
**Spelling variety:** BrE (held) · **Family:** ELF-TYPE-001 (direct detail retrieval)

## Genre / topic rationale

A sports-notebook column is the plausible home for groundskeeping optics and pulls BrE house
style (*colour*, *towards*, *half-time*, *pitch*). The passage is written as an excerpt with
a byline close (Marit Lundh) and an invented head groundsman (Elis Torvund) supplying the
concrete voice the blueprint asks for at this length.

**Anti-blind-solve design.** The bare fact that stripes are an optical effect is common
knowledge, so the item does *not* test it. The stem instead tests a **consequence** the
passage derives and a general-knowledge solver cannot be sure of: because the bands are an
artefact of the viewing angle, moving to the opposite stand inverts them. The mechanism
sentence (roller / reflection) and the observation sentence (bands swap at half-time) sit in
different places in the text, so the key requires joining them.

Concrete residue beyond the tested point, per law 9: the high camera's "third version" and
the pitch-level spectator who sees almost no pattern — true, vivid, and *not* the answer.

## Trap architecture (one identifiable flaw each, law 11 discipline applied)

| opt | trap | flaw a reader can point at |
|---|---|---|
| **A (KEY)** | — | paraphrase of "grass pressed away from you … reads as pale / pressed towards you … reads as dark" joined to "every pale band has gone dark and every dark band pale" |
| B | wrong mechanism + quantifier_upgrade | the roller is real in the text, but it lays *alternating* rows; B tips the whole sward one way and asserts one half "always" looks darker — the text describes bands swapping, not a permanent near/far gradient |
| C | outside_knowledge | floodlight and sun angle is a genuinely plausible optical cause, but the passage attributes nothing to lighting and insists "not a blade has moved" — the grass is unchanged |
| D | contradiction of the opening line | "nothing is cut to two heights"; soil is never mentioned |

Every distractor names a *mechanism a passage-blind reader would consider live* (mower
direction, stadium lighting, cutting height + soil show-through) — these are exactly the
three folk explanations for pitch stripes. None is an absurd overclaim, none is circular,
and none is off-topic.

**Hedge balance (M-FORM / law 10):** the key is a confident, specific causal claim; the
absolutizer ("always") sits on a *distractor*, not on the key. "Pick the measured option"
does not score here.

## Self-blind-solve

Read cold, arguing for each option: B falls to the band-versus-half mismatch and to the
text's own "not a blade has moved"; C is nowhere in the text and is blocked by the same
clause; D is denied verbatim by sentence 1. Only A survives. Single defensible answer.

## Mechanical self-check (run_mech.py)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.
Measured: passage 170 tokens (short_text band 101–368), 1 paragraph, mean sentence
24.3 words (12.0–47.2), prompt 22 tokens (reading 3–30), options 25/27/23/25 tokens
(0–31), option-length ratio 1.17 (cap 2.36). The key is **not** the longest option.
Sentence length varies from 7 words ("The pattern is not in the grass.") to 40+.

Spelling variety: BrE throughout — *colour*, *towards*, *half-time*; no AmE-only forms.
No option reproduces a passage run of four or more words.

# gen-elf-short-2 — "The Softest Ground" (playground surface engineering)

**Format:** `short_text_1q` · **Genre:** science_journalism · **Spelling variety:** AmE (held)
**Family:** ELF-TYPE-001 (direct detail retrieval, two-condition key)

## Genre / topic rationale

Engineering-materials journalism, AmE house style per the blueprint's science→AmE lean, with
the excerpt frame closed by a byline (Halvor Reim) and a named invented test engineer
(Sanna Vikhaug) doing the concrete work — an instrumented headform dropped on sample beds,
a deceleration curve, a toddler frame versus a three-meter tower.

The passage is built around a **counterintuitive inversion** (law 2: passage and question are
one design): the reader's default model is "soft = safe, rubber > wood chips", and the text
dismantles both halves of it in its first and fourth sentences. Every distractor is then one
of those defaults, so each has a locatable flaw rather than being merely unattested.

Concrete residue that is not the answer, per law 9: the May-to-September two-inch loss, and
the swings as the place where chips are kicked out of exactly where they are wanted. The
maintenance point is *part* of the key rather than decoration, which is why the key names two
conditions (rating against fall height **and** kept depth) instead of one.

## Trap architecture

| opt | trap | flaw a reader can point at |
|---|---|---|
| **C (KEY)** | — | paraphrase of "bring a falling head to rest slowly enough … decided by the tallest platform standing above it" plus the closing depth condition ("two inches short of it by September unless somebody rakes it back") |
| A | contradiction (material fallacy) | the text calls loose fills "neither the cheap compromise nor the villain they are usually taken for" and says rubber and chips "can both be built to meet the same fall height" |
| B | contradiction of the opening line | "A playground surface is not engineered to feel soft" — feel underfoot is precisely the intuition the passage overturns; the standard is deceleration, not give |
| D | outside_knowledge | drainage/waterlogging is a plausible real-world failure mode, but the text pins failure on fall height and lost depth and never mentions water |

A, B and D are the three explanations a passage-blind reader would rate live (material grade,
softness underfoot, drainage) — no absurd overclaims, no circularity, no off-topic option.

**Hedge balance (M-FORM / law 10):** no option carries a hard absolutizer; the key is the
*specific, two-condition* claim while distractor A is the sweeping one ("outperforms …
wherever a site can afford it"). Correct and qualified do not line up.

## Self-blind-solve

Read cold, arguing for each option: A is killed by "both be built to meet the same fall
height"; B is killed by sentence 1; D has no textual footing at all — the passage's only
degradation mechanism is chips migrating, not water. Only C survives, and C needs both halves
of the text (the rating condition and the maintenance condition) to be fully right.
Single defensible answer.

## Mechanical self-check (run_mech.py)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.
Measured: passage 168 tokens (short_text band 101–368), 1 paragraph, mean sentence
28.0 words (12.0–47.2), prompt 13 tokens (reading 3–30), options 22/21/22/20 tokens
(0–31), option-length ratio 1.10 (cap 2.36). The key is not the single longest option
(tied at 22). Sentence length varies from 7 words ("A playground surface is not engineered
to feel soft.") to 45+.

Spelling variety: AmE throughout — *fiber*, *three-meter*, *lab*, inches; no BrE-only forms.
No option reproduces a passage run of four or more words.

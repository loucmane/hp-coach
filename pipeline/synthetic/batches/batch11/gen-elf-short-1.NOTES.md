# gen-elf-short-1 — "Rain on Cue" (batch 11)

**Block format:** `short_text_1q` · **Genre:** science_journalism (stagecraft engineering) · **Spelling variety:** BrE (`theatre`, `litres`)
**Family:** ELF-TYPE-001 (direct detail retrieval) · **Key:** C

## Why this topic and this cut of it

Stage rain is normally written up as a plumbing story — pumps, tanks, drainage.
The passage takes the counter-line that the water is the easy part and the
*visibility* is the engineering problem, which gives the item a mechanism a
careful reader must actually extract rather than recognise. The paragraph is
built in the short-text idiom: a flat opening verdict, one dense mechanism
sentence, and two pieces of concrete residue (warmed recirculated water; a
foam-lined tray against drumming) that do not point at the answer. The foam is
explicitly flagged in the text as "a separate problem", which is what licenses
its use as a distractor: a reader who grabs the nearest technical noun is
punished by the passage's own signposting.

Anti-plagiarism: Bo Ellander is invented, no real venue, production or supplier
is named, and the optics are stated in the passage's own words rather than
lifted from a source. M-PLAGIARISM passes clean.

## Trap architecture

Stem: *According to the text, why must stage rain be lit from the side or from
behind?* — corpus-attested "According to the text…" form; it names the setup
(the lighting angle) without entailing the reason.

| opt | role | mechanism |
|---|---|---|
| A | plausible-but-wrong physics | accepts that reflection matters, then reverses the passage: claims the front beam is *absorbed* by the drops and the shower reads as a shadow, whereas the text says the beam "passes straight through the shower" |
| B | outside_knowledge | shadow management is a real lighting concern and the most available outside belief, but the passage attributes nothing to shadows |
| **C** | **key** | paraphrases both halves of the mechanism — a drop is seen only by returned light, and a front beam continues past the shower to the set |
| D | surface_word_match | recycles the foam lining, which the text introduces as a *separate* problem about noise, and invents a light-absorption claim never made |

Key derivation: `paraphrase_one_sentence` — the returned-light sentence plus its
consequence clause. The key shares no distinctive 4-word run with the passage
("scenery" → "the set behind"; "throws back" → "returns").

## Self-blind-solve

Read the passage cold and argued for each option. A is the strongest rival
because it uses the right physical vocabulary, but it makes a claim the passage
directly contradicts — the front beam does not stop at the drops, it lands on
the scenery. B is defeated by absence: no shadow is mentioned anywhere. D is
defeated by the text's own "though that is a separate problem". Only C is
supported. **Single defensible answer; no rewrite needed.**

Test-wise checks: no option is hedged, so "pick the qualified one" fails; the
key (23 words) is *not* the longest (B is, at 25), so the length heuristic
fails; all four options open with "Because" and are grammatically parallel.

## Bands (measured)

passage 145 words (short_text band 101–368) · 1 paragraph (0–8) ·
mean sentence 24.2 words (12.0–47.2) · prompt 16 words (reading 3–30) ·
options 22–25 words (0–31) · option ratio 1.14 (cap 2.36).
`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.

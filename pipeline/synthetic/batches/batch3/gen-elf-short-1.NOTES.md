# gen-elf-short-1 — authoring notes

## Unit
- **Format:** `short_text_1q`
- **Family:** `ELF-TYPE-001 / glacier-fiber-sensing-geophysics-detail` (direct detail retrieval — the short-text backbone family)
- **Genre:** science_journalism
- **Topic:** distributed acoustic sensing — a telecoms fibre frozen into a glacier used to locate ice fractures. Fresh domain (geophysics/glaciology); does not neighbour any banned topic. Deliberately kept distinct from the batch's other two units (transport commentary; social history).
- **Spelling variety:** **AmE**, held throughout (`fiber`, `kilometers`, `meter`, `billionths of a meter`, `meltwater`). No BrE spellings.
- **Fictional entities:** Straumfonna (glacier), Dr. Kel Ostrander, Varden Polar Institute, Marlo Quist (byline). All invented.
- **Frame:** title line separate; byline ("— Marlo Quist, science desk") in the passage tail. No glossary — the one semi-technical idea ("scatters off flaws in the glass") is explained in-line, so no term needs a gloss.

## Planted trap architecture (TYPE-001: every distractor is one of the four attested transformations of real passage sentences)
Stem: "According to the text, what does the fiber-optic cable allow Ostrander's team to do?" (corpus-attested TYPE-001 stem form).
- **Key B** — `paraphrase_one_sentence`: "locate where the ice is fracturing … by sensing tiny stretches" recasts "fix the position of each tiny fracture" + "stretches the cable by a few billionths of a meter". No ≥4-word verbatim run from the passage.
- **A** — `scope_error / contradiction`: measuring meltwater volume is explicitly ruled out ("not how much water is pooling beneath it").
- **C** — `quantifier_upgrade / contradiction`: "do away with the boreholes" overstates; the text says the boreholes "still have to be drilled and sampled by hand".
- **D** — `surface_word_match`: recycles "laser pulse" into a false mechanism (melting a channel); the passage says the pulse "scatters faintly off flaws in the glass".

## Self-blind-solve
From the passage alone, only B is defensible: the mechanism the text describes (light change → fracture position) maps onto B. A and C are each contradicted by an explicit sentence; D contradicts the stated behaviour of the laser. **Single-keyed.** Key B is not the longest option (A/C/D are comparable; 13–17 words, ratio 1.3 < 2.36) and is a plain, unhedged claim — no length or hedge tell.

## Bands (self-checked via mech.py)
words 160 (short_text 101–368 ✓); mean_sentence_words 26.7 (12.0–47.2 ✓); option_words 13–17 (reading 0–31 ✓). All four mechanical gates pass.

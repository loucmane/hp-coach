# gen-elf-long — authoring notes (batch 9)

## Topic & genre
- **Topic (batch-9 exclusive pool):** beaver reintroduction and river re-engineering, treated as catchment field science. All entities invented: hydrologist **Anneke Sorrel**, campaigner **Douglas Traer**, byline **Peter Mallow**, the **Ferrow** catchment and its **Millstake** gauge. No real researcher, publication or river. No overlap with the batch 1–8 topic list (nearest neighbours — hedgehogs/allotments, snow/stormwater, tidal energy, fog nets — are different subjects and different mechanisms; nothing here reuses flood, wetland or rewilding material from earlier batches).
- **Genre:** science_journalism, `long_passage_5q`. **BrE held throughout** (metres, defence, towards, hectare-metres, "totted up", "a great deal of public money"); no AmE forms anywhere.
- **Arc:** phenomenon → evidence → complication → verdict.
- **Length:** 798 mech tokens; 5 content paragraphs + byline (attached to para 5) + 2-line glossary = 6 blank-line blocks. Mean sentence 26.6 words, SD 16.5 (sentence lengths run 5 → 60; short verdict sentences — "It is made of timing.", "There is a ceiling on it in any case." — set against 40–60-word subordinated sentences).
- **Glossary** defines only words that occur: *catchment*, *freeboard*.

## Planted trap architecture
The passage is engineered so the received rule (**more pond storage → lower flood peak**) is genuinely TRUE on the figure the campaign quotes — storage, ordinary winter storms, and it holds in *all eleven* sub-catchments — and then stops predicting anything in the rare large storms that flood defences are actually sized for. What predicts there is **where** the dams sit (spread across tributaries of unequal travel time vs. chained on one), and even that is bounded by a **ceiling** (once every pond fills, freeboard is gone and the catchment routes water as before). Every distractor is a named operation on that scoped, hedged material.

- **Q1 (ELF-TYPE-004, main idea, edge position 1) — key C.**
  A = scope_error / detail-as-main, distorted: the tape-measure volunteers are one clause in para 1, and the text never says the *measuring* is crude — its complaint is about what the quantity predicts.
  B = outside_knowledge: habitat/wetland value, the most familiar real-world case for beavers, entirely absent from a passage that argues inside flood hydrology.
  D = quantifier_upgrade of a sub-finding: "two of the fourteen … a little higher" generalised into a rule about what a chain does to a valley.
- **Q2 (ELF-TYPE-001, detail, para 2) — key A.**
  B = hedged-but-flawed (scope error): "most … the steep peaty ones showed no measurable change" contradicts "all eleven … the steep peaty ones and the gentle grazed ones alike".
  C = wrong_location: true of the fourteen largest events, relocated into the ordinary-storm scope by its opening words and thereby false.
  D = outside_knowledge: pre-storm drawdown is standard reservoir practice and sounds like method, but the ponds were never managed.
- **Q3 (ELF-TYPE-001, detail, ceiling sentence of para 3) — key D.**
  A = reversed detail: the text says water from the *highest* tributaries takes the better part of a day *longer*.
  B = outside_knowledge / plausible mechanism never stated: dam failure under load is what a reader expects; the passage has ponds filling and spilling, never breaching.
  C = outside_knowledge: a natural-history claim about colony movement the text never touches.
- **Q4 (ELF-TYPE-002, inference, one inch) — key B.** The passage states the travel-time premise and the "single schedule" observation but never joins them; the join is the inch.
  A = too_far: long tributary → most of the flood is plausible catchment reasoning, but the text ranks tributaries only by travel time.
  C = surface_word_match on the storage intuition, defeated by a pointable phrase ("a similar volume of pond sat in one long chain").
  D = one step too far: true premise (late arrival) plus an unsupported consequence (uncounted in the peak).
- **Q5 (ELF-TYPE-005, stance, edge position 5) — key C.**
  A = role_or_attribution_swap (the TYPE-005 signature): Traer's quoted absolutism offered as the writer's view.
  B = direction reversal, **deliberately hedged in form** so "pick the cautious option" decides nothing; it fails on direction against "when the water is high it predicts very little".
  D = polarity overshoot: dismissiveness, contradicted by "It does not make the animals decorative" and the reduction being "real enough … to feel it in a wet January".

## STEM-LAW audit
- Q2/Q3 stems name only the setup (which storms / which weather) — direction, scope and curve are never entailed.
- Q4's stem quotes only the premise Sorrel *states* (unequal tributary length) and asks what follows. An earlier draft stated the scattered-vs-chain finding in the stem; that was rewritten because it leaked confirmation into Q1's key. No stem now entails another question's answer.
- Q1/Q5 are whole-text framings with no leak.

## Hedge-balance / length-tell discipline (law 10, M-FORM, M-TELL)
- The key is the **strict longest option in 0 of 5** questions (longest per question: Q1 D, Q2 D, Q3 tie, Q4 A, Q5 A). Option-length ratios 1.06–1.39, cap 2.36.
- "Correct = qualified" is broken on purpose: **Q2's key is the absolute option** ("in all eleven sub-catchments alike" — licensed verbatim by the passage) while its distractor B is the cautious-sounding one; **Q3's key** likewise carries "once every pond has filled". Q5's decoy B is as measured in form as the key. M-FORM passes on every question.

## Self-blind-solve result
Solved all five from the passage alone, arguing actively for each non-keyed option first: **Q1=C, Q2=A, Q3=D, Q4=B, Q5=C — 5/5 match.** No item resolved two ways. Closest two-ways deliberately closed:
- **Q1 C vs D:** D is real passage content, but "two of the fourteen … a little higher" is a bounded sub-finding, and the verdict paragraph names the volume-vs-spread swap as the point.
- **Q4 B vs D:** both build on the same true premise; D adds a consequence (late water excluded from the recorded peak) that the passage never states and that contradicts its own logic — late arrival is how the flood is taken apart, not how it escapes measurement.
- **Q5 C vs B:** both hedged in form; separated only by direction — "more divided than either side's leaflet" plus "when the water is high it predicts very little" places the writer against a broad vindication of the leaflets.

## Band / gate compliance
`run_mech.py` (full stack, corpus present): **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass, M-PLAGIARISM pass.** 798 words sits inside the ELF long_passage band (bands.json 332–873; blueprint hard band 550–825). Mean sentence 26.6 (band 14.9–35.4), SD 16.5 (blueprint minimum 7). Paragraph count 6 passes via the documented union check. Prompt words 6–21 (band 3–30); option words 17–25 (band 0–31). All entities fictional; no famous-thesis anchoring; no option reproduces a passage sentence.

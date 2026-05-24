# ELF framework_id tagging — QA (12-sample)

## Headline

**12/12 CORRECT.** The ELF tagger nailed every item in the sample. This corroborates the taxonomy's own observation that ELF question language is "höggradigt stereotypt" — the question verb alone (`told` / `said` / `claimed` / `implied` / `main point` / `impression`) carries nearly all the classification signal, and the agent has clearly learned that mapping.

The tag rate caveat (68%, with 135 cloze-style left null) is not visible in this sample because the sample is drawn from the TAGGED population. The null bucket is a separate concern — these results say nothing about whether the cloze items deserve a 9th type or should fold into an expanded ELF-TYPE-008.

## Item-by-item

| # | qid | prompt cue | proposed | independent | verdict |
|---|-----|------------|----------|-------------|---------|
| 1 | `var-2013-verb1-ELF-039` | "What is suggested here?" | ELF-TYPE-002 | ELF-TYPE-002 | CORRECT |
| 2 | `var-2018-1-verb1-ELF-038` | "In what way does Mann shed new light on..." | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |
| 3 | `host-2014-verb2-ELF-040` | "How can the reviewer's impression... best be summarized?" | ELF-TYPE-005 | ELF-TYPE-005 | CORRECT |
| 4 | `host-2024-verb1-ELF-040` | "What are we told about British jingoism..." | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |
| 5 | `host-2022-verb1-ELF-033` | "What is implied early on in the text..." | ELF-TYPE-002 | ELF-TYPE-002 | CORRECT |
| 6 | `host-ver2-2019-verb1-ELF-040` | "What is the main point here?" | ELF-TYPE-004 | ELF-TYPE-004 | CORRECT |
| 7 | `var-2014-verb1-ELF-032` | "What is the main point in this text?" | ELF-TYPE-004 | ELF-TYPE-004 | CORRECT |
| 8 | `var-2014-verb2-ELF-037` | "What is said about Otto Katz's stay in Berlin?" | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |
| 9 | `var-2015-verb1-ELF-039` | "What are we told in this text?" | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |
| 10 | `var-2022-1-verb1-ELF-035` | "What is claimed concerning the NHS..." | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |
| 11 | `host-2022-verb1-ELF-037` | "What is the writer's basic impression of present-day research..." | ELF-TYPE-005 | ELF-TYPE-005 | CORRECT |
| 12 | `var-2018-1-verb1-ELF-039` | "What is claimed about Bolivian silver?" | ELF-TYPE-001 | ELF-TYPE-001 | CORRECT |

## Notes on borderline-but-defensible calls

- **#2 `var-2018-1-verb1-ELF-038`** — "In what way does Mann shed new light…" is the only non-template phrasing in the sample. It could plausibly be read as ELF-TYPE-004 (main argument: Mann's overall thesis about colonisation) instead of ELF-TYPE-001. The agent's call (ELF-TYPE-001) holds because the solution path locates Mann's reframing in an explicit statement ("extraction by all European colonists") — i.e. retrievable text rather than synthesised thesis across paragraphs. If a future audit lands on the other side of this, treat it as a calibration question between TYPE-001 and TYPE-004 on the "Mann argues / states X" question shape, not as a tagger bug.

- **#10, #12 — "What is claimed…"** — Both got ELF-TYPE-001. The taxonomy's recognition cues list "we are told / is said / is stated / according to the text" but not "is claimed". `claimed` is a synonym for those retrieval verbs (assertion that exists in the text), so the mapping is sound. Worth adding "claimed" to the ELF-TYPE-001 recognition cues in a v2 taxonomy revision so it's explicit rather than inferred.

## Patterns

1. **Question-verb signal is doing all the work.** All 12 items map from the question stem alone — no item required reading the passage to disambiguate. This is consistent with the taxonomy's own claim that ELF is "more uniform than LÄS" and that "most questions classify cleanly into ONE type via the question verb alone". The agent has internalised this perfectly.

2. **Type distribution in the sample mirrors the corpus distribution.** 6×TYPE-001 retrieval / 2×TYPE-002 implication / 2×TYPE-004 main point / 2×TYPE-005 stance. No TYPE-003 (conclusion), TYPE-006 (purpose), TYPE-007 (alignment), or TYPE-008 (vocabulary-in-context) in the sample. The four absent types are also the smaller buckets in the corpus (TYPE-008 has only 5 entries), so the gap is expected at n=12 but limits how confidently we can generalise this 12/12 result to those types. A 20-sample with forced coverage of TYPE-003 / TYPE-006 / TYPE-007 / TYPE-008 would close that blind spot.

3. **The TYPE-005 trap the taxonomy flags didn't show up.** The taxonomy notes that "fine distinctions between e.g. 'on the whole positive but has some serious objections' vs 'clearly impressed but avoids taking a stand' are the stubborn error pattern." Items #3 and #11 are both TYPE-005 questions, both got cleanly tagged. Stance-tagging at this layer (which type) is not the same as stance-resolution at solution layer (which polarity/intensity) — this QA only tests the former, and that layer is solid.

4. **Recommendation:** Promote the QA result for the TAGGED 68% to a strong pass. Pivot effort to the 135 null bucket — sample those next and decide whether the cloze pattern is a missing 9th type, an expansion of TYPE-008, or genuinely outside the framework_id scheme (in which case `null` is correct and we should mark them `framework_id: null` deliberately rather than treat them as untagged).
